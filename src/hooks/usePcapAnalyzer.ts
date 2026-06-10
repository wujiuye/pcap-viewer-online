import { useState, useEffect, useRef, useCallback } from 'react';
import { Bridge } from '../lib/pcap/Bridge';
import { FrameDetailsTree } from '../lib/pcap/FrameDetailsTree';

export function usePcapAnalyzer() {
  const [initialized, setInitialized] = useState(false);
  const [columns, setColumns] = useState<any[]>([]);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [frames, setFrames] = useState<any[]>([]);
  const [activeFrameIndex, setActiveFrameIndex] = useState<number | null>(null);
  const [activeFrameDetails, setActiveFrameDetails] = useState<FrameDetailsTree | null>(null);
  const [progressMsg, setProgressMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [displayFilter, setDisplayFilter] = useState<string>("");
  const [isLoadingFrames, setIsLoadingFrames] = useState(false);
  const [hasMoreFrames, setHasMoreFrames] = useState(false);

  const bridgeRef = useRef<Bridge | null>(null);

  useEffect(() => {
    const bridge = new Bridge();
    bridgeRef.current = bridge;
    
    bridge.initialize((msg) => {
      setProgressMsg(msg);
    }, () => {
      if (bridge.initialized) {
        setInitialized(true);
        setColumns(bridge.columns);
      }
    });

    return () => {
      bridge.deinitialize();
    };
  }, []);

  const openFile = async (file: File) => {
    if (!bridgeRef.current) return;
    setError(null);
    setActiveFile(file);
    setFrames([]);
    setActiveFrameIndex(null);
    setActiveFrameDetails(null);
    setHasMoreFrames(false);
    
    const result = await bridgeRef.current.createSession(file);
    if (result.code) {
      setError(result.message || "Failed to open file");
      setActiveFile(null);
      await bridgeRef.current.closeSession();
      return;
    }
    
    setSessionInfo(result.summary);
    
    // Load initial frames and automatically select the first one
    setIsLoadingFrames(true);
    try {
      const initialFrames = await bridgeRef.current.getFrames("", 0, 200);
      setFrames(initialFrames);
      setHasMoreFrames(initialFrames.length === 200);
      
      if (initialFrames.length > 0) {
        setActiveFrameIndex(0);
        const rawDetails = await bridgeRef.current.getFrame(initialFrames[0].number);
        setActiveFrameDetails(new FrameDetailsTree(rawDetails));
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoadingFrames(false);
    }
  };

  const closeFile = async () => {
    if (!bridgeRef.current) return;
    await bridgeRef.current.closeSession();
    setActiveFile(null);
    setSessionInfo(null);
    setFrames([]);
    setActiveFrameIndex(null);
    setActiveFrameDetails(null);
    setHasMoreFrames(false);
  };

  const loadMoreFrames = async (skip: number, limit: number, filter: string) => {
    if (!bridgeRef.current) return;
    setIsLoadingFrames(true);
    try {
      const newFrames = await bridgeRef.current.getFrames(filter, skip, limit);
      setFrames(prev => skip === 0 ? newFrames : [...prev, ...newFrames]);
      setHasMoreFrames(newFrames.length === limit);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoadingFrames(false);
    }
  };

  const selectFrame = async (index: number) => {
    if (!bridgeRef.current) return;
    setActiveFrameIndex(index);
    const frame = frames[index];
    if (frame) {
      const rawDetails = await bridgeRef.current.getFrame(frame.number);
      setActiveFrameDetails(new FrameDetailsTree(rawDetails));
    }
  };

  const applyFilter = async (filter: string) => {
    if (!bridgeRef.current) return;
    setDisplayFilter(filter);
    await loadMoreFrames(0, 200, filter);
  };

  return {
    initialized,
    columns,
    sessionInfo,
    activeFile,
    frames,
    activeFrameIndex,
    activeFrameDetails,
    progressMsg,
    error,
    displayFilter,
    isLoadingFrames,
    hasMoreFrames,
    openFile,
    closeFile,
    loadMoreFrames,
    selectFrame,
    applyFilter
  };
}

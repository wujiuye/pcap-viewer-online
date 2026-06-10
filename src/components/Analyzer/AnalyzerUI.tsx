"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { usePcapAnalyzer } from '../../hooks/usePcapAnalyzer';
import styles from './AnalyzerUI.module.css';

interface AnalyzerUIProps {
  globalFilter?: string;
  onFilterChange?: (value: string) => void;
  onFileLoaded?: (isLoaded: boolean) => void;
  onWasmStatusChange?: (status: { initialized: boolean; error: string | null; progress: string | null }) => void;
}

export default function AnalyzerUI({ globalFilter = '', onFilterChange, onFileLoaded, onWasmStatusChange }: AnalyzerUIProps) {
  const [topPaneHeight, setTopPaneHeight] = useState(50); // percentage
  const [leftPaneWidth, setLeftPaneWidth] = useState(50); // percentage
  const [isDraggingY, setIsDraggingY] = useState(false);
  const [isDraggingX, setIsDraggingX] = useState(false);
  
  // Use local fallback if props aren't provided (for backward compatibility)
  const [localFilterValue, setLocalFilterValue] = useState("");
  const currentFilterValue = onFilterChange !== undefined ? globalFilter : localFilterValue;
  
  const handleFilterChange = (val: string) => {
    if (onFilterChange) onFilterChange(val);
    else setLocalFilterValue(val);
  };

  const [activeByteRange, setActiveByteRange] = useState<[number, number] | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragY = useCallback((e: MouseEvent) => {
    if (!containerRef.current || e.buttons !== 1) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newHeight = ((e.clientY - rect.top) / rect.height) * 100;
    setTopPaneHeight(Math.max(20, Math.min(newHeight, 80)));
  }, []);

  const handleDragX = useCallback((e: MouseEvent) => {
    if (!containerRef.current || e.buttons !== 1) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
    setLeftPaneWidth(Math.max(20, Math.min(newWidth, 80)));
  }, []);

  useEffect(() => {
    if (isDraggingY) {
      window.addEventListener('mousemove', handleDragY);
      const handleMouseUp = () => setIsDraggingY(false);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleDragY);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingY, handleDragY]);

  useEffect(() => {
    if (isDraggingX) {
      window.addEventListener('mousemove', handleDragX);
      const handleMouseUp = () => setIsDraggingX(false);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleDragX);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingX, handleDragX]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const {
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
  } = usePcapAnalyzer();

  useEffect(() => {
    if (onFileLoaded) {
      onFileLoaded(!!activeFile);
    }
  }, [activeFile, onFileLoaded]);

  useEffect(() => {
    if (onWasmStatusChange) {
      onWasmStatusChange({ initialized, error, progress: progressMsg });
    }
  }, [initialized, error, progressMsg, onWasmStatusChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) openFile(file);
  };

  // Auto-apply filter with debounce when globalFilter changes
  useEffect(() => {
    if (!initialized || !activeFile) return;
    
    const timeoutId = setTimeout(() => {
      // Only apply if it's different from the currently applied displayFilter
      if (globalFilter !== displayFilter) {
        applyFilter(globalFilter);
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalFilter, initialized, activeFile, displayFilter]);

  if (!activeFile || !sessionInfo) {
    const isProcessing = !initialized || (activeFile && !sessionInfo);
    return (
      <div className={styles.container}>
        <div className={styles.uploadOverlay}>
          <div className={styles.heroWrapper}>
            <div className={styles.heroContent}>
              <div className={styles.heroBadge}>100% Free • Runs locally in your browser</div>
              <h1 className={styles.heroTitle}>Free Online PCAP Viewer</h1>
              <p className={styles.heroSubtitle}>
                Instantly open, parse, and analyze your packet capture files (.pcap, .pcapng) directly in your browser. Everything runs 100% locally—your files are never uploaded to any server. The core parsing engine is powered by <strong>WebAssembly compiled directly from Wireshark's C/C++ source code</strong>, providing identical protocol decoding capabilities without installing the desktop app.
              </p>
            </div>
            <div className={`${styles.uploadBox} ${isProcessing ? styles.uploading : ''}`}>
              {!isProcessing ? (
                <>
                  <svg className={styles.uploadIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                  <h3>Select a PCAP/PCAPNG File</h3>
                  <p>Drag and drop or click anywhere to upload</p>
                  <input 
                    type="file" 
                    accept=".cap,.pcap,.pcapng" 
                    onChange={handleFileChange} 
                    className={styles.fileInput}
                    title="Click to select a PCAP file"
                  />
                </>
              ) : (
                <div className={styles.loadingState}>
                  <svg className={styles.spinner} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="31.4 31.4" />
                  </svg>
                  <p className={styles.progress}>
                    {!initialized 
                      ? (progressMsg || 'Loading Parser Engine (68MB WASM)... Please wait.') 
                      : 'Parsing file... Please wait.'}
                  </p>
                </div>
              )}
            </div>
            {error && <p className={styles.error}>{error}</p>}
          </div>

          {/* SEO Content Section */}
          <div className={styles.seoSection}>
            <div className={styles.seoHeader}>
              <h2>Why use PCAP Viewer Online?</h2>
              <p>Experience desktop-grade network protocol analysis directly in your web browser with zero compromises.</p>
            </div>
            <div className={styles.seoGrid}>
              <div className={styles.seoCard}>
                <h4>
                  <svg className={styles.seoIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  100% Privacy
                </h4>
                <p>Everything runs entirely in your local browser using WebAssembly. Your sensitive PCAP files never leave your machine. No uploads, no cloud servers, no data retention.</p>
              </div>
              <div className={styles.seoCard}>
                <h4>
                  <svg className={styles.seoIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Wireshark Engine
                </h4>
                <p>Powered by the exact same C/C++ engine that runs the desktop Wireshark app, compiled directly to WebAssembly. Expect the exact same packet decoding, protocol support, and reliability.</p>
              </div>
              <div className={styles.seoCard}>
                <h4>
                  <svg className={styles.seoIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  No Installation
                </h4>
                <p>Skip the bulky downloads and admin privileges. Open packet captures instantly on any device, from any modern web browser, regardless of your operating system.</p>
              </div>
              <div className={styles.seoCard}>
                <h4>
                  <svg className={styles.seoIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" />
                  </svg>
                  Advanced Filtering
                </h4>
                <p>Utilize the built-in Smart Filter Generator to build complex display filters for TCP, HTTP, WebSocket, and DNS without having to memorize Wireshark syntax.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`${styles.container} ${(isDraggingX || isDraggingY) ? styles.dragging : ''} ${isFullscreen ? styles.fullscreen : ''}`} 
      ref={containerRef}
    >
      <div className={styles.toolbar}>
        <button onClick={closeFile} className={styles.btn}>Close File</button>
        <span className={styles.info}>
          {frames.length} / {sessionInfo.packet_count} packets shown
        </span>
        <input 
          type="text" 
          value={currentFilterValue}
          onChange={(e) => handleFilterChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') applyFilter(currentFilterValue);
          }}
          placeholder="Display filter (e.g., tcp.port == 80)"
          className={styles.filterInput}
        />
        
        <div className={styles.toolbarRight}>
          <button 
            onClick={toggleFullscreen} 
            className={styles.iconBtn}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
              </svg>
            )}
          </button>
        </div>
        {isLoadingFrames && <span className={styles.info}>Loading...</span>}
      </div>

      <div className={styles.panes}>
        <div className={styles.pane} style={{ flex: `0 0 ${topPaneHeight}%`, overflow: 'auto' }}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tr}>
                  {columns.map((c: string, i) => <th key={i} className={styles.th}>{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {frames.map((frame, i) => (
                  <tr 
                    key={frame.number} 
                    className={`${styles.tr} ${activeFrameIndex === i ? styles.activeRow : ''}`}
                    onClick={() => selectFrame(i)}
                  >
                    {frame.columns.map((cell: string, ci: number) => (
                      <td key={ci} className={styles.td}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {hasMoreFrames && (
              <button 
                onClick={() => loadMoreFrames(frames.length, 200, displayFilter)}
                className={styles.loadMoreBtn}
              >
                Load More Packets
              </button>
            )}
          </div>
        </div>

        <div 
          className={styles.resizerY} 
          onMouseDown={() => setIsDraggingY(true)} 
        />

        <div className={styles.pane} style={{ flex: 1, display: 'flex', flexDirection: 'row' }}>
          <div className={styles.pane} style={{ flex: `0 0 ${leftPaneWidth}%`, borderBottom: 'none' }}>
            <div className={styles.treeWrapper}>
              {activeFrameDetails ? (
                <FrameTree 
                  tree={activeFrameDetails.tree} 
                  onHoverRange={(start, len) => setActiveByteRange(start >= 0 ? [start, len] : null)}
                />
              ) : (
                <div className={styles.empty}>Select a packet to view details</div>
              )}
            </div>
          </div>
          
          <div 
            className={styles.resizerX} 
            onMouseDown={() => setIsDraggingX(true)} 
          />
          
          <div className={styles.pane} style={{ flex: 1, borderLeft: '1px solid #e2e8f0', borderBottom: 'none' }}>
            {activeFrameDetails && (
              <HexViewer 
                data={activeFrameDetails.getSourceData(0)} 
                highlightRange={activeByteRange}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FrameTree({ tree, onHoverRange }: { tree: any[], onHoverRange: (s: number, l: number) => void }) {
  if (!tree) return null;
  return (
    <ul className={styles.tree}>
      {tree.map((node, i) => (
        <FrameTreeNode key={i} node={node} onHoverRange={onHoverRange} />
      ))}
    </ul>
  );
}

function FrameTreeNode({ node, onHoverRange }: { node: any, onHoverRange: (s: number, l: number) => void }) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.tree && node.tree.length > 0;
  
  return (
    <li className={styles.treeNode}>
      <div 
        className={styles.treeLabel} 
        onClick={() => hasChildren && setExpanded(!expanded)}
        onMouseEnter={() => onHoverRange(node.start ?? -1, node.length ?? 0)}
        onMouseLeave={() => onHoverRange(-1, 0)}
        style={{ cursor: hasChildren ? 'pointer' : 'default' }}
      >
        {hasChildren ? (expanded ? '▼ ' : '▶ ') : '  '}
        {node.label}
      </div>
      {expanded && hasChildren && <FrameTree tree={node.tree} onHoverRange={onHoverRange} />}
    </li>
  );
}

function HexViewer({ data, highlightRange }: { data: Uint8Array, highlightRange: [number, number] | null }) {
  const [localSelection, setLocalSelection] = useState<[number, number] | null>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        setLocalSelection(null);
        return;
      }
      
      const range = selection.getRangeAt(0);
      let startNode = range.startContainer;
      let endNode = range.endContainer;
      
      // Navigate up to the span elements
      while (startNode && startNode.nodeType !== Node.ELEMENT_NODE) startNode = startNode.parentNode as Node;
      while (endNode && endNode.nodeType !== Node.ELEMENT_NODE) endNode = endNode.parentNode as Node;
      
      if (startNode && endNode && (startNode as Element).hasAttribute('data-byte-idx') && (endNode as Element).hasAttribute('data-byte-idx')) {
        const startIdx = parseInt((startNode as Element).getAttribute('data-byte-idx') || '0', 10);
        const endIdx = parseInt((endNode as Element).getAttribute('data-byte-idx') || '0', 10);
        const minIdx = Math.min(startIdx, endIdx);
        const maxIdx = Math.max(startIdx, endIdx);
        setLocalSelection([minIdx, maxIdx - minIdx + 1]);
      } else {
        setLocalSelection(null);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  if (!data || data.length === 0) return null;

  const rows = [];
  const [hStart, hLen] = highlightRange || [-1, 0];
  const hEnd = hStart + hLen;

  for (let i = 0; i < data.length; i += 16) {
    const chunk = data.slice(i, i + 16);
    
    // Address
    const address = i.toString(16).padStart(4, '0');
    
    // Hex Bytes and ASCII
    const hexBytes = [];
    const asciiChars = [];
    
    for (let j = 0; j < chunk.length; j++) {
      const byteIndex = i + j;
      const isHighlighted = byteIndex >= hStart && byteIndex < hEnd;
      const isSelected = localSelection && byteIndex >= localSelection[0] && byteIndex < localSelection[0] + localSelection[1];
      
      let className = '';
      if (isHighlighted) className = styles.highlightedByte;
      else if (isSelected) className = styles.syncSelectedByte;
      
      const b = chunk[j];
      const hexStr = b.toString(16).padStart(2, '0');
      const asciiChar = (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.';
      
      hexBytes.push(<span key={j} data-byte-idx={byteIndex} className={className}>{hexStr} </span>);
      asciiChars.push(<span key={j} data-byte-idx={byteIndex} className={className}>{asciiChar}</span>);
    }
    
    // Padding for incomplete rows
    for (let j = chunk.length; j < 16; j++) {
      hexBytes.push(<span key={j}>   </span>);
    }

    rows.push(
      <div key={i} className={styles.hexRow}>
        <span className={styles.hexAddress}>{address}</span>
        <span className={styles.hexData}>{hexBytes}</span>
        <span className={styles.hexAscii}>{asciiChars}</span>
      </div>
    );
  }

  return (
    <div className={styles.hexViewer}>
      {rows}
    </div>
  );
}

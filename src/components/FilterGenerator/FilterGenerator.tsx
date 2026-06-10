'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import styles from './FilterGenerator.module.css';

interface FilterGeneratorProps {
  globalFilter?: string;
  onFilterChange?: (value: string) => void;
}

export default function FilterGenerator({ globalFilter = '', onFilterChange }: FilterGeneratorProps) {
  const [activeTab, setActiveTab] = useState<'tcp' | 'http' | 'ws' | 'dns'>('tcp');
  const isInternalChange = useRef(false);
  const isSettingFromProps = useRef(false);
  const isMounted = useRef(false);

  // TCP State
  const [tcpState, setTcpState] = useState({
    srcIp: '',
    dstIp: '',
    srcPort: '',
    dstPort: '',
    flags: { syn: false, ack: false, fin: false, rst: false, psh: false, urg: false },
    windowSize: '',
    seqNumber: '',
    payloadContains: '',
    payloadLength: '',
  });

  // HTTP State
  const [httpState, setHttpState] = useState({
    method: '',
    host: '',
    uri: '',
    statusCode: '',
    contentType: '',
  });

  // WebSocket State
  const [wsState, setWsState] = useState({
    host: '',
    port: '',
    path: '',
    protocol: '',
    opcode: '',
    payloadContains: '',
    payloadLength: '',
    masked: '',
    fin: '',
    upgradeRequest: false,
    upgradeResponse: false
  });

  // DNS State
  const [dnsState, setDnsState] = useState({
    queryName: '',
    queryType: '',
    responseCode: '',
    flags: [] as string[],
    server: '',
    client: '',
    transactionId: '',
    queryClass: '',
    answerContains: '',
    ttl: ''
  });

  const handleTcpChange = (key: string, value: any) => {
    setTcpState(prev => ({ ...prev, [key]: value }));
  };

  const handleTcpFlagChange = (flag: keyof typeof tcpState.flags) => {
    setTcpState(prev => ({
      ...prev,
      flags: { ...prev.flags, [flag]: !prev.flags[flag] }
    }));
  };

  const handleHttpChange = (key: string, value: any) => {
    setHttpState(prev => ({ ...prev, [key]: value }));
  };

  const handleWsChange = (key: string, value: any) => {
    setWsState(prev => ({ ...prev, [key]: value }));
  };

  const handleDnsChange = (key: string, value: any) => {
    setDnsState(prev => ({ ...prev, [key]: value }));
  };

  const handleDnsFlagChange = (flag: string) => {
    setDnsState(prev => ({
      ...prev,
      flags: prev.flags.includes(flag)
        ? prev.flags.filter(f => f !== flag)
        : [...prev.flags, flag]
    }));
  };

  const filterString = useMemo(() => {
    const conditions: string[] = [];

    if (activeTab === 'tcp') {
      if (tcpState.srcIp) conditions.push(`ip.src == ${tcpState.srcIp}`);
      if (tcpState.dstIp) conditions.push(`ip.dst == ${tcpState.dstIp}`);
      if (tcpState.srcPort) conditions.push(`tcp.srcport == ${tcpState.srcPort}`);
      if (tcpState.dstPort) conditions.push(`tcp.dstport == ${tcpState.dstPort}`);
      
      if (tcpState.flags.syn) conditions.push(`tcp.flags.syn == 1`);
      if (tcpState.flags.ack) conditions.push(`tcp.flags.ack == 1`);
      if (tcpState.flags.fin) conditions.push(`tcp.flags.fin == 1`);
      if (tcpState.flags.rst) conditions.push(`tcp.flags.reset == 1`);
      if (tcpState.flags.psh) conditions.push(`tcp.flags.push == 1`);
      if (tcpState.flags.urg) conditions.push(`tcp.flags.urg == 1`);

      if (tcpState.windowSize) conditions.push(`tcp.window_size == ${tcpState.windowSize}`);
      if (tcpState.seqNumber) conditions.push(`tcp.seq == ${tcpState.seqNumber}`);
      if (tcpState.payloadContains) conditions.push(`tcp.payload contains "${tcpState.payloadContains}"`);
      if (tcpState.payloadLength) conditions.push(`tcp.len == ${tcpState.payloadLength}`);

      if (conditions.length === 0) return 'tcp';
    } else if (activeTab === 'http') {
      if (httpState.method) conditions.push(`http.request.method == "${httpState.method}"`);
      if (httpState.host) conditions.push(`http.host contains "${httpState.host}"`);
      if (httpState.uri) conditions.push(`http.request.uri contains "${httpState.uri}"`);
      if (httpState.statusCode) conditions.push(`http.response.code == ${httpState.statusCode}`);
      if (httpState.contentType) conditions.push(`http.content_type contains "${httpState.contentType}"`);

      if (conditions.length === 0) return 'http';
    } else if (activeTab === 'ws') {
      if (wsState.upgradeRequest) conditions.push('http.upgrade == "websocket"');
      if (wsState.upgradeResponse) conditions.push('http.response.code == 101');
      if (wsState.host && (wsState.upgradeRequest || wsState.upgradeResponse)) conditions.push(`http.host == "${wsState.host}"`);
      if (wsState.path && (wsState.upgradeRequest || wsState.upgradeResponse)) conditions.push(`http.request.uri contains "${wsState.path}"`);
      if (wsState.protocol) conditions.push(`websocket.extensions contains "${wsState.protocol}"`);
      if (wsState.opcode) conditions.push(`websocket.opcode == ${wsState.opcode}`);
      if (wsState.payloadContains) conditions.push(`websocket.payload contains "${wsState.payloadContains}"`);
      if (wsState.payloadLength) conditions.push(`websocket.payload.length == ${wsState.payloadLength}`);
      if (wsState.masked !== '') conditions.push(`websocket.mask == ${wsState.masked === 'true' ? '1' : '0'}`);
      if (wsState.fin !== '') conditions.push(`websocket.fin == ${wsState.fin === 'true' ? '1' : '0'}`);
      if (wsState.port && !wsState.upgradeRequest && !wsState.upgradeResponse) conditions.push(`tcp.port == ${wsState.port}`);

      let base = (wsState.upgradeRequest || wsState.upgradeResponse) ? 'http' : 'websocket';
      if (conditions.length > 0) return base + ' && ' + conditions.join(' && ');
      return base;
    } else if (activeTab === 'dns') {
      if (dnsState.queryName) conditions.push(`dns.qry.name == "${dnsState.queryName}"`);
      if (dnsState.queryType) conditions.push(`dns.qry.type == ${dnsState.queryType}`);
      if (dnsState.responseCode) conditions.push(`dns.flags.rcode == ${dnsState.responseCode}`);
      if (dnsState.flags.length > 0) {
        const flagConditions = dnsState.flags.map(flag => `dns.flags.${flag} == 1`);
        conditions.push(`(${flagConditions.join(' && ')})`);
      }
      if (dnsState.server) conditions.push(`ip.dst == ${dnsState.server}`);
      if (dnsState.client) conditions.push(`ip.src == ${dnsState.client}`);
      if (dnsState.transactionId) conditions.push(`dns.id == ${dnsState.transactionId}`);
      if (dnsState.queryClass) conditions.push(`dns.qry.class == ${dnsState.queryClass}`);
      if (dnsState.answerContains) conditions.push(`dns.resp.name contains "${dnsState.answerContains}"`);
      if (dnsState.ttl) conditions.push(`dns.resp.ttl == ${dnsState.ttl}`);

      if (conditions.length > 0) return 'dns && ' + conditions.join(' && ');
      return 'dns';
    }

    return conditions.join(' && ');
  }, [activeTab, tcpState, httpState, wsState, dnsState]);

  // Upward sync: when internal state changes (causing filterString to change), bubble it up
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    if (isSettingFromProps.current) {
      isSettingFromProps.current = false;
      return;
    }
    
    isInternalChange.current = true;
    if (onFilterChange) onFilterChange(filterString);
  }, [filterString, onFilterChange]);

  // Downward sync (Reverse Parsing): when globalFilter changes externally, parse it
  useEffect(() => {
    if (isInternalChange.current) {
      // It was generated by us, so we just reset the flag and ignore
      isInternalChange.current = false;
      return;
    }

    isSettingFromProps.current = true;
    
    // We use a timeout to reset the flag in case the parsed state doesn't change filterString,
    // which would otherwise prevent the upward sync effect from running and resetting the flag.
    const timer = setTimeout(() => {
      isSettingFromProps.current = false;
    }, 50);
    
    if (!globalFilter) {
      // Clear all forms
      setActiveTab('tcp');
      setTcpState({ srcIp: '', dstIp: '', srcPort: '', dstPort: '', flags: { syn: false, ack: false, fin: false, rst: false, psh: false, urg: false }, windowSize: '', seqNumber: '', payloadContains: '', payloadLength: '' });
      setHttpState({ method: '', host: '', uri: '', statusCode: '', contentType: '' });
      setWsState({ host: '', port: '', path: '', protocol: '', opcode: '', payloadContains: '', payloadLength: '', masked: '', fin: '', upgradeRequest: false, upgradeResponse: false });
      setDnsState({ queryName: '', queryType: '', responseCode: '', flags: [], server: '', client: '', transactionId: '', queryClass: '', answerContains: '', ttl: '' });
      return () => clearTimeout(timer);
    }

    // Very basic "best-effort" parsing
    const str = globalFilter;
    
    // IP Parsing
    const srcIpMatch = str.match(/ip\.src == ([^\s&]+)/);
    const dstIpMatch = str.match(/ip\.dst == ([^\s&]+)/);
    const srcPortMatch = str.match(/tcp\.srcport == (\d+)/);
    const dstPortMatch = str.match(/tcp\.dstport == (\d+)/);
    
    // TCP Flags Parsing
    const synMatch = str.includes('tcp.flags.syn == 1');
    const ackMatch = str.includes('tcp.flags.ack == 1');
    const finMatch = str.includes('tcp.flags.fin == 1');
    const rstMatch = str.includes('tcp.flags.reset == 1');
    const pshMatch = str.includes('tcp.flags.push == 1');
    const urgMatch = str.includes('tcp.flags.urg == 1');
    
    const winMatch = str.match(/tcp\.window_size == (\d+)/);
    const seqMatch = str.match(/tcp\.seq == (\d+)/);
    const payloadContainsMatch = str.match(/tcp\.payload contains "([^"]+)"/);
    const payloadLenMatch = str.match(/tcp\.len == (\d+)/);

    // HTTP Parsing
    const methodMatch = str.match(/http\.request\.method == "([^"]+)"/);
    const hostMatch = str.match(/http\.host contains "([^"]+)"/);
    const uriMatch = str.match(/http\.request\.uri contains "([^"]+)"/);
    const statusMatch = str.match(/http\.response\.code == (\d+)/);
    const contentMatch = str.match(/http\.content_type contains "([^"]+)"/);

    // WS Parsing
    const wsOpcodeMatch = str.match(/websocket\.opcode == (\d+)/);
    const wsPayloadMatch = str.match(/websocket\.payload contains "([^"]+)"/);
    const isHttpOnly = str === 'http';
    const isWsOnly = str === 'websocket';

    // DNS Parsing
    const dnsQryNameMatch = str.match(/dns\.qry\.name == "([^"]+)"/);
    const dnsQryTypeMatch = str.match(/dns\.qry\.type == (\d+)/);
    const dnsRcodeMatch = str.match(/dns\.flags\.rcode == (\d+)/);
    const isDnsOnly = str === 'dns';

    const isHttp = methodMatch || hostMatch || uriMatch || statusMatch || contentMatch || isHttpOnly;
    const isWs = wsOpcodeMatch || wsPayloadMatch || isWsOnly;
    const isDns = dnsQryNameMatch || dnsQryTypeMatch || dnsRcodeMatch || isDnsOnly;

    const clearWs = () => setWsState({ host: '', port: '', path: '', protocol: '', opcode: '', payloadContains: '', payloadLength: '', masked: '', fin: '', upgradeRequest: false, upgradeResponse: false });
    const clearDns = () => setDnsState({ queryName: '', queryType: '', responseCode: '', flags: [], server: '', client: '', transactionId: '', queryClass: '', answerContains: '', ttl: '' });
    const clearTcp = () => setTcpState({ srcIp: '', dstIp: '', srcPort: '', dstPort: '', flags: { syn: false, ack: false, fin: false, rst: false, psh: false, urg: false }, windowSize: '', seqNumber: '', payloadContains: '', payloadLength: '' });
    const clearHttp = () => setHttpState({ method: '', host: '', uri: '', statusCode: '', contentType: '' });
    
    if (isDns) {
      setActiveTab('dns');
      clearDns(); // base clear
      setDnsState(prev => ({
        ...prev,
        queryName: dnsQryNameMatch ? dnsQryNameMatch[1] : '',
        queryType: dnsQryTypeMatch ? dnsQryTypeMatch[1] : '',
        responseCode: dnsRcodeMatch ? dnsRcodeMatch[1] : '',
      }));
      clearTcp();
      clearHttp();
      clearWs();
    } else if (isWs) {
      setActiveTab('ws');
      clearWs();
      setWsState(prev => ({
        ...prev,
        opcode: wsOpcodeMatch ? wsOpcodeMatch[1] : '',
        payloadContains: wsPayloadMatch ? wsPayloadMatch[1] : '',
      }));
      clearTcp();
      clearHttp();
      clearDns();
    } else if (isHttp) {
      setActiveTab('http');
      setHttpState({
        method: methodMatch ? methodMatch[1] : '',
        host: hostMatch ? hostMatch[1] : '',
        uri: uriMatch ? uriMatch[1] : '',
        statusCode: statusMatch ? statusMatch[1] : '',
        contentType: contentMatch ? contentMatch[1] : '',
      });
      clearTcp();
      clearWs();
      clearDns();
    } else {
      setActiveTab('tcp');
      setTcpState({
        srcIp: srcIpMatch ? srcIpMatch[1] : '',
        dstIp: dstIpMatch ? dstIpMatch[1] : '',
        srcPort: srcPortMatch ? srcPortMatch[1] : '',
        dstPort: dstPortMatch ? dstPortMatch[1] : '',
        flags: {
          syn: synMatch, ack: ackMatch, fin: finMatch,
          rst: rstMatch, psh: pshMatch, urg: urgMatch
        },
        windowSize: winMatch ? winMatch[1] : '',
        seqNumber: seqMatch ? seqMatch[1] : '',
        payloadContains: payloadContainsMatch ? payloadContainsMatch[1] : '',
        payloadLength: payloadLenMatch ? payloadLenMatch[1] : '',
      });
      clearHttp();
      clearWs();
      clearDns();
    }

    return () => clearTimeout(timer);
  }, [globalFilter]);



  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Wireshark Filter Generator</h2>
        <p className={styles.subtitle}>Quickly generate Wireshark filters through simple forms.</p>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'tcp' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('tcp')}
        >
          <span>🔗</span> TCP
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'http' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('http')}
        >
          <span>🌐</span> HTTP
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'ws' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('ws')}
        >
          <span>⚡</span> WebSocket
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'dns' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('dns')}
        >
          <span>🌍</span> DNS
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'tcp' && (
          <div className={styles.grid}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>IP Addresses</h3>
              <div className={styles.formGroup}>
                <label className={styles.label}>Source IP</label>
                <input 
                  className={styles.input} 
                  placeholder="e.g. 192.168.1.1" 
                  value={tcpState.srcIp}
                  onChange={e => handleTcpChange('srcIp', e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Destination IP</label>
                <input 
                  className={styles.input} 
                  placeholder="e.g. 192.168.1.2" 
                  value={tcpState.dstIp}
                  onChange={e => handleTcpChange('dstIp', e.target.value)}
                />
              </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Ports</h3>
              <div className={styles.formGroup}>
                <label className={styles.label}>Source Port</label>
                <input 
                  className={styles.input} 
                  type="number" 
                  placeholder="e.g. 80" 
                  value={tcpState.srcPort}
                  onChange={e => handleTcpChange('srcPort', e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Destination Port</label>
                <input 
                  className={styles.input} 
                  type="number" 
                  placeholder="e.g. 443" 
                  value={tcpState.dstPort}
                  onChange={e => handleTcpChange('dstPort', e.target.value)}
                />
              </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>TCP Flags</h3>
              <div className={styles.checkboxGrid}>
                {['syn', 'ack', 'fin', 'rst', 'psh', 'urg'].map((flag) => (
                  <label key={flag} className={styles.checkboxLabel}>
                    <input 
                      type="checkbox" 
                      className={styles.checkbox}
                      checked={tcpState.flags[flag as keyof typeof tcpState.flags]}
                      onChange={() => handleTcpFlagChange(flag as keyof typeof tcpState.flags)}
                    />
                    {flag.toUpperCase()}
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>TCP Options</h3>
              <div className={styles.formGroup}>
                <label className={styles.label}>Window Size</label>
                <input 
                  className={styles.input} 
                  type="number" 
                  placeholder="e.g. 65535" 
                  value={tcpState.windowSize}
                  onChange={e => handleTcpChange('windowSize', e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Sequence Number</label>
                <input 
                  className={styles.input} 
                  type="number" 
                  placeholder="e.g. 1000" 
                  value={tcpState.seqNumber}
                  onChange={e => handleTcpChange('seqNumber', e.target.value)}
                />
              </div>
            </div>
            
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Payload Options</h3>
              <div className={styles.formGroup}>
                <label className={styles.label}>Payload Contains</label>
                <input 
                  className={styles.input} 
                  placeholder="e.g. GET /api" 
                  value={tcpState.payloadContains}
                  onChange={e => handleTcpChange('payloadContains', e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Payload Length</label>
                <input 
                  className={styles.input} 
                  type="number" 
                  placeholder="e.g. 1024" 
                  value={tcpState.payloadLength}
                  onChange={e => handleTcpChange('payloadLength', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'http' && (
          <div className={styles.grid}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>HTTP Request</h3>
              <div className={styles.formGroup}>
                <label className={styles.label}>Method</label>
                <select 
                  className={styles.select} 
                  value={httpState.method}
                  onChange={e => handleHttpChange('method', e.target.value)}
                >
                  <option value="">Any</option>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="HEAD">HEAD</option>
                  <option value="OPTIONS">OPTIONS</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Host / Domain</label>
                <input 
                  className={styles.input} 
                  placeholder="e.g. api.example.com" 
                  value={httpState.host}
                  onChange={e => handleHttpChange('host', e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>URI Contains</label>
                <input 
                  className={styles.input} 
                  placeholder="e.g. /v1/users" 
                  value={httpState.uri}
                  onChange={e => handleHttpChange('uri', e.target.value)}
                />
              </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>HTTP Response</h3>
              <div className={styles.formGroup}>
                <label className={styles.label}>Status Code</label>
                <input 
                  className={styles.input} 
                  type="number" 
                  placeholder="e.g. 200, 404" 
                  value={httpState.statusCode}
                  onChange={e => handleHttpChange('statusCode', e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Content Type</label>
                <input 
                  className={styles.input} 
                  placeholder="e.g. application/json" 
                  value={httpState.contentType}
                  onChange={e => handleHttpChange('contentType', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ws' && (
          <div className={styles.grid}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Connection Setup</h3>
              <div className={styles.checkboxGrid}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={wsState.upgradeRequest}
                    onChange={(e) => handleWsChange('upgradeRequest', e.target.checked)}
                  />
                  Upgrade Request
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={wsState.upgradeResponse}
                    onChange={(e) => handleWsChange('upgradeResponse', e.target.checked)}
                  />
                  Upgrade Response
                </label>
              </div>
            </div>
            
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Connection Details</h3>
              <div className={styles.formGroup}>
                <label className={styles.label}>Host</label>
                <input 
                  className={styles.input} 
                  placeholder="websocket.example.com" 
                  value={wsState.host}
                  onChange={e => handleWsChange('host', e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Port</label>
                <input 
                  className={styles.input} 
                  type="number"
                  placeholder="8080" 
                  value={wsState.port}
                  onChange={e => handleWsChange('port', e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Path</label>
                <input 
                  className={styles.input} 
                  placeholder="/websocket" 
                  value={wsState.path}
                  onChange={e => handleWsChange('path', e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Protocol</label>
                <input 
                  className={styles.input} 
                  placeholder="chat" 
                  value={wsState.protocol}
                  onChange={e => handleWsChange('protocol', e.target.value)}
                />
              </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Frame Details</h3>
              <div className={styles.formGroup}>
                <label className={styles.label}>Opcode</label>
                <select 
                  className={styles.select} 
                  value={wsState.opcode}
                  onChange={e => handleWsChange('opcode', e.target.value)}
                >
                  <option value="">Select Opcode</option>
                  <option value="0">0 - Continuation Frame</option>
                  <option value="1">1 - Text Frame</option>
                  <option value="2">2 - Binary Frame</option>
                  <option value="8">8 - Connection Close</option>
                  <option value="9">9 - Ping</option>
                  <option value="10">10 - Pong</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Masked</label>
                <select 
                  className={styles.select} 
                  value={wsState.masked}
                  onChange={e => handleWsChange('masked', e.target.value)}
                >
                  <option value="">Any</option>
                  <option value="true">Masked</option>
                  <option value="false">Unmasked</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>FIN Bit</label>
                <select 
                  className={styles.select} 
                  value={wsState.fin}
                  onChange={e => handleWsChange('fin', e.target.value)}
                >
                  <option value="">Any</option>
                  <option value="true">Final Frame</option>
                  <option value="false">Fragmented Frame</option>
                </select>
              </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Payload Options</h3>
              <div className={styles.formGroup}>
                <label className={styles.label}>Payload Contains</label>
                <input 
                  className={styles.input} 
                  placeholder="message" 
                  value={wsState.payloadContains}
                  onChange={e => handleWsChange('payloadContains', e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Payload Length</label>
                <input 
                  className={styles.input} 
                  type="number"
                  placeholder="1024" 
                  value={wsState.payloadLength}
                  onChange={e => handleWsChange('payloadLength', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dns' && (
          <div className={styles.grid}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Query Info</h3>
              <div className={styles.formGroup}>
                <label className={styles.label}>Query Name</label>
                <input 
                  className={styles.input} 
                  placeholder="example.com" 
                  value={dnsState.queryName}
                  onChange={e => handleDnsChange('queryName', e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Query Type</label>
                <select 
                  className={styles.select} 
                  value={dnsState.queryType}
                  onChange={e => handleDnsChange('queryType', e.target.value)}
                >
                  <option value="">Select Query Type</option>
                  <option value="1">A (1)</option>
                  <option value="28">AAAA (28)</option>
                  <option value="5">CNAME (5)</option>
                  <option value="15">MX (15)</option>
                  <option value="2">NS (2)</option>
                  <option value="12">PTR (12)</option>
                  <option value="6">SOA (6)</option>
                  <option value="16">TXT (16)</option>
                  <option value="33">SRV (33)</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Query Class</label>
                <select 
                  className={styles.select} 
                  value={dnsState.queryClass}
                  onChange={e => handleDnsChange('queryClass', e.target.value)}
                >
                  <option value="">Any</option>
                  <option value="1">IN (Internet)</option>
                  <option value="3">CH (Chaos)</option>
                  <option value="4">HS (Hesiod)</option>
                </select>
              </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Response Info</h3>
              <div className={styles.formGroup}>
                <label className={styles.label}>Response Code</label>
                <select 
                  className={styles.select} 
                  value={dnsState.responseCode}
                  onChange={e => handleDnsChange('responseCode', e.target.value)}
                >
                  <option value="">Select Response Code</option>
                  <option value="0">No Error (0)</option>
                  <option value="1">Format Error (1)</option>
                  <option value="2">Server Failure (2)</option>
                  <option value="3">Name Error (3)</option>
                  <option value="4">Not Implemented (4)</option>
                  <option value="5">Refused (5)</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Answer Contains</label>
                <input 
                  className={styles.input} 
                  placeholder="192.168.1.1" 
                  value={dnsState.answerContains}
                  onChange={e => handleDnsChange('answerContains', e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>TTL</label>
                <input 
                  className={styles.input} 
                  type="number"
                  placeholder="3600" 
                  value={dnsState.ttl}
                  onChange={e => handleDnsChange('ttl', e.target.value)}
                />
              </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Network Info</h3>
              <div className={styles.formGroup}>
                <label className={styles.label}>DNS Server</label>
                <input 
                  className={styles.input} 
                  placeholder="8.8.8.8" 
                  value={dnsState.server}
                  onChange={e => handleDnsChange('server', e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Client IP</label>
                <input 
                  className={styles.input} 
                  placeholder="192.168.1.100" 
                  value={dnsState.client}
                  onChange={e => handleDnsChange('client', e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Transaction ID</label>
                <input 
                  className={styles.input} 
                  type="number"
                  placeholder="12345" 
                  value={dnsState.transactionId}
                  onChange={e => handleDnsChange('transactionId', e.target.value)}
                />
              </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>DNS Flags</h3>
              <div className={styles.checkboxGrid}>
                {[
                  { value: 'qr', label: 'QR (Query/Response)' },
                  { value: 'aa', label: 'AA (Authoritative Answer)' },
                  { value: 'tc', label: 'TC (Truncated)' },
                  { value: 'rd', label: 'RD (Recursion Desired)' },
                  { value: 'ra', label: 'RA (Recursion Available)' },
                  { value: 'ad', label: 'AD (Authentic Data)' },
                  { value: 'cd', label: 'CD (Checking Disabled)' }
                ].map(flag => (
                  <label key={flag.value} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={dnsState.flags.includes(flag.value)}
                      onChange={() => handleDnsFlagChange(flag.value)}
                    />
                    {flag.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

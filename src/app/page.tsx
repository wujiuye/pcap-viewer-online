'use client';

import { useState, useEffect } from 'react';
import styles from "./page.module.css";
import AnalyzerUI from "../components/Analyzer/AnalyzerUI";
import FilterGenerator from "../components/FilterGenerator/FilterGenerator";

export default function Home() {
  const [globalFilter, setGlobalFilter] = useState('');
  const [isFileLoaded, setIsFileLoaded] = useState(false);
  const [showAd, setShowAd] = useState(false);

  useEffect(() => {
    if (isFileLoaded) {
      const timer = setTimeout(() => {
        setShowAd(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowAd(false);
    }
  }, [isFileLoaded]);

  return (
    <div className={styles.pageContainer}>
      {/* Navigation Bar */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <img src="/logo.png" alt="Logo" width={32} height={32} style={{ display: 'block' }} />
          </div>
          <span className={styles.logoText}>PCAP Viewer Online</span>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.headerStatus}>
            <span className={styles.statusBlink}></span>
            SYS_STATUS: ONLINE
          </div>
          <div className={styles.headerTag}>
            // LOCAL_PARSING_ONLY
          </div>
          <a href="https://github.com/wujiuye/pcap-viewer-online" target="_blank" className={styles.headerBtn}>
            [ FORK_ON_GITHUB ]
          </a>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.workspaceLayout}>
          {/* Analyzer embedded in a clean container */}
          <section id="analyzer" className={styles.analyzerSection}>
            <div className={styles.analyzerContainer}>
              <div className={styles.analyzerWrapper}>
                <AnalyzerUI
                  globalFilter={globalFilter}
                  onFilterChange={setGlobalFilter}
                  onFileLoaded={setIsFileLoaded}
                />
              </div>
            </div>
          </section>

          {/* Filter Generator Section */}
          {isFileLoaded && (
            <section className={styles.filterSection}>
              <FilterGenerator
                globalFilter={globalFilter}
                onFilterChange={setGlobalFilter}
              />
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerBottom}>
          <p>&copy; {new Date().getFullYear()} PCAP Viewer Online. All rights reserved.</p>
        </div>
      </footer>

      {/* Floating Ad Card */}
      {showAd && (
        <div className={styles.adCard}>
          <button className={styles.closeAdBtn} onClick={() => setShowAd(false)} title="Close ad">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <div className={styles.adContent}>
            <img src="https://chattcp.com/images/logo.webp" alt="ChatTCP Logo" className={styles.adLogo} />
            <div className={styles.adText}>
              <strong>Struggling to read packets?</strong>
              ChatTCP makes viewing network packets as simple as reading chat logs!
            </div>
          </div>
          <a href="https://chattcp.com/" target="_blank" rel="noopener noreferrer" className={styles.adButton}>
            <span>Visit ChatTCP</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}

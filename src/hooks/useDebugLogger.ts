import { useState, useEffect } from 'react';

export function useDebugLogger() {
  const [logs, setLogs] = useState<string[]>([]);
  
  useEffect(() => {
    const addLog = (type: string, ...args: any[]) => {
      const msg = `[${type}] ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}`;
      setLogs(prev => [...prev.slice(-49), msg]); // Keep last 50 logs
    };

    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => { originalLog(...args); addLog('LOG', ...args); };
    console.error = (...args) => { originalError(...args); addLog('ERR', ...args); };
    console.warn = (...args) => { originalWarn(...args); addLog('WARN', ...args); };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  return logs;
}

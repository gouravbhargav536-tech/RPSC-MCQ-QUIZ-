import { X, RefreshCw, Database } from 'lucide-react';
import { useState, useEffect } from 'react';
import FirebaseHealthCheck from './FirebaseHealthCheck';

interface DebugTerminalProps {
  logs: string[];
  onClose: () => void;
}

export default function DebugTerminal({ logs, onClose }: DebugTerminalProps) {
  const [keyStatus, setKeyStatus] = useState<{status: string, message: string} | null>(null);
  const [showHealth, setShowHealth] = useState(false);

  const checkKey = async () => {
    try {
      const resp = await fetch("/api/check-key");
      const data = await resp.json();
      setKeyStatus(data);
    } catch {
      setKeyStatus({ status: "error", message: "Failed to reach server key check" });
    }
  };

  useEffect(() => { checkKey(); }, []);

  return (
    <div className="fixed bottom-2 right-2 z-[9999] w-[95vw] md:w-[400px] max-h-[50vh] bg-slate-950 text-emerald-400 p-3 rounded-lg shadow-2xl font-mono text-[9px] overflow-y-auto border border-emerald-900/50 flex flex-col gap-1.5 pointer-events-auto">
      <div className="flex justify-between items-center border-b border-emerald-900 pb-1.5">
        <span className="font-bold uppercase tracking-widest text-[8px]">Builder Console</span>
        <div className='flex gap-2 items-center'>
            {keyStatus && <span className={`text-[8px] font-bold ${keyStatus.status === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
                {keyStatus.status === 'ok' ? 'API OK' : 'API FAILED'}
            </span>}
            <button onClick={() => setShowHealth(!showHealth)} className="text-emerald-400 hover:text-white"><Database size={10} /></button>
            <button onClick={checkKey} className="text-emerald-400 hover:text-white"><RefreshCw size={10} /></button>
            <button onClick={onClose} className="text-emerald-400 hover:text-white"><X size={10} /></button>
        </div>
      </div>
      
      {showHealth && <FirebaseHealthCheck />}

      {keyStatus && (
          <div className={`p-1.5 rounded text-[8px] ${keyStatus.status === 'ok' ? 'bg-emerald-900/20 text-emerald-300' : 'bg-red-950/20 text-red-300'}`}>
              Reason: {keyStatus.message.substring(0, 50)}
          </div>
      )}

      <div className="flex flex-col gap-0.5">
        {logs.length === 0 && <span className="text-emerald-700 italic">No logs yet...</span>}
        {logs.map((log, i) => (
          <div key={i} className="whitespace-pre-wrap break-all border-b border-emerald-900/20 py-0.5">
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}

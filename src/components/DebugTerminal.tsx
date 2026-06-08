import { X } from 'lucide-react';

interface DebugTerminalProps {
  logs: string[];
  onClose: () => void;
}

export default function DebugTerminal({ logs, onClose }: DebugTerminalProps) {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-[400px] max-h-[300px] bg-slate-950 text-emerald-400 p-4 rounded-lg shadow-2xl font-mono text-[10px] overflow-y-auto border border-emerald-900/50 flex flex-col gap-2 pointer-events-auto">
      <div className="flex justify-between items-center border-b border-emerald-900 pb-2">
        <span className="font-bold uppercase tracking-widest text-[9px]">Builder Console</span>
        <button onClick={onClose} className="text-emerald-400 hover:text-white">
          <X size={12} />
        </button>
      </div>
      <div className="flex flex-col gap-1">
        {logs.length === 0 && <span className="text-emerald-700 italic">No logs yet...</span>}
        {logs.map((log, i) => (
          <div key={i} className="whitespace-pre-wrap break-all">
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}

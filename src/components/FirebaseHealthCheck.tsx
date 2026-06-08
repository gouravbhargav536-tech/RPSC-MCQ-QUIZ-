import { useState } from 'react';
import { checkFirebaseHealth, runFirebaseTest, TestResult } from '../services/firebaseTest';

export default function FirebaseHealthCheck() {
  const [status, setStatus] = useState<{
    health: TestResult | null;
    test: {
        connected: boolean;
        writeSuccess: boolean;
        readSuccess: boolean;
        errorMessage?: string;
    } | null;
  }>({ health: null, test: null });
  const [loading, setLoading] = useState(false);

  const runAllTests = async () => {
    setLoading(true);
    const health = await checkFirebaseHealth();
    const test = await runFirebaseTest();
    setStatus({ health, test });
    setLoading(false);
  };

  return (
    <div className="p-4 bg-slate-900 rounded-lg border border-slate-700 text-[10px] text-emerald-400 font-mono">
      <h3 className="font-bold mb-2">Firebase Diagnostics</h3>
      <button 
        onClick={runAllTests}
        disabled={loading}
        className="bg-emerald-700 text-white px-2 py-1 rounded hover:bg-emerald-600 mb-2 w-full"
      >
        {loading ? 'Running...' : 'Run Firebase Test'}
      </button>

      {status.health && (
        <div className="mb-1">
          Firebase: {status.health.status === 'connected' ? '✅ Connected' : '❌ ' + status.health.message}
        </div>
      )}
      {status.test && (
        <>
          <div className="mb-1">
            Write: {status.test.writeSuccess ? '✅ Success' : '❌ Failed'}
          </div>
          <div className="mb-1">
            Read: {status.test.readSuccess ? '✅ Success' : '❌ Failed'}
          </div>
          {status.test.errorMessage && (
            <div className="text-red-400 mt-2 p-1 bg-red-950 rounded">
                Error: {status.test.errorMessage}
            </div>
          )}
        </>
      )}
    </div>
  );
}

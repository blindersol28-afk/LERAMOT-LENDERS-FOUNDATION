import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Settings, 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  RefreshCw, 
  Play, 
  AlertTriangle, 
  Layers, 
  FileText, 
  Database, 
  Terminal,
  X
} from 'lucide-react';

interface PaymentItem {
  checkoutRequestID: string;
  applicationId: string;
  amount: number;
  status: string;
  mpesaReceiptNumber: string | null;
  createdAt: string;
  updatedAt: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  idNumber: string | null;
  purpose: string | null;
}

interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'failed' | 'info';
}

const PayheroPortal: React.FC = () => {
  // Toasts state
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (message: string, type: 'success' | 'failed' | 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Credentials State
  const [config, setConfig] = useState({
    apiKey: '',
    channelId: '',
    username: '',
    appUrl: '',
    isApiKeySet: false,
    mode: 'sandbox'
  });
  
  const [configLoading, setConfigLoading] = useState(true);
  const [configSaving, setConfigSaving] = useState(false);
  const [configMessage, setConfigMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Payments State
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  // Simulation State
  const [simulationLoading, setSimulationLoading] = useState<string | null>(null);

  // Fetch configs and payments
  const loadData = async () => {
    try {
      const configRes = await fetch('/api/payhero/config');
      const configData = await configRes.json();
      setConfig({
        apiKey: configData.apiKey || '',
        channelId: String(configData.channelId || ''),
        username: configData.username || '',
        appUrl: configData.appUrl || '',
        isApiKeySet: !!configData.isApiKeySet,
        mode: configData.mode || 'sandbox'
      });
      setConfigLoading(false);
    } catch (err) {
      console.error('Error reading config:', err);
      setConfigLoading(false);
    }

    try {
      const paymentsRes = await fetch('/api/payhero/payments');
      const paymentsData = await paymentsRes.json();
      setPayments(paymentsData);
      paymentsLoading && setPaymentsLoading(false);
    } catch (err) {
      console.error('Error reading payments history:', err);
      setPaymentsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      // Background poll transactions to keep view updated
      fetch('/api/payhero/payments')
        .then(res => res.json())
        .then(data => setPayments(data))
        .catch(err => console.error(err));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleClearConfig = async () => {
    if (!window.confirm('Are you sure you want to completely clear all saved credentials from the database to avoid any conflict of interest?')) {
      return;
    }

    setConfigSaving(true);
    setConfigMessage(null);

    try {
      const res = await fetch('/api/payhero/config/clear', {
        method: 'POST'
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to clear credentials.');

      setConfig({
        apiKey: '',
        channelId: '',
        username: '',
        appUrl: '',
        isApiKeySet: false,
        mode: 'sandbox'
      });

      setConfigMessage({ type: 'success', text: 'All saved credentials have been successfully cleared!' });
    } catch (err: any) {
      setConfigMessage({ type: 'error', text: err.message || 'An unexpected error occurred.' });
    } finally {
      setConfigSaving(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSaving(true);
    setConfigMessage(null);

    try {
      const res = await fetch('/api/payhero/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: config.apiKey,
          channelId: config.channelId,
          username: config.username,
          appUrl: config.appUrl,
          mode: config.mode
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update credentials.');

      setConfigMessage({ type: 'success', text: 'Credentials persisted securely to the database!' });
      // Reload to see the masked key updated
      await loadData();
    } catch (err: any) {
      setConfigMessage({ type: 'error', text: err.message || 'An unexpected error occurred.' });
    } finally {
      setConfigSaving(false);
    }
  };

  const handleSimulateCallback = async (checkoutRequestID: string, status: 'success' | 'failed') => {
    setSimulationLoading(checkoutRequestID);
    try {
      const res = await fetch('/api/payhero/simulate-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkoutRequestID,
          status
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Simulation failed');

      // Database successfully updated toast
      addToast('Simulated payment successfully updated the database.', 'info');

      // Show 'success' or 'failed' based on standard transaction status
      if (status === 'success') {
        addToast('success', 'success');
      } else {
        addToast('failed', 'failed');
      }

      // Refresh payments state
      const paymentsRes = await fetch('/api/payhero/payments');
      const paymentsData = await paymentsRes.json();
      setPayments(paymentsData);
    } catch (err: any) {
      addToast('failed', 'failed');
      addToast(err.message || 'Operation was not successful', 'failed');
    } finally {
      setSimulationLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header Hero banner */}
        <div className="bg-[#006D77] rounded-[32px] p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-24 -translate-y-24 w-96 h-96 bg-white/5 rounded-full" />
          <div className="relative z-10 space-y-4 max-w-2xl">
            <span className="bg-[#FF8C42]/20 text-[#FF8C42] text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-[#FF8C42]/30">
              Gateway Integration Portal
            </span>
            <h1 className="text-4xl sm:text-5xl font-black font-outfit leading-tight tracking-tight">
              Payhero M-PESA Integration
            </h1>
            <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
              Verify your setup, configure API keys securely, and simulate M-PESA payment flows directly on our sandboxed ledger.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Left Column: Form Setup */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* Form Section */}
            <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-100 shadow-xl">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-[#006D77]/10 p-2.5 rounded-xl">
                  <Lock className="h-6 w-6 text-[#006D77]" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 font-outfit">Credentials Manager</h2>
                  <p className="text-xs text-slate-400 font-bold">Encrypted server-side storage (SQLite Database)</p>
                </div>
              </div>

              {configLoading ? (
                <div className="py-12 text-center text-slate-400 font-bold flex items-center justify-center space-x-2">
                  <RefreshCw className="h-5 w-5 animate-spin text-[#006D77]" />
                  <span>Loading configuration status...</span>
                </div>
              ) : (
                <form onSubmit={handleSaveConfig} className="space-y-6">
                  
                  <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl flex items-start space-x-3 text-xs text-slate-500 mb-2">
                    <HelpCircle className="h-5 w-5 text-[#006D77] shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      Saving settings here overrides default <strong>.env</strong> variables. Sensitive fields like the API Key are masked after submission for security, but can be updated at any time.
                    </p>
                  </div>

                   <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
                          API Username
                        </label>
                        <span className="text-[10px] text-slate-400 font-bold">Required</span>
                      </div>
                      <input
                        type="text"
                        name="username"
                        value={config.username}
                        onChange={handleConfigChange}
                        placeholder="Enter API Username"
                        className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-4 font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77] transition-all"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
                          API password
                        </label>
                        <span className="text-[10px] text-slate-400 font-bold">Required</span>
                      </div>
                      <input
                        type="password"
                        name="apiKey"
                        value={config.apiKey}
                        onChange={handleConfigChange}
                        placeholder={config.isApiKeySet ? "••••••••••••••••••••••••••••" : "Enter API password"}
                        className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-4 font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77] transition-all"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
                          account ID
                        </label>
                        <span className="text-[10px] text-slate-400 font-bold">Required</span>
                      </div>
                      <input
                        type="text"
                        name="channelId"
                        value={config.channelId}
                        onChange={handleConfigChange}
                        placeholder="Enter account ID"
                        className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-4 font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77] transition-all"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
                          APP_URL
                        </label>
                        <span className="text-[10px] text-slate-400 font-bold">Required</span>
                      </div>
                      <input
                        type="url"
                        name="appUrl"
                        value={config.appUrl}
                        onChange={handleConfigChange}
                        placeholder="e.g. https://your-domain.run.app"
                        className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-4 font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77] transition-all"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
                          Gateway Operation Mode
                        </label>
                        <span className="text-[10px] text-teal-600 font-bold">Live Status</span>
                      </div>
                      <select
                        name="mode"
                        value={config.mode}
                        onChange={handleConfigChange}
                        className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-4 font-bold text-slate-850 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77] transition-all"
                      >
                        <option value="sandbox">Sandbox / Simulation Fallback (Ideal for local testing)</option>
                        <option value="live">Live Base URL (Direct real-time calls to https://payhero.co.ke)</option>
                      </select>
                    </div>
                  </div>

                  {configMessage && (
                    <div className={`p-4 rounded-xl text-xs font-bold border ${
                      configMessage.type === 'success' 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {configMessage.text}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4 pt-2">
                    <button
                      type="submit"
                      disabled={configSaving}
                      className="flex-1 bg-[#006D77] hover:bg-[#065A63] text-white py-4 px-6 rounded-full font-black shadow-lg transition-all transform hover:scale-[1.01] active:scale-95 flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
                    >
                      {configSaving ? (
                        <>
                          <RefreshCw className="h-5 w-5 animate-spin" />
                          <span>Saving Credentials...</span>
                        </>
                      ) : (
                        <span>Save Payhero Credentials</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleClearConfig}
                      disabled={configSaving}
                      className="bg-red-50 hover:bg-red-100/80 text-red-600 border border-red-200 py-4 px-6 rounded-full font-bold transition-all transform hover:scale-[1.01] active:scale-95 flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
                    >
                      <span>Clear Saved Credentials</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Simulated Transactions Logger */}
            <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-100 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-[#FF8C42]/10 p-2.5 rounded-xl">
                    <Terminal className="h-6 w-6 text-[#FF8C42]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 font-outfit">Active Ledger</h2>
                    <p className="text-xs text-slate-400 font-bold">Applications & M-PESA payment requests</p>
                  </div>
                </div>
                <button 
                  onClick={loadData}
                  className="self-start sm:self-auto bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-xs font-black flex items-center space-x-1.5 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Refresh List</span>
                </button>
              </div>

              {paymentsLoading ? (
                <div className="py-12 text-center text-slate-400 font-bold flex items-center justify-center space-x-2">
                  <RefreshCw className="h-5 w-5 animate-spin text-[#FF8C42]" />
                  <span>Loading transaction log...</span>
                </div>
              ) : payments.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                  <Database className="h-10 w-10 text-slate-300 mx-auto mb-4" />
                  <p className="text-sm font-black text-slate-800">No transactions recorded yet</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto p-2">
                    Submit a rate request on the application funnel to generate dynamic invoice payment requests on this ledger!
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        <th className="py-4">Applicant</th>
                        <th className="py-4 text-center">Amount</th>
                        <th className="py-4 text-center">Status</th>
                        <th className="py-4 text-center">Reference ID</th>
                        <th className="py-4 text-right">Actions / Developer simulation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {payments.map((p) => (
                        <tr key={p.checkoutRequestID} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="py-4">
                            <div className="font-black text-slate-900 text-sm">
                              {p.firstName || 'Anonymous'} {p.lastName || ''}
                            </div>
                            <div className="text-[10px] font-mono font-bold text-slate-400 mt-0.5">
                              {p.phoneNumber || 'N/A'} (ID: {p.idNumber || 'N/A'})
                            </div>
                          </td>
                          <td className="py-4 text-center font-black text-slate-900 text-sm">
                            KSH {p.amount.toLocaleString()}
                          </td>
                          <td className="py-4 text-center">
                            <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              p.status === 'success' 
                                ? 'bg-green-50 text-green-700 border border-green-100' 
                                : p.status === 'failed' 
                                ? 'bg-red-50 text-red-700 border border-red-100' 
                                : 'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse'
                            }`}>
                              <span>{p.status.toUpperCase()}</span>
                            </span>
                          </td>
                          <td className="py-4 text-center font-mono font-semibold text-slate-500 text-[10px]">
                            {p.checkoutRequestID}
                          </td>
                          <td className="py-4 text-right">
                            {p.status === 'pending' ? (
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  disabled={simulationLoading !== null}
                                  onClick={() => handleSimulateCallback(p.checkoutRequestID, 'success')}
                                  className="bg-green-600 hover:bg-green-700 text-white font-extrabold text-[10px] uppercase tracking-wider px-3 py-2 rounded-lg shadow-sm flex items-center space-x-1 transition-all disabled:opacity-40"
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  <span>Simulate Success</span>
                                </button>
                                <button
                                  disabled={simulationLoading !== null}
                                  onClick={() => handleSimulateCallback(p.checkoutRequestID, 'failed')}
                                  className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-[10px] uppercase tracking-wider px-3 py-2 rounded-lg shadow-sm flex items-center space-x-1 transition-all disabled:opacity-40"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  <span>Fail</span>
                                </button>
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-400 font-bold italic mr-2">
                                {p.status === 'success' ? `M-pesa Code: ${p.mpesaReceiptNumber || 'MOCK...'}` : 'Completed'}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Checklist & Requirements Explanation */}
          <div className="space-y-10">
            
            {/* Checklist Section */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl space-y-6">
              <div className="flex items-center space-x-3">
                <div className="bg-[#006D77]/10 p-2 text-[#006D77] rounded-xl">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="font-black text-slate-900 font-outfit">Integration Requirements</h3>
              </div>

              <div className="space-y-4">
                
                {/* Rule 1 */}
                <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-2xl">
                  <div className="bg-[#006D77] text-white rounded-full p-0.5 text-xs font-bold mt-0.5 shrink-0">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">1. Payhero Credentials</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                      You need a verified Payhero Kenya merchant profile. Enter your <strong>API Key</strong>, and your active <strong>Service Channel ID</strong>.
                    </p>
                  </div>
                </div>

                {/* Rule 2 */}
                <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-2xl">
                  <div className="bg-[#006D77] text-white rounded-full p-0.5 text-xs font-bold mt-0.5 shrink-0">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">2. Public Domain & Webhook</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                      M-PESA checkout requires an external callback destination. Payhero sends notification payloads to:
                      <code className="block bg-slate-200 p-1.5 rounded font-mono text-[9px] text-slate-800 mt-1">
                        /api/payhero/callback
                      </code>
                      This means <strong>APP_URL</strong> must point to a public server address (e.g. your Cloud Run domain).
                    </p>
                  </div>
                </div>

                {/* Rule 3 */}
                <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-2xl">
                  <div className="bg-[#006D77] text-white rounded-full p-0.5 text-xs font-bold mt-0.5 shrink-0">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">3. Phone Number Format</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                      Safaricom mandates phone numbers to follow the international prefix pattern missing the '+' symbol (e.g., <strong>254700000000</strong>). Our code automatic pre-formats entries dynamically.
                    </p>
                  </div>
                </div>

                {/* Rule 4 */}
                <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-2xl">
                  <div className="bg-[#FF8C42]/20 text-[#9E5A2A] rounded-full p-0.5 mt-0.5 shrink-0">
                    <AlertTriangle className="h-4 w-4 text-[#FF8C42]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">Local Development Caveat</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                      Webhooks cannot reach your local host container. Use the <strong>Active Ledger</strong> simulation action (left) to manually trigger success callback events, immediately allowing loans to advance for review!
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Quick stats box */}
            <div className="bg-gradient-to-tr from-[#006D77]/5 to-[#FF8C42]/5 rounded-3xl p-8 border border-white/50 shadow-inner text-center space-y-4">
              <h3 className="text-xs font-black text-[#006D77] uppercase tracking-widest">Database Health</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Orders</p>
                  <p className="text-lg font-black text-slate-800 mt-1">{payments.length}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Succeeded</p>
                  <p className="text-lg font-black text-green-600 mt-1">{payments.filter(item => item.status === 'success').length}</p>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Floating Toast Notification Container */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-[calc(100vw-3rem)]">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-start justify-between gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 ${
                toast.type === 'success'
                  ? 'bg-green-600/95 text-white border-green-700'
                  : toast.type === 'failed'
                  ? 'bg-red-600/95 text-white border-red-700'
                  : 'bg-slate-900/95 text-white border-slate-950'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {toast.type === 'success' && (
                  <CheckCircle className="h-5 w-5 shrink-0 text-white mt-0.5" />
                )}
                {toast.type === 'failed' && (
                  <XCircle className="h-5 w-5 shrink-0 text-white mt-0.5" />
                )}
                {toast.type === 'info' && (
                  <Database className="h-5 w-5 shrink-0 text-teal-400 mt-0.5" />
                )}
                <div className="text-xs font-semibold tracking-wide">
                  {toast.message}
                </div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-white/70 hover:text-white hover:bg-white/10 p-1 rounded transition-colors"
                aria-label="Dismiss toast"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default PayheroPortal;

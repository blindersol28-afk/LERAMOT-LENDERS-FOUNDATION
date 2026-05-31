import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  CreditCard, 
  RefreshCw, 
  PlusCircle, 
  Smartphone, 
  Info, 
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Database,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { LoanPurpose, FundingSource } from '../types';

interface PaymentItem {
  checkoutRequestID: string;
  applicationId: string;
  amount: number;
  status: string;
  paymentType: string;
  mpesaReceiptNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LoanApplication {
  id: string;
  purpose: string;
  amount: number;
  fundingSource: string;
  firstName: string;
  lastName: string;
  birthday: string | null;
  email: string | null;
  phoneNumber: string;
  guarantorNumber: string;
  idNumber: string;
  status: string;
  autoPay: number;
  createdAt: string;
  payments: PaymentItem[];
}

const LoanCenter: React.FC = () => {
  const navigate = useNavigate();

  // Search Flow States
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<LoanApplication[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Submit Application States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [newApplication, setNewApplication] = useState({
    purpose: LoanPurpose.PERSONAL,
    fundingSource: FundingSource.SALARY,
    amount: 5000,
    firstName: '',
    lastName: '',
    birthday: '',
    email: '',
    phoneNumber: '',
    guarantorNumber: '',
    idNumber: ''
  });

  // Repayment Flow States
  const [repayAmount, setRepayAmount] = useState<string>('');
  const [repayPhone, setRepayPhone] = useState<string>('');
  const [repayLoading, setRepayLoading] = useState<string | null>(null); // maps to applicationId
  const [repayMessage, setRepayMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [repayPollID, setRepayPollID] = useState<string | null>(null);
  const [repayPollStatus, setRepayPollStatus] = useState<string | null>(null);

  // UI Active Section
  const [activeTab, setActiveTab] = useState<'manage' | 'apply'>('manage');

  // Load configured M-PESA service channel ID
  const [channelId, setChannelId] = useState('3090761');

  useEffect(() => {
    let retries = 3;
    const fetchConfig = () => {
      fetch('/api/payhero/config')
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (data.channelId) setChannelId(String(data.channelId));
        })
        .catch(err => {
          console.error('Error fetching config (attempt ' + (4 - retries) + '):', err);
          if (retries > 0) {
            retries--;
            setTimeout(fetchConfig, 1500);
          }
        });
    };
    fetchConfig();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchError('Please fill in a valid ID card or Phone number.');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/loans/search?query=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to fetch loan information.');
      setSearchResults(data);

      // Pre-fill repayment phone number with the searched phone if results found
      if (data.length > 0) {
        setRepayPhone(data[0].phoneNumber);
      }
    } catch (err: any) {
      setSearchError(err.message || 'An error occurred during search.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleToggleAutoPay = async (appId: string, currentVal: number) => {
    try {
      const targetVal = currentVal === 1 ? 0 : 1;
      const res = await fetch('/api/loans/toggle-autopay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: appId, autoPay: targetVal === 1 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update auto-pay.');
      
      // Update local state
      setSearchResults(prev => prev.map(loan => {
        if (loan.id === appId) {
          return { ...loan, autoPay: targetVal };
        }
        return loan;
      }));
    } catch (error: any) {
      alert(error.message || 'Failed to update auto-pay setting.');
    }
  };

  // Developer Simulation - approve application status to active/repaid
  const handleSimulateStatus = async (appId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/loans/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: appId, status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Simulation failed.');

      // Reload search results to update UI
      handleSearch();
    } catch (error: any) {
      alert(error.message || 'Simulation updating failed.');
    }
  };

  const handleSubmitLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    // Validate parameters
    const { firstName, lastName, phoneNumber, idNumber, amount } = newApplication;
    if (!firstName.trim() || !lastName.trim() || !phoneNumber.trim() || !idNumber.trim() || !amount) {
      setSubmitError('First name, last name, phone number, ID card number, and loan amount are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/loans/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApplication)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed.');

      setSubmitSuccess('Your loan application was successfully registered in the database! Set the status to approved to manage repayments.');
      setSearchQuery(idNumber); // auto fill search input
      setNewApplication({
        purpose: LoanPurpose.PERSONAL,
        fundingSource: FundingSource.SALARY,
        amount: 5000,
        firstName: '',
        lastName: '',
        birthday: '',
        email: '',
        phoneNumber: '',
        guarantorNumber: '',
        idNumber: ''
      });
      // automatically go to management dashboard
      setTimeout(() => {
        setActiveTab('manage');
        handleSearch();
      }, 2000);
    } catch (error: any) {
      setSubmitError(error.message || 'An unexpected error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRepaySTK = async (loan: LoanApplication) => {
    setRepayMessage(null);
    if (!repayAmount || Number(repayAmount) <= 0) {
      alert('Please enter a valid repayment amount.');
      return;
    }
    if (!repayPhone) {
      alert('Please enter a valid M-PESA phone number.');
      return;
    }

    setRepayLoading(loan.id);

    try {
      const res = await fetch('/api/loans/repay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: loan.id,
          phoneNumber: repayPhone,
          amount: parseFloat(repayAmount)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to trigger M-PESA push.');

      setRepayPollID(data.checkoutRequestID);
      setRepayPollStatus('pending');
      setRepayMessage({ type: 'success', text: `STK push triggered successfully! Please authorize the KSH ${repayAmount} prompt on your phone.` });
      
      // Auto clear input
      setRepayAmount('');
    } catch (err: any) {
      setRepayMessage({ type: 'error', text: err.message || 'Repayment push trigger failed.' });
    } finally {
      setRepayLoading(null);
    }
  };

  // Poll for repayment status updates
  useEffect(() => {
    if (!repayPollID || repayPollStatus !== 'pending') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payhero/status/${repayPollID}`);
        const data = await res.json();
        
        if (data.status === 'success') {
          setRepayPollStatus('success');
          setRepayMessage({ type: 'success', text: 'Repayment payment successfully verified and credited!' });
          setRepayPollID(null);
          clearInterval(interval);
          handleSearch(); // Refresh repayments list
        } else if (data.status === 'failed') {
          setRepayPollStatus('failed');
          setRepayMessage({ type: 'error', text: 'M-PESA repayment transaction failed or was cancelled.' });
          setRepayPollID(null);
          clearInterval(interval);
        }
      } catch (e) {
        console.error('Polling repayment error:', e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [repayPollID, repayPollStatus]);

  // Form input change handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewApplication(prev => ({ ...prev, [name]: value }));
  };

  // Status Badge generator
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'active':
        return <span className="bg-emerald-100 text-emerald-800 font-black text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle className="h-3 w-3" />Approved / Active</span>;
      case 'repaid':
        return <span className="bg-blue-100 text-blue-800 font-black text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1"><ShieldCheck className="h-3 w-3" />Repaid</span>;
      case 'rejected':
      case 'failed':
        return <span className="bg-red-100 text-red-800 font-black text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1"><XCircle className="h-3 w-3" />Rejected</span>;
      default:
        return <span className="bg-amber-100 text-amber-800 font-black text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1"><Clock className="h-3 w-3" />Pending Review</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Module Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-black text-[#FF8C42] uppercase tracking-widest bg-[#FFF4ED] px-3 py-1.5 rounded-full border border-[#FFD8C2]">
              LENDING SUITE
            </span>
            <h1 className="text-4xl font-black text-slate-900 font-outfit mt-4 flex items-center gap-2">
              Loan Management Center
            </h1>
            <p className="text-slate-500 text-sm mt-1">Submit new applications, check status, and manage active loans & repayments</p>
          </div>

          {/* Module Navigation Tabs */}
          <div className="flex bg-slate-200/80 p-1.5 rounded-full self-start md:self-center border border-slate-200">
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-6 py-2.5 rounded-full text-xs font-black tracking-wide transition-all ${
                activeTab === 'manage' ? 'bg-[#006D77] text-white shadow' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Dashboard
            </button>
            <button
              onClick={() => setActiveTab('apply')}
              className={`px-6 py-2.5 rounded-full text-xs font-black tracking-wide transition-all ${
                activeTab === 'apply' ? 'bg-[#006D77] text-white shadow' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Apply Direct
            </button>
          </div>
        </div>

        {activeTab === 'manage' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Search Bar Block */}
            <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-8">
              <h2 className="text-lg font-black text-slate-800 font-outfit mb-2">Access Your Loans</h2>
              <p className="text-slate-500 text-xs mb-6">Enter your National ID card number or registered telephone number to locate details.</p>
              
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter National ID (e.g. 35142345) or Phone Number"
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-12 pr-4 py-4 font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77] transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="bg-[#006D77] hover:bg-[#065A63] text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSearching ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Lookup Accounts'}
                </button>
              </form>
              {searchError && (
                <div className="mt-4 p-4 bg-red-50 text-red-700 text-xs font-bold border border-red-100 rounded-xl">
                  {searchError}
                </div>
              )}
            </div>

            {/* Repayment Action Messages */}
            {repayMessage && (
              <div className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-bold animate-in slide-in-from-top-2 ${
                repayMessage.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}>
                <Info className="h-5 w-5 shrink-0" />
                <div className="flex-1">{repayMessage.text}</div>
                {repayPollID && (
                  <div className="flex items-center gap-1.5 text-slate-500 text-[10px] bg-white border px-2.5 py-1 rounded-lg">
                    <RefreshCw className="h-3 w-3 animate-spin text-[#006D77]" />
                    <span>Verifying</span>
                  </div>
                )}
              </div>
            )}

            {repayPollID && (
              <div className="p-5 bg-indigo-50 border-2 border-indigo-100 rounded-3xl text-xs font-bold animate-in slide-in-from-top-2 flex flex-col md:flex-row items-center justify-between gap-4 mt-4">
                <div className="flex items-start gap-3">
                  <Database className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-indigo-900 font-extrabold font-outfit uppercase tracking-wider text-[11px] mb-1">Repayment Sandbox Simulation</h4>
                    <p className="text-indigo-700 font-semibold text-[11px] leading-relaxed">
                      Repayment Sandbox is listening for Request ID: <span className="font-mono bg-white px-1.5 py-0.5 rounded text-indigo-900 border border-indigo-200">{repayPollID}</span>. Test state trigger:
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto shrink-0">
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/payhero/simulate-callback', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ checkoutRequestID: repayPollID, status: 'success' })
                        });
                        if (res.ok) {
                          setRepayPollStatus('success');
                          setRepayMessage({ type: 'success', text: 'Repayment payment successfully verified and credited!' });
                          setRepayPollID(null);
                          handleSearch();
                        }
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="flex-1 md:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2.5 rounded-xl text-xs uppercase shadow-sm active:scale-95 transition-transform"
                  >
                    Simulate Success
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/payhero/simulate-callback', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ checkoutRequestID: repayPollID, status: 'failed' })
                        });
                        if (res.ok) {
                          setRepayPollStatus('failed');
                          setRepayMessage({ type: 'error', text: 'M-PESA repayment transaction failed or was cancelled under simulation.' });
                          setRepayPollID(null);
                        }
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="flex-1 md:flex-initial bg-red-500 hover:bg-red-600 text-white font-black px-4 py-2.5 rounded-xl text-xs uppercase shadow-sm active:scale-95 transition-transform"
                  >
                    Simulate Fail
                  </button>
                </div>
              </div>
            )}

            {/* Results Output */}
            {hasSearched ? (
              searchResults.length > 0 ? (
                <div className="space-y-6">
                  {searchResults.map((loan) => {
                    // Summarize payments
                    const insurancePayments = loan.payments.filter(p => p.paymentType === 'insurance_fee' && p.status === 'success');
                    const repayments = loan.payments.filter(p => p.paymentType === 'loan_repayment' && p.status === 'success');
                    
                    const isInsurancePaid = insurancePayments.length > 0;
                    const totalRepaidAmt = repayments.reduce((acc, curr) => acc + curr.amount, 0);
                    const loanInterest = loan.amount * 0.10; // Simple 10% interest for management view
                    const totalOwed = loan.amount + loanInterest;
                    const remainingBalance = Math.max(0, totalOwed - totalRepaidAmt);
                    const isFullyPaid = remainingBalance <= 0 && loan.status.toLowerCase() === 'repaid';

                    return (
                      <div key={loan.id} className="bg-white rounded-[24px] shadow-md border border-slate-100 p-6 md:p-8 animate-in slide-in-from-bottom-2 duration-300">
                        {/* Summary Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 pb-6 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="text-xl font-black text-slate-800 font-outfit">Loan #{loan.id.toUpperCase()}</h3>
                              {getStatusBadge(loan.status)}
                            </div>
                            <p className="text-xs text-slate-400 font-semibold mt-1">Requested on {new Date(loan.createdAt).toLocaleDateString()} • Purpose: {loan.purpose}</p>
                          </div>
                          
                          <div className="text-right sm:text-right flex items-center gap-2 sm:self-start">
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">AutoPay Settings:</span>
                            <button
                              onClick={() => handleToggleAutoPay(loan.id, loan.autoPay)}
                              className="focus:outline-none transition-transform active:scale-95"
                              title={loan.autoPay === 1 ? 'Disable Automatic Debit' : 'Enable Automatic Debit'}
                            >
                              {loan.autoPay === 1 ? (
                                <ToggleRight className="text-[#006D77] h-8 w-8" />
                              ) : (
                                <ToggleLeft className="text-slate-300 h-8 w-8" />
                              )}
                            </button>
                            <span className="text-xs font-black text-slate-700">{loan.autoPay === 1 ? 'Enabled' : 'Disabled'}</span>
                          </div>
                        </div>

                        {/* Developer Fast-Control Actions */}
                        <div className="my-4 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                          <span className="font-bold text-indigo-800 flex items-center gap-1">
                            <Database className="h-4 w-4" /> <strong>Developer Simulator:</strong> Test different loan and active states instantly
                          </span>
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => handleSimulateStatus(loan.id, 'approved')}
                              className="bg-emerald-600 hover:bg-emerald-700 font-black text-white px-3 py-1.5 rounded-lg text-[10px] uppercase shadow-sm transition"
                            >
                              Simulate Approve
                            </button>
                            <button
                              onClick={() => handleSimulateStatus(loan.id, 'repaid')}
                              className="bg-blue-600 hover:bg-blue-700 font-black text-white px-3 py-1.5 rounded-lg text-[10px] uppercase shadow-sm transition"
                            >
                              Simulate Repaid
                            </button>
                            <button
                              onClick={() => handleSimulateStatus(loan.id, 'rejected')}
                              className="bg-red-600 hover:bg-red-700 font-black text-white px-3 py-1.5 rounded-lg text-[10px] uppercase shadow-sm transition"
                            >
                              Simulate Reject
                            </button>
                            <button
                              onClick={() => handleSimulateStatus(loan.id, 'pending')}
                              className="bg-slate-500 hover:bg-slate-600 font-black text-white px-3 py-1.5 rounded-lg text-[10px] uppercase shadow-sm transition"
                            >
                              Lock Pending
                            </button>
                          </div>
                        </div>

                        {/* Key Loan Indicators */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-b border-slate-100">
                          <div>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Total Borrowed</p>
                            <p className="text-lg font-black text-slate-900 mt-0.5">KSH {loan.amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Interest Added (10%)</p>
                            <p className="text-lg font-black text-slate-900 mt-0.5">KSH {loanInterest.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Amount Repaid</p>
                            <p className="text-lg font-black text-teal-600 mt-0.5">KSH {totalRepaidAmt.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Outstanding Balance</p>
                            <p className={`text-lg font-black mt-0.5 ${remainingBalance > 0 ? 'text-[#FF8C42]' : 'text-emerald-600'}`}>
                              KSH {remainingBalance.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Repayment & AutoPay setup controls details */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
                          
                          {/* STK Repayment Prompt Panel */}
                          <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-100">
                            <h4 className="text-sm font-black text-slate-700 mb-2 flex items-center gap-1.5">
                              <Smartphone className="h-4 w-4 text-[#006D77]" /> Push Repayment Notification
                            </h4>
                            <p className="text-slate-500 text-xs mb-4">
                              Specify the receipt phone and payment amount to start an instant Lipa Na M-PESA STK prompt.
                            </p>

                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1">M-PESA Phone Number</label>
                                  <input
                                    type="text"
                                    value={repayPhone}
                                    onChange={(e) => setRepayPhone(e.target.value)}
                                    placeholder="e.g. 0708374149"
                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#006D77]"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1">Repayment Sum</label>
                                  <input
                                    type="number"
                                    value={repayAmount}
                                    onChange={(e) => setRepayAmount(e.target.value)}
                                    placeholder="Enter Amount"
                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#006D77]"
                                  />
                                </div>
                              </div>
                              <button
                                onClick={() => handleRepaySTK(loan)}
                                disabled={repayLoading === loan.id || remainingBalance <= 0 || loan.status.toLowerCase() !== 'approved' && loan.status.toLowerCase() !== 'active'}
                                className="w-full bg-[#006D77] hover:bg-[#065A63] text-white py-2.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-sm disabled:opacity-50"
                              >
                                {repayLoading === loan.id ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 animate-spinPin" />
                                    <span>Sending Prompt...</span>
                                  </>
                                ) : (
                                  <>
                                    <CreditCard className="h-4 w-4" />
                                    <span>Lipa Na M-PESA Repay</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Historical Payments Tracker */}
                          <div>
                            <h4 className="text-sm font-black text-slate-700 mb-3 flex items-center gap-1.5">
                              <Database className="h-4 w-4 text-[#FF8C42]" /> Payment History & Ledger
                            </h4>
                            {loan.payments.length > 0 ? (
                              <div className="max-h-[180px] overflow-y-auto space-y-2.5 pr-1">
                                {loan.payments.map((pmt) => (
                                  <div key={pmt.checkoutRequestID} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3 rounded-xl hover:bg-slate-100/50 transition">
                                    <div className="text-xs">
                                      <div className="font-bold text-slate-800">
                                        {pmt.paymentType === 'insurance_fee' ? 'Insurance / App Fee' : 'Loan Installment Repay'}
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-medium">Ref: {pmt.mpesaReceiptNumber || pmt.checkoutRequestID.slice(0, 10) + '...'}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-black text-slate-800 text-xs">KSH {pmt.amount.toLocaleString()}</div>
                                      <div className={`text-[9px] font-bold uppercase ${
                                        pmt.status === 'success' ? 'text-green-600' : pmt.status === 'failed' ? 'text-red-500' : 'text-amber-500'
                                      }`}>
                                        {pmt.status}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="h-[120px] bg-slate-50/55 rounded-2xl flex flex-col items-center justify-center border border-dashed border-slate-200">
                                <AlertCircle className="h-6 w-6 text-slate-300 mb-1" />
                                <span className="text-[10px] text-slate-400 font-bold">No historical payments have been registered.</span>
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-[24px] border border-slate-200/80 p-12 text-center max-w-lg mx-auto shadow-sm">
                  <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
                  <h3 className="text-lg font-black text-slate-900 font-outfit">No Records Found</h3>
                  <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                    We couldn't locate any active loan applications for <span className="font-bold text-slate-800">"{searchQuery}"</span>. If you recently applied, remember it takes a few moments to sync into credit records.
                  </p>
                  <button
                    onClick={() => setActiveTab('apply')}
                    className="mt-6 bg-[#006D77] hover:bg-[#065A63] text-white px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider inline-flex items-center gap-1 transition"
                  >
                    Create New Application <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[28px] p-12 text-center max-w-lg mx-auto">
                <ShieldCheck className="h-10 w-10 text-[#006D77] mx-auto mb-3" />
                <h3 className="text-base font-black text-slate-700">Database Secure Connect</h3>
                <p className="text-xs text-slate-400 mt-1">Please insert your registered ID details above to safely unlock your custom financial desk.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'apply' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
            {/* Direct Application Form Block */}
            <div className="bg-white rounded-[24px] border border-slate-100 p-8 shadow-sm lg:col-span-2">
              <h2 className="text-2xl font-black text-slate-800 font-outfit mb-2">Loan Application Form</h2>
              <p className="text-slate-500 text-xs mb-6">Complete standard forms to record a new application directly into Leramot DB.</p>

              <form onSubmit={handleSubmitLoan} className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={newApplication.firstName}
                      onChange={handleInputChange}
                      placeholder="Enter first name"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-bold text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-[#006D77] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={newApplication.lastName}
                      onChange={handleInputChange}
                      placeholder="Enter last name"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-bold text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-[#006D77] transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1">National ID Card Number</label>
                    <input
                      type="text"
                      name="idNumber"
                      value={newApplication.idNumber}
                      onChange={handleInputChange}
                      placeholder="e.g. 35142142"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-bold text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-[#006D77] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1">Your M-PESA Number</label>
                    <input
                      type="text"
                      name="phoneNumber"
                      value={newApplication.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="e.g. 0708374149"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-bold text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-[#006D77] transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1">Loan Amount (KSH)</label>
                    <input
                      type="number"
                      name="amount"
                      value={newApplication.amount}
                      onChange={handleInputChange}
                      placeholder="e.g. 5000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-bold text-slate-[#006D77] text-base focus:outline-none focus:ring-1 focus:ring-[#006D77] transition font-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1">Loan Purpose</label>
                    <select
                      name="purpose"
                      value={newApplication.purpose}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-bold text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-[#006D77] transition"
                    >
                      {Object.values(LoanPurpose).map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1">Funding Source</label>
                    <select
                      name="fundingSource"
                      value={newApplication.fundingSource}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-bold text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-[#006D77] transition"
                    >
                      {Object.values(FundingSource).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1">Guarantor Mobile Number</label>
                    <input
                      type="text"
                      name="guarantorNumber"
                      value={newApplication.guarantorNumber}
                      onChange={handleInputChange}
                      placeholder="e.g. 0712345678"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-bold text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-[#006D77] transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      name="birthday"
                      value={newApplication.birthday}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-bold text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-[#006D77] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1">Email (Optional)</label>
                    <input
                      type="email"
                      name="email"
                      value={newApplication.email}
                      onChange={handleInputChange}
                      placeholder="e.g. user@customer.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-bold text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-[#006D77] transition"
                    />
                  </div>
                </div>

                {submitError && (
                  <div className="p-4 bg-red-50 text-red-700 font-bold border border-red-100 text-xs rounded-xl">
                    {submitError}
                  </div>
                )}

                {submitSuccess && (
                  <div className="p-4 bg-emerald-50 text-emerald-800 font-bold border border-emerald-100 text-xs rounded-xl">
                    {submitSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#006D77] hover:bg-[#065A63] text-white py-4 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Transmitting Information...</span>
                    </>
                  ) : (
                    <span>Submit Direct Application</span>
                  )}
                </button>
              </form>
            </div>

            {/* Calculations Card */}
            <div className="bg-[#FFF4ED] border border-[#FFD8C2] rounded-[24px] p-6 self-start space-y-5 shadow-sm">
              <span className="inline-block bg-[#FF8C42] text-white font-black text-[9px] tracking-wider uppercase px-2 py-0.5 rounded-full">
                QUICK RATES
              </span>
              <h3 className="text-lg font-black text-slate-800 font-outfit leading-none mb-1">Guaranteed Conditions</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Leramot utilizes standardized ethical interest tables. Here is a breakdown for a loan of <strong>KSH {newApplication.amount.toLocaleString()}</strong>:
              </p>

              <div className="space-y-4 text-xs font-semibold text-slate-700">
                <div className="flex justify-between border-b border-orange-200/50 pb-2">
                  <span>Insurance Fee (6% due upfront):</span>
                  <span className="text-[#006D77] font-black">KSH {Math.round(newApplication.amount * 0.06).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-orange-200/50 pb-2">
                  <span>Simple Flat Interest (10%):</span>
                  <span className="font-bold">KSH {Math.round(newApplication.amount * 0.1).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-orange-200/50 pb-2">
                  <span>Total Payable:</span>
                  <span className="font-black text-slate-900">KSH {Math.round(newApplication.amount * 1.1).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Guarantor Check:</span>
                  <span className="text-emerald-700">Required (SMS)</span>
                </div>
              </div>

              <div className="p-3 bg-white/60 border border-orange-200 rounded-xl text-[10px] text-orange-800 font-medium leading-relaxed">
                <Info className="h-4 w-4 text-[#FF8C42] inline mr-1 mb-0.5" /> Note: Approval usually requires active guarantor digital verification.
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default LoanCenter;


import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Copy, Check, Database } from 'lucide-react';
import { LoanPurpose, FundingSource } from '../types';
import payheroQr from '../components/payhero_qr.png';

interface FormErrors {
  [key: string]: string;
}

const ApplicationFunnel: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialValues = location.state as { 
    initialAmount?: number; 
    initialTerm?: number;
    initialFee?: number;
    totalInterest?: number;
  } || {};

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    purpose: LoanPurpose.PERSONAL,
    fundingSource: '' as FundingSource | '',
    amount: initialValues.initialAmount || 5000,
    firstName: '',
    lastName: '',
    birthday: '',
    email: '',
    phoneNumber: '',
    guarantorNumber: '',
    idNumber: '',
    country: 'Kenya'
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [initialFee, setInitialFee] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');

  const [checkoutRequestID, setCheckoutRequestID] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [payheroConfig, setPayheroConfig] = useState<{ channelId: string } | null>(null);
  const [refCopied, setRefCopied] = useState(false);

  useEffect(() => {
    let retries = 3;
    const fetchConfig = () => {
      fetch('/api/payhero/config')
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          setPayheroConfig({
            channelId: String(data.channelId || '3090761')
          });
        })
        .catch(err => {
          console.error('Error fetching payhero config for QR (attempt ' + (4 - retries) + '):', err);
          if (retries > 0) {
            retries--;
            setTimeout(fetchConfig, 1500);
          } else {
            setPayheroConfig({ channelId: '3090761' });
          }
        });
    };
    fetchConfig();
  }, []);

  const formatPhoneNumber = (value: string, country: string) => {
    if (!value) return '';
    const digits = value.replace(/\D/g, '');
    if (country === 'Kenya') {
      if (digits.length === 0) return '';
      
      // If user backspaced and only "+25" or similar remains, support deleting completely
      if (value.length <= 4 && (digits === '2' || digits === '25' || digits === '254')) {
        return '';
      }
      
      let cleaned = digits;
      if (cleaned.startsWith('254')) {
        cleaned = cleaned.substring(3);
      } else if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
      }
      
      cleaned = cleaned.substring(0, 9); // Max 9 digits
      
      let formatted = '+254';
      if (cleaned.length > 0) formatted += ' ' + cleaned.substring(0, 3);
      if (cleaned.length > 3) formatted += ' ' + cleaned.substring(3, 6);
      if (cleaned.length > 6) formatted += ' ' + cleaned.substring(6, 9);
      
      if (cleaned.length === 0) {
        return '+254';
      }
      
      return formatted;
    }
    return value;
  };

  const getDisplayPhone = (phoneStr: string) => {
    if (!phoneStr) return '';
    if (formData.country !== 'Kenya') return phoneStr;
    const digits = phoneStr.replace(/\D/g, '');
    let cleaned = digits;
    if (cleaned.startsWith('254')) {
      cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    cleaned = cleaned.substring(0, 9);
    let formatted = '+254';
    if (cleaned.length > 0) formatted += ' ' + cleaned.substring(0, 3);
    if (cleaned.length > 3) formatted += ' ' + cleaned.substring(3, 6);
    if (cleaned.length > 6) formatted += ' ' + cleaned.substring(6, 9);
    return formatted;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'phoneNumber' | 'guarantorNumber') => {
    const val = e.target.value;
    if (formData.country === 'Kenya') {
      const formatted = formatPhoneNumber(val, 'Kenya');
      setFormData(prev => ({ ...prev, [field]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [field]: val }));
    }
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const totalSteps = 4; 
  const MIN_LOAN = 800;
  const MAX_LOAN = 11600;
  const INSURANCE_FEE_RATE = 0.06;

  useEffect(() => {
    setInitialFee(Math.round(formData.amount * INSURANCE_FEE_RATE));
  }, [formData.amount]);

  useEffect(() => {
    if (!checkoutRequestID || paymentStatus !== 'pending') return;

    let pollInterval: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;

    const startPolling = () => {
      pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/payhero/status/${checkoutRequestID}`);
          const statusData = await statusRes.json();
          
          if (statusData.status === 'success') {
            clearInterval(pollInterval);
            clearTimeout(timeoutId);
            setPaymentStatus('success');
            setTimeout(() => {
              setStep(6);
              setIsSubmitting(false);
            }, 2000);
          } else if (statusData.status === 'failed') {
            clearInterval(pollInterval);
            clearTimeout(timeoutId);
            setPaymentStatus('failed');
            setIsSubmitting(false);
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 3000);

      // Timeout polling after 2 minutes
      timeoutId = setTimeout(() => {
        clearInterval(pollInterval);
        setPaymentStatus('idle');
        setStep(4);
        setIsSubmitting(false);
        setErrors(prev => ({ ...prev, payment: 'payment timeout. If this keeps happenning consider using the link and copy the reference code from this page to use in payment using the link.' }));
      }, 120000);
    };

    startPolling();

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [checkoutRequestID, paymentStatus]);

  const validateStep = (currentStep: number): boolean => {
    const newErrors: FormErrors = {};

    if (currentStep === 1) {
      if (formData.amount < MIN_LOAN || formData.amount > MAX_LOAN) {
        newErrors.amount = `Amount must be between KSH ${MIN_LOAN} and ${MAX_LOAN}`;
      }
      if (!formData.fundingSource) {
        newErrors.fundingSource = "Please select your primary funding source";
      }
    }

    if (currentStep === 2) {
      if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
      if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
      
      if (!formData.birthday) {
        newErrors.birthday = "Date of birth is required";
      } else {
        const birthDate = new Date(formData.birthday);
        const age = new Date().getFullYear() - birthDate.getFullYear();
        if (age < 18) newErrors.birthday = "You must be at least 18 years old";
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!emailRegex.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    if (currentStep === 3) {
      if (formData.country === 'Kenya') {
        const digits = formData.phoneNumber.replace(/\D/g, '');
        if (!formData.phoneNumber) {
          newErrors.phoneNumber = "Phone number is required";
        } else if (digits.length !== 12) {
          newErrors.phoneNumber = "Enter a complete Kenyan phone number (+254...)";
        }

        const gDigits = formData.guarantorNumber.replace(/\D/g, '');
        if (!formData.guarantorNumber) {
          newErrors.guarantorNumber = "Guarantor number is required";
        } else if (gDigits.length !== 12) {
          newErrors.guarantorNumber = "Enter a complete Kenyan phone number";
        } else if (formData.guarantorNumber === formData.phoneNumber) {
          newErrors.guarantorNumber = "Guarantor cannot be the same as the applicant";
        }
      } else {
        // Simple validation for international numbers
        const digits = formData.phoneNumber.replace(/\D/g, '');
        if (!formData.phoneNumber) {
          newErrors.phoneNumber = "Phone number is required";
        } else if (digits.length < 10) {
          newErrors.phoneNumber = "Enter a valid phone number";
        }

        const gDigits = formData.guarantorNumber.replace(/\D/g, '');
        if (!formData.guarantorNumber) {
          newErrors.guarantorNumber = "Guarantor number is required";
        } else if (gDigits.length < 10) {
          newErrors.guarantorNumber = "Enter a valid phone number";
        } else if (formData.guarantorNumber === formData.phoneNumber) {
          newErrors.guarantorNumber = "Guarantor cannot be the same as the applicant";
        }
      }

      if (!formData.idNumber) {
        newErrors.idNumber = "ID number is required";
      } else if (formData.idNumber.length < 7 || formData.idNumber.length > 8) {
        newErrors.idNumber = "ID must be 7-8 digits";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(s => Math.min(s + 1, 6));
    }
  };

  const handleBack = () => {
    setErrors({});
    setStep(s => Math.max(s - 1, 1));
  };

  const triggerSTKPush = async () => {
    // Final validation across all inputs
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      if (Object.keys(errors).some(k => ['amount', 'fundingSource'].includes(k))) setStep(1);
      else if (Object.keys(errors).some(k => ['firstName', 'lastName', 'birthday', 'email'].includes(k))) setStep(2);
      else setStep(3);
      return;
    }

    setIsSubmitting(true);
    setStep(5);
    setPaymentStatus('pending');

    const cleanPhone = formData.phoneNumber.replace(/\D/g, '');

    try {
      const response = await fetch('/api/payhero/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: cleanPhone,
          amount: initialFee,
          accountReference: `LERAMOT-${formData.idNumber}`,
          applicationData: formData
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to initiate payment');

      setCheckoutRequestID(data.checkoutRequestID);
      setIsSimulated(!!data.isSimulated);
    } catch (err: any) {
      console.error('Payment error:', err);
      setPaymentStatus('idle');
      setStep(4);
      setIsSubmitting(false);
      setErrors({ payment: err.message || 'An unexpected error occurred' });
    }
  };

  const handleSimulatePayment = async (status: 'success' | 'failed') => {
    if (!checkoutRequestID) return;
    try {
      const res = await fetch('/api/payhero/simulate-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkoutRequestID, status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to simulate payment result');
    } catch (err: any) {
      console.error('Simulation click trigger error:', err);
    }
  };

  const progress = Math.min((step / totalSteps) * 100, 100);

  const InputError = ({ field }: { field: string }) => (
    errors[field] ? (
      <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-1 animate-in slide-in-from-top-1">
        {errors[field]}
      </p>
    ) : null
  );

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        {step <= totalSteps && (
          <div className="mb-12">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-black text-[#006D77] uppercase tracking-widest">
                {`Step ${step} of ${totalSteps}`}
              </span>
              <span className="text-xs font-bold text-slate-400">{Math.round(progress)}% Complete</span>
            </div>
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#006D77] transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="bg-white rounded-[32px] shadow-2xl p-8 md:p-12 border border-slate-100">
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-3xl font-black text-slate-900 font-outfit mb-2">Loan Details</h2>
              <p className="text-slate-500 mb-8">Confirm how much you need and your source of funds.</p>
              
              <div className="space-y-6 mb-8">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Loan Amount</label>
                  <div className="relative mb-3">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-slate-400">KSH</span>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => {
                        setFormData({...formData, amount: Number(e.target.value)});
                        if (errors.amount) setErrors(prev => ({...prev, amount: ''}));
                      }}
                      className={`w-full bg-slate-50 border-2 rounded-2xl px-16 py-5 text-2xl font-black text-[#006D77] focus:outline-none transition-colors ${
                        errors.amount ? 'border-red-300 bg-red-50' : 'border-slate-100 focus:border-[#006D77]'
                      }`}
                    />
                  </div>
                  <InputError field="amount" />

                  {/* Highly Noticeable Gauge Section & Live Controls */}
                  <div className="bg-gradient-to-br from-slate-50 to-[#F4F9FA] border-2 border-[#B2D8DB] rounded-3xl p-6 shadow-xs mt-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#006D77]/10" />
                    
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black text-[#006D77] uppercase tracking-widest flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-[#FF8C42] animate-pulse" />
                        Interactive Gauge Adjustment
                      </span>
                      <span className="text-xs font-black text-slate-600 bg-white border border-slate-100 rounded-full px-3 py-1 shadow-xs">
                        KSH {formData.amount.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* Decrease Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const newVal = Math.max(formData.amount - 100, MIN_LOAN);
                          setFormData({...formData, amount: newVal});
                          if (errors.amount) setErrors(prev => ({...prev, amount: ''}));
                        }}
                        className="w-10 h-10 rounded-full bg-white border border-slate-200 hover:border-[#006D77] hover:text-[#006D77] flex items-center justify-center font-black text-slate-500 shadow-xs transition-all active:scale-90"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 12H6" />
                        </svg>
                      </button>

                      {/* Slider Track Gauge */}
                      <div className="flex-1 relative flex items-center py-4">
                        <input
                          type="range"
                          min={MIN_LOAN}
                          max={MAX_LOAN}
                          step={100}
                          value={formData.amount}
                          onChange={(e) => {
                            setFormData({...formData, amount: Number(e.target.value)});
                            if (errors.amount) setErrors(prev => ({...prev, amount: ''}));
                          }}
                          className="w-full h-3 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#006D77] focus:outline-none focus:ring-2 focus:ring-[#006D77]/20 transition-all"
                          style={{
                            background: `linear-gradient(to right, #006D77 0%, #006D77 ${Math.min(Math.max(((formData.amount - MIN_LOAN) / (MAX_LOAN - MIN_LOAN)) * 100, 0), 100)}%, #E2E8F0 ${Math.min(Math.max(((formData.amount - MIN_LOAN) / (MAX_LOAN - MIN_LOAN)) * 100, 0), 100)}%, #E2E8F0 100%)`
                          }}
                        />
                      </div>

                      {/* Increase Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const newVal = Math.min(formData.amount + 100, MAX_LOAN);
                          setFormData({...formData, amount: newVal});
                          if (errors.amount) setErrors(prev => ({...prev, amount: ''}));
                        }}
                        className="w-10 h-10 rounded-full bg-white border border-slate-200 hover:border-[#006D77] hover:text-[#006D77] flex items-center justify-center font-black text-slate-500 shadow-xs transition-all active:scale-90"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v12m6-6H6" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex justify-between mt-2.5 px-1">
                      <span className="text-[10px] text-slate-400 font-bold">MIN KSH {MIN_LOAN.toLocaleString()}</span>
                      <span className="text-[10px] text-[#006D77] font-extrabold bg-[#E6F3F4] px-2 py-0.5 rounded-md">TAP SLIDER TO FINE TUNE</span>
                      <span className="text-[10px] text-slate-400 font-bold">MAX KSH {MAX_LOAN.toLocaleString()}</span>
                    </div>

                    {/* Snap Preset Buttons */}
                    <div className="mt-5 pt-4 border-t border-slate-200">
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quick Amount Snaps</p>
                        <span className="text-[10px] text-slate-400 font-bold">100-step resolution</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[2000, 5000, 8000, 11000].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => {
                              setFormData({...formData, amount: preset});
                              if (errors.amount) setErrors(prev => ({...prev, amount: ''}));
                            }}
                            className={`py-2.5 rounded-xl text-xs font-black transition-all transform active:scale-95 ${
                              formData.amount === preset
                                ? 'bg-[#006D77] text-white shadow-md'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            K {preset.toLocaleString()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Residence Area</label>
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#006D77]"
                    >
                      <option value="Kenya">Kenya</option>
                      <option value="USA">United States</option>
                      <option value="Canada">Canada</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Loan Purpose</label>
                    <select
                      value={formData.purpose}
                      onChange={(e) => setFormData({...formData, purpose: e.target.value as LoanPurpose})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#006D77]"
                    >
                      {Object.values(LoanPurpose).map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Primary Funding Source</label>
                  <select
                    value={formData.fundingSource}
                    onChange={(e) => {
                      setFormData({...formData, fundingSource: e.target.value as FundingSource});
                      if (errors.fundingSource) setErrors(prev => ({...prev, fundingSource: ''}));
                    }}
                    className={`w-full bg-slate-50 border rounded-2xl px-5 py-4 font-bold text-slate-700 outline-none transition-all ${
                      errors.fundingSource ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200 focus:ring-2 focus:ring-[#006D77]'
                    }`}
                  >
                    <option value="" disabled>Select Source...</option>
                    {Object.values(FundingSource).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <InputError field="fundingSource" />
                </div>

                <div className="bg-[#E6F3F4] p-4 rounded-2xl border border-[#B2D8DB] flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-[#006D77] uppercase tracking-widest">Initial Insurance Fee (6%)</p>
                    <p className="text-lg font-black text-[#006D77] font-outfit">KSH {initialFee.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#006D77]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleNext} 
                className="w-full bg-[#006D77] text-white py-5 rounded-full font-black shadow-lg transform transition-all active:scale-95"
              >
                Continue to Personal Info
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-3xl font-black text-slate-900 font-outfit mb-2">Personal Information</h2>
              <p className="text-slate-500 mb-8">Please tell us who you are. These details should match your ID.</p>
              
              <div className="space-y-4 mb-8">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">First Name</label>
                    <input
                      placeholder="e.g. John"
                      value={formData.firstName}
                      onChange={(e) => {
                        setFormData({...formData, firstName: e.target.value});
                        if (errors.firstName) setErrors(prev => ({...prev, firstName: ''}));
                      }}
                      className={`w-full bg-slate-50 border rounded-xl px-4 py-4 focus:outline-none transition-all ${
                        errors.firstName ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:ring-2 focus:ring-[#006D77]'
                      }`}
                    />
                    <InputError field="firstName" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Last Name</label>
                    <input
                      placeholder="e.g. Doe"
                      value={formData.lastName}
                      onChange={(e) => {
                        setFormData({...formData, lastName: e.target.value});
                        if (errors.lastName) setErrors(prev => ({...prev, lastName: ''}));
                      }}
                      className={`w-full bg-slate-50 border rounded-xl px-4 py-4 focus:outline-none transition-all ${
                        errors.lastName ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:ring-2 focus:ring-[#006D77]'
                      }`}
                    />
                    <InputError field="lastName" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Birthday</label>
                  <input
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => {
                      setFormData({...formData, birthday: e.target.value});
                      if (errors.birthday) setErrors(prev => ({...prev, birthday: ''}));
                    }}
                    className={`w-full bg-slate-50 border rounded-xl px-4 py-4 focus:outline-none transition-all ${
                      errors.birthday ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:ring-2 focus:ring-[#006D77]'
                    }`}
                  />
                  <InputError field="birthday" />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="john.doe@example.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({...formData, email: e.target.value});
                      if (errors.email) setErrors(prev => ({...prev, email: ''}));
                    }}
                    className={`w-full bg-slate-50 border rounded-xl px-4 py-4 focus:outline-none transition-all ${
                      errors.email ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:ring-2 focus:ring-[#006D77]'
                    }`}
                  />
                  <InputError field="email" />
                </div>
              </div>

              <div className="flex space-x-4">
                <button onClick={handleBack} className="flex-1 py-4 font-bold text-slate-500 hover:text-slate-700 transition-colors">Back</button>
                <button 
                  onClick={handleNext}
                  className="flex-[2] bg-[#006D77] text-white py-4 rounded-full font-black shadow-lg hover:shadow-xl transition-all active:scale-95"
                >
                  Continue to Contact
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-3xl font-black text-slate-900 font-outfit mb-2">Contact & Guarantor</h2>
              <p className="text-slate-500 mb-8">Verification details for your disbursement and security.</p>
              
              <div className="space-y-6 mb-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Your M-PESA Number</label>
                  <div className={`flex items-center bg-slate-50 border rounded-xl px-4 py-4 transition-all ${
                    errors.phoneNumber ? 'border-red-300 bg-red-50' : 'border-slate-200 focus-within:ring-2 focus-within:ring-[#006D77]'
                  }`}>
                    {formData.country !== 'Kenya' && <span className="text-slate-400 font-bold mr-2">+254</span>}
                    <input
                      placeholder={formData.country === 'Kenya' ? "+254 708 374 149" : "712 345 678"}
                      value={formData.phoneNumber}
                      onChange={(e) => handlePhoneChange(e, 'phoneNumber')}
                      className="w-full bg-transparent outline-none font-black text-slate-900 placeholder:text-slate-300"
                    />
                  </div>
                  <InputError field="phoneNumber" />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Guarantor's Phone Number</label>
                  <div className={`flex items-center bg-slate-50 border rounded-xl px-4 py-4 transition-all ${
                    errors.guarantorNumber ? 'border-red-300 bg-red-50' : 'border-slate-200 focus-within:ring-2 focus-within:ring-[#006D77]'
                  }`}>
                    {formData.country !== 'Kenya' && <span className="text-slate-400 font-bold mr-2">+254</span>}
                    <input
                      placeholder={formData.country === 'Kenya' ? "+254 7XX XXX XXX" : "708 374 149"}
                      value={formData.guarantorNumber}
                      onChange={(e) => handlePhoneChange(e, 'guarantorNumber')}
                      className="w-full bg-transparent outline-none font-black text-slate-900 placeholder:text-slate-300"
                    />
                  </div>
                  <InputError field="guarantorNumber" />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">National ID Number</label>
                  <input
                    placeholder="Enter ID number"
                    value={formData.idNumber}
                    onChange={(e) => {
                      setFormData({...formData, idNumber: e.target.value});
                      if (errors.idNumber) setErrors(prev => ({...prev, idNumber: ''}));
                    }}
                    className={`w-full bg-slate-50 border rounded-xl px-4 py-4 focus:outline-none transition-all ${
                      errors.idNumber ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:ring-2 focus:ring-[#006D77]'
                    }`}
                  />
                  <InputError field="idNumber" />
                </div>
              </div>

              <div className="flex space-x-4">
                <button onClick={handleBack} className="flex-1 py-4 font-bold text-slate-500 hover:text-slate-700 transition-colors">Back</button>
                <button 
                  onClick={handleNext}
                  className="flex-[2] bg-[#006D77] text-white py-4 rounded-full font-black shadow-lg hover:shadow-xl transition-all active:scale-95"
                >
                  Review Application
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-3xl font-black text-slate-900 font-outfit mb-2">Review & Submit</h2>
              <p className="text-slate-500 mb-8">Please double check your information before final submission.</p>
              
              <div className="bg-slate-50 rounded-2xl p-6 mb-8 space-y-4 border border-slate-100">
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loan Amount</p>
                    <p className="font-black text-slate-900">KSH {formData.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Insurance Fee</p>
                    <p className="font-black text-[#006D77]">KSH {initialFee.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Funding Source</p>
                    <p className="font-bold text-slate-700">{formData.fundingSource || 'Not selected'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</p>
                    <p className="font-bold text-slate-700">{formData.firstName} {formData.lastName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">M-PESA Number</p>
                    <p className="font-bold text-slate-700">{getDisplayPhone(formData.phoneNumber)}</p>
                  </div>
                </div>
              </div>

              {/* Dynamic M-PESA QR Code Generator */}
              <div className="bg-[#E6F3F4] rounded-[24px] p-6 mb-8 border border-[#B2D8DB] flex flex-col sm:flex-row items-center gap-6 animate-in fade-in-50 duration-300">
                <div className="flex-1 text-center sm:text-left">
                  <span className="inline-block bg-[#006D77] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">
                    M-PESA Scan To Pay
                  </span>
                  <h4 className="text-base font-black text-[#006D77] mb-1">Instant QR Code Payment</h4>
                  <p className="text-xs text-[#065A63] leading-relaxed mb-4">
                    Scan this dynamic QR Code using your phone camera to open the secure Lipwa payment page, or click the direct payment link below to complete your payment! Any payment amount can be submitted.
                  </p>
                  <div className="space-y-1.5 text-xs text-[#065A63]">
                    <div>• <strong>Till Number (Buy Goods):</strong> {payheroConfig?.channelId || '3090761'}</div>
                    <div className="flex flex-wrap items-center gap-2 py-0.5">
                      <span>• <strong>Reference Code:</strong></span>
                      <span className="font-mono bg-white/60 px-2 py-0.5 rounded text-slate-800 font-black select-all border border-[#B2D8DB] shadow-xs">
                        LERAMOT-{formData.idNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const refCode = `LERAMOT-${formData.idNumber}`;
                          navigator.clipboard.writeText(refCode);
                          setRefCopied(true);
                          setTimeout(() => setRefCopied(false), 2000);
                        }}
                        className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-[#006D77] hover:bg-[#006D77] hover:text-white bg-white border border-[#B2D8DB] rounded-lg px-2.5 py-1 shadow-xs transition-all hover:scale-105 active:scale-95 animate-in fade-in duration-300"
                        title="Copy Reference Code for Link Payment"
                      >
                        {refCopied ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-green-600 font-bold" />
                            <span className="text-green-600 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy for Link</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div>• <strong>Amount:</strong> KSH {initialFee.toLocaleString()}</div>
                    <div className="pt-2">
                      • <strong>Payment Link:</strong>{' '}
                      <a 
                        href="https://short.payhero.co.ke/s/G4fWnADmuu2WxZ3g39ZPGP" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="underline text-[#FF8C42] hover:text-[#E67E3B] font-bold"
                      >
                        https://short.payhero.co.ke/s/G4fWnADmuu2WxZ3g39ZPGP
                      </a>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 bg-white p-3 rounded-2xl shadow-md border border-slate-100 flex flex-col items-center">
                  <a href="https://short.payhero.co.ke/s/G4fWnADmuu2WxZ3g39ZPGP" target="_blank" rel="noopener noreferrer" className="hover:opacity-95 transition-opacity block">
                    <img
                      src={payheroQr}
                      alt="M-PESA Payment QR Code"
                      className="w-[140px] h-[140px]"
                      referrerPolicy="no-referrer"
                    />
                  </a>
                  <span className="text-[10px] text-slate-400 font-black tracking-wider uppercase mt-2">SCAN TO PAY</span>
                </div>
              </div>

              <div className="bg-[#FFF4ED] p-4 rounded-xl mb-8 text-[11px] text-[#9E5A2A] font-medium leading-relaxed border border-[#FFD8C2]">
                By clicking "Pay Fee & Submit", an M-PESA prompt will be sent to <strong>{getDisplayPhone(formData.phoneNumber)}</strong>. The application fee is to cover for operational and administrative costs as well as serve as an act of good faith to insure against your loan amount.
              </div>

              {errors.payment && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-[#9E5A2A] text-xs font-semibold leading-relaxed flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-[#FF8C42] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{errors.payment}</span>
                </div>
              )}

              <div className="flex space-x-4">
                <button onClick={handleBack} className="flex-1 py-4 font-bold text-slate-500 hover:text-slate-700 transition-colors">Back</button>
                <button 
                  onClick={triggerSTKPush}
                  disabled={isSubmitting}
                  className="flex-[2] bg-[#FF8C42] text-white py-4 rounded-full font-black shadow-lg hover:bg-[#E67E3B] transition-all flex items-center justify-center space-x-2 active:scale-95"
                >
                  <span>Pay Fee & Submit</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="animate-in fade-in zoom-in duration-500 text-center py-12">
              <div className={`${paymentStatus === 'failed' ? 'mb-4' : 'mb-10'} relative inline-block`}>
                <div className={`rounded-full flex items-center justify-center mx-auto relative z-10 transition-all duration-500 ${
                  paymentStatus === 'pending' ? 'w-24 h-24 bg-[#4CAF50]/10' : 
                  paymentStatus === 'success' ? 'w-24 h-24 bg-green-100' : 'w-10 h-10 bg-red-50 border border-red-200'
                }`}>
                  {paymentStatus === 'pending' ? (
                    <div className="animate-pulse">
                      <svg className="h-12 w-12 text-[#4CAF50]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                  ) : paymentStatus === 'success' ? (
                    <div className="animate-bounce">
                      <svg className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                {paymentStatus === 'pending' && (
                  <div className="absolute inset-0 animate-ping bg-[#4CAF50]/20 rounded-full scale-150" />
                )}
              </div>

              <h2 className={`font-black text-slate-900 font-outfit mb-3 transition-all ${
                paymentStatus === 'failed' ? 'text-xl' : 'text-3xl'
              }`}>
                {paymentStatus === 'pending' ? 'Awaiting M-PESA Confirmation' : 
                 paymentStatus === 'success' ? 'Payment Successful!' : 'Payment Failed'}
              </h2>
              
              <div className="max-w-sm mx-auto">
                <p className="text-slate-600 mb-6 leading-relaxed">
                  {paymentStatus === 'pending' ? (
                    <>We've triggered an STK push to <span className="font-black text-slate-900">{getDisplayPhone(formData.phoneNumber)}</span>. Enter your PIN to finalize and submit your application.</>
                  ) : paymentStatus === 'success' ? (
                    <>Insurance payment verified. We are now transmitting your application to the credit board...</>
                  ) : (
                    <>The M-PESA transaction was unsuccessful or cancelled. Please check your balance and try again.</>
                  )}
                </p>
                
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-8 text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Transaction Details</p>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Status:</span>
                      <span className={`font-black uppercase ${
                        paymentStatus === 'pending' ? 'text-amber-500' : 
                        paymentStatus === 'success' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {paymentStatus}
                      </span>
                    </div>
                    {checkoutRequestID && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Request ID:</span>
                        <span className="font-mono font-bold text-slate-900 text-[10px]">{checkoutRequestID}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Amount:</span>
                      <span className="font-black text-slate-900">KSH {initialFee.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {paymentStatus === 'pending' && isSimulated && (
                  <div className="bg-indigo-50 border-2 border-indigo-100 rounded-3xl p-5 mb-8 text-left animate-in fade-in-50 slide-in-from-top-3 duration-300">
                    <div className="flex items-center gap-2 mb-2 font-black text-indigo-900 text-xs uppercase tracking-wider font-outfit">
                      <Database className="h-4 w-4 text-indigo-600" />
                      <span>Sandbox Simulation</span>
                    </div>
                    <p className="text-[11px] text-indigo-700 leading-relaxed mb-4">
                      The application is in Sandbox Simulation mode because live Payhero credentials failed or are unconfigured. You can simulate the payment callback directly here:
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleSimulatePayment('success')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl py-3 px-4 text-xs transition duration-200 active:scale-95 shadow-md hover:shadow-lg"
                      >
                        Simulate Success
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSimulatePayment('failed')}
                        className="bg-red-500 hover:bg-red-600 text-white font-black rounded-xl py-3 px-4 text-xs transition duration-200 active:scale-95 shadow-md hover:shadow-lg"
                      >
                        Simulate Fail
                      </button>
                    </div>
                  </div>
                )}

                {paymentStatus === 'failed' && (
                  <div className="flex flex-col space-y-4">
                    <button 
                      onClick={() => {
                        setStep(4);
                        setPaymentStatus('idle');
                      }}
                      className="w-full bg-[#006D77] text-white py-4 rounded-full font-black shadow-lg transform transition-all hover:scale-105 active:scale-95"
                    >
                      Try Again
                    </button>
                    <button 
                      onClick={() => navigate('/')}
                      className="w-full py-4 font-bold text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      Cancel & Return Home
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="animate-in zoom-in duration-500 text-center py-10">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-4xl font-black text-slate-900 font-outfit mb-4">Application Submitted!</h2>
              <p className="text-slate-600 mb-10 text-lg">
                Your request for <span className="font-bold text-slate-900">KSH {formData.amount.toLocaleString()}</span> is now in review. 
              </p>
              
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-10 text-left">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Status Summary</p>
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Payment Status:</span>
                    <span className="font-bold text-green-600 uppercase">Success</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Transaction ID:</span>
                    <span className="font-mono font-bold text-slate-900">{checkoutRequestID}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Amount Paid:</span>
                    <span className="font-bold text-slate-900">KSH {initialFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Processing Time:</span>
                    <span className="font-bold text-slate-900">~72 Hours</span>
                  </div>
                </div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">What happens next?</p>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3 text-sm text-slate-700">
                    <span className="w-5 h-5 bg-[#006D77] text-white rounded-full flex items-center justify-center text-[10px] mt-0.5">1</span>
                    <span>Keep your phone on; we will call to verify your identity.</span>
                  </li>
                  <li className="flex items-start space-x-3 text-sm text-slate-700">
                    <span className="w-5 h-5 bg-[#006D77] text-white rounded-full flex items-center justify-center text-[10px] mt-0.5">2</span>
                    <span>Your guarantor will receive an SMS for digital confirmation.</span>
                  </li>
                  <li className="flex items-start space-x-3 text-sm text-slate-700">
                    <span className="w-5 h-5 bg-[#006D77] text-white rounded-full flex items-center justify-center text-[10px] mt-0.5">3</span>
                    <span>Disbursement will be automatic to your M-PESA line.</span>
                  </li>
                </ul>
              </div>
              
              <button 
                onClick={() => navigate('/')}
                className="w-full bg-[#006D77] text-white py-4 rounded-full font-black shadow-lg transform transition-all hover:scale-105 active:scale-95"
              >
                Return Home
              </button>
            </div>
          )}
        </div>
        
        {step < 6 && (
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              We take your privacy seriously. All data is encrypted using bank-level security.<br/>
              Leramot Lenders Foundation is a CBK regulated financial institution.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationFunnel;

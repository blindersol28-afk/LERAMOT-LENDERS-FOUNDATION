
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LoanCalculator: React.FC = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState<number>(5000);
  const [term, setTerm] = useState<number>(3); // Months
  const [monthlyPayment, setMonthlyPayment] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);
  const [insuranceFee, setInsuranceFee] = useState<number>(0);
  const [totalRepayment, setTotalRepayment] = useState<number>(0);

  const MIN_LOAN = 800;
  const MAX_LOAN = 11600;
  const MONTHLY_RATE = 0.045; // 4.5% interest rate
  const INSURANCE_FEE_RATE = 0.06; // 6% insurance fee

  useEffect(() => {
    // Calculate interest: Principal * Rate * Time
    const interest = amount * MONTHLY_RATE * term;
    // Calculate 6% insurance fee
    const fee = amount * INSURANCE_FEE_RATE;
    // Total cost including fee
    const total = amount + interest + fee;

    setTotalInterest(interest);
    setInsuranceFee(fee);
    setTotalRepayment(total);
    setMonthlyPayment(term > 0 ? Math.ceil(total / term) : 0);
  }, [amount, term]);

  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setAmount(0);
      return;
    }
    
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;

    // Cap at MAX_LOAN immediately to prevent overflow UI issues
    if (numValue > MAX_LOAN) {
      setAmount(MAX_LOAN);
    } else {
      setAmount(numValue);
    }
  };

  const handleAmountInputBlur = () => {
    // Enforce MIN_LOAN on blur
    if (amount < MIN_LOAN) {
      setAmount(MIN_LOAN);
    }
  };

  const handleApply = () => {
    navigate('/apply', { 
      state: { 
        initialAmount: amount, 
        initialTerm: term,
        initialFee: insuranceFee,
        totalInterest: totalInterest
      } 
    });
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-100">
      <div className="space-y-8">
        {/* Amount Input & Slider */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="text-sm font-bold text-slate-500 uppercase tracking-wide">Loan Amount</label>
            <div className="flex flex-col items-end">
              <div className="flex items-center bg-slate-50 rounded-xl px-3 py-1 border border-slate-100 focus-within:border-[#006D77] focus-within:ring-1 focus-within:ring-[#006D77] transition-all">
                <span className="text-sm font-black text-[#006D77] font-outfit mr-1">KSH</span>
                <input
                  type="number"
                  value={amount === 0 ? '' : amount}
                  onChange={handleAmountInputChange}
                  onBlur={handleAmountInputBlur}
                  className="text-xl font-black text-[#006D77] font-outfit bg-transparent outline-none w-24 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                />
              </div>
              <p className="text-[10px] text-slate-400 italic font-medium mt-1">Checking won't impact credit score.</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-slate-50 border border-slate-100 p-4 rounded-2xl relative">
            {/* Decrease Button */}
            <button
              type="button"
              onClick={() => {
                const newVal = Math.max(amount - 100, MIN_LOAN);
                setAmount(newVal);
              }}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:border-[#006D77] hover:text-[#006D77] flex items-center justify-center font-black text-slate-500 shadow-xs transition-all active:scale-95 shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 12H6" />
              </svg>
            </button>

            {/* Range slider gauge */}
            <div className="flex-1 relative flex items-center py-2">
              <input
                type="range"
                min={MIN_LOAN}
                max={MAX_LOAN}
                step={100}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full h-3 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#006D77] focus:outline-none focus:ring-2 focus:ring-[#006D77]/20 transition-all opacity-95 hover:opacity-100"
                style={{
                  background: `linear-gradient(to right, #006D77 0%, #006D77 ${Math.min(Math.max(((amount - MIN_LOAN) / (MAX_LOAN - MIN_LOAN)) * 100, 0), 100)}%, #E2E8F0 ${Math.min(Math.max(((amount - MIN_LOAN) / (MAX_LOAN - MIN_LOAN)) * 100, 0), 100)}%, #E2E8F0 100%)`
                }}
              />
            </div>

            {/* Increase Button */}
            <button
              type="button"
              onClick={() => {
                const newVal = Math.min(amount + 100, MAX_LOAN);
                setAmount(newVal);
              }}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:border-[#006D77] hover:text-[#006D77] flex items-center justify-center font-black text-slate-500 shadow-xs transition-all active:scale-95 shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v12m6-6H6" />
              </svg>
            </button>
          </div>
          <div className="flex justify-between mt-2.5 px-1 text-[10px] font-bold text-slate-400">
            <span>MIN KSH {MIN_LOAN.toLocaleString()}</span>
            <span className="text-[#006D77] font-extrabold bg-[#E6F3F4] px-2 py-0.5 rounded-md">TAP TO CHOOSE</span>
            <span>MAX KSH {MAX_LOAN.toLocaleString()}</span>
          </div>
        </div>

        {/* Term Selection */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="text-sm font-bold text-slate-500 uppercase tracking-wide">Term Length</label>
            <span className="text-xl font-bold text-slate-800">{term === 1 ? '1Month' : `${term}Months`}</span>
          </div>
          <div className="flex space-x-2">
            {[1, 2, 3].map((m) => (
              <button
                key={m}
                onClick={() => setTerm(m)}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                  term === m 
                    ? 'bg-[#006D77] text-white shadow-md' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {m === 1 ? '1Month' : `${m}Months`}
              </button>
            ))}
          </div>
        </div>

        {/* Repayment Breakdown */}
        <div className="pt-6 border-t border-slate-100">
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly Installment</p>
                <p className="text-3xl font-black text-slate-900 font-outfit">KSH {monthlyPayment.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-[#FF8C42] uppercase tracking-widest">Total Repayment</p>
                <p className="text-lg font-bold text-slate-900">KSH {totalRepayment.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-y-3 pt-4 border-t border-slate-50">
              <div className="flex justify-between">
                <span className="text-xs text-slate-500 font-medium">Interest (4.5%/mo)</span>
                <span className="text-xs text-slate-800 font-bold">KSH {totalInterest.toLocaleString()}</span>
              </div>
              
              {/* Prominent Insurance Fee with Tooltip */}
              <div className="flex justify-between items-center bg-[#E6F3F4]/50 p-2 rounded-lg border border-[#B2D8DB]/30">
                <div className="flex items-center space-x-2 relative group">
                  <span className="text-xs text-[#006D77] font-bold">Insurance Fee (6%)</span>
                  <div className="cursor-help text-[#006D77] opacity-60 hover:opacity-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-slate-900 text-white text-[10px] leading-relaxed rounded-xl shadow-2xl invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all z-50 pointer-events-none">
                    The application fee is to cover for operational and administrative costs as well as serve as an act of good faith to insure against your loan amount.
                    <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-slate-900" />
                  </div>
                </div>
                <span className="text-sm font-black text-[#006D77]">KSH {insuranceFee.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-[#FFF4ED] border border-[#FFD8C2] p-4 rounded-xl mb-6">
            <div className="flex items-start space-x-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#FF8C42] mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-[#9E5A2A] leading-relaxed">
                <span className="font-bold text-[#9E5A2A]">Important:</span> The 6% application fee of <span className="font-bold">KSH {insuranceFee.toLocaleString()}</span> is required as a good faith act to insure your loan amount.
              </p>
            </div>
          </div>

          <div className="text-center">
            <button 
              onClick={handleApply}
              disabled={amount < MIN_LOAN}
              className="w-full bg-[#FF8C42] hover:bg-[#E67E3B] disabled:bg-slate-300 text-white py-4 rounded-full font-bold shadow-lg transition-all transform active:scale-95 flex items-center justify-center space-x-2"
            >
              <span>Apply for KSH {amount.toLocaleString()}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <p className="text-[10px] text-slate-400 mt-2 font-medium italic">Checking your rate won't impact your credit score.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanCalculator;

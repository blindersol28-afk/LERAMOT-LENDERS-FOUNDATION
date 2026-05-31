
import React from 'react';
import { Link } from 'react-router-dom';
import LoanCalculator from './LoanCalculator';

const Hero: React.FC = () => {
  return (
    <section className="relative bg-white overflow-hidden pb-12 pt-8 md:pt-20">
      {/* Background patterns */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-[#006D77]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-[#FF8C42]/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side: Value Prop */}
          <div className="animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="inline-flex items-center space-x-2 bg-[#E6F3F4] text-[#006D77] px-4 py-2 rounded-full mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006D77] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#006D77]"></span>
              </span>
              <span className="text-xs font-black uppercase tracking-widest">Join over 10 million global users</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 font-outfit leading-[1.1] mb-6">
              Apply in seconds, get approved immediately and the loan amount will be credited to your account within <span className="text-[#006D77]">72 Hours</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-lg leading-relaxed font-medium">
              Low interest starting at 4.5% per month. Grow your credit score portfolio and unlock higher limits with every on-time repayment.
            </p>

            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-10">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-[#006D77]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 leading-tight">Secure & Private</p>
                  <p className="text-xs text-slate-500">Bank-level encryption</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 border-l-0 sm:border-l sm:pl-4 border-slate-200">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-[#FF8C42]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 leading-tight">6% insurance fees interest on loan amount</p>
                  <p className="text-xs text-slate-500">Transparent APR</p>
                </div>
              </div>
            </div>

            <div className="bg-[#F8FAFC] border border-slate-100 p-4 rounded-2xl">
              <p className="text-xs font-medium text-slate-500 italic">
                "Repay within 3 months to avoid CRB listing and grow your financial health."
              </p>
            </div>
          </div>

          {/* Right Side: Quick Start Card */}
          <div className="animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
            <div className="relative">
              {/* Floating trust badges */}
              <div className="absolute -top-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 hidden md:block z-20">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 uppercase">Licensed</p>
                    <p className="text-[10px] text-slate-500 font-bold">By Central Bank</p>
                  </div>
                </div>
              </div>
              
              <LoanCalculator />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

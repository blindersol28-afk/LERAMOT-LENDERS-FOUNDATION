
import React from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import ProductTabs from '../components/ProductTabs';
import TestimonialCarousel from '../components/TestimonialCarousel';

const FeaturesAndServices: React.FC = () => {
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-xs font-black text-[#006D77] uppercase tracking-[0.3em] mb-4">Features & Services</h2>
          <h3 className="text-4xl md:text-5xl font-black text-slate-900 font-outfit">Built for your success.</h3>
          <p className="mt-4 text-slate-500 max-w-2xl mx-auto font-medium">
            We provide more than just capital. We provide a foundation for growth, supported by real people and real stories.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-20">
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-[#E6F3F4] rounded-2xl flex items-center justify-center text-[#006D77] mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="text-xl font-black text-slate-900 mb-3 font-outfit">Instant Disbursement</h4>
            <p className="text-slate-500 text-sm leading-relaxed font-medium">
              Get your funds via M-PESA or direct bank transfer within minutes of approval. No waiting in lines.
            </p>
          </div>
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-[#FFF4ED] rounded-2xl flex items-center justify-center text-[#FF8C42] mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h4 className="text-xl font-black text-slate-900 mb-3 font-outfit">Fair Credit Evaluation</h4>
            <p className="text-slate-500 text-sm leading-relaxed font-medium">
              We use alternative data points to evaluate your creditworthiness, making loans accessible to more people.
            </p>
          </div>
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-xl font-black text-slate-900 mb-3 font-outfit">Flexible Repayment</h4>
            <p className="text-slate-500 text-sm leading-relaxed font-medium">
              Choose a repayment schedule that fits your cash flow. Weekly, bi-weekly, or monthly options available.
            </p>
          </div>
        </div>

        <div className="mt-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-black text-slate-900 font-outfit">What our community says</h3>
          </div>
          <TestimonialCarousel />
        </div>
      </div>
    </section>
  );
};

const TrustSignalSection: React.FC = () => {
  return (
    <div className="bg-[#006D77] py-20 overflow-hidden relative">
      {/* Decorative element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-3 gap-12 items-center text-center md:text-left">
          <div className="md:col-span-1">
            <h2 className="text-3xl md:text-4xl font-black text-white font-outfit mb-4">Trusted across the region.</h2>
            <p className="text-white/70 text-sm font-medium">Regulated by the Central Bank and international financial authorities.</p>
          </div>
          <div className="md:col-span-2 grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-2">
              <p className="text-4xl font-black text-[#FF8C42] font-outfit">10M+</p>
              <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">Active Users</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-black text-[#FF8C42] font-outfit">KSH 250B+</p>
              <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">Loans Issued</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-black text-[#FF8C42] font-outfit">4.8/5</p>
              <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">App Rating</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-black text-[#FF8C42] font-outfit">Secure</p>
              <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">Foundation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Home: React.FC = () => {
  return (
    <div className="animate-in fade-in duration-1000">
      <Hero />
      <TrustSignalSection />
      <FeaturesAndServices />
      <ProductTabs />
      
      {/* Visual call to action */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 rounded-[48px] overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent z-10" />
            <img 
              src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=2000" 
              className="absolute inset-0 w-full h-full object-cover opacity-60"
              alt="Community"
            />
            <div className="relative z-20 p-10 md:p-20 max-w-2xl">
              <h2 className="text-4xl md:text-6xl font-black text-white font-outfit mb-8 leading-tight">
                Unlock your <span className="text-[#FF8C42]">potential</span> with fair credit.
              </h2>
              <p className="text-white/80 text-lg mb-10 font-medium">
                We believe in your future, not just your past credit history. Join Leramot Lenders Foundation today and experience banking built for you.
              </p>
              <Link 
                to="/apply"
                className="bg-white text-slate-900 px-10 py-5 rounded-full font-black text-lg shadow-2xl hover:bg-[#FF8C42] hover:text-white transition-all transform hover:scale-105 active:scale-95 inline-block"
              >
                Get Started Now
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

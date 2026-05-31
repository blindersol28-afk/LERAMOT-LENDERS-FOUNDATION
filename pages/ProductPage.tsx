
import React from 'react';
import { Link } from 'react-router-dom';
import LoanCalculator from '../components/LoanCalculator';

interface ProductPageProps {
  type: 'personal' | 'business' | 'auto';
}

const ProductPage: React.FC<ProductPageProps> = ({ type }) => {
  const content = {
    personal: {
      title: 'Personal Loans',
      subtitle: 'Instant cash for your daily needs.',
      heroImg: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&q=80&w=2000',
      description: 'Get the financial support you need for life\'s unexpected moments. Whether it\'s a medical bill, a small repair, or education fees, we\'ve got you covered.'
    },
    business: {
      title: 'Business Growth',
      subtitle: 'Scaling your vision, one loan at a time.',
      heroImg: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=2000',
      description: 'Designed for small businesses and entrepreneurs. Unlock capital for inventory, marketing, or operations and grow your enterprise with flexible repayment terms.'
    },
    auto: {
      title: 'Auto Refinance',
      subtitle: 'Smarter car payments for a better life.',
      heroImg: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=2000',
      description: 'Is your current car loan costing you too much? Refinance with us to lower your monthly payments and interest rates. Save hundreds every year.'
    }
  };

  const data = content[type];

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[500px] flex items-center overflow-hidden">
        <img src={data.heroImg} className="absolute inset-0 w-full h-full object-cover" alt={data.title} />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="max-w-2xl text-white">
            <h1 className="text-5xl md:text-7xl font-black font-outfit mb-6 animate-in slide-in-from-left-8 duration-700">{data.title}</h1>
            <p className="text-xl md:text-2xl font-medium opacity-90 mb-10 leading-relaxed">{data.subtitle}</p>
            <div className="flex flex-col items-start">
              <Link to="/apply" className="bg-[#FF8C42] text-white px-10 py-5 rounded-full font-black text-lg shadow-2xl hover:bg-[#E67E3B] transition-all inline-block">
                Apply Now
              </Link>
              <p className="text-white/70 text-xs italic mt-2 ml-4">Checking your rate won't impact your credit score.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-black text-slate-900 font-outfit mb-8">Why choose our {data.title.toLowerCase()}?</h2>
            <p className="text-lg text-slate-600 mb-12 leading-relaxed">{data.description}</p>
            
            <div className="grid md:grid-cols-2 gap-10 mb-16">
              {[
                { title: 'Fast Approval', desc: 'Get a decision in as little as 2 minutes.' },
                { title: 'Fair Rates', desc: 'We look at more than just your credit score.' },
                { title: 'Insurance Covered', desc: 'Standard 6% insurance fees interest on every loan.' },
                { title: 'Secure', desc: 'Your data is protected with military-grade encryption.' }
              ].map(f => (
                <div key={f.title} className="p-8 rounded-[24px] bg-slate-50 border border-slate-100">
                  <h4 className="font-black text-slate-900 mb-2 uppercase tracking-widest text-xs">{f.title}</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-[#006D77] p-10 md:p-16 rounded-[48px] text-white">
              <h3 className="text-3xl md:text-4xl font-black font-outfit mb-6">Ready to start?</h3>
              <p className="text-lg opacity-80 mb-10 leading-relaxed">
                Checking your rate takes less than 2 minutes and won't affect your credit score. Join millions who chose a smarter way to bank.
              </p>
              <div className="flex flex-col items-start">
                <Link to="/apply" className="bg-white text-[#006D77] px-10 py-4 rounded-full font-black text-lg shadow-xl hover:bg-[#FF8C42] hover:text-white transition-all inline-block">
                  Check My Rate
                </Link>
                <p className="text-white/60 text-xs italic mt-3 ml-2 font-medium">Checking your rate won't impact your credit score.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-32">
              <div className="mb-8 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                <h4 className="font-black text-slate-900 mb-4 uppercase tracking-widest text-xs text-center">Quick Calculator</h4>
                <LoanCalculator />
              </div>
              <div className="p-6 bg-green-50 rounded-[32px] border border-green-100 text-center">
                <p className="text-xs font-bold text-green-700 uppercase tracking-widest mb-2">Licensed Provider</p>
                <p className="text-[10px] text-green-600 font-medium">Regulated by the Central Bank and major authorities.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProductPage;


import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ProductTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const products = [
    {
      title: 'Personal Loans',
      icon: '👤',
      description: 'Quick cash for emergencies, shopping, or bills. Get up to KSH 11,600 instantly.',
      features: ['2-minute application', 'M-PESA disbursement', 'Low rates from 4.5%'],
      cta: '/personal-loans',
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800'
    },
    {
      title: 'Business Growth',
      icon: '🏢',
      description: 'Fuel your small business or side hustle. Inventory or equipment funding made easy.',
      features: ['Flexible repayments', 'Higher limits over time', 'Digital application'],
      cta: '/business-loans',
      image: 'https://images.unsplash.com/photo-1664575602276-acd073f104c1?auto=format&fit=crop&q=80&w=1200'
    },
    {
      title: 'Auto Refinance',
      icon: '🚗',
      description: 'Lower your monthly car payments. We help you save more every single month.',
      features: ['Competitive APR', 'Simple transfer', 'Expert support'],
      cta: '/auto-refinance',
      image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=800'
    }
  ];

  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 font-outfit mb-4">Financial products for every stage</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">Choose the product that fits your needs and start your journey to better financial health.</p>
        </div>

        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100">
          {/* Tab Headers */}
          <div className="flex border-b border-slate-100 overflow-x-auto no-scrollbar">
            {products.map((p, idx) => (
              <button
                key={p.title}
                onClick={() => setActiveTab(idx)}
                className={`flex-1 min-w-[150px] py-8 px-6 font-bold transition-all relative ${
                  activeTab === idx ? 'text-[#006D77]' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-2xl mb-2">{p.icon}</span>
                  <span className="text-sm uppercase tracking-widest">{p.title}</span>
                </div>
                {activeTab === idx && (
                  <div className="absolute bottom-0 left-0 w-full h-1.5 bg-[#006D77] rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-8 md:p-12 lg:p-16">
            <div className="grid lg:grid-cols-2 gap-12 items-center animate-in fade-in slide-in-from-bottom-4 duration-500" key={activeTab}>
              <div className="order-2 lg:order-1">
                <h3 className="text-3xl font-black text-slate-900 font-outfit mb-6">{products[activeTab].title}</h3>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  {products[activeTab].description}
                </p>
                <ul className="space-y-4 mb-10">
                  {products[activeTab].features.map(f => (
                    <li key={f} className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-slate-700 font-medium">{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 items-center sm:items-start">
                  <div className="flex flex-col items-center">
                    <Link
                      to="/apply"
                      className="bg-[#006D77] text-white px-8 py-4 rounded-full font-bold shadow-lg hover:bg-[#065A63] transition-all text-center w-full sm:w-auto"
                    >
                      Apply Now
                    </Link>
                    <p className="text-[10px] text-slate-400 italic mt-2 font-medium">Checking won't impact your score.</p>
                  </div>
                  <Link
                    to={products[activeTab].cta}
                    className="border-2 border-[#006D77] text-[#006D77] px-8 py-4 rounded-full font-bold hover:bg-[#006D77]/5 transition-all text-center w-full sm:w-auto"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="relative rounded-[32px] overflow-hidden shadow-2xl aspect-video lg:aspect-square group">
                  <img
                    src={products[activeTab].image}
                    alt={products[activeTab].title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductTabs;

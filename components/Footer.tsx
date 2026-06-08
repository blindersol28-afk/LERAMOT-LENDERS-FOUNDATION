
import React from 'react';
import { Link } from 'react-router-dom';
import logo from './LOGO.png';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white pt-20 pb-10 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <img src={logo} alt="Leramot Lenders Foundation Logo" className="h-12 w-auto object-contain" />
              <div className="flex flex-col">
                <span className="text-xl font-black text-[#006D77] font-outfit tracking-tighter leading-none">LERAMOT LENDERS</span>
                <span className="text-[9px] font-bold text-[#FF8C42] uppercase tracking-[0.2em] leading-none mt-1">FOUNDATION</span>
              </div>
            </div>
            <p className="text-slate-500 mb-8 max-w-sm">
              We provide fast, reliable, and transparent financial services to millions of customers. Our mission is to democratize financial access through ethical technology.
            </p>
            <div className="flex space-x-4">
              {['facebook', 'twitter', 'instagram', 'linkedin'].map(social => (
                <a key={social} href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-[#006D77] hover:text-white transition-all">
                  <span className="sr-only">{social}</span>
                  <div className="w-5 h-5 bg-current rounded-sm opacity-20" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-widest text-xs">Products</h4>
            <ul className="space-y-4">
              <li><Link to="/personal-loans" className="text-slate-500 hover:text-[#006D77] text-sm">Personal Loans</Link></li>
              <li><Link to="/business-loans" className="text-slate-500 hover:text-[#006D77] text-sm">Business Loans</Link></li>
              <li><Link to="/auto-refinance" className="text-slate-500 hover:text-[#006D77] text-sm">Auto Refinance</Link></li>
              <li><Link to="/apply" className="text-slate-500 hover:text-[#006D77] text-sm">Check Your Rate</Link></li>
              <li><Link to="/loan-center" className="text-slate-500 hover:text-[#006D77] text-sm font-bold">Loan Dashboard</Link></li>
              <li><Link to="/admin/payhero" className="text-[#FF8C42] hover:text-[#006D77] text-sm font-semibold">Payhero Setup</Link></li>
              <li><Link to="/sms-simulator" className="text-slate-500 hover:text-[#006D77] text-sm">SMS Simulator</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-widest text-xs">Join our newsletter</h4>
            <p className="text-slate-500 text-sm mb-4">Stay updated with financial tips and exclusive offers from Leramot.</p>
            <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#006D77] focus:outline-none"
              />
              <button className="w-full bg-[#006D77] text-white py-3 rounded-xl text-sm font-bold shadow-md hover:bg-[#065A63]">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Disclaimer Section */}
        <div className="pt-10 border-t border-slate-100 text-[10px] text-slate-400 leading-relaxed text-center sm:text-left space-y-4">
          <p>
            * Personal loan APRs range from 6.53% to 35.99%. Eligibility depends on credit score, history, and other factors. 
            All loans are subject to credit approval and verification. Insurance fees are standard at 6%.
          </p>
          <p>
            Example: A KSH 5,000 loan with a 3-month term and an APR of 4.5% per month would result in 3 monthly payments of approx KSH 1,892. 
            Total cost of the loan would be KSH 5,675. Repay on time to avoid CRB listing.
          </p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-4 pt-4 grayscale opacity-50">
            <span className="font-black">CBK REGULATED</span>
            <span className="font-black">SSL SECURED</span>
            <span className="font-black">PCI COMPLIANT</span>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <p>© 2024 LERAMOT LENDERS FOUNDATION. ALL RIGHTS RESERVED.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-[#006D77]">Privacy Policy</a>
            <a href="#" className="hover:text-[#006D77]">Terms of Service</a>
            <a href="#" className="hover:text-[#006D77]">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

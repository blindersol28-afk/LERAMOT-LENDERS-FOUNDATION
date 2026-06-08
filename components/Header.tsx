
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Country } from '../types';
import logo from './LOGO.png';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const selectedCountry: Country = 'KE';

  const navLinks = [
    { name: 'Personal', path: '/personal-loans' },
    { name: 'Business', path: '/business-loans' },
    { name: 'My Loans', path: '/loan-center' },
    { name: 'Reviews', path: '/reviews' },
    { name: 'Resources', path: '/resources' },
    { name: 'SMS Lab',   path: '/sms-simulator' },
  ];

  const countries: { code: Country; name: string; flag: string }[] = [
    { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src={logo} alt="Leramot Lenders Foundation Logo" className="h-14 w-auto object-contain" />
            <div className="flex flex-col">
              <span className="text-sm font-black text-[#006D77] font-outfit tracking-tighter leading-none">LERAMOT LENDERS</span>
              <span className="text-[10px] font-bold text-[#FF8C42] uppercase tracking-[0.2em] leading-none mt-1">FOUNDATION</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-8 items-center">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-semibold transition-colors hover:text-[#006D77] ${
                  location.pathname === link.path ? 'text-[#006D77]' : 'text-slate-600'
                }`}
              >
                {link.name}
              </Link>
            ))}
            
            <div className="flex flex-col items-center ml-4">
              <Link
                to="/apply"
                className="bg-[#006D77] text-white px-6 py-3 rounded-full text-sm font-bold shadow-lg hover:bg-[#065A63] transition-all transform hover:scale-105"
              >
                Check My Rate
              </Link>
              <span className="text-[9px] text-slate-400 font-medium mt-1 whitespace-nowrap">Won't affect credit score</span>
            </div>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <Link to="/apply" className="bg-[#006D77] text-white px-4 py-2 rounded-full text-xs font-bold">
              Check My Rate
            </Link>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-slate-600 hover:text-[#006D77] focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 animate-in slide-in-from-top-4 duration-300">
          <div className="px-4 pt-2 pb-6 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-4 rounded-lg text-base font-semibold text-slate-700 hover:bg-slate-50"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

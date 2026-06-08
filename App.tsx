
import React, { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProductPage from './pages/ProductPage';
import Resources from './pages/Resources';
import Reviews from './pages/Reviews';
import ApplicationFunnel from './pages/ApplicationFunnel';
import PayheroPortal from './pages/PayheroPortal';
import LoanCenter from './pages/LoanCenter';
import FakeSMS from './pages/FakeSMS';
import { Country } from './types';

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/personal-loans" element={<ProductPage type="personal" />} />
            <Route path="/business-loans" element={<ProductPage type="business" />} />
            <Route path="/auto-refinance" element={<ProductPage type="auto" />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/apply" element={<ApplicationFunnel />} />
            <Route path="/loan-center" element={<LoanCenter />} />
            <Route path="/admin/payhero" element={<PayheroPortal />} />
            <Route path="/sms-simulator" element={<FakeSMS />} />
          </Routes>
        </main>
        <Footer />
        
        {/* Floating Chat Placeholder */}
        <button className="fixed bottom-6 right-6 bg-[#FF8C42] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform z-50">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      </div>
    </HashRouter>
  );
};

export default App;


import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Testimonial } from '../types';

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: "Samuel Kamau",
    location: "Nairobi, Kenya",
    amount: "KSH 8,500",
    loanPurpose: "Small Business Inventory",
    discoveryMethod: "Radio Advertisement",
    ethnicity: 'KE',
    quote: "I was at a crossroads with my grocery business, needing a quick boost for inventory to meet the weekend demand. Leramot Lenders didn't just give me a loan; they gave me hope. The M-PESA disbursement was so fast, I had the stock delivered by evening. They truly understand the heartbeat of a Kenyan entrepreneur.",
    imageUrl: "https://images.unsplash.com/photo-1523913509264-1e9d17aa95ce?auto=format&fit=crop&q=80&w=1200"
  },
  {
    id: '2',
    name: "Sarah Thompson",
    location: "Austin, Texas, US",
    amount: "$85",
    loanPurpose: "Emergency Medical Supplies",
    discoveryMethod: "Google Search",
    ethnicity: 'US',
    quote: "When my daughter needed an unexpected prescription, the stress was overwhelming. I was worried about my credit score, but Leramot's soft pull gave me peace of mind. The funds were in my account the next morning, allowing me to focus on what mattered most—my family's health. I've never felt more supported by a financial institution.",
    imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=1200"
  },
  {
    id: '3',
    name: "Marcus Davies",
    location: "Toronto, Ontario, CA",
    amount: "$90",
    loanPurpose: "Minor Auto Repair",
    discoveryMethod: "Friend Referral",
    ethnicity: 'CA',
    quote: "I was struggling with a sudden car repair cost until a friend mentioned Leramot. The application process was incredibly transparent and straightforward. I got the funds I needed to get back on the road without any hassle. It's rare to find a lender that actually works for you, not against you.",
    imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=1200"
  },
  {
    id: '4',
    name: "Amina Juma",
    location: "Mombasa, Kenya",
    amount: "KSH 5,000",
    loanPurpose: "School Supplies",
    discoveryMethod: "Social Media",
    ethnicity: 'KE',
    quote: "As a mother, my children's education is my top priority. When school supplies were due and I was short, Leramot Lenders stepped in with such respect and efficiency. The process was dignified, and I could see the path forward for my children. They are more than just lenders; they are partners in our community's growth.",
    imageUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=1200"
  }
];

const TestimonialCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const next = () => setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  const current = testimonials[currentIndex];

  return (
    <div className="relative w-full max-w-5xl mx-auto px-4 py-12">
      <div className="overflow-hidden rounded-[40px] bg-white shadow-2xl border border-slate-100">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col md:flex-row min-h-[500px]"
          >
            {/* Image Section */}
            <div className="md:w-1/2 relative h-[300px] md:h-auto overflow-hidden">
              <img
                src={current.imageUrl}
                alt={current.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden" />
            </div>

            {/* Content Section */}
            <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
              <div className="mb-8">
                <svg className="h-12 w-12 text-[#FF8C42] opacity-20 mb-4" fill="currentColor" viewBox="0 0 32 32">
                  <path d="M10 8v8h6v-8h-6zm12 0v8h6v-8h-6zM10 18h6v8h-6v-8zm12 0h6v8h-6v-8z" />
                </svg>
                <p className="text-xl md:text-2xl font-medium text-slate-700 leading-relaxed italic">
                  "{current.quote}"
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <h3 className="text-2xl font-black text-slate-900 font-outfit">{current.name}</h3>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black rounded uppercase tracking-tighter">
                      {current.ethnicity}
                    </span>
                  </div>
                  <p className="text-slate-500 font-bold text-sm">{current.location}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Loan Amount</p>
                    <p className="font-black text-[#006D77]">{current.amount}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Purpose</p>
                    <p className="font-bold text-slate-700 text-sm">{current.loanPurpose}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">How they found us</p>
                    <p className="font-bold text-slate-700 text-sm">{current.discoveryMethod}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-8">
        <button
          onClick={prev}
          className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-full shadow-xl flex items-center justify-center text-slate-400 hover:text-[#006D77] transition-colors hover:scale-110 active:scale-95"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
      <div className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-8">
        <button
          onClick={next}
          className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-full shadow-xl flex items-center justify-center text-slate-400 hover:text-[#006D77] transition-colors hover:scale-110 active:scale-95"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Indicators */}
      <div className="flex justify-center mt-8 space-x-2">
        {testimonials.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-2 rounded-full transition-all duration-300 ${
              currentIndex === idx ? 'w-8 bg-[#006D77]' : 'w-2 bg-slate-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default TestimonialCarousel;

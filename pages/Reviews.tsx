
import React from 'react';
import TestimonialCarousel from '../components/TestimonialCarousel';

const Reviews: React.FC = () => {
  const testimonials = [
    {
      name: "Mercy Wanjiku",
      location: "Nairobi, Kenya",
      amount: "KSH 8,500",
      loanPurpose: "Stock Purchase",
      discoveryMethod: "M-PESA App",
      ethnicity: 'KE',
      quote: "Leramot Lenders Foundation was there when my business needed a quick boost for inventory. The M-PESA disbursement was super fast!",
      image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=400"
    },
    {
      name: "David Ochieng",
      location: "Kisumu, Kenya",
      amount: "KSH 5,000",
      loanPurpose: "Emergency Repair",
      discoveryMethod: "Newspaper Ad",
      ethnicity: 'KE',
      quote: "I love how transparent the fees are. I repaid on time, and my limit was immediately increased for next time by the Leramot team.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400"
    },
    {
      name: "Sarah Wambui",
      location: "Mombasa, Kenya",
      amount: "KSH 12,000",
      loanPurpose: "Personal Bridge",
      discoveryMethod: "Online Review Site",
      ethnicity: 'KE',
      quote: "Checking my rate was so easy and didn't hurt my credit score. The small bridge loan at Leramot Lenders saved my month when I had an unexpected expense!",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=400"
    },
    {
      name: "John Kamau",
      location: "Eldoret, Kenya",
      amount: "KSH 9,500",
      loanPurpose: "Minor Home Repair",
      discoveryMethod: "Instagram",
      ethnicity: 'KE',
      quote: "The application was incredibly fast. I got approved within minutes for a small home repair and the funds were available the next day. Highly recommended!",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400"
    },
    {
      name: "Linda Atieno",
      location: "Kisumu, Kenya",
      amount: "KSH 7,500",
      loanPurpose: "Textbooks",
      discoveryMethod: "University Bulletin",
      ethnicity: 'KE',
      quote: "Leramot provided the bridge I needed for my semester textbooks. Their customer service is top-notch and very understanding.",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400"
    },
    {
      name: "Peter Mwangi",
      location: "Nakuru, Kenya",
      amount: "KSH 11,500",
      loanPurpose: "Agri-business",
      discoveryMethod: "Community Meeting",
      ethnicity: 'KE',
      quote: "I used the loan to buy seeds and fertilizer. The harvest was great and I was able to pay back early. Thank you Leramot!",
      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400"
    }
  ];

  return (
    <div className="bg-white min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 font-outfit mb-6">Trusted by 10M+</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Real stories from real people who achieved their financial goals with Leramot Lenders Foundation.
          </p>
        </div>

        {/* Featured Carousel */}
        <div className="mb-24">
          <TestimonialCarousel />
        </div>

        {/* Video Feature */}
        <div className="mb-24">
          <div className="relative rounded-[48px] overflow-hidden aspect-video bg-slate-900 group shadow-2xl">
            <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2000" 
              className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-1000"
              alt="Community"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
              <button className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform mb-6">
                <svg className="h-10 w-10 text-[#006D77] ml-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
              <h2 className="text-3xl md:text-4xl font-black text-white font-outfit mb-2">Our Community Impact</h2>
              <p className="text-white/80 font-bold uppercase tracking-widest text-sm">Watch the documentary</p>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="mb-12">
          <h2 className="text-3xl font-black text-slate-900 font-outfit mb-12 text-center">More Success Stories</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
            {testimonials.map((t, idx) => (
              <div key={idx} className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 hover:shadow-xl transition-all flex flex-col">
                <div className="flex items-center space-x-4 mb-6">
                  <img src={t.image} className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md" alt={t.name} />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-slate-900 leading-tight">{t.name}</h4>
                      <span className="px-1 py-0.5 bg-slate-200 text-slate-500 text-[8px] font-black rounded uppercase">
                        {t.ethnicity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{t.location}</p>
                  </div>
                </div>
                
                <div className="flex-grow">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <div className="bg-white px-3 py-1 rounded-lg text-[9px] font-black text-[#006D77] uppercase tracking-widest border border-slate-100">
                      Amount: {t.amount}
                    </div>
                    <div className="bg-white px-3 py-1 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest border border-slate-100">
                      {t.loanPurpose}
                    </div>
                  </div>
                  <p className="text-slate-600 leading-relaxed italic text-sm">"{t.quote}"</p>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200/50 flex justify-between items-center">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Via {t.discoveryMethod}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 bg-slate-900 rounded-[40px] p-12 text-center">
          <div>
            <p className="text-4xl font-black text-[#FF8C42] font-outfit mb-2">4.9/5</p>
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">App Store</p>
          </div>
          <div>
            <p className="text-4xl font-black text-[#FF8C42] font-outfit mb-2">1M+</p>
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Reviews</p>
          </div>
          <div>
            <p className="text-4xl font-black text-[#FF8C42] font-outfit mb-2">24/7</p>
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Support</p>
          </div>
          <div>
            <p className="text-4xl font-black text-[#FF8C42] font-outfit mb-2">98%</p>
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Approval Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reviews;

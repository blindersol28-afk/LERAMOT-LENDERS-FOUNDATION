
import React from 'react';

const Resources: React.FC = () => {
  const articles = [
    {
      title: "How to Build a High Credit Score in 6 Months",
      category: "Credit Health",
      readTime: "5 min read",
      image: "https://images.unsplash.com/photo-1554224155-1696413575b8?auto=format&fit=crop&q=80&w=800"
    },
    {
      title: "5 Common Debt Consolidation Mistakes to Avoid",
      category: "Personal Finance",
      readTime: "8 min read",
      image: "https://images.unsplash.com/photo-1454165833767-027ffea9e77b?auto=format&fit=crop&q=80&w=800"
    },
    {
      title: "A Beginner's Guide to Digital Lending in Kenya",
      category: "Banking",
      readTime: "6 min read",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800"
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-16">
          <h1 className="text-5xl font-black text-slate-900 font-outfit mb-6">Resource Center</h1>
          <p className="text-xl text-slate-600 leading-relaxed">
            Your hub for financial literacy. Learn how to manage your money, grow your credit score, and make informed lending decisions.
          </p>
        </div>

        {/* Featured Search */}
        <div className="bg-white p-8 rounded-[32px] shadow-xl mb-20 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 border border-slate-100">
          <div className="relative flex-grow w-full">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search for topics (e.g., 'CRB', 'Interest Rates')" 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#006D77] outline-none"
            />
          </div>
          <button className="bg-[#006D77] text-white px-8 py-4 rounded-2xl font-bold w-full md:w-auto shadow-lg">
            Search
          </button>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-4 mb-16">
          {['All Posts', 'Lending 101', 'Credit Scoring', 'Debt Management', 'Banking Tech', 'Small Business'].map(cat => (
            <button key={cat} className="px-6 py-2 rounded-full bg-white border border-slate-200 text-sm font-bold text-slate-600 hover:border-[#006D77] hover:text-[#006D77] transition-all">
              {cat}
            </button>
          ))}
        </div>

        {/* Article Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {articles.map((art, idx) => (
            <article key={idx} className="group cursor-pointer">
              <div className="relative aspect-[16/10] rounded-[24px] overflow-hidden mb-6 shadow-lg">
                <img src={art.image} alt={art.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-[#006D77]">
                  {art.category}
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 font-outfit mb-3 group-hover:text-[#006D77] transition-colors leading-tight">
                {art.title}
              </h3>
              <div className="flex items-center space-x-3 text-xs font-bold text-slate-400">
                <span>{art.readTime}</span>
                <span>•</span>
                <span>Jan 24, 2024</span>
              </div>
            </article>
          ))}
        </div>

        {/* Newsletter CTA */}
        <div className="mt-24 bg-[#FF8C42] rounded-[48px] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-white font-outfit mb-6">Don't miss a beat.</h2>
            <p className="text-white/90 text-lg mb-10 font-medium">Get the latest financial news and tips delivered straight to your inbox.</p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="flex-grow bg-white px-6 py-4 rounded-2xl focus:outline-none text-slate-900"
              />
              <button className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black shadow-2xl hover:bg-slate-800 transition-all">
                Join Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resources;

import React from 'react'
import { Link } from 'react-router-dom'
import { 
  TrendingUp, 
  ShieldCheck, 
  MessageSquare, 
  ArrowRight
} from 'lucide-react'

const Dashboard = () => {
  return (
    <div className="pt-24 px-6 pb-20 max-w-7xl mx-auto">
      <header className="mb-16">
        <h1 className="text-5xl md:text-7xl font-display font-medium tracking-tight mb-6">
          Finance <span className="text-[#888888]">Platform</span>
        </h1>
        <p className="text-[#888888] text-lg max-w-2xl leading-relaxed">
          Welcome to the Smart Finance Platform. This application combines 
          predictive machine learning with real-time market sentiment to help you evaluate 
          and manage your personal financial risk.
        </p>
      </header>

      {/* Main Navigation Bento */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        <Link to="/risk" className="md:col-span-8 group relative overflow-hidden bento-card border border-[#262626] rounded-lg p-10 flex flex-col justify-end min-h-[400px]">
          <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 group-hover:scale-[1.6] transition-transform duration-700">
            <ShieldCheck className="w-64 h-64" />
          </div>
          <div className="relative z-10">
            <ShieldCheck className="w-8 h-8 text-[#00ff88] mb-6" />
            <h2 className="text-3xl font-display font-medium text-white mb-4">ML Risk Profiler</h2>
            <p className="text-[#888888] max-w-md mb-8">
              Navigate your financial future with an AI-driven predictive model. 
              Assess liquidity, debt, and credit impact in real-time.
            </p>
            <div className="flex items-center gap-2 text-[#00ff88] font-bold text-xs uppercase tracking-widest">
              Enter Profile <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </div>
          </div>
        </Link>

        <div className="md:col-span-4 flex flex-col gap-4">
          <Link to="/assistant" className="flex-1 bento-card border border-[#262626] rounded-lg p-8 group relative overflow-hidden">
            <MessageSquare className="w-6 h-6 text-[#00ff88] mb-4" />
            <h3 className="text-xl font-display font-medium text-white mb-4">AI Assistant</h3>
            <p className="text-sm text-[#888888] mb-6">Ask context-aware questions about your specific portfolio.</p>
            <div className="text-[10px] font-bold text-[#00ff88] uppercase tracking-widest flex items-center gap-2">
              Launch Bot <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link to="/sentiment" className="flex-1 bento-card border border-[#262626] rounded-lg p-8 group relative overflow-hidden">
            <TrendingUp className="w-6 h-6 text-[#00ff88] mb-4" />
            <h3 className="text-xl font-display font-medium text-white mb-4">Market Sentiment</h3>
            <p className="text-sm text-[#888888] mb-6">Real-time NLP analysis of global financial news and asset tags.</p>
            <div className="text-[10px] font-bold text-[#00ff88] uppercase tracking-widest flex items-center gap-2">
              View Market <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

      </div>
    </div>
  )
}

export default Dashboard

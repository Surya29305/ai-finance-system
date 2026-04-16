import React from 'react'
import { 
  BookOpen, 
  PiggyBank, 
  TrendingUp, 
  ShieldAlert,
  Wallet,
  Landmark,
  PieChart,
  Lightbulb,
  ArrowRight
} from 'lucide-react'

const Education = () => {
  const sections = [
    {
      title: 'Emergency Funds & Debt',
      icon: PiggyBank,
      content: 'An emergency fund is your financial bedrock. Aim for 3-6 months of expenses stored in a highly liquid, low-risk account. Concurrently, prioritize clearing high-interest debt (like credit cards) to prevent wealth erosion.',
      color: 'text-[#00ff88]'
    },
    {
      title: 'Asset Classes & Diversification',
      icon: PieChart,
      content: 'Spreading investments across equities, fixed income, real estate, and commodities reduces portfolio volatility. Diversification ensures that a downturn in a single asset class does not completely derail your financial goals.',
      color: 'text-blue-400'
    },
    {
      title: 'Risk Tolerance vs Capacity',
      icon: ShieldAlert,
      content: 'Risk tolerance is your psychological comfort with market swings, while risk capacity is your financial ability to endure loss without altering your lifestyle. Your investments should align with both dimensions.',
      color: 'text-purple-400'
    },
    {
      title: 'The Power of Compounding',
      icon: TrendingUp,
      content: 'Time is the most crucial variable in wealth creation. By reinvesting returns generated on your principal, compound interest turns modest, disciplined savings into exponential long-term growth.',
      color: 'text-yellow-400'
    }
  ]

  return (
    <div className="pt-24 px-6 pb-20 max-w-5xl mx-auto">
      <header className="mb-16">
        <div className="flex items-center gap-2 mb-4 text-[#00ff88]">
          <BookOpen className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest">Financial Literacy</span>
        </div>
        <h1 className="text-5xl font-display font-medium tracking-tight mb-6">
          Mastering Your <span className="text-[#888888]">Personal Finances</span>
        </h1>
        <p className="text-[#888888] text-lg max-w-2xl leading-relaxed">
          Financial intelligence starts with understanding the fundamentals. Explore these core principles of risk management, strategic savings, and wealth building to make smarter financial decisions.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
        {sections.map((sec) => (
          <div key={sec.title} className="bento-card p-8 border border-[#262626] rounded-lg group hover:border-[#404040] transition-colors">
            <sec.icon className={`w-8 h-8 ${sec.color} mb-6`} />
            <h3 className="text-xl font-display font-medium text-white mb-4">{sec.title}</h3>
            <p className="text-sm text-[#888888] leading-relaxed">{sec.content}</p>
          </div>
        ))}
      </div>

      {/* Financial FAQ */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 mb-8">
          <Lightbulb className="w-4 h-4 text-[#888888]" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#888888]">Core Concepts FAQ</h2>
        </div>
        
        <div className="space-y-4">
          <div className="bento-card p-6 border border-[#262626] rounded-lg">
            <h4 className="text-white font-medium mb-2">What is the 50/30/20 Rule?</h4>
            <p className="text-xs text-[#888888] leading-relaxed">
              It is a popular budgeting framework where you allocate <b>50%</b> of your after-tax income to needs (rent, groceries, bills), 
              <b>30%</b> to wants (hobbies, vacations, dining out), and dedicate at least <b>20%</b> to savings and debt repayment.
            </p>
          </div>
          <div className="bento-card p-6 border border-[#262626] rounded-lg">
            <h4 className="text-white font-medium mb-2">How does inflation impact my savings?</h4>
            <p className="text-xs text-[#888888] leading-relaxed">
              Inflation is the rate at which the cost of living increases. If your money is kept in a standard bank account yielding 1% 
              but inflation is at 5%, your purchasing power essentially drops by 4% per year. Investing helps beat inflation.
            </p>
          </div>
          <div className="bento-card p-6 border border-[#262626] rounded-lg">
            <h4 className="text-[#00ff88] font-bold mb-2 flex items-center gap-2">
              <Landmark className="w-4 h-4" />
              Strategic Debt vs Bad Debt
            </h4>
            <p className="text-xs text-[#888888] leading-relaxed">
              Not all debt is bad. <b>Strategic debt</b> (like a low-interest mortgage) allows you to purchase appreciating assets. 
              <b>Bad debt</b> (like high-interest credit cards) drains your resources to fund depreciating lifestyle expenses.
            </p>
          </div>
        </div>
      </section>

      <footer className="mt-20 pt-10 border-t border-[#262626] flex justify-between items-center text-[10px] text-[#555] uppercase font-bold tracking-[0.2em]">
        <span>Knowledge Hub</span>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white transition-colors">Tax Guide</a>
          <a href="#" className="hover:text-white transition-colors">Retirement Planning</a>
        </div>
      </footer>
    </div>
  )
}

export default Education

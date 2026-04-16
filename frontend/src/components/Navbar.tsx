import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  BarChart3, 
  UserCircle, 
  MessageSquare, 
  TrendingUp, 
  BookOpen,
  BrainCircuit
} from 'lucide-react'

const Navbar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: BarChart3 },
    { name: 'Risk Profiler', path: '/risk', icon: UserCircle },
    { name: 'AI Assistant', path: '/assistant', icon: MessageSquare },
    { name: 'Market Sentiment', path: '/sentiment', icon: TrendingUp },
    { name: 'Education', path: '/education', icon: BookOpen },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-[#0c0c0c]/80 backdrop-blur-md border-b border-[#262626] z-50 flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <BrainCircuit className="text-[#00ff88] w-6 h-6" />
        <span className="font-display font-semibold tracking-widest text-[#00ff88] uppercase text-xs hidden sm:block">
          Smart Finance App
        </span>
      </div>

      <div className="flex items-center gap-1 md:gap-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `flex items-center gap-2 px-3 py-2 rounded-md transition-all text-xs font-medium uppercase tracking-wider
              ${isActive ? 'text-[#00ff88] bg-[#00ff88]/10' : 'text-[#888888] hover:text-white hover:bg-white/5'}`
            }
          >
            <item.icon className="w-4 h-4" />
            <span className="hidden lg:block">{item.name}</span>
          </NavLink>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="h-2 w-2 rounded-full bg-[#00ff88] animate-pulse"></div>
        <span className="text-[10px] text-[#888888] font-mono hidden md:block">ONLINE</span>
      </div>
    </nav>
  )
}

export default Navbar

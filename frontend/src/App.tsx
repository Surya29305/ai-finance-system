import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import RiskProfiler from './pages/RiskProfiler'
import PortfolioAssistant from './pages/PortfolioAssistant'
import MarketSentiment from './pages/MarketSentiment'
import Education from './pages/Education'
import './index.css'

export default function App() {
  // Shared state for the portfolio so the AI Assistant knows the user's context
  const [portfolio, setPortfolio] = useState({
    age: 30,
    monthly_salary: 60000,
    monthly_expenses: 20000,
    housing_status: 'Rent',
    total_investments: 200000,
    total_debt: 500000,
    credit_score: 720,
    dependents: 1,
    employment_type: 'Salaried',
    monthly_emi: 10000,
    savings_per_month: 10000,
    emergency_fund_months: 3
  })

  const [result, setResult] = useState<any>(null)

  return (
    <Router>
      <div className="min-h-screen bg-[#050505] text-[#f8fafc] font-sans">
        <Navbar />
        
        <main className="relative">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route 
              path="/risk" 
              element={
                <RiskProfiler 
                  portfolio={portfolio} 
                  setPortfolio={setPortfolio} 
                  result={result} 
                  setResult={setResult} 
                />
              } 
            />
            <Route 
              path="/assistant" 
              element={<PortfolioAssistant portfolio={portfolio} />} 
            />
            <Route path="/sentiment" element={<MarketSentiment />} />
            <Route path="/education" element={<Education />} />
          </Routes>
        </main>

        <footer className="py-10 text-center border-t border-[#262626] mt-20 opacity-50">
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#888888]">
            AI Financial Terminal &bull; 2.1.0-STABLE
          </p>
        </footer>
      </div>
    </Router>
  )
}

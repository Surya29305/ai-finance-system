import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck,
  ArrowRight,
  Loader2,
  Home,
  Banknote,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Briefcase,
  PiggyBank,
  CreditCard,
  Activity,
  Star,
  ChevronDown,
} from 'lucide-react'
import axios from 'axios'
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import ReactMarkdown from 'react-markdown'

interface RiskProfilerProps {
  portfolio: any
  setPortfolio: (data: any) => void
  result: any
  setResult: (data: any) => void
}

const INR = (n: number) =>
  '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 })

const getRiskColor = (score: number) => {
  if (score <= 30) return '#00ff88'
  if (score <= 60) return '#facc15'
  return '#ff4d4d'
}

const getRiskLabel = (score: number) => {
  if (score <= 30) return 'Low Risk'
  if (score <= 60) return 'Moderate Risk'
  return 'High Risk'
}

// ── Animated circular gauge ────────────────────────────────────────────────
const RiskGauge = ({ score }: { score: number }) => {
  const color = getRiskColor(score)
  const data = [{ value: score, fill: color }]

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width={220} height={220}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="100%"
          barSize={18}
          data={data}
          startAngle={210}
          endAngle={-30}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar
            background={{ fill: '#1a1a1a' }}
            dataKey="value"
            cornerRadius={10}
            angleAxisId={0}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      {/* Overlay score text */}
      <div className="relative -mt-[120px] mb-[80px] flex flex-col items-center pointer-events-none">
        <span className="text-5xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs text-[#888] uppercase tracking-widest mt-1">out of 100</span>
        <span className="mt-2 text-sm font-semibold" style={{ color }}>{getRiskLabel(score)}</span>
      </div>
    </div>
  )
}

// ── Tooltip for charts ─────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#111] border border-[#333] rounded px-3 py-2 text-xs text-white shadow-xl">
        <p className="font-bold mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.fill || p.color }}>
            {p.name}: {typeof p.value === 'number' && p.value > 1000 ? INR(p.value) : p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// ── Input field helper ─────────────────────────────────────────────────────
const Field = ({
  label,
  name,
  value,
  onChange,
  placeholder = '',
  prefix = '',
  type = 'number',
}: {
  label: string
  name: string
  value: any
  onChange: any
  placeholder?: string
  prefix?: string
  type?: string
}) => (
  <div>
    <label className="text-[10px] text-[#888888] uppercase tracking-[0.18em] block mb-2">
      {label}
    </label>
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555] text-sm font-semibold">
          {prefix}
        </span>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full bg-[#111] border border-[#262626] rounded px-4 py-3 text-sm focus:border-[#00ff88] outline-none transition-colors ${prefix ? 'pl-7' : ''}`}
      />
    </div>
  </div>
)

// ── Select field helper ────────────────────────────────────────────────────
const SelectField = ({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string
  name: string
  value: any
  onChange: any
  options: { value: string; label: string }[]
}) => (
  <div>
    <label className="text-[10px] text-[#888888] uppercase tracking-[0.18em] block mb-2">
      {label}
    </label>
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full bg-[#111] border border-[#262626] rounded px-4 py-3 text-sm focus:border-[#00ff88] outline-none transition-colors text-white appearance-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555] pointer-events-none" />
    </div>
  </div>
)

// ── Section header ─────────────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <h2 className="text-sm font-semibold uppercase tracking-wider mb-6 text-white flex items-center gap-2">
    <Icon className="w-4 h-4 text-[#00ff88]" />
    {title}
  </h2>
)

// ══════════════════════════════════════════════════════════════════════════
const RiskProfiler = ({ portfolio, setPortfolio, result, setResult }: RiskProfilerProps) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const resultRef = useRef<HTMLDivElement>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    const val = e.target.type === 'number' ? parseInt(value) || 0 : value
    setPortfolio((prev: any) => ({ ...prev, [name]: val }))
  }

  const runAnalysis = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await axios.post('http://localhost:8000/predict-risk', portfolio)
      setResult(response.data)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Analysis failed. Please check backend.')
    } finally {
      setLoading(false)
    }
  }

  // Auto-scroll to results
  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [result])

  // Derived analytics for charts
  const monthlyIncome = portfolio.monthly_salary || 1
  const savingsRate = Math.round((portfolio.savings_per_month / monthlyIncome) * 100)
  const expenseRate = Math.round((portfolio.monthly_expenses / monthlyIncome) * 100)
  const emiRate = Math.round((portfolio.monthly_emi / monthlyIncome) * 100)
  const otherRate = Math.max(0, 100 - savingsRate - expenseRate - emiRate)

  const monthlyBreakdown = [
    { name: 'Expenses', value: portfolio.monthly_expenses, fill: '#ff4d4d' },
    { name: 'EMI', value: portfolio.monthly_emi, fill: '#f97316' },
    { name: 'Savings', value: portfolio.savings_per_month, fill: '#00ff88' },
    {
      name: 'Other',
      value: Math.max(
        0,
        portfolio.monthly_salary -
          portfolio.monthly_expenses -
          portfolio.monthly_emi -
          portfolio.savings_per_month
      ),
      fill: '#888888',
    },
  ].filter((d) => d.value > 0)

  const netWorthBreakdown = [
    { name: 'Investments', value: portfolio.total_investments, fill: '#00ff88' },
    { name: 'Debt', value: portfolio.total_debt, fill: '#ff4d4d' },
  ]

  const ratioData = [
    { name: 'Savings Rate', score: savingsRate, ideal: 20 },
    { name: 'EMI Burden', score: emiRate, ideal: 30 },
    { name: 'Expense Ratio', score: expenseRate, ideal: 50 },
  ]

  return (
    <div className="pt-24 px-6 pb-24 max-w-7xl mx-auto">
      {/* ── Page Header ── */}
      <header className="mb-12">
        <div className="flex items-center gap-2 mb-4 text-[#00ff88]">
          <ShieldCheck className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest">Risk Assessment Suite</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-medium tracking-tight mb-4">
          Personal Financial{' '}
          <span className="text-[#888888]">Risk Profiler</span>
        </h1>
        <p className="text-[#888888] max-w-2xl">
          Fill in your complete financial profile. Our AI engine will assign a{' '}
          <span className="text-[#00ff88]">risk score from 0–100</span>, analyse your financial
          health, and visualise your portfolio analytics.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ══ FORM COLUMN ══════════════════════════════════════════════════ */}
        <div className="lg:col-span-5 space-y-6">

          {/* Income & Personal */}
          <section className="bg-[#0c0c0c] border border-[#262626] p-6 rounded-xl">
            <SectionHeader icon={Banknote} title="Income & Personal" />
            <div className="space-y-4">
              <Field
                label="Monthly Salary (₹)"
                name="monthly_salary"
                value={portfolio.monthly_salary}
                onChange={handleInputChange}
                prefix="₹"
                placeholder="e.g. 60000"
              />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Age" name="age" value={portfolio.age} onChange={handleInputChange} />
                <Field
                  label="Dependents"
                  name="dependents"
                  value={portfolio.dependents}
                  onChange={handleInputChange}
                />
              </div>
              <SelectField
                label="Employment Type"
                name="employment_type"
                value={portfolio.employment_type}
                onChange={handleInputChange}
                options={[
                  { value: 'Salaried', label: 'Salaried' },
                  { value: 'Self-Employed', label: 'Self-Employed' },
                  { value: 'Business', label: 'Business Owner' },
                  { value: 'Freelancer', label: 'Freelancer' },
                  { value: 'Retired', label: 'Retired' },
                ]}
              />
            </div>
          </section>

          {/* Monthly Cash Flow */}
          <section className="bg-[#0c0c0c] border border-[#262626] p-6 rounded-xl">
            <SectionHeader icon={Activity} title="Monthly Cash Flow" />
            <div className="space-y-4">
              <Field
                label="Monthly Expenses (₹)"
                name="monthly_expenses"
                value={portfolio.monthly_expenses}
                onChange={handleInputChange}
                prefix="₹"
              />
              <Field
                label="Total Monthly EMI (₹)"
                name="monthly_emi"
                value={portfolio.monthly_emi}
                onChange={handleInputChange}
                prefix="₹"
              />
              <Field
                label="Monthly Savings (₹)"
                name="savings_per_month"
                value={portfolio.savings_per_month}
                onChange={handleInputChange}
                prefix="₹"
              />
            </div>
          </section>

          {/* Assets, Liabilities & Credit */}
          <section className="bg-[#0c0c0c] border border-[#262626] p-6 rounded-xl">
            <SectionHeader icon={Home} title="Assets, Liabilities & Credit" />
            <div className="space-y-4">
              <SelectField
                label="Housing Status"
                name="housing_status"
                value={portfolio.housing_status}
                onChange={handleInputChange}
                options={[
                  { value: 'Rent', label: 'Renting' },
                  { value: 'Own', label: 'Own (No Loan)' },
                  { value: 'Mortgage', label: 'Home Loan / Mortgage' },
                ]}
              />
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Total Investments (₹)"
                  name="total_investments"
                  value={portfolio.total_investments}
                  onChange={handleInputChange}
                  prefix="₹"
                />
                <Field
                  label="Total Debt (₹)"
                  name="total_debt"
                  value={portfolio.total_debt}
                  onChange={handleInputChange}
                  prefix="₹"
                />
              </div>
              <Field
                label="Credit Score (300–900)"
                name="credit_score"
                value={portfolio.credit_score}
                onChange={handleInputChange}
              />
            </div>
          </section>

          {/* Emergency & Security */}
          <section className="bg-[#0c0c0c] border border-[#262626] p-6 rounded-xl">
            <SectionHeader icon={PiggyBank} title="Emergency Fund" />
            <Field
              label="Emergency Fund (months of expenses)"
              name="emergency_fund_months"
              value={portfolio.emergency_fund_months}
              onChange={handleInputChange}
              placeholder="e.g. 3"
            />
            <p className="text-[10px] text-[#555] mt-2">
              Recommended: at least 6 months of expenses
            </p>
          </section>

          {/* Run Analysis */}
          {error && (
            <p className="text-[#ff4d4d] text-xs bg-[#ff4d4d]/10 border border-[#ff4d4d]/20 rounded px-4 py-3">
              ⚠ {error}
            </p>
          )}
          <button
            onClick={runAnalysis}
            disabled={loading}
            id="analyze-btn"
            className="w-full py-4 bg-[#00ff88] text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(0,255,136,0.15)]"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin w-4 h-4" /> Analysing...
              </>
            ) : (
              <>
                Analyse My Financial Risk <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* ══ OUTPUT COLUMN ════════════════════════════════════════════════ */}
        <div className="lg:col-span-7 space-y-6" ref={resultRef}>
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                {/* ── Risk Score Gauge ── */}
                <div className="bg-[#0c0c0c] border border-[#262626] rounded-xl p-6 flex flex-col items-center relative overflow-hidden">
                  <div className="absolute top-4 right-4 opacity-5">
                    <ShieldCheck className="w-36 h-36" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#888888] mb-2 self-start">
                    AI Risk Score
                  </span>
                  <RiskGauge score={result.risk_score} />

                  {/* Risk bands legend */}
                  <div className="flex gap-6 text-[10px] uppercase tracking-widest font-bold">
                    <span className="text-[#00ff88]">● 0–30 Low</span>
                    <span className="text-yellow-400">● 31–60 Moderate</span>
                    <span className="text-[#ff4d4d]">● 61–100 High</span>
                  </div>

                  {/* Alert strip */}
                  <div
                    className="mt-6 w-full p-3 rounded-lg border flex items-center gap-3"
                    style={{
                      background: `${getRiskColor(result.risk_score)}10`,
                      borderColor: `${getRiskColor(result.risk_score)}30`,
                    }}
                  >
                    {result.risk_score <= 30 ? (
                      <CheckCircle2 className="w-4 h-4 text-[#00ff88] shrink-0" />
                    ) : result.risk_score <= 60 ? (
                      <Star className="w-4 h-4 text-yellow-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-[#ff4d4d] shrink-0" />
                    )}
                    <span
                      className="text-xs font-semibold"
                      style={{ color: getRiskColor(result.risk_score) }}
                    >
                      {result.risk_score <= 30
                        ? 'Your financial profile is stable and well-structured.'
                        : result.risk_score <= 60
                        ? 'Moderate vulnerabilities detected — action recommended.'
                        : 'High financial risk — immediate restructuring advised.'}
                    </span>
                  </div>
                </div>

                {/* ── Quick Stats ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    {
                      label: 'Savings Rate',
                      value: `${savingsRate}%`,
                      ok: savingsRate >= 20,
                      icon: PiggyBank,
                    },
                    {
                      label: 'EMI Burden',
                      value: `${emiRate}%`,
                      ok: emiRate <= 30,
                      icon: CreditCard,
                    },
                    {
                      label: 'Credit Score',
                      value: portfolio.credit_score,
                      ok: portfolio.credit_score >= 700,
                      icon: Star,
                    },
                    {
                      label: 'Emergency Fund',
                      value: `${portfolio.emergency_fund_months}m`,
                      ok: portfolio.emergency_fund_months >= 6,
                      icon: Briefcase,
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-[#0c0c0c] border border-[#262626] rounded-xl p-4 flex flex-col gap-1"
                    >
                      <stat.icon
                        className="w-4 h-4 mb-1"
                        style={{ color: stat.ok ? '#00ff88' : '#ff4d4d' }}
                      />
                      <span className="text-xl font-bold">{stat.value}</span>
                      <span className="text-[10px] text-[#555] uppercase tracking-wider">
                        {stat.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* ── Financial Analysis ── */}
                {result.analysis && (
                  <div className="bg-[#0c0c0c] border border-[#262626] rounded-xl p-6">
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#00ff88]" />
                        <span className="text-xs font-bold uppercase tracking-widest text-[#00ff88]">
                          AI Financial Analysis
                        </span>
                      </div>
                      <span className="text-[9px] bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 px-2 py-1 rounded-full uppercase tracking-widest font-semibold">
                        FinSight AI Engine
                      </span>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none text-[#ccc] leading-relaxed">
                      <ReactMarkdown>{result.analysis}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* ── Portfolio Analytics ── */}
                <div className="bg-[#0c0c0c] border border-[#262626] rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="w-4 h-4 text-[#00ff88]" />
                    <span className="text-xs font-bold uppercase tracking-widest text-[#00ff88]">
                      Portfolio Analytics
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Monthly Cash Flow Donut */}
                    <div>
                      <p className="text-[10px] text-[#555] uppercase tracking-widest mb-3 text-center">
                        Monthly Cash Flow
                      </p>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={monthlyBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {monthlyBreakdown.map((entry, index) => (
                              <Cell key={index} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend
                            formatter={(value) => (
                              <span className="text-[10px] text-[#888]">{value}</span>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Net Worth Split */}
                    <div>
                      <p className="text-[10px] text-[#555] uppercase tracking-widest mb-3 text-center">
                        Assets vs Liabilities
                      </p>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={netWorthBreakdown} barSize={40}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                          <XAxis
                            dataKey="name"
                            tick={{ fill: '#555', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis hide />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                            {netWorthBreakdown.map((entry, index) => (
                              <Cell key={index} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Income Ratios vs Benchmark */}
                    <div className="md:col-span-2">
                      <p className="text-[10px] text-[#555] uppercase tracking-widest mb-3 text-center">
                        Your Ratios vs Recommended Benchmarks (%)
                      </p>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart
                          data={ratioData}
                          layout="vertical"
                          margin={{ left: 80, right: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" horizontal={false} />
                          <XAxis
                            type="number"
                            domain={[0, 100]}
                            tick={{ fill: '#555', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            dataKey="name"
                            type="category"
                            tick={{ fill: '#888', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend
                            formatter={(v) => (
                              <span className="text-[10px] text-[#888]">{v}</span>
                            )}
                          />
                          <Bar dataKey="score" name="Your %" fill="#00ff88" radius={[0, 4, 4, 0]} barSize={10} />
                          <Bar dataKey="ideal" name="Ideal %" fill="#333" radius={[0, 4, 4, 0]} barSize={10} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="min-h-[500px] border-2 border-dashed border-[#1e1e1e] rounded-xl flex flex-col items-center justify-center text-center p-10"
              >
                <ShieldCheck className="w-14 h-14 text-[#1e1e1e] mb-6" />
                <h3 className="text-[#555] font-medium mb-2 text-xl">
                  Your Risk Report Will Appear Here
                </h3>
                <p className="text-[#333] text-sm max-w-sm leading-relaxed">
                  Fill in your financial details on the left and click{' '}
                  <span className="text-[#00ff88]">Analyse My Financial Risk</span> to receive a
                  comprehensive risk score, AI analysis, and portfolio charts.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default RiskProfiler

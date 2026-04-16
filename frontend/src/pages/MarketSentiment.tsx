import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  Search,
  Newspaper,
  Loader2,
  Lightbulb,
  Coins,
  Gem,
  Flame,
  Bitcoin,
  BarChart3,
  ArrowUpRight,
  ShieldAlert,
  Brain,
  Target,
  Activity,
  TrendingDown,
  Minus,
  ChevronRight,
  Zap,
  Globe,
  Building2,
  CircleDollarSign,
} from 'lucide-react'
import axios from 'axios'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import ReactMarkdown from 'react-markdown'

// ─── Domain Groups ────────────────────────────────────────────────────────────
const DOMAIN_GROUPS = [
  {
    group: 'Commodities',
    icon: Coins,
    color: '#FFD700',
    items: [
      { name: 'Gold', icon: Coins, color: '#FFD700', badge: 'Safe Haven' },
      { name: 'Silver', icon: Gem, color: '#C0C0C0', badge: 'Industrial' },
      { name: 'Crude Oil', icon: Flame, color: '#FF4500', badge: 'Energy' },
    ],
  },
  {
    group: 'Crypto',
    icon: Bitcoin,
    color: '#F7931A',
    items: [
      { name: 'Bitcoin', icon: Bitcoin, color: '#F7931A', badge: 'Digital Gold' },
      { name: 'Ethereum', icon: CircleDollarSign, color: '#627EEA', badge: 'Smart Chain' },
      { name: 'Solana', icon: Zap, color: '#9945FF', badge: 'High Speed' },
    ],
  },
  {
    group: 'Indian Indices',
    icon: BarChart3,
    color: '#00ff88',
    items: [
      { name: 'Nifty 50', icon: BarChart3, color: '#00ff88', badge: 'Benchmark' },
      { name: 'Sensex', icon: Activity, color: '#00d4ff', badge: 'BSE' },
      { name: 'Bank Nifty', icon: Building2, color: '#ff6b6b', badge: 'Banking' },
    ],
  },
  {
    group: 'Indian Stocks',
    icon: Globe,
    color: '#ff9f43',
    items: [
      { name: 'Reliance', icon: Globe, color: '#ff9f43', badge: 'NSE' },
      { name: 'TCS', icon: Globe, color: '#0abde3', badge: 'NSE' },
      { name: 'Infosys', icon: Globe, color: '#48dbfb', badge: 'NSE' },
      { name: 'HDFC Bank', icon: Building2, color: '#ff6b9d', badge: 'NSE' },
      { name: 'Wipro', icon: Globe, color: '#c8d6e5', badge: 'NSE' },
    ],
  },
  {
    group: 'Global Stocks',
    icon: Globe,
    color: '#a29bfe',
    items: [
      { name: 'Tesla', icon: Zap, color: '#cc0000', badge: 'NASDAQ' },
      { name: 'Apple', icon: Globe, color: '#999999', badge: 'NASDAQ' },
      { name: 'Nvidia', icon: Brain, color: '#76b900', badge: 'NASDAQ' },
    ],
  },
]

const COLORS = {
  Bullish: '#00ff88',
  Bearish: '#ff4d4d',
  Neutral: '#888888',
}

const SentimentIcon = ({ label }: { label: string }) => {
  if (label === 'Bullish') return <TrendingUp className="w-5 h-5 text-[#00ff88]" />
  if (label === 'Bearish') return <TrendingDown className="w-5 h-5 text-[#ff4d4d]" />
  return <Minus className="w-5 h-5 text-[#888]" />
}

const ActionBadge = ({ action }: { action: string }) => {
  const styles: Record<string, string> = {
    Buy: 'bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88]',
    Sell: 'bg-[#ff4d4d]/10 border-[#ff4d4d]/30 text-[#ff4d4d]',
    Hedge: 'bg-[#ff9f43]/10 border-[#ff9f43]/30 text-[#ff9f43]',
    Wait: 'bg-[#888]/10 border-[#888]/30 text-[#888]',
  }
  return (
    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest border ${styles[action] || styles['Wait']}`}>
      {action}
    </span>
  )
}

// ─── Gauge Component ──────────────────────────────────────────────────────────
const SentimentGauge = ({ value, label }: { value: number; label: string }) => {
  const clampedValue = Math.max(0, Math.min(100, value))
  const angle = (clampedValue / 100) * 180 - 90

  const getColor = (v: number) => {
    if (v < 35) return '#ff4d4d'
    if (v < 55) return '#888888'
    return '#00ff88'
  }
  const color = getColor(clampedValue)

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-24 overflow-hidden">
        <svg viewBox="0 0 200 100" className="w-full h-full">
          {/* Background arc */}
          <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="#1a1a1a" strokeWidth="18" strokeLinecap="round" />
          {/* Colored arc */}
          <path
            d="M 10 100 A 90 90 0 0 1 190 100"
            fill="none"
            stroke={color}
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray={`${(clampedValue / 100) * 283} 283`}
            opacity="0.8"
          />
          {/* Needle */}
          <g transform={`translate(100,100) rotate(${angle})`}>
            <line x1="0" y1="0" x2="0" y2="-68" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="0" cy="0" r="5" fill={color} />
          </g>
          {/* Labels */}
          <text x="12" y="98" fontSize="8" fill="#555" fontWeight="600">FEAR</text>
          <text x="160" y="98" fontSize="8" fill="#555" fontWeight="600">GREED</text>
        </svg>
      </div>
      <div className="text-center -mt-2">
        <div className="text-3xl font-bold font-mono" style={{ color }}>{Math.round(clampedValue)}</div>
        <div className="text-[9px] text-[#555] uppercase tracking-widest mt-1">{label}</div>
      </div>
    </div>
  )
}

// ─── Insight Card ─────────────────────────────────────────────────────────────
const InsightCard = ({
  title,
  icon: Icon,
  color,
  children,
}: {
  title: string
  icon: React.ElementType
  color: string
  children: React.ReactNode
}) => (
  <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-5">
    <div className="flex items-center gap-2 mb-4" style={{ color }}>
      <Icon className="w-4 h-4" />
      <span className="text-[10px] font-bold uppercase tracking-widest">{title}</span>
    </div>
    {children}
  </div>
)

// ─── Main Component ───────────────────────────────────────────────────────────
const MarketSentiment = () => {
  const [ticker, setTicker] = useState('')
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)
  const [activeGroup, setActiveGroup] = useState<string>('Indian Indices')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyzeDomain = async (domain: string) => {
    setLoading(true)
    setError(null)
    setSelectedDomain(domain)
    setTicker('')
    setData(null)
    try {
      const response = await axios.post('http://localhost:8000/analyze-domain', { domain })
      setData(response.data)
    } catch {
      setError('Failed to fetch domain intelligence. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const analyzeTicker = async () => {
    if (!ticker.trim()) return
    setLoading(true)
    setError(null)
    setSelectedDomain(ticker.toUpperCase())
    setData(null)
    try {
      const response = await axios.post('http://localhost:8000/analyze-sentiment-full', {
        ticker: ticker.toUpperCase(),
      })
      setData(response.data)
    } catch {
      setError('Failed to fetch ticker data. Verify the symbol and try again.')
    } finally {
      setLoading(false)
    }
  }

  const pieData = data?.distribution
    ? [
        { name: 'Bullish', value: data.distribution.Bullish },
        { name: 'Bearish', value: data.distribution.Bearish },
        { name: 'Neutral', value: data.distribution.Neutral },
      ].filter((d) => d.value > 0)
    : []

  const barData = data?.headlines?.map((h: any, i: number) => ({
    name: `#${i + 1}`,
    score: parseFloat((h.score * 100).toFixed(1)),
    fill: h.score > 0.05 ? '#00ff88' : h.score < -0.05 ? '#ff4d4d' : '#555',
  })) || []

  const gaugeValue = data ? (data.average_score + 1) * 50 : 50

  // Active group domains
  const currentGroupDomains =
    DOMAIN_GROUPS.find((g) => g.group === activeGroup)?.items || []

  return (
    <div className="pt-24 px-6 pb-20 max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-10">
        <div className="flex items-center gap-2 mb-2 text-[#00ff88]">
          <TrendingUp className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest">NLP-Powered Intelligence</span>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-4xl font-display font-medium tracking-tight mb-2">
              Market <span className="text-[#888888]">Sentiment</span>
            </h1>
            <p className="text-[#888888] text-sm max-w-xl">
              Select a domain or search any stock ticker. We use <strong className="text-white">VADER NLP</strong> + <strong className="text-[#00ff88]">Gemini AI</strong> to analyze real news headlines and deliver actionable market insights.
            </p>
          </div>

          {/* Custom Ticker Search */}
          <div className="relative group w-full md:w-80">
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && analyzeTicker()}
              placeholder="e.g. AAPL, TATAMOTORS.NS..."
              className="w-full bg-[#0c0c0c] border border-[#262626] rounded-xl px-5 py-4 text-sm focus:border-[#00ff88] outline-none transition-all uppercase font-mono placeholder:normal-case placeholder:text-[#444]"
            />
            <button
              onClick={analyzeTicker}
              disabled={loading}
              className="absolute right-3 top-3 bottom-3 aspect-square bg-[#1a1a1a] rounded-lg flex items-center justify-center text-[#00ff88] hover:bg-[#262626] transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Domain Selector */}
      <section className="mb-8">
        {/* Group Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          {DOMAIN_GROUPS.map((group) => (
            <button
              key={group.group}
              onClick={() => setActiveGroup(group.group)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
                activeGroup === group.group
                  ? 'text-black border-transparent'
                  : 'bg-[#0c0c0c] border-[#262626] text-[#555] hover:border-[#444] hover:text-[#888]'
              }`}
              style={
                activeGroup === group.group
                  ? { backgroundColor: group.color, borderColor: group.color }
                  : {}
              }
            >
              <group.icon className="w-3.5 h-3.5" />
              {group.group}
            </button>
          ))}
        </div>

        {/* Domain Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {currentGroupDomains.map((domain) => (
            <motion.button
              key={domain.name}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => analyzeDomain(domain.name)}
              className={`relative flex flex-col items-center p-5 rounded-2xl border transition-all text-left ${
                selectedDomain === domain.name
                  ? 'border-opacity-60 shadow-lg'
                  : 'bg-[#0c0c0c] border-[#262626] text-[#888888] hover:border-[#444]'
              }`}
              style={
                selectedDomain === domain.name
                  ? {
                      backgroundColor: `${domain.color}08`,
                      borderColor: `${domain.color}66`,
                    }
                  : {}
              }
            >
              <domain.icon
                className="w-6 h-6 mb-3"
                style={{ color: selectedDomain === domain.name ? domain.color : '#444' }}
              />
              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: selectedDomain === domain.name ? domain.color : undefined }}
              >
                {domain.name}
              </span>
              <span className="text-[8px] text-[#444] uppercase tracking-widest mt-1">{domain.badge}</span>
              {selectedDomain === domain.name && (
                <motion.div
                  layoutId="selected-ring"
                  className="absolute inset-0 rounded-2xl border-2 pointer-events-none"
                  style={{ borderColor: domain.color }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </section>

      {/* Error Banner */}
      {error && (
        <div className="bg-[#ff4d4d]/10 border border-[#ff4d4d]/20 p-4 rounded-xl mb-8 text-[#ff4d4d] text-sm flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 text-[#333]"
        >
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-full border border-[#1a1a1a] flex items-center justify-center">
              <Brain className="w-8 h-8 text-[#00ff88] opacity-60" />
            </div>
            <Loader2 className="w-20 h-20 animate-spin text-[#00ff88]/20 absolute -top-2 -left-2" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#444]">
            Running NLP + AI Analysis…
          </p>
          <p className="text-[10px] text-[#333] mt-2 uppercase tracking-wider">
            VADER · Gemini · yFinance
          </p>
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && !data && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="w-20 h-20 rounded-full border border-dashed border-[#222] flex items-center justify-center mb-6">
            <TrendingUp className="w-8 h-8 text-[#333]" />
          </div>
          <h3 className="text-[#444] font-bold uppercase tracking-widest text-sm mb-2">
            Select a Domain to Begin
          </h3>
          <p className="text-[#333] text-xs max-w-xs">
            Choose any asset above — Gold, Bitcoin, Nifty 50, or any Indian/Global stock — to start the NLP sentiment scan.
          </p>
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {!loading && data && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* ── Left Column ── */}
            <div className="lg:col-span-4 space-y-5">

              {/* Sentiment Gauge */}
              <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-3xl p-7">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[9px] font-bold text-[#555] uppercase tracking-[0.3em] block mb-1">
                      Analyzing
                    </span>
                    <h3 className="text-lg font-bold text-white">{selectedDomain}</h3>
                  </div>
                  <ActionBadge action={data.suggested_action || 'Wait'} />
                </div>

                <SentimentGauge value={gaugeValue} label="Fear & Greed Index" />

                <div className="grid grid-cols-2 gap-3 mt-6">
                  <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-4 flex flex-col items-center">
                    <SentimentIcon label={data.sentiment_label} />
                    <span className="text-[8px] text-[#555] uppercase tracking-wider mt-2 block">Consensus</span>
                    <span
                      className="text-sm font-bold mt-0.5"
                      style={{
                        color:
                          data.sentiment_label === 'Bullish'
                            ? '#00ff88'
                            : data.sentiment_label === 'Bearish'
                            ? '#ff4d4d'
                            : '#888',
                      }}
                    >
                      {data.sentiment_label}
                    </span>
                  </div>
                  <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-4 flex flex-col items-center">
                    <Activity className="w-5 h-5 text-[#888]" />
                    <span className="text-[8px] text-[#555] uppercase tracking-wider mt-2 block">VADER Score</span>
                    <span
                      className="text-sm font-bold mt-0.5 font-mono"
                      style={{
                        color:
                          data.average_score > 0.05
                            ? '#00ff88'
                            : data.average_score < -0.05
                            ? '#ff4d4d'
                            : '#888',
                      }}
                    >
                      {data.average_score?.toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sentiment Distribution Pie */}
              <InsightCard title="Sentiment Split" icon={Target} color="#00ff88">
                {pieData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={4}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={index} fill={COLORS[entry.name as keyof typeof COLORS]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', fontSize: '11px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-around mt-2">
                      {Object.entries(COLORS).map(([label, color]) => {
                        const val = data.distribution?.[label] || 0
                        return (
                          <div key={label} className="text-center">
                            <div className="text-lg font-bold font-mono" style={{ color }}>{val}</div>
                            <div className="text-[8px] font-bold text-[#444] uppercase tracking-wider">{label}</div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-[#444] italic">No distribution data.</p>
                )}
              </InsightCard>

              {/* Headline Score Bar Chart */}
              {barData.length > 0 && (
                <InsightCard title="Headline Score Distribution" icon={BarChart3} color="#00d4ff">
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={barData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#444' }} />
                      <YAxis tick={{ fontSize: 9, fill: '#444' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', fontSize: '10px' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(v: number) => [`${v}%`, 'Score']}
                      />
                      <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                        {barData.map((entry: any, index: number) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="text-[9px] text-[#444] mt-2 uppercase tracking-wider">VADER compound score per headline (×100)</p>
                </InsightCard>
              )}
            </div>

            {/* ── Right Column ── */}
            <div className="lg:col-span-8 space-y-5">

              {/* AI Synthesis */}
              <div className="bg-[#00ff88]/[0.02] border border-[#262626] border-l-4 border-l-[#00ff88]/40 rounded-3xl p-7">
                <div className="flex items-center gap-2 mb-5 text-[#00ff88]">
                  <Brain className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-widest">Gemini AI + VADER Synthesis</h3>
                  <span className="ml-auto text-[9px] text-[#444] uppercase tracking-widest">NLP-Powered</span>
                </div>

                {data.summary ? (
                  <div className="space-y-5">
                    <div className="prose prose-invert max-w-none prose-sm text-[#ccc] prose-p:text-sm prose-p:leading-relaxed">
                      <ReactMarkdown>{data.summary}</ReactMarkdown>
                    </div>

                    {/* Market Drivers */}
                    {data.drivers?.length > 0 && (
                      <div>
                        <p className="text-[9px] font-bold text-[#555] uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Zap className="w-3 h-3" /> Key Market Drivers
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {data.drivers.map((driver: string, i: number) => (
                            <span
                              key={i}
                              className="px-3 py-1.5 bg-[#111] border border-[#222] rounded-lg text-[10px] text-white font-medium hover:border-[#00ff88]/40 transition-all cursor-default"
                            >
                              {driver}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* NLP Insights */}
                    {data.nlp_insights && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#1a1a1a]">
                        <div className="bg-[#0c0c0c] rounded-xl p-4 border border-[#1a1a1a]">
                          <p className="text-[9px] text-[#444] uppercase tracking-wider mb-1">Positive Signals</p>
                          <p className="text-[#00ff88] font-bold text-lg font-mono">{data.nlp_insights.positive_count}</p>
                          <p className="text-[9px] text-[#555] mt-0.5">bullish headlines</p>
                        </div>
                        <div className="bg-[#0c0c0c] rounded-xl p-4 border border-[#1a1a1a]">
                          <p className="text-[9px] text-[#444] uppercase tracking-wider mb-1">Negative Signals</p>
                          <p className="text-[#ff4d4d] font-bold text-lg font-mono">{data.nlp_insights.negative_count}</p>
                          <p className="text-[9px] text-[#555] mt-0.5">bearish headlines</p>
                        </div>
                        <div className="bg-[#0c0c0c] rounded-xl p-4 border border-[#1a1a1a]">
                          <p className="text-[9px] text-[#444] uppercase tracking-wider mb-1">Sentiment Intensity</p>
                          <p className="text-white font-bold text-lg font-mono">{data.nlp_insights.avg_intensity}%</p>
                          <p className="text-[9px] text-[#555] mt-0.5">avg emotional weight</p>
                        </div>
                      </div>
                    )}

                    {/* What This Means (Plain English) */}
                    {data.plain_insight && (
                      <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-5 mt-2">
                        <div className="flex items-center gap-2 mb-3">
                          <Lightbulb className="w-4 h-4 text-[#FFD700]" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#FFD700]">What This Means for You</span>
                        </div>
                        <p className="text-sm text-[#ccc] leading-relaxed">{data.plain_insight}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-[#444] italic">AI synthesis will appear here after analysis.</p>
                )}
              </div>

              {/* NEWS Headlines */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Newspaper className="w-4 h-4 text-[#555]" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#555]">Live News Headlines</h3>
                  </div>
                  <span className="text-[9px] font-bold text-[#333] uppercase tracking-widest">
                    {data?.headlines?.length || 0} Sources Analyzed
                  </span>
                </div>

                <div className="grid gap-3">
                  <AnimatePresence mode="popLayout">
                    {data?.headlines?.map((item: any, i: number) => (
                      <motion.a
                        key={i}
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="group block bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-4 hover:border-[#00ff88]/20 transition-all"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span
                                className="w-1.5 h-4 rounded-full flex-shrink-0"
                                style={{
                                  backgroundColor:
                                    item.label === 'Bullish'
                                      ? '#00ff88'
                                      : item.label === 'Bearish'
                                      ? '#ff4d4d'
                                      : '#444',
                                }}
                              />
                              <h4 className="text-white text-sm font-medium group-hover:text-[#00ff88] transition-colors line-clamp-2 leading-tight">
                                {item.title}
                              </h4>
                            </div>
                            <div className="flex items-center gap-4 ml-3.5">
                              <span
                                className="text-[9px] font-bold uppercase tracking-wider"
                                style={{
                                  color:
                                    item.label === 'Bullish'
                                      ? '#00ff88'
                                      : item.label === 'Bearish'
                                      ? '#ff4d4d'
                                      : '#555',
                                }}
                              >
                                {item.label}
                              </span>
                              <span className="text-[9px] text-[#333] uppercase tracking-wider">
                                Intensity: {(Math.abs(item.score) * 100).toFixed(1)}%
                              </span>
                              <span className="text-[9px] font-mono text-[#333]">
                                VADER: {item.score?.toFixed(3)}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#222] group-hover:text-[#00ff88] flex-shrink-0 transition-colors mt-0.5" />
                        </div>
                      </motion.a>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MarketSentiment

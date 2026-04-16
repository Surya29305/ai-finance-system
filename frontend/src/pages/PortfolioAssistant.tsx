import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, 
  Send, 
  Loader2, 
  User, 
  BrainCircuit,
  Settings,
  AlertCircle
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import axios from 'axios'

interface PortfolioAssistantProps {
  portfolio: any;
}

const PortfolioAssistant = ({ portfolio }: PortfolioAssistantProps) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: 'Hello! I am your AI Financial Assistant. Since I have access to your current risk profile, feel free to ask questions about your debt, investment strategy, or potential risk improvements.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)
    setError(null)

    try {
      const response = await axios.post('http://localhost:8000/chat', {
        user_portfolio: portfolio,
        question: userMsg
      })
      
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }])
    } catch (err: any) {
      console.error("Chat Error:", err)
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail)
      } else {
        setError("Failed to connect to the backend server. Make sure it is running on port 8000.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pt-24 px-6 pb-10 max-w-5xl mx-auto h-[calc(100vh-20px)] flex flex-col">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2 text-[#00ff88]">
            <BrainCircuit className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Smart Advisor</span>
          </div>
          <h1 className="text-4xl font-display font-medium tracking-tight">AI Portfolio <span className="text-[#888888]">Assistant</span></h1>
        </div>
        <div className="hidden md:flex gap-4">
          <div className="bento-card p-3 rounded-lg border border-[#262626] flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] text-[#888888] uppercase font-bold">Context Status</p>
              <p className="text-xs text-[#00ff88]">Portolio Linked</p>
            </div>
            <Settings className="w-4 h-4 text-[#888888]" />
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 bento-card border-[#262626] overflow-hidden flex flex-col mb-4">
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === 'assistant' ? '' : 'flex-row-reverse'}`}
              >
                <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? 'bg-[#00ff88]/20 text-[#00ff88]' : 'bg-white/10 text-white'}`}>
                  {msg.role === 'assistant' ? <BrainCircuit className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                <div className={`max-w-[80%] p-4 rounded-lg text-sm leading-relaxed ${msg.role === 'assistant' ? 'bg-[#111] border border-[#262626] text-[#dfdfdf] markdown-body' : 'bg-[#00ff88] text-black font-medium'}`}>
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown
                      components={{
                        p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                        li: ({node, ...props}) => <li className="mb-1" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-md font-semibold text-white mt-4 mb-2" {...props} />,
                        h4: ({node, ...props}) => <h4 className="font-semibold text-white mt-2 mb-1" {...props} />,
                        strong: ({node, ...props}) => <strong className="text-white font-bold" {...props} />,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )}
                </div>
              </motion.div>
            ))}
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                <div className="w-8 h-8 rounded bg-[#00ff88]/20 text-[#00ff88] flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
                <div className="bg-[#111] border border-[#262626] p-4 rounded-lg">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-[#888] rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-[#888] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-[#888] rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              </motion.div>
            )}
            {error && (
              <div className="flex justify-center">
                <div className="bg-[#ff4d4d]/10 border border-[#ff4d4d]/20 px-4 py-2 rounded flex items-center gap-2 text-[#ff4d4d] text-xs">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              </div>
            )}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[#080808] border-t border-[#262626]">
          <div className="relative max-w-4xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about your financial health, e.g. 'How can I lower my risk score?'"
              className="w-full bg-[#111] border border-[#262626] rounded-full py-4 pl-6 pr-16 text-sm focus:border-[#00ff88] outline-none transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="absolute right-2 top-2 bottom-2 aspect-square bg-[#00ff88] rounded-full flex items-center justify-center text-black hover:opacity-90 disabled:opacity-30 transition-all"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
          <p className="text-center text-[9px] text-[#555] mt-4 uppercase tracking-widest font-bold">
            AI advice is for informational purposes only. Consult a human professional for critical decisions.
          </p>
        </div>
      </div>
    </div>
  )
}

export default PortfolioAssistant

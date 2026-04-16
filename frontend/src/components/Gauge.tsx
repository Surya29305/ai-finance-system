import React from 'react'
import { motion } from 'framer-motion'

interface GaugeProps {
  value: number // 0 to 100
  label?: string
  color?: string
}

const Gauge: React.FC<GaugeProps> = ({ value, label, color }) => {
  // Map value (0-100) to rotation (-90 to 90)
  const rotation = (value / 100) * 180 - 90
  
  // Color interpolation logic (simple red to green)
  const getGaugeColor = (val: number) => {
    if (color) return color
    if (val < 30) return '#ff4d4d' // Red
    if (val < 70) return '#ffcc00' // Yellow/Gold
    return '#00ff88' // Green
  }

  const gaugeColor = getGaugeColor(value)

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative w-48 h-24 overflow-hidden">
        {/* Background Track */}
        <svg className="w-48 h-48 transform -rotate-90 origin-center" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="10"
            strokeDasharray="141.37"
            strokeDashoffset="141.37"
            strokeLinecap="round"
          />
          {/* Active Track */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={gaugeColor}
            strokeWidth="10"
            strokeDasharray="282.74"
            initial={{ strokeDashoffset: 282.74 }}
            animate={{ strokeDashoffset: 282.74 - (value / 100) * 141.37 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
            style={{ transformOrigin: 'center', transform: 'rotate(0deg)' }}
          />
        </svg>

        {/* Needle */}
        <motion.div
          className="absolute bottom-0 left-1/2 w-1 h-20 bg-white origin-bottom -translate-x-1/2"
          initial={{ rotate: -90 }}
          animate={{ rotate: rotation }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ 
            clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
            boxShadow: '0 0 10px rgba(255,255,255,0.5)'
          }}
        />
        
        {/* Center hub */}
        <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-4 h-4 bg-[#1a1a1a] border-2 border-[#333] rounded-full z-10" />
      </div>

      <div className="mt-4 text-center">
        <span className="text-3xl font-display font-medium text-white">{Math.round(value)}</span>
        {label && <p className="text-[10px] font-bold text-[#888888] uppercase tracking-[0.2em] mt-1">{label}</p>}
      </div>
    </div>
  )
}

export default Gauge

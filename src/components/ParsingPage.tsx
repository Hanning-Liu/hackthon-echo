import React from 'react';
import { motion } from 'motion/react';
import { Loader2, Music, Play } from 'lucide-react';

/** 解析过渡页：水彩五线谱树动画 */
export function ParsingPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.8 }}
      className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#fcfaec] via-[#f6f7ef] to-[#e4eedb]"
    >
      <div className="relative z-10 flex h-full w-full max-w-2xl flex-col items-center justify-center">

        {/* Floating Video Thumbnail Preview */}
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="relative z-20 mb-12 aspect-video w-48 rounded-3xl bg-white p-2 shadow-[0_20px_50px_rgba(130,140,110,0.15)] md:w-64"
        >
          <div className="group relative h-full w-full cursor-wait overflow-hidden rounded-2xl">
            <img
              src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
              alt="Video Thumbnail Preview"
              className="h-full w-full object-cover opacity-80"
              referrerPolicy="no-referrer"
            />
            {/* Play button overlay slightly faint */}
            <div className="absolute inset-0 flex items-center justify-center bg-white/20">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/40 backdrop-blur-sm">
                <Play fill="white" size={16} className="ml-1 text-white opacity-80" />
              </div>
            </div>
            {/* Scanner beam effect */}
            <motion.div
              className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[#8fa492] to-transparent opacity-60"
              animate={{ y: ['0%', '10000%', '0%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        </motion.div>

        {/* Tree of Music (Staff Line Tree) */}
        <div className="relative bottom-4 flex h-64 w-64 items-end justify-center">
          {/* SVG Tree driven by Framer Motion pathLength */}
          <svg width="200" height="240" viewBox="0 0 200 240" fill="none" className="overflow-visible stroke-[#a2af9a]">
            {/* We draw 5 parallel-ish lines to represent the staff lines growing into a tree */}
            {[...Array(5)].map((_, i) => {
              const offset = (i - 2) * 3.5; // Spacing between staff lines
              return (
                <g key={i} strokeWidth="1" strokeLinecap="round" opacity="0.7">
                  {/* Main Trunk turning into Left Branch */}
                  <motion.path
                    d={`M ${100 + offset} 240 Q ${100 + offset} 140 ${50 + offset} 90`}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 3, ease: 'easeOut', delay: 0.5 + Math.abs(offset) * 0.05 }}
                  />
                  {/* Right Branch splitting off the Trunk */}
                  <motion.path
                    d={`M ${95 + offset} 180 Q ${140 + offset} 150 ${160 + offset} 80`}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2.5, ease: 'easeOut', delay: 1.5 + Math.abs(offset) * 0.05 }}
                  />
                  {/* Top Center Branch splitting off */}
                  <motion.path
                    d={`M ${85 + offset} 130 Q ${110 + offset} 90 ${115 + offset} 40`}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, ease: 'easeOut', delay: 2.2 + Math.abs(offset) * 0.05 }}
                  />
                </g>
              );
            })}
          </svg>

          {/* Musical Notes (Glowing Fruits) */}
          {[
            { x: 30, y: 70, delay: 2.8, size: 28, rotation: -15, icon: <Music size={28} fill="currentColor" /> },
            { x: 155, y: 65, delay: 3.2, size: 22, rotation: 20, icon: <Music size={22} fill="currentColor" /> },
            { x: 105, y: 15, delay: 3.5, size: 30, rotation: 5, icon: <Music size={30} fill="currentColor" /> },
            { x: 70, y: 120, delay: 3.0, size: 18, rotation: -30, icon: <Music size={18} fill="currentColor" /> },
          ].map((fruit, idx) => (
            <motion.div
              key={idx}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: [0.6, 1, 0.8, 1], y: [0, -5, 0] }}
              transition={{
                scale: { delay: fruit.delay, duration: 1, type: 'spring', bounce: 0.5 },
                opacity: { delay: fruit.delay, duration: 2, repeat: Infinity, repeatType: 'reverse' },
                y: { delay: fruit.delay, duration: 3, repeat: Infinity, ease: 'easeInOut' },
              }}
              className="absolute z-20 text-[#dca64f] opacity-90 drop-shadow-[0_0_12px_rgba(220,166,79,0.7)]"
              style={{ left: fruit.x, bottom: fruit.y, transform: `rotate(${fruit.rotation}deg)` }}
            >
              {fruit.icon}
            </motion.div>
          ))}
        </div>

        {/* Text Prompt */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 1.5 }}
          className="mt-8 flex flex-col items-center gap-2"
        >
          <div className="flex items-center gap-3 text-[#7d8c75]">
            <Loader2 size={16} className="animate-spin opacity-60" />
            <h3 className="text-base font-medium tracking-[0.2em] md:text-lg">AI 正在为你捕捉旋律的灵魂...</h3>
          </div>
          <motion.p
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="mt-1 text-xs font-light tracking-widest text-[#a1998f] md:text-sm"
          >
            视频内容正在转化为音乐能力
          </motion.p>
        </motion.div>
      </div>

      {/* Decorative background blurs to keep aesthetic consistent */}
      <div className="pointer-events-none absolute left-[10%] top-[20%] h-64 w-64 rounded-full bg-[#e8efdd] opacity-60 mix-blend-multiply blur-[80px]" />
      <div className="pointer-events-none absolute bottom-[20%] right-[10%] h-64 w-64 rounded-full bg-[#f8efd8] opacity-60 mix-blend-multiply blur-[80px]" />
    </motion.div>
  );
}

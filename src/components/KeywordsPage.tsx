import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import * as d3 from 'd3-force';

const KEYWORDS = ["谷雨", "工位", "镜子", "未寄出", "山海", "红豆", "同桌", "跑步", "公路旅行", "猫", "深夜食堂", "树洞", "召唤师", "逆风如解意", "马", "王", "七里香", "三分糖", "第二杯半价", "Hackathon"];

const COLORS = [
  'bg-pink-50/90 text-[#b57388] border-pink-200/50',
  'bg-blue-50/90 text-[#7198bb] border-blue-200/50',
  'bg-yellow-50/90 text-[#cda434] border-yellow-200/50',
  'bg-teal-50/90 text-[#609995] border-teal-200/50',
  'bg-[#f6f2ec]/90 text-[#8c8276] border-[#e8dfcf]/50'
];

interface BubbleNode extends d3.SimulationNodeDatum {
  kw: string;
  r: number;
  color: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export default function KeywordsPage({ onSelect, onBack }: { key?: string; onSelect: (kw: string) => void; onBack: () => void; }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<BubbleNode[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const cx = width / 2;
    const cy = height * 0.52;
    const n = KEYWORDS.length;

    /** 环形散开初始布局，避免先挤在中心再炸开 */
    const initialNodes: BubbleNode[] = KEYWORDS.map((kw, i) => {
      const r = 30 + Math.random() * 20;
      const angle = (2 * Math.PI * i) / n + (Math.random() - 0.5) * 0.35;
      const ring = Math.min(width, height) * (0.24 + Math.random() * 0.14);
      return {
        kw,
        r,
        color: COLORS[i % COLORS.length],
        x: cx + Math.cos(angle) * ring + (Math.random() - 0.5) * 14,
        y: cy + Math.sin(angle) * ring + (Math.random() - 0.5) * 14,
      };
    });

    setNodes([...initialNodes]);

    const simulation = d3
      .forceSimulation<BubbleNode>(initialNodes)
      .velocityDecay(0.14)
      .alpha(0.95)
      .alphaMin(0.001)
      .alphaDecay(0.045)
      /** 维持轻微「热度」，模拟不会完全冷却，气泡会持续缓慢调整 */
      .alphaTarget(0.014)
      .force(
        'collide',
        d3
          .forceCollide<BubbleNode>()
          .radius((d) => d.r + 4)
          .strength(0.9)
          .iterations(3)
      )
      /** 负值：互相排斥（原先用正数会把节点吸向中心） */
      .force('charge', d3.forceManyBody<BubbleNode>().strength(-32))
      .force('center', d3.forceCenter(cx, cy).strength(0.028))
      .force('x', d3.forceX(cx).strength(0.018))
      .force('y', d3.forceY(cy).strength(0.022))
      .on('tick', () => {
        const t = performance.now() / 1000;
        initialNodes.forEach((d, i) => {
          /** 缓慢、不同相位的漂浮感（先略衰减再叠加，避免速度无限累积） */
          let vx = (d.vx ?? 0) * 0.988;
          let vy = (d.vy ?? 0) * 0.988;
          vx += Math.sin(t * 0.55 + i * 1.13) * 0.014 + Math.cos(t * 0.31 + i * 0.71) * 0.01;
          vy += Math.cos(t * 0.48 + i * 0.97) * 0.014 + Math.sin(t * 0.39 + i * 1.05) * 0.01;
          d.vx = Math.max(-0.85, Math.min(0.85, vx));
          d.vy = Math.max(-0.85, Math.min(0.85, vy));

          const m = d.r + 3;
          d.x = Math.max(m, Math.min(width - m, d.x!));
          d.y = Math.max(m, Math.min(height - m, d.y!));
        });
        setNodes([...initialNodes]);
      });

    return () => {
      simulation.stop();
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-gradient-to-br from-[#F9F7F2] to-[#f4f0e6] overflow-hidden"
    >
      <button 
        onClick={onBack}
        className="absolute left-6 top-[12%] p-2 rounded-full bg-white/60 text-[#8c8276] hover:bg-white shadow-sm transition-all z-50 pointer-events-auto"
      >
        <ArrowLeft size={20} />
      </button>

      <div className="absolute top-[11%] left-0 right-0 z-20 text-center px-4 pointer-events-none">
        <h2 className="text-[#5c5346] font-serif tracking-[0.15em] text-lg opacity-90">
          现在脑子里浮现的<br/>第一个关键词是
        </h2>
      </div>

      <div ref={containerRef} className="absolute inset-0 mt-10 h-full w-full">
        {nodes.map((b) => (
          <motion.div
            key={b.kw}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => onSelect(b.kw)}
            className={`absolute flex cursor-pointer items-center justify-center rounded-full border shadow-[0_4px_15px_rgba(100,90,80,0.05)] backdrop-blur-sm will-change-[left,top] hover:z-30 hover:scale-110 hover:shadow-md ${b.color} transition-[transform,box-shadow] duration-200 ease-out`}
            style={{
              width: b.r * 2,
              height: b.r * 2,
              left: (b.x || 0) - b.r,
              top: (b.y || 0) - b.r,
              fontSize: b.r * 2 > 80 ? '13px' : '11px',
              fontFamily: 'sans-serif',
              letterSpacing: '0.05em',
            }}
          >
            <span className="pointer-events-none px-3 text-center font-medium opacity-90">{b.kw}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

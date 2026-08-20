import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  MessageSquare,
  Network,
  Code2,
  ShieldAlert,
  Layers,
  UserCheck,
  Search,
  Reply,
  Share2,
  Bookmark,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  FileCode
} from 'lucide-react';

interface MockupItem {
  id: string;
  tab: 'chat' | 'arch' | 'review' | 'security' | 'tech' | 'intel';
  title: string;
  subtitle: string;
  time: string;
  tag: string;
  badgeColor: string;
}

const itemsList: MockupItem[] = [
  {
    id: '1',
    tab: 'chat',
    title: 'Prepare a product launch brief',
    subtitle: 'Defining the outcome, constraints, and success criteria',
    time: 'Just now',
    tag: 'Agent Run',
    badgeColor: '#00d2ff'
  },
  {
    id: '2',
    tab: 'arch',
    title: 'Execution Plan',
    subtitle: 'Research → Connect data → Analyze → Verify → Deliver',
    time: '2m ago',
    tag: 'Planning',
    badgeColor: '#A4F4FD'
  },
  {
    id: '3',
    tab: 'review',
    title: '48 market and customer signals found',
    subtitle: 'Comparing competitor moves, feedback themes, and campaign data',
    time: '12m ago',
    tag: 'Research',
    badgeColor: '#3D81E3'
  },
  {
    id: '4',
    tab: 'security',
    title: 'Verification required',
    subtitle: '4 claims and metrics need stronger evidence',
    time: '1h ago',
    tag: 'Verification',
    badgeColor: '#f59e0b'
  },
  {
    id: '5',
    tab: 'tech',
    title: 'Tool activity',
    subtitle: 'Browser · Search · CRM · Analytics · Documents',
    time: '2h ago',
    tag: 'Tools',
    badgeColor: '#10b981'
  },
  {
    id: '6',
    tab: 'intel',
    title: 'Launch brief and action plan delivered',
    subtitle: '12 prioritized actions with evidence, owners, and next steps',
    time: 'Yesterday',
    tag: 'Result',
    badgeColor: '#8b5cf6'
  }
];

export const RepoIntelligenceMockup: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>('1');
  const [activeNav, setActiveNav] = useState<string>('Agent Activity');
  const [activeTab, setActiveTab] = useState<'chat' | 'arch' | 'review' | 'security' | 'tech' | 'intel'>('chat');

  const handleItemSelect = (item: MockupItem) => {
    setSelectedId(item.id);
    setActiveTab(item.tab);
  };

  return (
    <section id="mockup" className="max-w-6xl mx-auto px-4 sm:px-6 xl:px-0 pt-10 md:pt-4 pb-20 md:pb-32 relative z-10">

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0e1014]/90 backdrop-blur-2xl shadow-2xl"
      >
        {/* Title Bar */}
        <div className="h-10 border-b border-white/10 bg-black/40 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ff5f57] inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#febc2e] inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#28c840] inline-block" />
          </div>
          <div className="flex items-center gap-2 text-xs text-white/60 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-white/50" />
            <span>Codyn Agent — Product launch workflow</span>
          </div>

          <div className="w-12" />
        </div>

        {/* Body Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 md:h-[660px] divide-y md:divide-y-0 md:divide-x divide-white/10">

          {/* Sidebar */}
          <div className="col-span-12 md:col-span-3 bg-black/30 p-4 flex flex-col gap-4 overflow-y-auto">
            {/* Action Button */}
            <button className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-white text-black text-xs font-semibold px-3 py-2.5 transition hover:bg-white/90 cursor-pointer shadow-sm">
              <span>New Agent Run</span>
              <ArrowRight className="w-3.5 h-3.5 text-black" />
            </button>

            {/* Nav Items */}
            <div className="space-y-1">
              {[
                { name: 'Agent Activity', icon: MessageSquare, tabKey: 'chat' },
                { name: 'Execution Plan', icon: Network, tabKey: 'arch' },
                { name: 'Findings & Insights', icon: Code2, tabKey: 'review' },
                { name: 'Verification', icon: ShieldAlert, tabKey: 'security' },
                { name: 'Connected Tools', icon: Layers, tabKey: 'tech' },
                { name: 'Final Result', icon: UserCheck, tabKey: 'intel' },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      setActiveNav(item.name);
                      const matched = itemsList.find(i => i.tab === item.tabKey);
                      if (matched) {
                        setSelectedId(matched.id);
                        setActiveTab(matched.tab);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-white/10 text-white font-medium'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-3.5 h-3.5 text-white/70" />
                      <span>{item.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Context Categories */}
            <div className="pt-2 border-t border-white/10 space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40 px-3 py-1">
                Live Context
              </div>
              {[
                { name: 'Goal & Success Criteria', color: '#00d2ff' },
                { name: 'Execution Plan', color: '#A4F4FD' },
                { name: 'Tools & Evidence', color: '#f59e0b' },
                { name: 'Verification Status', color: '#10b981' },
              ].map((label) => (
                <div
                  key={label.name}
                  className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-white/70 hover:text-white cursor-pointer rounded-md hover:bg-white/5 transition-colors"
                >
                  <span
                    className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                    style={{ backgroundColor: label.color }}
                  />
                  <span>{label.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Middle List Panel */}
          <div className="col-span-12 md:col-span-4 flex flex-col h-[320px] md:h-full overflow-hidden bg-black/10">
            {/* Search Header */}
            <div className="p-3 border-b border-white/10 flex items-center gap-2 text-xs text-white/50 bg-black/20">
              <Search className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search actions, sources, and results"
                className="bg-transparent border-none outline-none text-xs text-white placeholder-white/40 w-full"
              />
            </div>

            {/* List Scrollable */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {itemsList.map((item) => {
                const isSelected = item.id === selectedId;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemSelect(item)}
                    className={`p-3 transition cursor-pointer relative ${
                      isSelected
                        ? 'bg-white/10 border-l-2 border-[#00d2ff]'
                        : 'hover:bg-white/5 border-l-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        {item.tag}
                      </span>
                      <span className="text-[10px] text-white/40 flex-shrink-0">
                        {item.time}
                      </span>
                    </div>
                    <div className="text-xs text-white/90 truncate mt-0.5 font-medium">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-white/50 truncate mt-0.5">
                      {item.subtitle}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reader / View Details Panel */}
          <div className="col-span-12 md:col-span-5 flex flex-col h-full bg-black/20 p-5 overflow-y-auto">
            {/* Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs text-white/60">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#00d2ff]/10 text-[#00d2ff] border border-[#00d2ff]/20">
                  Autonomous Agent Active
                </span>
                <span className="text-white/40 text-[11px]">27 sources · 3 tools in context</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1.5 rounded-md hover:bg-white/10 text-white/70 hover:text-white transition">
                  <Share2 className="w-3.5 h-3.5" />
                </button>
                <button className="p-1.5 rounded-md hover:bg-white/10 text-white/70 hover:text-white transition">
                  <Bookmark className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Dynamic View Content based on selected tab */}
            {activeTab === 'chat' && (
              <div className="mt-4 flex-1 space-y-4">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-[11px] text-white/40 font-mono mb-1">USER PROMPT</div>
                  <p className="text-xs text-white font-medium">"Research competitor launches, analyze customer feedback, pull campaign metrics, and deliver a launch brief with prioritized actions."</p>
                </div>

                <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#00d2ff]/10 via-[#A4F4FD]/5 to-transparent border border-[#00d2ff]/20 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#A4F4FD]">
                    <MessageSquare className="w-3.5 h-3.5 text-[#A4F4FD]" />
                    <span>Codyn Agent Activity</span>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed">
                    Codyn defined the deliverable, selected the right tools, and started gathering the market, customer, and performance context needed to finish it:
                  </p>


                  <div className="p-2.5 rounded-lg bg-black/60 font-mono text-[11px] text-white/80 space-y-1.5 border border-white/10">
                    <div className="text-[#00d2ff] flex items-center justify-between">
                      <span>1. Gather external signals</span>
                      <span className="text-[9px] text-white/40">27 sources found</span>
                    </div>
                    <div className="text-white/60 pl-3">↳ research launches, positioning, pricing, and market response</div>
                    <div className="text-[#A4F4FD] flex items-center justify-between pt-1">
                      <span>2. Connect internal context</span>
                      <span className="text-[9px] text-white/40">3 tools connected</span>
                    </div>
                    <div className="text-white/60 pl-3">↳ analyze feedback, campaign metrics, and existing launch notes</div>
                  </div>

                  <p className="text-xs text-white/70 leading-relaxed pt-1">
                    The agent continuously asks: <code className="text-[#A4F4FD]">What am I missing, what should I do next, and am I actually done?</code>
                  </p>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-white/50 pt-1">
                  <FileCode className="w-3.5 h-3.5 text-[#00d2ff]" />
                  <span>Context evaluated: competitor sites, customer feedback, CRM notes, analytics, and launch documents</span>
                </div>
              </div>
            )}

            {activeTab === 'arch' && (
              <div className="mt-4 flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Execution Flow</h3>
                  <span className="text-[10px] text-white/40 font-mono">Generated from your goal</span>
                </div>

                <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-center p-2 rounded-lg bg-[#00d2ff]/10 border border-[#00d2ff]/30 text-[#00d2ff] font-semibold text-center">
                    Goal: Prepare a product launch brief
                  </div>
                  <div className="text-center text-white/40">↓</div>
                  <div className="flex items-center justify-center p-2 rounded-lg bg-white/10 border border-white/20 text-white font-semibold text-center">
                    Plan and choose tools
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center text-white/40">
                    <span>↙</span>
                    <span>↘</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-[#A4F4FD]/10 border border-[#A4F4FD]/30 text-[#A4F4FD] text-center text-[11px]">
                      Research and connect data
                    </div>
                    <div className="p-2 rounded-lg bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981] text-center text-[11px]">
                      Analyze, verify, and deliver
                    </div>
                  </div>
                </div>

                <p className="text-xs text-white/70 leading-relaxed">
                  Codyn decides the steps required to reach the outcome, while keeping the full workflow visible and inspectable.
                </p>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="mt-4 flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Verification Signal</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Review Needed
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Claims and metrics need stronger evidence</span>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed">
                    Two campaign metrics are missing date ranges, and two competitor claims currently rely on a single source.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <div className="text-xs font-semibold text-white">Next Best Action</div>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Recheck the <code className="text-[#00d2ff]">analytics source</code>, confirm the reporting period, and cross-check competitor claims against a <code className="text-[#A4F4FD]">second trusted source</code> before delivery.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'review' && (
              <div className="mt-4 flex-1 space-y-3">
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#00d2ff]">
                    <CheckCircle2 className="w-4 h-4 text-[#00d2ff]" />
                    <span>Cross-Source Analysis Completed</span>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed">
                    Codyn connected market movement with customer evidence and internal performance data to identify the decisions that matter most for launch.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2 text-xs text-white/70">
                  <div className="flex justify-between text-white font-medium">
                    <span>Opportunity</span>
                    <span className="text-[#00d2ff]">Faster onboarding story</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer signal</span>
                    <span>Repeated in 18 interviews</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Market risk</span>
                    <span>Two competitors launch earlier</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recommended priority</span>
                    <span className="text-[#10b981] font-semibold">High</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tech' && (
              <div className="mt-4 flex-1 space-y-3">
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#00d2ff]">
                    <Layers className="w-4 h-4 text-[#00d2ff]" />
                    <span>Connected Tool Workspace</span>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed">
                    Codyn selected each system for a purpose and preserved the context returned by every action.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2 text-xs text-white/70">
                  <div className="flex justify-between text-white font-medium"><span>Browser + Search</span><span className="text-[#00d2ff]">Market evidence</span></div>
                  <div className="flex justify-between"><span>CRM + Feedback</span><span>Customer context</span></div>
                  <div className="flex justify-between"><span>Analytics</span><span>Campaign performance</span></div>
                  <div className="flex justify-between"><span>Documents</span><span className="text-[#10b981] font-semibold">Brief + action plan</span></div>
                </div>
              </div>
            )}

            {activeTab === 'intel' && (
              <div className="mt-4 flex-1 space-y-3">
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#00d2ff]">
                    <CheckCircle2 className="w-4 h-4 text-[#00d2ff]" />
                    <span>Autonomous Workflow Completed</span>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed">
                    Codyn delivered a verified launch brief, a prioritized action plan, and the evidence trail behind every recommendation.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2 text-xs text-white/70">
                  <div className="flex justify-between text-white font-medium"><span>Deliverable</span><span className="text-[#00d2ff]">Launch Brief</span></div>
                  <div className="flex justify-between"><span>Priority actions</span><span>12</span></div>
                  <div className="flex justify-between"><span>Evidence linked</span><span>18 verified sources</span></div>
                  <div className="flex justify-between"><span>Verification score</span><span className="text-[#10b981] font-semibold">98/100</span></div>
                </div>
              </div>
            )}

          </div>

        </div>
      </motion.div>
    </section>
  );
};

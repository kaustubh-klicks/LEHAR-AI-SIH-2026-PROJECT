import React, { useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { QueryChips } from './QueryChips';
import { Waves, Sparkles, Map, Activity, Box } from 'lucide-react';
import { HudCornerBrackets } from '../common/HudCornerBrackets';
import type { ChatMessage as ChatMessageType } from '../../types';

interface ChatPanelProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  onSendMessage: (query: string, mode?: 'text' | 'voice') => void;
  onFocusMap?: (markers: any[]) => void;
  onView3D?: () => void;
  selectedLanguage?: string;
  onSelectLanguage?: (lang: string) => void;
  activeView?: 'map' | 'ctd' | '3d';
  onViewChange?: (view: 'map' | 'ctd' | '3d') => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  isLoading,
  onSendMessage,
  onFocusMap,
  onView3D,
  activeView = 'map',
  onViewChange,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll strictly inside the message pane on new messages or loading state
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading]);

  const handleTabClick = (view: 'map' | 'ctd' | '3d') => {
    if (onViewChange) {
      onViewChange(view);
    }
    if (view === '3d' && onView3D) {
      onView3D();
    }
  };

  return (
    <div className="flex flex-col h-full max-h-full min-h-0 bg-abyssal-950/85 border border-abyssal-800/90 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-2xl relative glow-organism-cyan">
      <HudCornerBrackets />

      {/* Top Chat Header with View Toggles (Static top) */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-abyssal-800/80 bg-abyssal-900/60 shadow-inner gap-2 flex-wrap sm:flex-nowrap shrink-0 z-10">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="p-1.5 rounded-xl bg-ocean-cyan/10 text-ocean-cyan border border-ocean-cyan/25 shadow-glow-cyan-sm shrink-0">
            <Waves className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 font-heading truncate">
              Ocean Intelligence Console
            </h2>
            <p className="text-[10px] text-slate-400 truncate">Natural Language to Read-Only SQL Engine</p>
          </div>
        </div>

        {/* Console View Navigation Tabs */}
        <div className="flex items-center p-0.5 bg-abyssal-950/90 rounded-xl border border-abyssal-800/80 shrink-0">
          <button
            type="button"
            onClick={() => handleTabClick('map')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
              activeView === 'map'
                ? 'bg-ocean-cyan text-abyssal-950 font-bold shadow-glow-cyan-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Ocean Map</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabClick('ctd')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
              activeView === 'ctd'
                ? 'bg-ocean-cyan text-abyssal-950 font-bold shadow-glow-cyan-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>CTD Profile</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabClick('3d')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
              activeView === '3d'
                ? 'bg-ocean-cyan text-abyssal-950 font-bold shadow-glow-cyan-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Lens</span>
          </button>
        </div>
      </div>

      {/* Messages Stream — Locked scrollable viewport */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-8 space-y-4 my-auto">
            <div className="relative ocean-breathing">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-ocean-cyan/20 via-teal-500/10 to-abyssal-900 border border-ocean-cyan/30 flex items-center justify-center text-ocean-cyan shadow-glow-cyan">
                <Waves className="w-7 h-7 animate-pulse" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                Ready for Ocean Queries
              </h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Ask anything in Hindi, Hinglish, or English via text or voice.
              </p>
            </div>

            {/* Starter Categorized Discovery Chips */}
            <div className="w-full pt-2">
              <QueryChips onSelectQuery={(q) => onSendMessage(q, 'text')} />
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onFocusMap={onFocusMap}
              onView3D={onView3D}
            />
          ))
        )}

        {isLoading && (
          <div className="flex items-center space-x-2 text-xs text-ocean-cyan p-3 bg-abyssal-900/60 rounded-xl border border-ocean-cyan/20 w-fit animate-pulse font-mono shadow-glow-cyan-sm">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>Analyzing ARGO profiles & computing telemetry...</span>
          </div>
        )}
      </div>

      {/* Input Composer Bar (Static bottom) */}
      <div className="p-3 border-t border-abyssal-800/80 bg-abyssal-900/40 shrink-0 z-10">
        <ChatInput
          onSendMessage={(text, mode) => onSendMessage(text, mode)}
          isLoading={isLoading}
          language="auto"
        />
      </div>
    </div>
  );
};
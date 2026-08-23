import React from 'react';
import { 
  Send, 
  ExternalLink, 
  ShieldCheck, 
  Mic, 
  Navigation, 
  Waves, 
  Sparkles, 
  Radio, 
  Smartphone,
  CheckCircle2
} from 'lucide-react';
import { HudCornerBrackets } from '../common/HudCornerBrackets';

export const TelegramGateway: React.FC = () => {
  const telegramBotUrl = 'https://t.me/LeharAIBot';

  return (
    <div className="w-full h-full flex items-center justify-center p-3 sm:p-6 bg-[#020713] font-sans overflow-y-auto relative selection:bg-cyan-400 selection:text-black">
      
      {/* Background Ambient Ocean Glow */}
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -top-20 -left-20"></div>
      <div className="absolute w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none -bottom-20 -right-20"></div>

      <div className="w-full max-w-5xl bg-abyssal-950/90 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl relative glow-organism-cyan flex flex-col lg:flex-row items-center gap-8 z-10">
        
        <HudCornerBrackets />

        {/* Left Column: Glowing Radar QR HUD */}
        <div className="flex flex-col items-center space-y-4 shrink-0 w-full lg:w-auto">
          
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500 via-teal-400 to-sky-500 rounded-3xl blur-md opacity-40 group-hover:opacity-75 transition duration-700 animate-pulse"></div>

            <div className="relative bg-[#040f1d] border-2 border-cyan-400/60 p-5 rounded-2xl shadow-2xl flex flex-col items-center overflow-hidden">
              
              {/* Radar Scan Sweep Line */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/15 to-transparent h-20 w-full animate-[scan_3s_ease-in-out_infinite] pointer-events-none"></div>

              {/* Sensor Header */}
              <div className="w-full flex items-center justify-between pb-3 border-b border-cyan-500/30 text-[10px] font-mono text-cyan-300">
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                  RADAR BEACON ACTIVE
                </span>
                <span className="text-slate-400">INCOIS//SIH26040</span>
              </div>

              {/* QR Image Box */}
              <div className="relative my-3 p-2 bg-[#020b16] rounded-xl border border-cyan-500/40 shadow-inner">
                <img
                  src="/telegram_qr.jpg"
                  alt="Scan Lehar AI Telegram Bot"
                  className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-lg filter drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                />
              </div>

              {/* HUD Instruction Footer */}
              <div className="w-full pt-2.5 border-t border-cyan-500/30 flex items-center justify-between text-[11px] font-mono">
                <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
                  <span>POINT MOBILE CAMERA</span>
                </div>
                <span className="text-[10px] text-teal-400 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800/50">
                  @LeharAIBot
                </span>
              </div>

            </div>
          </div>

          <a
            href={telegramBotUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-ocean-cyan via-teal-400 to-sky-400 hover:brightness-110 text-abyssal-950 font-black text-xs font-mono shadow-lg shadow-cyan-500/25 transition cursor-pointer active:scale-95"
          >
            <Send className="w-4 h-4 text-abyssal-950" />
            <span>Launch @LeharAIBot on Telegram</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1 text-abyssal-950" />
          </a>
        </div>

        {/* Right Column: Tactical Mission Cards */}
        <div className="flex-1 space-y-4 text-left w-full">
          
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-xs">
              <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span>OFFICIAL INCOIS TELEMETRY GATEWAY</span>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-heading flex items-center gap-2">
              Lehar AI Multimodal Telegram Bot
              <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              24/7 vernacular voice, automated PFZ coordinate delivery, and real-time ocean intelligence built for coastal fishermen, trawler captains, and marine researchers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            
            <div className="p-3 rounded-xl bg-abyssal-900/80 border border-abyssal-800 space-y-1 hover:border-cyan-500/40 transition">
              <div className="flex items-center space-x-2 text-cyan-300 text-xs font-bold font-mono">
                <Mic className="w-3.5 h-3.5 text-cyan-400" />
                <span>Vernacular Voice AI</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Send voice notes in Hindi, Tamil, Telugu, Malayalam, Marathi, Bengali & English with natural audio replies.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-abyssal-900/80 border border-abyssal-800 space-y-1 hover:border-teal-400/40 transition">
              <div className="flex items-center space-x-2 text-teal-300 text-xs font-bold font-mono">
                <Navigation className="w-3.5 h-3.5 text-teal-400" />
                <span>GPS-Targeted PFZ</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Share live Telegram GPS location to calculate exact nautical distance and compass heading to tuna fronts.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-abyssal-900/80 border border-abyssal-800 space-y-1 hover:border-rose-400/40 transition">
              <div className="flex items-center space-x-2 text-rose-300 text-xs font-bold font-mono">
                <Waves className="w-3.5 h-3.5 text-rose-400" />
                <span>High-Wave & Cyclone Alerts</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Automated swell surges, high-wave warnings, and monsoonal squall alerts pushed directly to mobile devices.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-abyssal-900/80 border border-abyssal-800 space-y-1 hover:border-purple-400/40 transition">
              <div className="flex items-center space-x-2 text-purple-300 text-xs font-bold font-mono">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>ARGO Float Telemetry</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Query in-situ water temperature, thermocline depth, and dissolved oxygen minimums in plain language.
              </p>
            </div>

          </div>

          <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-[11px] font-mono text-cyan-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Active Endpoint: <strong className="text-white">@LeharAIBot</strong></span>
            </div>
            <span className="text-slate-400">Developed for INCOIS & MoES (SIH26040)</span>
          </div>

        </div>

      </div>
    </div>
  );
};
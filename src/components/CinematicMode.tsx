import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CloudSun, Navigation } from 'lucide-react';
import { Match, Screen, TransitionType, UserSeat } from '../types';
import { getMatchScore } from '../utils';
import { BottomNav } from './BottomNav';

interface CinematicModeProps {
  navigate: (screen: Screen, transition: TransitionType) => void;
  activeMatch: Match;
  userSeat: UserSeat;
}

export function CinematicMode({ navigate, activeMatch, userSeat }: CinematicModeProps) {
  const [weather, setWeather] = useState<{ temp: number; desc: string } | null>(null);

  useEffect(() => {
    let active = true;
    fetch('https://api.open-meteo.com/v1/forecast?latitude=25.4208&longitude=51.4903&current_weather=true')
      .then(res => res.json())
      .then(data => {
        if (!active) return;
        const temp = Math.round(data.current_weather.temperature);
        const code = data.current_weather.weathercode;
        let desc = 'Clear';
        if (code >= 1 && code <= 3) desc = 'Partly Cloudy';
        else if (code >= 45 && code <= 48) desc = 'Fog';
        else if (code >= 51 && code <= 67) desc = 'Rain';
        else if (code >= 71 && code <= 82) desc = 'Snow';
        else if (code >= 95) desc = 'Thunderstorm';
        setWeather({ temp, desc });
      })
      .catch(() => {
        if (active) setWeather({ temp: 28, desc: 'Clear' });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-[var(--bg-primary)]">
      <header className="flex items-start justify-between px-6 py-6 z-10 shrink-0 bg-gradient-to-b from-[var(--accent)]/5 to-transparent border-b border-[var(--accent)]/10">
        <div className="flex flex-col items-start gap-2">
          <div className="flex items-center space-x-2">
            {activeMatch.status === 'live' ? (
              <div className="px-2 py-1 bg-red-500/20 text-red-500 border border-red-500/30 rounded flex items-center gap-1 text-[10px] font-bold tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                LIVE &bull; {activeMatch.time}
              </div>
            ) : (
              <div className="px-2 py-1 bg-orange-500/20 text-orange-500 border border-orange-500/30 rounded flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase">
                {activeMatch.time}
              </div>
            )}
          </div>
          {weather && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-md">
              <CloudSun className="w-3 h-3 text-[var(--text-secondary)]" />
              <span className="text-[9px] font-mono text-[var(--text-secondary)] uppercase tracking-wider">{weather.temp}°C {weather.desc}</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button 
            id="btn-cinematic-matches"
            aria-label="View matches list"
            onClick={() => navigate('MatchesList', 'push')}
            className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full text-xs font-bold tracking-wide uppercase hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
          >
            Matches
          </button>
          <button 
            id="btn-cinematic-hub"
            aria-label="Launch stadium hub"
            onClick={() => navigate('WarmMode', 'push')}
            className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full text-xs font-bold tracking-wide uppercase hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
          >
            Hub
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 z-10 space-y-6 overflow-y-auto pb-6 pt-6 relative before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top,_var(--accent)_0%,_transparent_50%)] before:opacity-5 before:pointer-events-none">
        <div className="text-center space-y-1">
          <h2 className="text-xs font-bold tracking-widest uppercase text-[var(--text-secondary)]">{activeMatch.stage}</h2>
          <h1 className="text-3xl font-black italic uppercase tracking-tight text-[var(--text-primary)] flex items-center justify-center gap-3">
            <span>{activeMatch.team1}</span>
            <span className="px-2.5 py-0.5 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] not-italic text-lg font-bold text-[var(--accent)] font-mono shadow-inner shadow-black/25">
              {getMatchScore(activeMatch)}
            </span>
            <span>{activeMatch.team2}</span>
          </h1>
        </div>

        <div id="card-match-stats" className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-4 flex justify-between items-center shadow-lg">
          <div className="flex flex-col items-center w-1/3">
            <span className="text-[8px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mb-1">Possession</span>
            <div className="flex items-center gap-2 w-full justify-center text-sm font-black">
              <span className="text-orange-400">{activeMatch.stats.possession[0]}%</span>
              <span className="text-[var(--text-secondary)] text-[10px]">-</span>
              <span className="text-red-400">{activeMatch.stats.possession[1]}%</span>
            </div>
          </div>
          <div className="w-px h-8 bg-[var(--border-color)]"></div>
          <div className="flex flex-col items-center w-1/3">
            <span className="text-[8px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mb-1">Shots (On)</span>
            <div className="flex items-center gap-2 w-full justify-center text-sm font-black">
              <span className="text-orange-400">{activeMatch.stats.shotsOnTarget[0]}</span>
              <span className="text-[var(--text-secondary)] text-[10px]">-</span>
              <span className="text-red-400">{activeMatch.stats.shotsOnTarget[1]}</span>
            </div>
          </div>
          <div className="w-px h-8 bg-[var(--border-color)]"></div>
          <div className="flex flex-col items-center w-1/3">
            <span className="text-[8px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mb-1">Corners</span>
            <div className="flex items-center gap-2 w-full justify-center text-sm font-black">
              <span className="text-orange-400">{activeMatch.stats.corners[0]}</span>
              <span className="text-[var(--text-secondary)] text-[10px]">-</span>
              <span className="text-red-400">{activeMatch.stats.corners[1]}</span>
            </div>
          </div>
        </div>

        {activeMatch.highlights && activeMatch.highlights.length > 0 && (
          <div id="card-match-highlights" className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-5 shadow-lg">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-4 pb-2 border-b border-[var(--border-color)]">Match Highlights</h3>
            <div className="space-y-4">
              {activeMatch.highlights.map((highlight) => (
                <div key={highlight.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-center shrink-0 mt-0.5">
                    {highlight.type === 'goal' && <div className="w-3 h-3 rounded-full bg-white/90 border-2 border-black/50"></div>}
                    {highlight.type === 'yellow_card' && <div className="w-2.5 h-3.5 bg-yellow-400 rounded-sm border border-yellow-500/50 rotate-12"></div>}
                    {highlight.type === 'red_card' && <div className="w-2.5 h-3.5 bg-red-500 rounded-sm border border-red-600/50 rotate-12"></div>}
                    {highlight.type === 'substitution' && (
                      <div className="flex flex-col items-center gap-0.5 relative">
                        <div className="w-0 h-0 border-l-[3px] border-l-transparent border-b-[4px] border-b-green-500 border-r-[3px] border-r-transparent"></div>
                        <div className="w-0 h-0 border-l-[3px] border-l-transparent border-t-[4px] border-t-red-500 border-r-[3px] border-r-transparent"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-[var(--text-primary)]">{highlight.player}</span>
                      <span className="text-[10px] font-mono font-bold text-[var(--accent)]">{highlight.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[var(--text-secondary)]">{highlight.team}</span>
                      {highlight.details && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-[var(--border-color)]"></span>
                          <span className="text-[9px] text-[var(--text-secondary)] tracking-wide">{highlight.details}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div id="card-assigned-seat" className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--accent)_0%,_transparent_70%)] opacity-10 mix-blend-screen"></div>
          
          <div className="relative flex flex-col items-center justify-center space-y-4">
            <div className="w-full max-w-[240px] h-32 relative bg-[var(--bg-tertiary)] rounded-2xl border border-[var(--border-color)] overflow-hidden flex items-center justify-center mb-2 shadow-inner">
              <svg width="100%" height="100%" viewBox="0 0 200 120" className="absolute inset-0">
                <defs>
                  <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--text-secondary)" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="1" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--border-color)" strokeWidth="0.5"/>
                </pattern>
                <rect width="100%" height="100%" fill="url(#grid)" />

                <path d="M 20,100 Q 100,10 180,100" fill="none" stroke="var(--border-color)" strokeWidth="2" strokeDasharray="4 4" />
                
                <motion.path
                  d="M 20,110 C 60,110 80,60 150,75"
                  fill="none"
                  stroke="url(#pathGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  filter="url(#glow)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.5 }}
                />

                <circle cx="20" cy="110" r="4" fill="var(--text-secondary)" />
                <circle cx="20" cy="110" r="8" fill="var(--text-secondary)" opacity="0.3" className="animate-ping" />
                
                <circle cx="150" cy="75" r="5" fill="var(--accent)" filter="url(#glow)" />
                <circle cx="150" cy="75" r="10" fill="var(--accent)" opacity="0.4" className="animate-pulse" />
              </svg>
              
              <div className="absolute top-2 left-2 text-[8px] font-bold tracking-widest text-[var(--text-secondary)] uppercase bg-[var(--bg-primary)]/80 px-1.5 py-0.5 rounded border border-[var(--border-color)]">
                You are here
              </div>
              <div className="absolute top-6 right-2 text-[8px] font-bold tracking-widest text-[var(--accent)] uppercase bg-[var(--accent)]/10 px-1.5 py-0.5 rounded border border-[var(--accent)]/30 backdrop-blur-sm">
                Block {userSeat.block}
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-[10px] text-[var(--accent)] font-mono tracking-widest uppercase mb-1">Your Assigned Seat</p>
              <p className="text-2xl font-black italic uppercase text-[var(--text-primary)]">Block {userSeat.block} &bull; Row {userSeat.row} &bull; {userSeat.seat}</p>
            </div>
            
            <button 
              id="btn-route-to-gate"
              aria-label="Route to Gate C Assigned Seat"
              onClick={() => navigate('UserProfile', 'push')}
              className="mt-2 w-full py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-[var(--accent)]/30 transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Navigation className="w-4 h-4" /> Route to Gate C (Assigned)
            </button>
          </div>
        </div>
      </main>

      <BottomNav currentScreen="CinematicMode" navigate={navigate} />
    </div>
  );
}

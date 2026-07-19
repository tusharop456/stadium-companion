import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Screen, TransitionType, Match } from '../types';
import { getMatchScore } from '../utils';

interface MatchesListProps {
  navigate: (screen: Screen, transition: TransitionType) => void;
  matches: Match[];
  selectMatch: (match: Match) => void;
  activeMatch: Match;
}

export function MatchesList({ navigate, matches, selectMatch, activeMatch }: MatchesListProps) {
  return (
    <div className="flex flex-col h-full w-full bg-[var(--bg-primary)]">
      <header className="flex items-center px-6 py-6 z-10 relative shrink-0">
        <button 
          id="btn-matches-back"
          aria-label="Back to Match Hub"
          onClick={() => navigate('CinematicMode', 'push_back')}
          className="w-10 h-10 flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full mr-4 text-[var(--text-primary)] cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold uppercase tracking-tight text-[var(--text-primary)]">Matches</h1>
      </header>
      
      <main className="flex-1 px-6 z-10 space-y-4 overflow-y-auto pb-6">
        {matches.map((match) => (
          <div 
            key={match.id} 
            id={`btn-select-match-${match.id}`}
            aria-label={`Select Match ${match.team1} vs ${match.team2}`}
            role="button"
            onClick={() => {
              selectMatch(match);
              navigate('CinematicMode', 'push_back');
            }}
            className={`bg-[var(--bg-secondary)] border rounded-2xl p-5 relative overflow-hidden flex flex-col cursor-pointer transition-transform active:scale-95 ${match.id === activeMatch.id ? 'border-[var(--accent)]' : 'border-[var(--border-color)] hover:border-[var(--text-secondary)]'}`}
          >
            {match.id === activeMatch.id && (
              <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--accent)]/10 blur-[30px]"></div>
            )}
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-secondary)]">{match.stage}</span>
              {match.status === 'live' ? (
                <div className="px-2 py-1 bg-red-500/20 text-red-500 rounded text-[9px] font-bold tracking-widest uppercase flex items-center gap-1 border border-red-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  LIVE &bull; {match.time}
                </div>
              ) : (
                <span className="text-[10px] font-mono text-[var(--text-secondary)]">{match.time}</span>
              )}
            </div>
            <div className="flex items-center justify-between z-10">
              <span className="text-2xl font-black italic uppercase text-[var(--text-primary)]">{match.team1}</span>
              <span className="px-2 py-0.5 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)] text-xs font-bold text-[var(--accent)] font-mono">
                {getMatchScore(match)}
              </span>
              <span className="text-2xl font-black italic uppercase text-[var(--text-primary)]">{match.team2}</span>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ArrowRight, Settings, CheckCircle2, LogOut, LogIn } from 'lucide-react';
import { Match, Screen, TransitionType, UserSeat } from '../types';
import { getMatchScore } from '../utils';
import { BottomNav } from './BottomNav';
import { User as FirebaseUser } from 'firebase/auth';

interface UserProfileProps {
  navigate: (screen: Screen, transition: TransitionType) => void;
  activeMatch: Match;
  userSeat: UserSeat;
  goalCelebrationEnabled: boolean;
  setGoalCelebrationEnabled: (val: boolean) => void;
  triggerGoal: (team: string, color: string) => void;
  user: FirebaseUser | null;
  login: () => void;
  logout: () => void;
  autoSimulateEvents: boolean;
  setAutoSimulateEvents: (val: boolean) => void;
  triggerFirestoreEvent: (type: 'goal' | 'yellow_card' | 'red_card' | 'substitution', team: string, player: string, details: string) => Promise<void> | void;
  resetFirestoreMatch: () => Promise<void> | void;
}

export function UserProfile({
  navigate,
  activeMatch,
  userSeat,
  goalCelebrationEnabled,
  setGoalCelebrationEnabled,
  user,
  login,
  logout,
  autoSimulateEvents,
  setAutoSimulateEvents,
  triggerFirestoreEvent,
  resetFirestoreMatch,
}: UserProfileProps) {
  const [userName, setUserName] = useState(user?.displayName || 'Guest User');
  const [avatarUrl, setAvatarUrl] = useState(user?.photoURL || 'https://i.pravatar.cc/150?u=guest');
  const [isEditing, setIsEditing] = useState(false);
  const [avatarInput, setAvatarInput] = useState(avatarUrl);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    if (user) {
      setUserName(user.displayName || 'Fan');
      setAvatarUrl(user.photoURL || 'https://i.pravatar.cc/150?u=fan');
      setAvatarInput(user.photoURL || 'https://i.pravatar.cc/150?u=fan');
    } else {
      setUserName('Guest User');
      setAvatarUrl('https://i.pravatar.cc/150?u=guest');
      setAvatarInput('https://i.pravatar.cc/150?u=guest');
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setAvatarInput(newUrl);
    
    try {
      new URL(newUrl);
      setAvatarUrl(newUrl);
      setAvatarError(false);
    } catch {
      setAvatarError(true);
    }
  };

  const toggleEditing = async () => {
    if (isEditing) {
      if (avatarError) {
        setAvatarInput(avatarUrl);
        setAvatarError(false);
      }
      // Trigger updating state
      const { db } = await import('../lib/firebase');
      if (user && db) {
        const { doc, updateDoc } = await import('firebase/firestore');
        updateDoc(doc(db, 'users', user.uid), {
          name: userName,
          avatar: avatarError ? avatarUrl : avatarInput
        }).catch(console.error);
      }
    } else {
      setAvatarInput(avatarUrl);
    }
    setIsEditing(!isEditing);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[var(--bg-primary)]">
      <header className="flex items-center px-6 py-6 z-10 relative shrink-0">
        <button 
          id="btn-profile-back"
          aria-label="Back to Match Hub"
          onClick={() => navigate('CinematicMode', 'push_back')}
          className="w-10 h-10 flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full mr-4 text-[var(--text-primary)] cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold uppercase tracking-tight text-[var(--text-primary)]">Fan Profile</h1>
      </header>

      <main className="flex-1 px-6 z-10 space-y-6 overflow-y-auto pb-6">
        <div id="card-fan-profile" className="flex items-center space-x-4 bg-[var(--bg-secondary)] p-4 rounded-3xl border border-[var(--border-color)] relative">
          <div className="relative group shrink-0">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] border-2 border-[var(--border-color)] overflow-hidden">
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="flex-1 overflow-hidden pr-6">
            {isEditing ? (
              <div className="space-y-2 mb-2">
                <input 
                  id="input-profile-username"
                  aria-label="Edit Username"
                  type="text" 
                  value={userName} 
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] px-2 py-1.5 rounded-lg border border-[var(--border-color)] text-sm font-bold outline-none focus:border-[var(--accent)] transition-colors"
                  placeholder="Username"
                />
                <input 
                  id="input-profile-avatar"
                  aria-label="Edit Avatar URL"
                  type="text" 
                  value={avatarInput} 
                  onChange={handleAvatarChange}
                  className={`w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] px-2 py-1.5 rounded-lg border ${avatarError ? 'border-red-500 focus:border-red-500' : 'border-[var(--border-color)] focus:border-[var(--accent)]'} text-[10px] font-mono outline-none transition-colors`}
                  placeholder="Avatar URL"
                />
              </div>
            ) : (
              <h2 className="text-xl font-bold text-[var(--text-primary)] truncate">{userName}</h2>
            )}
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] text-[var(--text-secondary)] font-mono uppercase">Ticket: #TKT-8291</p>
              <p className="text-[10px] text-[var(--accent)] font-mono uppercase">Seat: Block {userSeat.block}, Row {userSeat.row}, Seat {userSeat.seat}</p>
            </div>
            <div className="inline-block mt-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-[9px] font-bold uppercase tracking-wider rounded border border-yellow-500/30">
              VIP Access
            </div>
          </div>
          <button 
            id="btn-profile-edit"
            aria-label="Edit Profile Settings"
            onClick={toggleEditing}
            className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            {isEditing ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Settings className="w-4 h-4" />}
          </button>
        </div>

        <div id="card-match-pass" className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/10 blur-[50px]"></div>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4 border-b border-[var(--border-color)] pb-2 text-[var(--text-primary)]">Digital Match Pass</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] text-[var(--text-secondary)] font-mono uppercase">Match</p>
                <p className="text-base font-bold text-[var(--text-primary)]">{activeMatch.team1} vs {activeMatch.team2}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[var(--text-secondary)] font-mono uppercase">Gate</p>
                <p className="text-base font-bold text-[var(--accent)]">Gate C</p>
              </div>
            </div>
            
            <div className="bg-[var(--bg-tertiary)] rounded-xl p-4 flex justify-center items-center">
              <div className="w-full h-16 flex items-center justify-between opacity-80 gap-1">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className={`h-full bg-[var(--text-primary)] ${i % 2 === 0 ? 'w-1' : i % 3 === 0 ? 'w-3' : 'w-2'} rounded-sm`}></div>
                ))}
              </div>
            </div>
            
            <p className="text-[10px] text-[var(--text-secondary)] text-center leading-relaxed">
              Scan this pass at VIP entrance lanes. ID verification may be required.
            </p>
          </div>
        </div>

        <div id="card-preferences" className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-6 relative overflow-hidden">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4 border-b border-[var(--border-color)] pb-2 text-[var(--text-primary)]">Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">Goal Celebration</p>
                <p className="text-[10px] text-[var(--text-secondary)]">Screen pulses on followed team goals</p>
              </div>
              <button 
                id="btn-toggle-celebration"
                aria-label="Toggle Goal Celebration"
                onClick={() => setGoalCelebrationEnabled(!goalCelebrationEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${goalCelebrationEnabled ? 'bg-[var(--accent)]' : 'bg-[var(--bg-tertiary)]'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${goalCelebrationEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)]">
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">Auto-Simulate Events</p>
                <p className="text-[10px] text-[var(--text-secondary)]">Simulate match events in background</p>
              </div>
              <button 
                id="btn-toggle-autosimulate"
                aria-label="Toggle Auto-Simulate"
                onClick={() => setAutoSimulateEvents(!autoSimulateEvents)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${autoSimulateEvents ? 'bg-[var(--accent)]' : 'bg-[var(--bg-tertiary)]'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoSimulateEvents ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {activeMatch && activeMatch.status === 'live' && (
          <div id="card-realtime-controller" className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/10 blur-[50px]"></div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 border-b border-[var(--border-color)] pb-2 text-[var(--text-primary)] flex items-center justify-between">
              <span>Real-Time Controller</span>
              <span className="text-[9px] px-2 py-0.5 bg-[var(--accent)]/15 text-[var(--accent)] rounded font-mono uppercase tracking-wider">Firestore Sync</span>
            </h3>
            
            <p className="text-[10px] text-[var(--text-secondary)] mb-4 leading-relaxed uppercase font-mono">
              Add real-time events to the live match. All users will see the update in real-time.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                id="btn-trigger-goal-arg"
                aria-label="Trigger Argentina Goal"
                onClick={() => triggerFirestoreEvent('goal', 'ARG', 'L. Messi', 'Goal!')}
                className="py-2.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-1"
              >
                <span className="text-xs">⚽</span>
                Goal Argentina
              </button>
              
              <button
                id="btn-trigger-goal-esp"
                aria-label="Trigger Spain Goal"
                onClick={() => triggerFirestoreEvent('goal', 'ESP', 'L. Yamal', 'Goal!')}
                className="py-2.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-1"
              >
                <span className="text-xs">⚽</span>
                Goal Spain
              </button>

              <button
                id="btn-trigger-yellow-card"
                aria-label="Trigger Yellow Card"
                onClick={() => triggerFirestoreEvent('yellow_card', 'ESP', 'Rodri', 'Tactical foul')}
                className="py-2.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-1"
              >
                <span className="text-xs">🟨</span>
                Yellow Card
              </button>

              <button
                id="btn-trigger-substitution"
                aria-label="Trigger Substitution"
                onClick={() => triggerFirestoreEvent('substitution', 'ARG', 'L. Martinez', 'In for J. Alvarez')}
                className="py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-1"
              >
                <span className="text-xs">🔄</span>
                Substitution
              </button>
            </div>

            <button
              id="btn-reset-match"
              aria-label="Reset Match Events"
              onClick={resetFirestoreMatch}
              className="w-full py-2.5 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-red-500/30 text-[var(--text-secondary)] hover:text-red-400 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              🔄 Reset Match to 1 - 1
            </button>
          </div>
        )}

        <div id="card-match-history" className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-6 relative overflow-hidden">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4 border-b border-[var(--border-color)] pb-2 text-[var(--text-primary)]">Match History</h3>
          <div className="space-y-4">
            {[
              { id: 'm1', date: 'Jul 12, 2026', match: 'FRA vs ESP', score: '1 - 2', result: 'L' },
              { id: 'm2', date: 'Jul 10, 2026', match: 'ARG vs ENG', score: '2 - 0', result: 'W' },
              { id: 'm3', date: 'Jul 04, 2026', match: 'BRA vs ESP', score: '0 - 1', result: 'L' }
            ].map(history => (
              <div key={history.id} className="flex justify-between items-center bg-[var(--bg-tertiary)] p-3 rounded-xl border border-[var(--border-color)]">
                <div>
                  <p className="text-[10px] text-[var(--text-secondary)] font-mono uppercase">{history.date}</p>
                  <p className="text-sm font-bold text-[var(--text-primary)]">{history.match}</p>
                  <p className="text-xs font-bold mt-1">
                    Score: <span className={history.result === 'W' ? 'text-green-500' : 'text-red-500'}>{history.score}</span>
                  </p>
                </div>
                <button 
                  id={`btn-history-ticket-${history.id}`}
                  aria-label={`View Ticket for ${history.match}`}
                  className="px-3 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--accent)] text-[var(--text-primary)] rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
                >
                  Ticket <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button 
          id="btn-launch-hub"
          aria-label="Launch Stadium Hub"
          onClick={() => navigate('WarmMode', 'push')}
          className="w-full py-3 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          Launch Stadium Hub <ArrowRight className="w-4 h-4" />
        </button>

        {user ? (
          <button 
            id="btn-logout"
            aria-label="Log Out"
            onClick={logout}
            className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            Log Out <LogOut className="w-4 h-4" />
          </button>
        ) : (
          <button 
            id="btn-signin"
            aria-label="Sign in with Google"
            onClick={login}
            className="w-full py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-[var(--accent)]/30 transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            Sign in with Google <LogIn className="w-4 h-4" />
          </button>
        )}
      </main>

      <BottomNav currentScreen="UserProfile" navigate={navigate} />
    </div>
  );
}

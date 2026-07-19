import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, Sun, Menu, MapPin, Navigation, Coffee, ListOrdered } from 'lucide-react';
import { Screen, TransitionType } from '../types';
import { BottomNav } from './BottomNav';

interface WarmModeProps {
  navigate: (screen: Screen, transition: TransitionType) => void;
  toggleTheme: () => void;
  isLightMode: boolean;
  showToast: (title: string, message: string, type?: 'success' | 'info' | 'alert') => void;
}

export function WarmMode({ navigate, toggleTheme, isLightMode, showToast }: WarmModeProps) {
  const [activeGate, setActiveGate] = useState('C');
  
  return (
    <div className="flex flex-col h-full w-full bg-[var(--bg-primary)] transition-colors duration-300">
      <header className="flex items-center justify-between px-6 py-6 z-10 shrink-0">
        <h1 className="text-lg font-bold uppercase tracking-tight text-[var(--text-primary)]">Overview</h1>
        <div className="flex items-center space-x-3">
          <button 
            id="btn-toggle-theme"
            aria-label="Toggle Color Theme"
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full text-[var(--text-primary)] cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            {isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          <button 
            id="btn-menu"
            aria-label="View concessions menu"
            onClick={() => navigate('FoodMenu', 'push')}
            className="w-10 h-10 flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full text-[var(--text-primary)] cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 z-10 space-y-6 overflow-y-auto pb-6">
        <div id="alert-high-traffic" className="bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-2xl p-4 flex items-start space-x-3">
          <div className="p-2 bg-[var(--accent)] rounded-full text-white shrink-0 mt-0.5">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--accent)]">High Traffic Alert</h4>
            <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
              Lusail Stadium West Concourse is experiencing heavy congestion. Use East corridors for faster routing.
            </p>
          </div>
        </div>

        <div id="card-heatmap-map" className="w-full aspect-[4/3] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl relative overflow-hidden flex items-center justify-center group">
          <div className="absolute inset-0 bg-orange-500/5"></div>
          
          <div className="relative w-[65%] h-[65%] border-2 border-[var(--border-color)] rounded-[60px] flex items-center justify-center">
            {/* Heatmap Overlay */}
            <div className="absolute inset-0 overflow-hidden rounded-[60px] pointer-events-none">
              <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-40 mix-blend-hard-light dark:mix-blend-screen">
                <div className="bg-red-500 blur-[20px] rounded-full scale-150 origin-top-left animate-pulse"></div>
                <div className="bg-yellow-500 blur-[20px] rounded-full scale-150 origin-top-right"></div>
                <div className="bg-green-500 blur-[20px] rounded-full scale-150 origin-bottom-left"></div>
                <div className="bg-orange-500 blur-[20px] rounded-full scale-150 origin-bottom-right"></div>
              </div>
            </div>

            {/* Gate Markers */}
            <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[var(--bg-primary)] border rounded text-[8px] font-bold whitespace-nowrap ${activeGate === 'A' ? 'border-[var(--accent)] text-[var(--accent)] shadow-[0_0_10px_var(--accent)]' : 'border-[var(--border-color)] text-[var(--text-secondary)]'}`}>GATE A</div>
            <div className={`absolute top-1/2 -right-6 -translate-y-1/2 px-2 py-0.5 bg-[var(--bg-primary)] border rounded text-[8px] font-bold whitespace-nowrap origin-center rotate-90 ${activeGate === 'B' ? 'border-[var(--accent)] text-[var(--accent)] shadow-[0_0_10px_var(--accent)]' : 'border-[var(--border-color)] text-[var(--text-secondary)]'}`}>GATE B</div>
            <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[var(--bg-primary)] border rounded text-[8px] font-bold whitespace-nowrap ${activeGate === 'C' ? 'border-[var(--accent)] text-[var(--accent)] shadow-[0_0_10px_var(--accent)]' : 'border-[var(--border-color)] text-[var(--text-secondary)]'}`}>GATE C</div>
            <div className={`absolute top-1/2 -left-6 -translate-y-1/2 px-2 py-0.5 bg-[var(--bg-primary)] border rounded text-[8px] font-bold whitespace-nowrap origin-center -rotate-90 ${activeGate === 'D' ? 'border-[var(--accent)] text-[var(--accent)] shadow-[0_0_10px_var(--accent)]' : 'border-[var(--border-color)] text-[var(--text-secondary)]'}`}>GATE D</div>

            <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-orange-500 rounded-full shadow-[0_0_10px_#f97316]"></div>
            <div className={`absolute w-3 h-3 bg-[var(--accent)] rounded-full shadow-[0_0_10px_var(--accent)] animate-pulse transition-all duration-700 ${activeGate === 'A' ? 'top-1/4 right-1/4' : activeGate === 'B' ? 'top-3/4 right-1/4' : activeGate === 'C' ? 'bottom-1/3 right-1/4' : 'top-3/4 left-1/4'}`}></div>
            <div className="w-1/2 h-1/2 border border-[var(--border-color)] border-dashed rounded-[30px]"></div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeGate}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-x-4 bottom-4 bg-[var(--bg-primary)]/90 backdrop-blur-md border border-[var(--border-color)] rounded-2xl p-3 shadow-xl z-20"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-full bg-[var(--accent)]/20 flex items-center justify-center">
                  <Navigation className="w-3 h-3 text-[var(--accent)]" />
                </div>
                <span className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-wider">Route to Gate {activeGate}</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-[var(--text-secondary)] mt-1.5 shrink-0"></div>
                  <p className="text-[10px] text-[var(--text-secondary)] leading-tight">Head straight towards Concourse {activeGate === 'A' ? 'North' : activeGate === 'B' ? 'East' : activeGate === 'C' ? 'South' : 'West'}</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-[var(--text-secondary)] mt-1.5 shrink-0"></div>
                  <p className="text-[10px] text-[var(--text-secondary)] leading-tight">Turn {['A', 'C'].includes(activeGate) ? 'right' : 'left'} at section 105</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-[var(--accent)] mt-1.5 shrink-0"></div>
                  <p className="text-[10px] text-[var(--accent)] font-medium leading-tight">Proceed 50m to destination</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider pl-1">Stadium Gates & Routing</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'A', name: 'Gate A (North)' },
              { id: 'B', name: 'Gate B (East)' },
              { id: 'C', name: 'Gate C (South)' },
              { id: 'D', name: 'Gate D (West)' }
            ].map(gate => {
              const isActive = gate.id === activeGate;
              return (
                <button 
                  key={gate.id}
                  id={`btn-gate-${gate.id}`}
                  aria-label={`Route to ${gate.name}`}
                  onClick={() => {
                    setActiveGate(gate.id);
                    showToast('Route Updated', `Routing you to ${gate.name}`, 'info');
                  }}
                  className={`py-3 px-4 bg-[var(--bg-secondary)] border rounded-xl text-[9px] font-bold uppercase tracking-widest transition-transform active:scale-95 flex items-center justify-between cursor-pointer ${isActive ? 'border-[var(--accent)] shadow-lg shadow-[var(--accent)]/20 text-white' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'}`}
                >
                  <span>{gate.name}</span>
                  {isActive && <Navigation className="w-3 h-3 text-[var(--accent)]" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            id="btn-warm-express-food"
            aria-label="View express food concessions"
            onClick={() => navigate('FoodMenu', 'push')}
            className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl flex flex-col items-center justify-center text-center hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
          >
            <Coffee className="w-6 h-6 mb-2 text-[var(--text-secondary)]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-primary)]">Express Food</span>
          </button>
          <button 
            id="btn-warm-order-tracker"
            aria-label="View active order tracker"
            onClick={() => navigate('OrderHistory', 'push')}
            className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl flex flex-col items-center justify-center text-center hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
          >
            <ListOrdered className="w-6 h-6 mb-2 text-[var(--text-secondary)]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-primary)]">Order Tracker</span>
          </button>
        </div>
      </main>

      <BottomNav currentScreen="WarmMode" navigate={navigate} />
    </div>
  );
}

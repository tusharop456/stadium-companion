import React from 'react';
import { Map, ListOrdered, Coffee, User } from 'lucide-react';
import { Screen, TransitionType } from '../types';

interface BottomNavProps {
  currentScreen: Screen;
  navigate: (s: Screen, t: TransitionType) => void;
}

export const BottomNav = React.memo(function BottomNav({ currentScreen, navigate }: BottomNavProps) {
  let activeTab = 'stadium';
  if (currentScreen === 'FoodMenu') activeTab = 'fastfood';
  if (currentScreen === 'UserProfile') activeTab = 'profile';
  if (currentScreen === 'OrderHistory') activeTab = 'orders';

  return (
    <nav id="bottom-nav" aria-label="Main Navigation" className="px-6 pb-6 pt-2 z-20 bg-gradient-to-t from-[var(--bg-primary)] to-transparent shrink-0">
      <div id="bottom-nav-container" className="bg-[var(--bg-secondary)] backdrop-blur-xl border border-[var(--border-color)] rounded-2xl p-2 flex items-center justify-around shadow-lg">
        <button 
          id="btn-nav-stadium"
          aria-label="Stadium Hub"
          onClick={() => navigate('WarmMode', 'none')}
          className={`flex-1 flex flex-col items-center py-2 transition-colors cursor-pointer ${activeTab === 'stadium' ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
        >
          <Map className="w-5 h-5" />
          <span className="text-[9px] mt-1 font-bold uppercase tracking-tighter">Stadium</span>
        </button>
        <button 
          id="btn-nav-orders"
          aria-label="Order History"
          onClick={() => navigate('OrderHistory', 'none')}
          className={`flex-1 flex flex-col items-center py-2 transition-colors cursor-pointer ${activeTab === 'orders' ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
        >
          <ListOrdered className="w-5 h-5" />
          <span className="text-[9px] mt-1 font-bold uppercase tracking-tighter">Orders</span>
        </button>
        <button 
          id="btn-nav-fastfood"
          aria-label="Concessions Menu"
          onClick={() => navigate('FoodMenu', 'none')}
          className={`flex-1 flex flex-col items-center py-2 transition-colors cursor-pointer ${activeTab === 'fastfood' ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
        >
          <Coffee className="w-5 h-5" />
          <span className="text-[9px] mt-1 font-bold uppercase tracking-tighter">Fastfood</span>
        </button>
        <button 
          id="btn-nav-profile"
          aria-label="Fan Profile"
          onClick={() => navigate('UserProfile', 'none')}
          className={`flex-1 flex flex-col items-center py-2 transition-colors cursor-pointer ${activeTab === 'profile' ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
        >
          <User className="w-5 h-5" />
          <span className="text-[9px] mt-1 font-bold uppercase tracking-tighter">Profile</span>
        </button>
      </div>
    </nav>
  );
});

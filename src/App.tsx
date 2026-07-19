import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, WifiOff } from 'lucide-react';

// Firebase Setup
import { auth, db } from './lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc, collection, query, where } from 'firebase/firestore';

// Types & Utils
import { Screen, TransitionType, Match, Order, Highlight, UserSeat } from './types';
import { getMatchScore, getEtaMinutes, getArrivalTime, CONCESSION_ITEMS } from './utils';

// Re-exports for unit test compatibility
export { getMatchScore, getEtaMinutes, getArrivalTime, CONCESSION_ITEMS } from './utils';
export type { Match, Highlight, Order, Screen, TransitionType } from './types';

// Modular Components
import { CinematicMode } from './components/CinematicMode';
import { UserProfile } from './components/UserProfile';
import { WarmMode } from './components/WarmMode';
import { FoodMenu } from './components/FoodMenu';
import { OrderHistory } from './components/OrderHistory';
import { MatchesList } from './components/MatchesList';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('CinematicMode');
  const [direction, setDirection] = useState<number>(0);
  const [isLightMode, setIsLightMode] = useState<boolean>(false);
  const [userSeat, setUserSeat] = useState<UserSeat>({ block: 104, row: 'G', seat: 12 });
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [goalCelebrationEnabled, setGoalCelebrationEnabled] = useState<boolean>(false);
  const [goalPulse, setGoalPulse] = useState<string | null>(null); // Team color hex or null
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [loginAttempts, setLoginAttempts] = useState<number>(0);
  const [authDomainError, setAuthDomainError] = useState<boolean>(false);

  const [matches] = useState<Match[]>([
    { 
      id: '1', 
      stage: 'FIFA World Cup Final', 
      team1: 'ARG', 
      team2: 'ESP', 
      time: "68'", 
      status: 'live', 
      stats: { possession: [54, 46], shotsOnTarget: [4, 3], corners: [6, 2] },
      highlights: [
        { id: 'h1', time: "12'", type: 'goal', team: 'ARG', player: 'L. Messi', details: 'Penalty' },
        { id: 'h2', time: "34'", type: 'yellow_card', team: 'ESP', player: 'Rodri' },
        { id: 'h3', time: "45+2'", type: 'goal', team: 'ESP', player: 'L. Yamal', details: 'Assist: Pedri' },
        { id: 'h4', time: "65'", type: 'substitution', team: 'ARG', player: 'A. Di Maria', details: 'In for J. Alvarez' }
      ]
    },
    { id: '2', stage: 'Semi-Final', team1: 'FRA', team2: 'ESP', time: "FT", status: 'finished', stats: { possession: [42, 58], shotsOnTarget: [5, 7], corners: [4, 8] } },
    { id: '3', stage: 'Semi-Final', team1: 'ARG', team2: 'ENG', time: "FT", status: 'finished', stats: { possession: [60, 40], shotsOnTarget: [6, 2], corners: [7, 3] } },
    { id: '4', stage: 'Quarter-Final', team1: 'BRA', team2: 'ESP', time: "FT", status: 'finished', stats: { possession: [45, 55], shotsOnTarget: [3, 4], corners: [5, 5] } }
  ]);
  
  const [activeMatchId, setActiveMatchId] = useState<string>('1');
  const [dbMatches, setDbMatches] = useState<Match[]>([]);
  const [autoSimulateEvents, setAutoSimulateEvents] = useState<boolean>(false);

  const currentMatchesList = useMemo(() => {
    return dbMatches.length > 0 ? dbMatches : matches;
  }, [dbMatches, matches]);

  const activeMatch = useMemo(() => {
    return currentMatchesList.find(m => m.id === activeMatchId) || currentMatchesList[0];
  }, [currentMatchesList, activeMatchId]);

  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const activeOrdersRef = useRef<Order[]>([]);
  const orderTimersRef = useRef<{ [orderId: string]: any[] }>({});

  useEffect(() => {
    activeOrdersRef.current = activeOrders;
  }, [activeOrders]);

  const [toast, setToast] = useState<{ title: string; message: string; type: 'success' | 'info' | 'alert' } | null>(null);

  const showToast = useCallback((title: string, message: string, type: 'success' | 'info' | 'alert' = 'info') => {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    if (!auth || !db) {
      setAuthLoading(false);
      return;
    }
    let unsubscribeOrders = () => {};
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
             const data = docSnap.data();
             if (data.isLightMode !== undefined) setIsLightMode(data.isLightMode);
             if (data.goalCelebrationEnabled !== undefined) setGoalCelebrationEnabled(data.goalCelebrationEnabled);
             if (data.userSeat !== undefined) setUserSeat(data.userSeat);
          } else {
             await setDoc(docRef, { isLightMode, goalCelebrationEnabled, name: currentUser.displayName, avatar: currentUser.photoURL, userSeat });
          }

          const q = query(collection(db, 'orders'), where('userId', '==', currentUser.uid));
          unsubscribeOrders = onSnapshot(q, (querySnapshot) => {
             const orders: Order[] = [];
             querySnapshot.forEach((docSnap) => {
                orders.push({ id: docSnap.id, ...docSnap.data() } as Order);
             });
             orders.sort((a, b) => b.timestamp - a.timestamp);
             setActiveOrders(orders);
          });
        } catch (e) {
          console.error("Firebase fetch error", e);
        }
      } else {
        setActiveOrders([]);
        unsubscribeOrders();
      }
    });
    return () => {
      unsubscribe();
      unsubscribeOrders();
    };
  }, []);

  const login = useCallback(async () => {
     if (loginAttempts >= 3) {
       showToast('Locked', 'Too many attempts. Please wait.', 'alert');
       return;
     }
     if (!auth) {
       showToast('Error', 'Firebase is not configured', 'alert');
       return;
     }
     try {
       const provider = new GoogleAuthProvider();
       await signInWithPopup(auth, provider);
       setLoginAttempts(0);
     } catch (e: any) {
       setLoginAttempts(prev => prev + 1);
       if (e?.code === 'auth/api-key-not-valid') {
         showToast('Configuration Error', 'The Firebase API key is invalid.', 'alert');
       } else if (e?.code === 'auth/unauthorized-domain') {
         setAuthDomainError(true);
         showToast('Domain Unauthorized', 'This domain is not authorized in Firebase Console.', 'alert');
       } else {
         console.error(e);
         showToast('Error', 'Failed to login', 'alert');
       }
     }
  }, [loginAttempts, showToast]);

  const logout = useCallback(async () => {
     if (!auth) return;
     await signOut(auth);
  }, []);

  const triggerGoal = useCallback((team: string, color: string) => {
    showToast('GOAL!', `${team} has scored!`, 'success');
    if (goalCelebrationEnabled) {
      setGoalPulse(color);
      setTimeout(() => setGoalPulse(null), 3000);
    }
  }, [goalCelebrationEnabled, showToast]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isLightMode) {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [isLightMode]);
  
  // Load/sync matches from firestore in real-time
  useEffect(() => {
    if (!db) return;

    const unsubscribe = onSnapshot(collection(db, 'matches'), async (snapshot) => {
      if (snapshot.empty) {
        // Seed matches in database
        const initialMatches = [
          { 
            id: '1', 
            stage: 'FIFA World Cup Final', 
            team1: 'ARG', 
            team2: 'ESP', 
            time: "68'", 
            status: 'live', 
            stats: { possession: [54, 46], shotsOnTarget: [4, 3], corners: [6, 2] },
            highlights: [
              { id: 'h1', time: "12'", type: 'goal', team: 'ARG', player: 'L. Messi', details: 'Penalty' },
              { id: 'h2', time: "34'", type: 'yellow_card', team: 'ESP', player: 'Rodri' },
              { id: 'h3', time: "45+2'", type: 'goal', team: 'ESP', player: 'L. Yamal', details: 'Assist: Pedri' },
              { id: 'h4', time: "65'", type: 'substitution', team: 'ARG', player: 'A. Di Maria', details: 'In for J. Alvarez' }
            ]
          },
          { id: '2', stage: 'Semi-Final', team1: 'FRA', team2: 'ESP', time: "FT", status: 'finished', stats: { possession: [42, 58], shotsOnTarget: [5, 7], corners: [4, 8] }, highlights: [] },
          { id: '3', stage: 'Semi-Final', team1: 'ARG', team2: 'ENG', time: "FT", status: 'finished', stats: { possession: [60, 40], shotsOnTarget: [6, 2], corners: [7, 3] }, highlights: [] },
          { id: '4', stage: 'Quarter-Final', team1: 'BRA', team2: 'ESP', time: "FT", status: 'finished', stats: { possession: [45, 55], shotsOnTarget: [3, 4], corners: [5, 5] }, highlights: [] }
        ];
        
        for (const m of initialMatches) {
          try {
            await setDoc(doc(db, 'matches', m.id), m);
          } catch (err) {
            console.error("Error seeding match doc:", err);
          }
        }
      } else {
        const list: Match[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Match);
        });
        list.sort((a, b) => a.id.localeCompare(b.id));
        setDbMatches(list);
      }
    });

    return () => unsubscribe();
  }, [db]);

  // Handle Real-Time Highlight Alerts
  const prevHighlightsRef = useRef<Highlight[]>([]);
  useEffect(() => {
    if (!activeMatch) return;
    const curr = activeMatch.highlights || [];
    const prev = prevHighlightsRef.current;

    if (activeMatch.status === 'live' && prev.length > 0 && curr.length > prev.length) {
      // Find newly added highlights (by ID)
      const prevIds = new Set(prev.map(h => h.id));
      const newHighlights = curr.filter(h => !prevIds.has(h.id));

      newHighlights.forEach(h => {
        if (h.type === 'goal') {
          const color = h.team === 'ARG' ? '#3b82f6' : '#ef4444';
          triggerGoal(h.team, color);
        } else if (h.type === 'yellow_card') {
          showToast('YELLOW CARD', `Yellow Card for ${h.team} (${h.player})`, 'info');
        } else if (h.type === 'red_card') {
          showToast('RED CARD', `RED CARD for ${h.team}! (${h.player})`, 'alert');
        } else if (h.type === 'substitution') {
          showToast('SUBSTITUTION', `${h.team}: ${h.player} (${h.details})`, 'info');
        }
      });
    }

    prevHighlightsRef.current = curr;
  }, [activeMatch?.highlights, activeMatch?.id, triggerGoal, showToast]);

  const triggerFirestoreEvent = useCallback(async (type: 'goal' | 'yellow_card' | 'red_card' | 'substitution', team: string, player: string, details: string) => {
    if (!activeMatch) return;
    
    const eventId = `h-${Date.now()}`;
    let currentTimeVal = parseInt(activeMatch.time);
    if (isNaN(currentTimeVal)) currentTimeVal = 68;
    const newTime = `${Math.min(90, currentTimeVal + Math.floor(Math.random() * 2) + 1)}'`;
    
    const newHighlight: Highlight = {
      id: eventId,
      time: newTime,
      type,
      team,
      player,
      details
    };

    if (db) {
      try {
        const matchRef = doc(db, 'matches', activeMatch.id);
        const updatedHighlights = [...(activeMatch.highlights || []), newHighlight];
        
        const possession = activeMatch.stats.possession;
        const shotsOnTarget = [...activeMatch.stats.shotsOnTarget] as [number, number];
        const corners = [...activeMatch.stats.corners] as [number, number];
        
        if (type === 'goal') {
          if (team === 'ARG') {
            shotsOnTarget[0] += 1;
          } else {
            shotsOnTarget[1] += 1;
          }
        }

        await updateDoc(matchRef, {
          time: newTime,
          highlights: updatedHighlights,
          stats: {
            possession,
            shotsOnTarget,
            corners
          }
        });
      } catch (e) {
        console.error("Error triggering event", e);
        showToast('Error', 'Failed to save event to database', 'alert');
      }
    } else {
      // Fallback
      showToast('Action Taken', 'Real-time action completed locally (Offline).', 'success');
    }
  }, [activeMatch, showToast]);

  // Optional background event auto-simulator
  useEffect(() => {
    if (activeMatch.status !== 'live' || !autoSimulateEvents) return;

    let timeoutId: any;
    
    const simulateEvent = async () => {
      const events = [
        { type: 'goal', team: 'ARG', player: 'L. Messi', details: 'A spectacular shot!' },
        { type: 'goal', team: 'ESP', player: 'L. Yamal', details: 'Smashed into top corner!' },
        { type: 'yellow_card', team: 'ESP', player: 'N. Williams', details: 'Late tackle' },
        { type: 'substitution', team: 'ARG', player: 'L. Martinez', details: 'In for J. Alvarez' }
      ];
      
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      await triggerFirestoreEvent(
        randomEvent.type as any,
        randomEvent.team,
        randomEvent.player,
        randomEvent.details
      );

      timeoutId = setTimeout(simulateEvent, Math.random() * 20000 + 25000);
    };

    timeoutId = setTimeout(simulateEvent, 25000);

    return () => clearTimeout(timeoutId);
  }, [activeMatch?.id, activeMatch?.time, autoSimulateEvents, triggerFirestoreEvent]);

  const resetFirestoreMatch = useCallback(async () => {
    if (!activeMatch) return;
    
    const resetMatchData: Match = {
      id: '1', 
      stage: 'FIFA World Cup Final', 
      team1: 'ARG', 
      team2: 'ESP', 
      time: "68'", 
      status: 'live', 
      stats: { possession: [54, 46], shotsOnTarget: [4, 3], corners: [6, 2] },
      highlights: [
        { id: 'h1', time: "12'", type: 'goal', team: 'ARG', player: 'L. Messi', details: 'Penalty' },
        { id: 'h2', time: "34'", type: 'yellow_card', team: 'ESP', player: 'Rodri' },
        { id: 'h3', time: "45+2'", type: 'goal', team: 'ESP', player: 'L. Yamal', details: 'Assist: Pedri' },
        { id: 'h4', time: "65'", type: 'substitution', team: 'ARG', player: 'A. Di Maria', details: 'In for J. Alvarez' }
      ]
    };

    if (db) {
      try {
        await setDoc(doc(db, 'matches', activeMatch.id), resetMatchData);
        showToast('Match Reset', 'Successfully reset live match in database.', 'success');
      } catch (e) {
        console.error("Error resetting match", e);
        showToast('Error', 'Failed to reset match', 'alert');
      }
    } else {
      showToast('Match Reset', 'Match reset locally (Offline)', 'success');
    }
  }, [activeMatch, showToast]);

  const placeOrder = useCallback(async (items: {name: string, quantity: number}[]) => {
    const orderId = `FIFA-${Math.floor(Math.random() * 9000) + 1000}`;
    const newOrder: Order = {
      id: orderId,
      items,
      status: 'confirmed',
      timestamp: Date.now()
    };
    
    if (user && db) {
      try {
        await setDoc(doc(db, 'orders', orderId), { ...newOrder, userId: user.uid });
      } catch (e) {
        console.error("Error saving order", e);
      }
    } else {
      setActiveOrders(prev => [newOrder, ...prev]);
    }
    
    showToast('Order Received', `Order #${orderId} has been confirmed.`, 'success');

    // Simulate order progression
    const t1 = setTimeout(async () => {
      if (user && db) {
         try {
           const docRef = doc(db, 'orders', orderId);
           const docSnap = await getDoc(docRef);
           if (docSnap.exists() && (docSnap.data().status === 'cancelled' || docSnap.data().locked)) return;
           await updateDoc(docRef, { status: 'preparing' });
           showToast('Order Update', `Order #${orderId} is now being prepared.`, 'info');
         } catch(e){}
      } else {
         const currentOrder = activeOrdersRef.current.find(o => o.id === orderId);
         if (currentOrder && (currentOrder.status === 'cancelled' || currentOrder.locked)) return;
         setActiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'preparing' } : o));
         showToast('Order Update', `Order #${orderId} is now being prepared.`, 'info');
      }
    }, 5000);

    const t2 = setTimeout(async () => {
      if (user && db) {
         try {
           const docRef = doc(db, 'orders', orderId);
           const docSnap = await getDoc(docRef);
           if (docSnap.exists() && (docSnap.data().status === 'cancelled' || docSnap.data().locked)) return;
           await updateDoc(docRef, { status: 'delivering' });
           showToast('Out for Delivery', `Order #${orderId} is en route to your seat!`, 'info');
         } catch(e){}
      } else {
         const currentOrder = activeOrdersRef.current.find(o => o.id === orderId);
         if (currentOrder && (currentOrder.status === 'cancelled' || currentOrder.locked)) return;
         setActiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'delivering' } : o));
         showToast('Out for Delivery', `Order #${orderId} is en route to your seat!`, 'info');
      }
    }, 10000);

    const t3 = setTimeout(async () => {
      if (user && db) {
         try {
           const docRef = doc(db, 'orders', orderId);
           const docSnap = await getDoc(docRef);
           if (docSnap.exists() && (docSnap.data().status === 'cancelled' || docSnap.data().locked)) return;
           await updateDoc(docRef, { status: 'delivered' });
           showToast('Delivered', `Order #${orderId} has been delivered!`, 'success');
         } catch(e){}
      } else {
         const currentOrder = activeOrdersRef.current.find(o => o.id === orderId);
         if (currentOrder && (currentOrder.status === 'cancelled' || currentOrder.locked)) return;
         setActiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'delivered' } : o));
         showToast('Delivered', `Order #${orderId} has been delivered!`, 'success');
      }
      delete orderTimersRef.current[orderId];
    }, 15000);

    orderTimersRef.current[orderId] = [t1, t2, t3];
  }, [user, showToast]);

  const cancelOrder = useCallback(async (orderId: string) => {
    if (orderTimersRef.current[orderId]) {
      orderTimersRef.current[orderId].forEach(clearTimeout);
      delete orderTimersRef.current[orderId];
    }

    if (user && db) {
      try { await updateDoc(doc(db, 'orders', orderId), { status: 'cancelled', locked: true }); } catch(e){}
    } else {
      setActiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled', locked: true } : o));
    }
    showToast('Order Cancelled', `Order #${orderId} cancelled. Refund initiated.`, 'alert');
  }, [user, showToast]);

  const updateOrder = useCallback(async (orderId: string, newItems: any[]) => {
    if (user && db) {
      try { await updateDoc(doc(db, 'orders', orderId), { items: newItems }); } catch(e){}
    } else {
      setActiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, items: newItems } : o));
    }
    showToast('Order Updated', `Order #${orderId} has been modified.`, 'success');
  }, [user, showToast]);

  const rateOrder = useCallback(async (orderId: string, rating: number) => {
    if (user && db) {
      try { await updateDoc(doc(db, 'orders', orderId), { rating }); } catch(e){}
    } else {
      setActiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, rating } : o));
    }
    showToast('Thanks for your feedback!', `You rated order #${orderId} with ${rating} stars.`, 'success');
  }, [user, showToast]);

  const navigate = useCallback((screen: Screen, transition: TransitionType) => {
    if (transition === 'push') setDirection(1);
    else if (transition === 'push_back') setDirection(-1);
    else setDirection(0);
    setCurrentScreen(screen);
  }, []);

  const variants = useMemo(() => ({
    initial: (dir: number) => ({
      x: dir === 1 ? '100%' : dir === -1 ? '-100%' : 0,
      opacity: dir === 0 ? 0 : 1
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: { type: 'tween', duration: 0.3, ease: 'easeOut' }
    },
    exit: (dir: number) => ({
      x: dir === 1 ? '-100%' : dir === -1 ? '100%' : 0,
      opacity: dir === 0 ? 0 : 1,
      transition: { type: 'tween', duration: 0.3, ease: 'easeIn' }
    })
  }), []);

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black font-sans antialiased overflow-hidden">
        <div className="relative w-full h-full max-w-[420px] max-h-[850px] md:h-[90vh] md:rounded-[3rem] md:border-[8px] border-neutral-900 bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center">
          <div className="text-white text-xs font-bold uppercase tracking-widest animate-pulse">Initializing...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black font-sans antialiased overflow-hidden">
        <div className="relative w-full h-full max-w-[420px] max-h-[850px] md:h-[90vh] md:rounded-[3rem] md:border-[8px] border-neutral-900 bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden flex flex-col justify-center px-8 text-center shadow-2xl shadow-black">
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Stadium Hub</h1>
          <p className="text-xs text-[var(--text-secondary)] font-mono uppercase mb-12">Connect your Fan ID</p>
          
          <button 
            onClick={login}
            disabled={loginAttempts >= 3}
            className="w-full py-4 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-[var(--accent)]/30 transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sign in with Google
          </button>
          
          {loginAttempts > 0 && (
            <p className="mt-4 text-xs text-red-500 font-bold uppercase tracking-widest">
              {loginAttempts >= 3 ? 'Account Locked' : `${3 - loginAttempts} attempts remaining`}
            </p>
          )}

          {authDomainError && (
            <div className="mt-6 p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-left text-xs text-red-200 overflow-y-auto max-h-[220px]">
              <p className="font-bold text-red-400 mb-2 uppercase tracking-wide">Domain Authorization Required</p>
              <p className="mb-2 leading-relaxed text-[11px]">This application's domain is not authorized in your Firebase Project.</p>
              <p className="font-semibold text-[var(--text-secondary)] mb-1 text-[11px]">Please add this domain to your authorized list in Firebase Console:</p>
              <div className="font-mono text-[10px] text-red-300 bg-black/40 p-2 rounded-lg border border-red-500/15 select-all break-all mb-3 font-bold">
                {window.location.hostname}
              </div>
              <p className="text-[10px] text-red-400 leading-relaxed">
                <strong>Steps:</strong> Go to <strong>Firebase Console</strong> &rarr; <strong>Authentication</strong> &rarr; <strong>Settings</strong> &rarr; <strong>Authorized domains</strong> &rarr; <strong>Add domain</strong> and paste the domain above.
              </p>
            </div>
          )}

          {/* Toast Notification */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-6 left-4 right-4 z-50 pointer-events-none text-left"
              >
                <div className="bg-[var(--bg-secondary)] backdrop-blur-xl border border-[var(--border-color)] rounded-2xl p-4 shadow-2xl flex items-start gap-4">
                  <div className={`mt-0.5 p-2 rounded-full flex-shrink-0 ${toast.type === 'success' ? 'bg-green-500/20 text-green-500' : toast.type === 'alert' ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-500'}`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">{toast.title}</h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">{toast.message}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-black font-sans antialiased overflow-hidden">
      <div className="relative w-full h-full max-w-[420px] max-h-[850px] md:h-[90vh] md:rounded-[3rem] md:border-[8px] border-neutral-900 bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden flex flex-col shadow-2xl shadow-black">
        <AnimatePresence>
          {goalPulse && (
            <motion.div
              initial={{ opacity: 0, scale: 1 }}
              animate={{ opacity: [0, 0.4, 0], scale: [1, 1.1, 1] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, repeat: 1, ease: 'easeInOut' }}
              className="absolute inset-0 z-0 pointer-events-none"
              style={{ background: `radial-gradient(circle at center, ${goalPulse}, transparent 80%)` }}
            />
          )}
        </AnimatePresence>
        <div className="absolute top-[-10%] left-[-20%] w-[300px] h-[300px] bg-orange-600/20 rounded-full blur-[80px] pointer-events-none z-0"></div>
        <div className="absolute bottom-[-10%] right-[-20%] w-[350px] h-[350px] bg-[var(--accent)] opacity-10 rounded-full blur-[100px] pointer-events-none z-0"></div>

        {!isOnline && (
          <div className="absolute top-0 left-0 right-0 z-50 flex justify-center mt-4 pointer-events-none transition-opacity">
            <div className="bg-[var(--bg-secondary)] backdrop-blur-md border border-red-500/50 text-red-500 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg shadow-red-500/10">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              <span className="text-[10px] font-bold uppercase tracking-widest">Offline</span>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-6 left-4 right-4 z-50 pointer-events-none"
            >
              <div className="bg-[var(--bg-secondary)] backdrop-blur-xl border border-[var(--border-color)] rounded-2xl p-4 shadow-2xl flex items-start gap-4">
                <div className={`mt-0.5 p-2 rounded-full flex-shrink-0 ${toast.type === 'success' ? 'bg-green-500/20 text-green-500' : toast.type === 'alert' ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-500'}`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">{toast.title}</h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{toast.message}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 relative overflow-hidden z-10">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentScreen}
              custom={direction}
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute inset-0 flex flex-col w-full h-full"
            >
              {currentScreen === 'CinematicMode' && <CinematicMode navigate={navigate} activeMatch={activeMatch} userSeat={userSeat} />}
              {currentScreen === 'UserProfile' && <UserProfile navigate={navigate} activeMatch={activeMatch} userSeat={userSeat} goalCelebrationEnabled={goalCelebrationEnabled} setGoalCelebrationEnabled={(val: boolean) => {
                setGoalCelebrationEnabled(val);
                if (user && db) {
                  updateDoc(doc(db, 'users', user.uid), { goalCelebrationEnabled: val }).catch(console.error);
                }
              }} triggerGoal={triggerGoal} user={user} login={login} logout={logout} autoSimulateEvents={autoSimulateEvents} setAutoSimulateEvents={setAutoSimulateEvents} triggerFirestoreEvent={triggerFirestoreEvent} resetFirestoreMatch={resetFirestoreMatch} />}
              {currentScreen === 'WarmMode' && <WarmMode navigate={navigate} isLightMode={isLightMode} toggleTheme={() => {
                const updatedVal = !isLightMode;
                setIsLightMode(updatedVal);
                if (user && db) {
                  updateDoc(doc(db, 'users', user.uid), { isLightMode: updatedVal }).catch(console.error);
                }
              }} showToast={showToast} />}
              {currentScreen === 'FoodMenu' && <FoodMenu navigate={navigate} placeOrder={placeOrder} isOnline={isOnline} userSeat={userSeat} />}
              {currentScreen === 'OrderHistory' && <OrderHistory navigate={navigate} activeOrders={activeOrders} userSeat={userSeat} placeOrder={placeOrder} cancelOrder={cancelOrder} updateOrder={updateOrder} rateOrder={rateOrder} />}
              {currentScreen === 'MatchesList' && <MatchesList navigate={navigate} matches={currentMatchesList} activeMatch={activeMatch} selectMatch={(m: Match) => setActiveMatchId(m.id)} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

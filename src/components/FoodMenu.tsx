import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { Screen, TransitionType, UserSeat, ConcessionItem } from '../types';
import { CONCESSION_ITEMS } from '../utils';
import { BottomNav } from './BottomNav';

interface FoodMenuProps {
  navigate: (screen: Screen, transition: TransitionType) => void;
  placeOrder: (items: { name: string; quantity: number }[]) => void;
  isOnline: boolean;
  userSeat: UserSeat;
}

export function FoodMenu({ navigate, placeOrder, isOnline, userSeat }: FoodMenuProps) {
  const items = CONCESSION_ITEMS;

  const [checkoutItem, setCheckoutItem] = useState<ConcessionItem | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<number>(1);
  const [seatInput, setSeatInput] = useState(`Block ${userSeat.block}, Row ${userSeat.row}, Seat ${userSeat.seat}`);
  
  const [scanFailed, setScanFailed] = useState(false);
  const holdTimer = useRef<any>(null);
  const isHolding = useRef(false);

  const handleScanStart = () => {
    isHolding.current = true;
    holdTimer.current = setTimeout(() => {
      if (isHolding.current) {
        setCheckoutStep(4);
      }
    }, 800);
  };

  const handleScanEnd = () => {
    isHolding.current = false;
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
    }
  };

  const handleScanClick = () => {
    if (checkoutStep === 3) {
      setScanFailed(true);
      setTimeout(() => {
        setScanFailed(false);
      }, 2000);
    }
  };

  const handleOrderClick = (item: ConcessionItem) => {
    setCheckoutItem(item);
    setCheckoutStep(1);
    setSeatInput(`Block ${userSeat.block}, Row ${userSeat.row}, Seat ${userSeat.seat}`);
  };

  const handleConfirmOrder = () => {
    if (!checkoutItem) return;
    placeOrder([{ name: checkoutItem.name, quantity: 1 }]);
    setCheckoutItem(null);
    navigate('OrderHistory', 'push');
  };

  useEffect(() => {
    if (checkoutStep === 4) {
      const timer = setTimeout(() => {
        handleConfirmOrder();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [checkoutStep]);

  useEffect(() => {
    return () => {
      if (holdTimer.current) {
        clearTimeout(holdTimer.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-[var(--bg-primary)]">
      <header className="relative flex items-center px-6 py-10 z-10 shrink-0 overflow-hidden rounded-b-3xl mb-2">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=800&q=80" alt="French Fries Background" className="w-full h-full object-cover opacity-30 mix-blend-luminosity" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/80 to-transparent"></div>
        </div>
        <div className="relative z-10 flex items-center w-full">
          <button 
            id="btn-concessions-back"
            aria-label="Back to Match Hub"
            onClick={() => navigate('CinematicMode', 'push_back')}
            className="w-10 h-10 flex items-center justify-center bg-[var(--bg-secondary)]/80 backdrop-blur border border-[var(--border-color)] rounded-full mr-4 text-[var(--text-primary)] cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-[var(--text-primary)] drop-shadow-md">Concessions</h1>
            <p className="text-[10px] text-[var(--accent)] font-bold uppercase tracking-widest mt-0.5 drop-shadow-md">Delivered to Seat</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 z-10 space-y-4 overflow-y-auto pb-6 relative">
        {items.map(item => (
          <div key={item.id} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl overflow-hidden flex flex-col">
            <div className="p-4 flex gap-4">
              <div className="w-20 h-20 bg-[var(--bg-tertiary)] rounded-xl shrink-0 flex items-center justify-center border border-[var(--border-color)] overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <h3 className="font-bold text-sm text-[var(--text-primary)] leading-tight">{item.name}</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">{item.desc}</p>
                <p className="text-sm font-bold text-[var(--accent)] mt-2">{item.price}</p>
              </div>
            </div>
            <div className="bg-[var(--bg-tertiary)]/50 px-4 py-3 border-t border-[var(--border-color)] flex justify-end">
              <button 
                id={`btn-order-item-${item.id}`}
                aria-label={`Order ${item.name}`}
                disabled={!isOnline}
                onClick={() => handleOrderClick(item)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer shadow-lg ${
                  isOnline 
                    ? 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shadow-[var(--accent)]/20' 
                    : 'bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] shadow-none opacity-50 cursor-not-allowed'
                }`}
              >
                {isOnline ? 'Order Now' : 'Offline'}
              </button>
            </div>
          </div>
        ))}
      </main>

      <BottomNav currentScreen="FoodMenu" navigate={navigate} />

      <AnimatePresence>
        {checkoutItem && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{opacity: 0}} 
              animate={{opacity: 1}} 
              exit={{opacity: 0}} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => setCheckoutItem(null)} 
            />
            <motion.div 
              initial={{scale: 0.9, opacity: 0, y: 20}} 
              animate={{scale: 1, opacity: 1, y: 0}} 
              exit={{scale: 0.9, opacity: 0, y: 20}} 
              className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-6 w-full max-w-sm relative z-10 shadow-2xl flex flex-col"
            >
              {checkoutStep === 1 && (
                <div id="checkout-step-1" className="space-y-4">
                  <h2 className="text-lg font-bold text-[var(--text-primary)] uppercase tracking-tight">Delivery Seat</h2>
                  <p className="text-xs text-[var(--text-secondary)]">Confirm your seat number for delivery.</p>
                  <input 
                    id="input-delivery-seat"
                    aria-label="Delivery Seat Information"
                    type="text"
                    value={seatInput}
                    onChange={(e) => setSeatInput(e.target.value)}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] font-bold outline-none focus:border-[var(--accent)] transition-colors"
                  />
                  <div className="pt-2 flex justify-end gap-2">
                    <button 
                      id="btn-checkout-cancel-1"
                      aria-label="Cancel Checkout"
                      onClick={() => setCheckoutItem(null)} 
                      className="px-4 py-2 rounded-lg text-xs font-bold text-[var(--text-secondary)] uppercase cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      id="btn-checkout-next-1"
                      aria-label="Proceed to Confirmation"
                      onClick={() => setCheckoutStep(2)} 
                      className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-xs font-bold uppercase tracking-wide cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
              {checkoutStep === 2 && (
                <div id="checkout-step-2" className="space-y-4">
                  <h2 className="text-lg font-bold text-[var(--text-primary)] uppercase tracking-tight">Confirm Order</h2>
                  <div className="flex justify-between items-center bg-[var(--bg-tertiary)] p-3 rounded-xl border border-[var(--border-color)]">
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">{checkoutItem.name}</h4>
                      <p className="text-[10px] text-[var(--text-secondary)] font-mono">{seatInput}</p>
                    </div>
                    <p className="text-sm font-bold text-[var(--accent)]">{checkoutItem.price}</p>
                  </div>
                  <div className="pt-2 flex justify-end gap-2">
                    <button 
                      id="btn-checkout-back-2"
                      aria-label="Go Back to Seat Entry"
                      onClick={() => setCheckoutStep(1)} 
                      className="px-4 py-2 rounded-lg text-xs font-bold text-[var(--text-secondary)] uppercase cursor-pointer"
                    >
                      Back
                    </button>
                    <button 
                      id="btn-checkout-pay"
                      aria-label={`Pay ${checkoutItem.price}`}
                      onClick={() => setCheckoutStep(3)} 
                      className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-xs font-bold uppercase tracking-wide cursor-pointer"
                    >
                      Pay {checkoutItem.price}
                    </button>
                  </div>
                </div>
              )}
              {checkoutStep === 3 && (
                <div id="checkout-step-3" className="space-y-4 flex flex-col items-center">
                  <h2 className="text-lg font-bold text-[var(--text-primary)] uppercase tracking-tight">Scan to Pay</h2>
                  <p className="text-xs text-[var(--text-secondary)] text-center h-8">
                    {scanFailed ? (
                      <span className="text-red-500 font-bold">Scan failed. Please hold to scan.</span>
                    ) : (
                      "Simulate scanning by holding the QR code below."
                    )}
                  </p>
                  
                  <div 
                    id="div-payment-qr"
                    aria-label="Simulate scanning by holding down on this QR code"
                    onMouseDown={handleScanStart}
                    onMouseUp={handleScanEnd}
                    onMouseLeave={handleScanEnd}
                    onTouchStart={handleScanStart}
                    onTouchEnd={handleScanEnd}
                    onClick={handleScanClick}
                    className={`w-48 h-48 bg-white p-4 rounded-xl shadow-inner cursor-pointer relative overflow-hidden group border-2 transition-all ${
                      scanFailed ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'border-[var(--bg-tertiary)] hover:border-[var(--accent)]'
                    }`}
                  >
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=pay_${checkoutItem.id}`} alt="Payment QR" className={`w-full h-full object-contain mix-blend-multiply opacity-90 group-hover:opacity-100 ${scanFailed ? 'grayscale' : ''}`} />
                    
                    {/* Scanning laser animation */}
                    <motion.div 
                      animate={{ y: [0, 160, 0] }} 
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className={`absolute top-4 left-4 right-4 h-0.5 shadow-[0_0_8px_var(--accent)] ${scanFailed ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-[var(--accent)]'}`}
                    />
                  </div>
                  
                  <div className="pt-2 flex justify-center w-full">
                    <button 
                      id="btn-checkout-cancel-3"
                      aria-label="Cancel Payment Scan"
                      onClick={() => setCheckoutStep(2)} 
                      className="px-4 py-2 rounded-lg text-xs font-bold text-[var(--text-secondary)] uppercase cursor-pointer"
                    >
                      Cancel Scan
                    </button>
                  </div>
                </div>
              )}
              {checkoutStep === 4 && (
                <div className="space-y-6 py-4 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full border-4 border-[var(--bg-tertiary)] border-t-[var(--accent)] animate-spin"></div>
                  <div className="text-center">
                    <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">Processing Payment</h2>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">Please wait securely...</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

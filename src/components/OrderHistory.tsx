import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ListOrdered, CheckCircle2, Star } from 'lucide-react';
import { Screen, TransitionType, UserSeat, Order } from '../types';
import { getEtaMinutes, getArrivalTime } from '../utils';
import { BottomNav } from './BottomNav';

interface OrderHistoryProps {
  navigate: (screen: Screen, transition: TransitionType) => void;
  activeOrders: Order[];
  userSeat: UserSeat;
  placeOrder: (items: { name: string; quantity: number }[]) => void;
  cancelOrder: (orderId: string) => void;
  updateOrder: (orderId: string, newItems: any[]) => void;
  rateOrder: (orderId: string, rating: number) => void;
}

export function OrderHistory({
  navigate,
  activeOrders,
  userSeat,
  placeOrder,
  cancelOrder,
  updateOrder,
  rateOrder,
}: OrderHistoryProps) {
  const [filter, setFilter] = useState<'active' | 'delivered' | 'cancelled'>('active');

  const filteredOrders = activeOrders.filter((order) => {
    if (filter === 'active') return ['confirmed', 'preparing', 'delivering'].includes(order.status);
    if (filter === 'delivered') return order.status === 'delivered';
    if (filter === 'cancelled') return order.status === 'cancelled';
    return false;
  });

  return (
    <div className="flex flex-col h-full w-full bg-[var(--bg-primary)]">
      <header className="flex flex-col px-6 py-6 z-10 relative shrink-0">
        <div className="flex items-center w-full mb-4">
          <button 
            id="btn-orders-back"
            aria-label="Back to Match Hub"
            onClick={() => navigate('CinematicMode', 'push_back')}
            className="w-10 h-10 flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full mr-4 text-[var(--text-primary)] cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold uppercase tracking-tight text-[var(--text-primary)]">Order History</h1>
        </div>
        <div className="flex space-x-2">
          {(['active', 'delivered', 'cancelled'] as const).map(f => (
            <button
              key={f}
              id={`btn-filter-orders-${f}`}
              aria-label={`Filter by ${f} orders`}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                filter === f 
                  ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20' 
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 px-6 z-10 space-y-6 overflow-y-auto pb-6">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center border border-[var(--border-color)]">
              <ListOrdered className="w-8 h-8 text-[var(--text-secondary)] opacity-50" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">No {filter} Orders</h3>
              {filter === 'active' && <p className="text-xs text-[var(--text-secondary)] mt-2">Hungry? Check out the concessions menu.</p>}
            </div>
            {filter === 'active' && (
              <button 
                id="btn-browse-menu"
                aria-label="Browse Concessions Menu"
                onClick={() => navigate('FoodMenu', 'push')}
                className="mt-4 px-6 py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-[var(--accent)]/30 transition-transform active:scale-95 cursor-pointer"
              >
                Browse Menu
              </button>
            )}
          </div>
        ) : (
          filteredOrders.map((order, index) => {
            const minutes = getEtaMinutes(order.status, userSeat.block);
            const arrivalTime = getArrivalTime(minutes);
            
            return (
              <div key={order.id || index} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-6 shadow-xl mb-4">
                <div className="flex justify-between items-start mb-6 border-b border-[var(--border-color)] pb-4">
                  <div>
                    <p className="text-[10px] text-[var(--text-secondary)] font-mono uppercase tracking-widest mb-1">Order #{order.id}</p>
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">
                      {order.items.map((i) => `${i.name} x${i.quantity}`).join(', ')}
                    </h2>
                  </div>
                  <div className="px-2.5 py-1 bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 rounded-md text-[9px] font-bold uppercase tracking-wider text-center">
                    {order.status === 'confirmed' && 'Confirmed'}
                    {order.status === 'preparing' && 'Preparing'}
                    {order.status === 'delivering' && <>En Route <br/> To Seat</>}
                    {order.status === 'delivered' && 'Delivered'}
                    {order.status === 'cancelled' && 'Cancelled'}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-8">
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-black italic text-[var(--text-primary)]">{minutes}</span>
                    <span className="text-[9px] text-[var(--text-secondary)] uppercase tracking-wider">Minutes</span>
                  </div>
                  <div className="h-8 w-px bg-[var(--border-color)]"></div>
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-black italic text-[var(--text-primary)]">{arrivalTime}</span>
                    <span className="text-[9px] text-[var(--text-secondary)] uppercase tracking-wider">Est. Arrival</span>
                  </div>
                </div>

                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-3 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[var(--accent)] before:via-[var(--accent)] before:to-[var(--border-color)]">
                  <div className="relative flex items-center">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${order.status ? 'border-[var(--accent)] bg-[var(--bg-primary)]' : 'border-[var(--border-color)] bg-[var(--bg-secondary)]'} shadow shrink-0 z-10`}>
                      <CheckCircle2 className="w-3 h-3 text-[var(--accent)]" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-xs font-bold text-[var(--text-primary)]">Order Confirmed</h4>
                      <span className="text-[10px] font-mono text-[var(--text-secondary)]">Received</span>
                    </div>
                  </div>
                  <div className="relative flex items-center">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${['preparing', 'delivering', 'delivered'].includes(order.status) ? 'border-[var(--accent)] bg-[var(--bg-primary)]' : 'border-[var(--border-color)] bg-[var(--bg-secondary)]'} shadow shrink-0 z-10`}>
                      {['preparing', 'delivering', 'delivered'].includes(order.status) ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }}>
                          <CheckCircle2 className="w-3 h-3 text-[var(--accent)]" />
                        </motion.div>
                      ) : (order.status === 'confirmed' ? <div className="w-2 h-2 rounded-full bg-[var(--text-secondary)] animate-ping"></div> : null)}
                    </div>
                    <div className="ml-4">
                      <h4 className={`text-xs font-bold ${['preparing', 'delivering', 'delivered'].includes(order.status) ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>Prepared & Packaged</h4>
                      <span className="text-[10px] font-mono text-[var(--text-secondary)]">{['preparing', 'delivering', 'delivered'].includes(order.status) ? 'Done' : (order.status === 'confirmed' ? 'In progress...' : 'Pending')}</span>
                    </div>
                  </div>
                  <div className="relative flex items-center">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${['delivering', 'delivered'].includes(order.status) ? 'border-[var(--accent)] bg-[var(--bg-primary)]' : 'border-[var(--border-color)] bg-[var(--bg-secondary)]'} shadow shrink-0 z-10`}>
                      {['delivering', 'delivered'].includes(order.status) ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }}>
                          <CheckCircle2 className="w-3 h-3 text-[var(--accent)]" />
                        </motion.div>
                      ) : (order.status === 'preparing' ? <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping"></div> : null)}
                    </div>
                    <div className="ml-4">
                      <h4 className={`text-xs font-bold ${['delivering', 'delivered'].includes(order.status) ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}>Out for Delivery</h4>
                      <span className={`text-[10px] font-mono ${['delivering', 'delivered'].includes(order.status) ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}>{['delivering', 'delivered'].includes(order.status) ? 'Courier #42' : 'Waiting...'}</span>
                    </div>
                  </div>
                </div>

                {order.status === 'delivered' && (
                  <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex flex-col gap-4">
                    {order.rating ? (
                      <div className="flex justify-between items-center bg-[var(--bg-tertiary)] p-3 rounded-xl border border-[var(--border-color)]">
                        <span className="text-xs font-bold text-[var(--text-primary)]">Your Rating</span>
                        <div className="flex text-yellow-500">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className={`w-4 h-4 ${star <= order.rating! ? 'fill-current' : 'opacity-30'}`} />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center bg-[var(--bg-tertiary)] p-3 rounded-xl border border-[var(--border-color)]">
                        <span className="text-xs font-bold text-[var(--text-primary)]">Rate Order</span>
                        <div className="flex gap-1 group">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button 
                              key={star} 
                              id={`btn-rate-order-${order.id}-star-${star}`}
                              aria-label={`Rate order ${star} stars`}
                              onClick={() => rateOrder(order.id, star)} 
                              className="text-yellow-500 hover:scale-110 transition-transform cursor-pointer"
                            >
                              <Star className="w-5 h-5 opacity-30 hover:opacity-100 peer-hover:opacity-100" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end">
                      <button
                        id={`btn-reorder-${order.id}`}
                        aria-label="Reorder these items"
                        onClick={() => {
                          placeOrder(order.items);
                          setFilter('active');
                        }}
                        className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-[var(--accent)]/30 transition-transform active:scale-95 cursor-pointer"
                      >
                        Reorder Items
                      </button>
                    </div>
                  </div>
                )}
                {['confirmed', 'preparing'].includes(order.status) && (
                  <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex justify-end gap-2">
                    {order.status === 'confirmed' && (
                      <button
                        id={`btn-edit-order-${order.id}`}
                        aria-label="Edit Order Items"
                        onClick={() => {
                          const note = prompt('Enter minor modifications (e.g., change Cola to Diet Cola):');
                          if (note && note.trim() !== '') {
                            const updatedItems = order.items.map((item, idx) => {
                              if (idx === 0) return { ...item, name: `${item.name} (${note})` };
                              return item;
                            });
                            updateOrder(order.id, updatedItems);
                          }
                        }}
                        className="px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-lg text-[10px] font-bold uppercase tracking-widest transition-transform active:scale-95 cursor-pointer"
                      >
                        Edit Order
                      </button>
                    )}
                    <button
                      id={`btn-cancel-order-${order.id}`}
                      aria-label="Cancel Order"
                      onClick={() => cancelOrder(order.id)}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-transform active:scale-95 cursor-pointer"
                    >
                      Cancel Order
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>

      <BottomNav currentScreen="OrderHistory" navigate={navigate} />
    </div>
  );
}

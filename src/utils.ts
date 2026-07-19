import { Match, ConcessionItem } from './types';

export function getMatchScore(match: Match): string {
  if (!match.highlights) return '0 - 0';
  const score1 = match.highlights.filter(h => h.type === 'goal' && h.team === match.team1).length;
  const score2 = match.highlights.filter(h => h.type === 'goal' && h.team === match.team2).length;
  return `${score1} - ${score2}`;
}

export const CONCESSION_ITEMS: ConcessionItem[] = [
  { id: 1, name: "Lusail Signature Burger", desc: "Double beef, cheddar, house sauce", price: "$14.00", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=200&q=80" },
  { id: 2, name: "Argentinian Empanadas", desc: "Beef, onions, olives, baked to perfection", price: "$9.50", image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=200&q=80" },
  { id: 3, name: "French Fries & Dips", desc: "Crispy fries with aioli and ketchup", price: "$6.00", image: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=200&q=80" },
  { id: 4, name: "Classic Hot Dog", desc: "Premium beef frank, mustard, onions", price: "$8.00", image: "https://images.unsplash.com/photo-1612392062631-94dd858cba88?auto=format&fit=crop&w=200&q=80" },
  { id: 5, name: "Margherita Pizza Slice", desc: "Tomato, mozzarella, fresh basil", price: "$7.50", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=200&q=80" },
  { id: 6, name: "Cold Soda", desc: "Cola, Lemon-Lime, or Orange", price: "$4.00", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=200&q=80" }
];

export function getEtaMinutes(status: string, block: number): number {
  if (status === 'delivered' || status === 'cancelled') return 0;
  const distanceTime = 2 + Math.ceil(Math.abs(block - 100) * 0.5);
  const prepTime = 8;
  if (status === 'delivering') return distanceTime;
  return prepTime + distanceTime;
}

export function getArrivalTime(minutes: number, baseDate: Date = new Date()): string {
  if (minutes === 0) return '--:--';
  const d = new Date(baseDate.getTime());
  d.setMinutes(d.getMinutes() + minutes);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

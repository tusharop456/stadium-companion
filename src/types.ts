export type Screen = 'CinematicMode' | 'UserProfile' | 'WarmMode' | 'FoodMenu' | 'OrderHistory' | 'MatchesList';

export type TransitionType = 'push' | 'push_back' | 'none';

export interface Highlight {
  id: string;
  time: string;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution';
  team: string;
  player: string;
  details?: string;
}

export interface Match {
  id: string;
  stage: string;
  team1: string;
  team2: string;
  time: string;
  status: 'live' | 'upcoming' | 'finished';
  stats: {
    possession: [number, number];
    shotsOnTarget: [number, number];
    corners: [number, number];
  };
  highlights?: Highlight[];
}

export interface ConcessionItem {
  id: number;
  name: string;
  desc: string;
  price: string;
  image: string;
}

export interface Order {
  id: string;
  items: { name: string; quantity: number }[];
  status: 'confirmed' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';
  timestamp: number;
  rating?: number;
  locked?: boolean;
}

export interface UserSeat {
  block: number;
  row: string;
  seat: number;
}

export interface Toast {
  title: string;
  message: string;
  type: 'success' | 'info' | 'alert';
}

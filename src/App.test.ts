import { describe, it, expect, vi } from 'vitest';

// Mock firebase modules so importing src/App doesn't trigger side effects
vi.mock('./lib/firebase', () => ({
  auth: { currentUser: null },
  db: {}
}));

vi.mock('firebase/auth', () => ({
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: class {},
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn((auth, cb) => {
    cb(null);
    return () => {};
  })
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  onSnapshot: vi.fn(() => () => {}),
  updateDoc: vi.fn(),
  arrayUnion: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn()
}));

import { 
  getMatchScore, 
  getEtaMinutes, 
  getArrivalTime, 
  CONCESSION_ITEMS, 
  Match 
} from './App';

describe('Stadium Companion - getMatchScore Unit Tests', () => {
  it('should return 0 - 0 if highlights are missing', () => {
    const match: Match = {
      id: '1',
      stage: 'Final',
      team1: 'ARG',
      team2: 'ESP',
      time: '90',
      status: 'finished',
      stats: { possession: [50, 50], shotsOnTarget: [0, 0], corners: [0, 0] }
    };
    expect(getMatchScore(match)).toBe('0 - 0');
  });

  it('should calculate the score correctly based on goals in highlights', () => {
    const match: Match = {
      id: '1',
      stage: 'Final',
      team1: 'ARG',
      team2: 'ESP',
      time: '90',
      status: 'finished',
      stats: { possession: [50, 50], shotsOnTarget: [4, 4], corners: [2, 2] },
      highlights: [
        { id: 'h1', time: '10', type: 'goal', team: 'ARG', player: 'L. Messi' },
        { id: 'h2', time: '20', type: 'yellow_card', team: 'ESP', player: 'Rodri' },
        { id: 'h3', time: '45', type: 'goal', team: 'ESP', player: 'L. Yamal' },
        { id: 'h4', time: '88', type: 'goal', team: 'ARG', player: 'L. Martinez' }
      ]
    };
    expect(getMatchScore(match)).toBe('2 - 1');
  });

  it('should return 0 - 0 if highlights exist but contain no goals', () => {
    const match: Match = {
      id: '1',
      stage: 'Final',
      team1: 'ARG',
      team2: 'ESP',
      time: '90',
      status: 'finished',
      stats: { possession: [50, 50], shotsOnTarget: [0, 0], corners: [0, 0] },
      highlights: [
        { id: 'h1', time: '15', type: 'yellow_card', team: 'ARG', player: 'De Paul' },
        { id: 'h2', time: '60', type: 'substitution', team: 'ESP', player: 'Morata' }
      ]
    };
    expect(getMatchScore(match)).toBe('0 - 0');
  });

  it('should handle goals scored by non-participating team names gracefully by ignoring them', () => {
    const match: Match = {
      id: '1',
      stage: 'Final',
      team1: 'ARG',
      team2: 'ESP',
      time: '90',
      status: 'finished',
      stats: { possession: [50, 50], shotsOnTarget: [0, 0], corners: [0, 0] },
      highlights: [
        { id: 'h1', time: '10', type: 'goal', team: 'FRA', player: 'Mbappe' }
      ]
    };
    expect(getMatchScore(match)).toBe('0 - 0');
  });

  it('should compute scores when there are multiple goals for one team and none for the other', () => {
    const match: Match = {
      id: '2',
      stage: 'Group Stage',
      team1: 'BRA',
      team2: 'GER',
      time: '90',
      status: 'finished',
      stats: { possession: [40, 60], shotsOnTarget: [1, 10], corners: [2, 5] },
      highlights: [
        { id: 'h1', time: '11', type: 'goal', team: 'GER', player: 'Muller' },
        { id: 'h2', time: '23', type: 'goal', team: 'GER', player: 'Klose' },
        { id: 'h3', time: '24', type: 'goal', team: 'GER', player: 'Kroos' }
      ]
    };
    expect(getMatchScore(match)).toBe('0 - 3');
  });
});

describe('Stadium Companion - getEtaMinutes Unit Tests', () => {
  it('should return 0 minutes if status is delivered', () => {
    expect(getEtaMinutes('delivered', 104)).toBe(0);
  });

  it('should return 0 minutes if status is cancelled', () => {
    expect(getEtaMinutes('cancelled', 104)).toBe(0);
  });

  it('should calculate distance time only if status is delivering (block 104)', () => {
    // block = 104. Distance = abs(104-100) = 4. Math.ceil(4 * 0.5) = 2. distanceTime = 2 + 2 = 4.
    expect(getEtaMinutes('delivering', 104)).toBe(4);
  });

  it('should calculate distance time only if status is delivering (block 100)', () => {
    // block = 100. Distance = abs(100-100) = 0. distanceTime = 2 + 0 = 2.
    expect(getEtaMinutes('delivering', 100)).toBe(2);
  });

  it('should calculate distance time only if status is delivering (block 91)', () => {
    // block = 91. Distance = abs(91-100) = 9. Math.ceil(9 * 0.5) = 5. distanceTime = 2 + 5 = 7.
    expect(getEtaMinutes('delivering', 91)).toBe(7);
  });

  it('should calculate distance time + prepTime (8) for pre-delivery statuses like confirmed/preparing (block 104)', () => {
    // block = 104. distanceTime = 4. ETA = prepTime (8) + 4 = 12.
    expect(getEtaMinutes('confirmed', 104)).toBe(12);
    expect(getEtaMinutes('preparing', 104)).toBe(12);
  });

  it('should calculate distance time + prepTime (8) for pre-delivery statuses (block 100)', () => {
    // block = 100. distanceTime = 2. ETA = prepTime (8) + 2 = 10.
    expect(getEtaMinutes('confirmed', 100)).toBe(10);
  });

  it('should handle boundary block values and negative block values gracefully', () => {
    // block = -50. Distance = abs(-50 - 100) = 150. Math.ceil(150 * 0.5) = 75. distanceTime = 2 + 75 = 77.
    // ETA for confirmed = 8 + 77 = 85.
    expect(getEtaMinutes('confirmed', -50)).toBe(85);
  });
});

describe('Stadium Companion - getArrivalTime Unit Tests', () => {
  it('should return --:-- if minutes is 0', () => {
    expect(getArrivalTime(0)).toBe('--:--');
  });

  it('should format arrival time correctly for positive minutes', () => {
    // Use a fixed base Date to be deterministic: 2026-07-19 at 10:00:00
    const baseDate = new Date('2026-07-19T10:00:00');
    
    // Add 15 minutes -> Expect 10:15
    const result = getArrivalTime(15, baseDate);
    
    // Check that hour is '10' or '10 AM/PM' depending on formatting, and minute has '15'
    expect(result).toMatch(/10.*15/);
  });

  it('should handle rolling over hour boundaries correctly', () => {
    // Start at 10:45:00
    const baseDate = new Date('2026-07-19T10:45:00');
    
    // Add 20 minutes -> Expect 11:05
    const result = getArrivalTime(20, baseDate);
    
    expect(result).toMatch(/11.*05/);
  });

  it('should handle rolling over PM to AM boundaries correctly', () => {
    // Start at 23:50:00 (11:50 PM)
    const baseDate = new Date('2026-07-19T23:50:00');
    
    // Add 15 minutes -> Expect 00:05 or 12:05 AM
    const result = getArrivalTime(15, baseDate);
    
    expect(result).toMatch(/(12|00).*05/);
  });
});

describe('Stadium Companion - CONCESSION_ITEMS Static Configurations', () => {
  it('should contain the correct number of items', () => {
    expect(CONCESSION_ITEMS).toBeInstanceOf(Array);
    expect(CONCESSION_ITEMS.length).toBe(6);
  });

  it('should have valid and unique IDs', () => {
    const ids = CONCESSION_ITEMS.map(item => item.id);
    const uniqueIds = Array.from(new Set(ids));
    
    expect(ids.length).toBe(uniqueIds.length);
    CONCESSION_ITEMS.forEach(item => {
      expect(item.id).toBeGreaterThan(0);
    });
  });

  it('should have valid strings for name, desc, and price', () => {
    CONCESSION_ITEMS.forEach(item => {
      expect(item.name).toBeTruthy();
      expect(item.name.trim().length).toBeGreaterThan(0);
      
      expect(item.desc).toBeTruthy();
      expect(item.desc.trim().length).toBeGreaterThan(0);

      expect(item.price).toBeTruthy();
      expect(item.price.startsWith('$')).toBe(true);
      
      const priceVal = parseFloat(item.price.replace('$', ''));
      expect(priceVal).toBeGreaterThan(0);
    });
  });

  it('should have a valid image URL for visual fidelity', () => {
    CONCESSION_ITEMS.forEach(item => {
      expect(item.image).toBeTruthy();
      expect(item.image).toMatch(/^https:\/\//);
    });
  });
});

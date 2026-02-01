import { Item } from '@/types'; // Assuming your type definition is in src/types/index.ts or similar

// A basic Item type definition if you don't have one
export interface Item {
  _id: string;
  title: string;
  description: string;
  images: string[];
  category: string[];
  status: 'live' | 'goal_met' | 'ended' | 'not_met';
  aiVerificationScore: number;
  ticketGoal: number;
  ticketsSold: number;
  ticketCost: number;
  endDate: string;
  createdAt: string;
}


export const mockItems: Item[] = Array.from({ length: 10 }, (_, i) => ({
  _id: `item_${i + 1}`,
  title: `Sample Raffle Item ${i + 1}`,
  description: `This is a sample description for raffle item ${i + 1}. Win big with this amazing prize!`,
  images: [`https://picsum.photos/400/600?random=${i + 1}`],
  category: ['electronics', 'gadgets'],
  status: 'live',
  aiVerificationScore: Math.random(),
  ticketGoal: 100,
  ticketsSold: Math.floor(Math.random() * 100),
  ticketCost: Math.floor(Math.random() * 50) + 5,
  endDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000).toISOString(),
}));
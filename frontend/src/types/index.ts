import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export interface User {
    _id: string;
    email: string;
    password: string;
    role: 'seller' | 'buyer';
    ticketBalance: number;
    totalRevenue: number;
    totalSpent: number;
    enteredRaffles?: Array<{
        ticketsBought: number;
    }>;
    createdAt: string;
}

export interface Item {
    _id: string;
    sellerId: string | User; // Can be either string ID or populated user object
    title: string;
    description: string;
    condition: string;
    images: string[];
    category: string[];
    aiVerificationScore: number;
    ticketCost: number;
    ticketGoal: number;
    ticketsSold: number;
    participants: {
        userId: string;
        ticketsSpent: number;
        joinedAt: string;
    }[];
    status: 'live' | 'goal_met' | 'ended' | 'not_met_pending_decision' | 'not_met' | 'awaiting_confirmation' | 'cancelled' | 'goal_met_grace_period';
    winnerId?: string | User;
    confirmationDeadline?: string;
    sellerConfirmed?: boolean | null;
    endDate: string;
    charityOverflow: number;
    createdAt: string;
}

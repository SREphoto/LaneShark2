/**
 * LaneShark 2.0 - Ball Database
 */

import { BallStats } from '../Physics';

export interface BallDefinition {
    id: string;
    name: string;
    description: string;
    stats: BallStats;
    cost: number;
    currency: 'COINS' | 'GEMS';
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
    spriteIndex: number; // For rendering from sprite sheet
}

export const BALL_DATABASE: BallDefinition[] = [
    {
        id: 'ball_starter',
        name: 'STREET SHARK',
        description: 'Perfect for beginners. Balanced and reliable.',
        stats: { speed: 60, hook: 40, weight: 60, guide: 70, control: 80 },
        cost: 0,
        currency: 'COINS',
        rarity: 'COMMON',
        spriteIndex: 0
    },
    {
        id: 'ball_heavy_hitter',
        name: 'CRUSH_CORE',
        description: 'Maximum pin impact. Hard to control but hits like a truck.',
        stats: { speed: 40, hook: 30, weight: 95, guide: 40, control: 30 },
        cost: 1500,
        currency: 'COINS',
        rarity: 'RARE',
        spriteIndex: 1
    },
    {
        id: 'ball_curve_king',
        name: 'NEON_HOOK',
        description: 'Elite backend reaction. For professionals only.',
        stats: { speed: 70, hook: 90, weight: 50, guide: 50, control: 40 },
        cost: 2500,
        currency: 'COINS',
        rarity: 'RARE',
        spriteIndex: 2
    },
    {
        id: 'ball_speed_demon',
        name: 'VELOCITY_X',
        description: 'Lightning fast. Minimal hook, maximum straight power.',
        stats: { speed: 95, hook: 10, weight: 70, guide: 60, control: 50 },
        cost: 50,
        currency: 'GEMS',
        rarity: 'EPIC',
        spriteIndex: 3
    }
];

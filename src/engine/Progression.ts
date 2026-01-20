/**
 * LaneShark 2.0 - Progression & Economy System
 */

export interface PlayerProfile {
    level: number;
    xp: number;
    coins: number;
    gems: number;
    stats: {
        totalPins: number;
        totalStrikes: number;
        gamesPlayed: number;
    };
    unlockedBalls: string[];
    activeBallId: string;
}

export class ProgressionManager {
    private profile: PlayerProfile;

    constructor() {
        this.profile = this.loadProfile();
    }

    private loadProfile(): PlayerProfile {
        const saved = localStorage.getItem('laneshark_v2_profile');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            level: 1,
            xp: 0,
            coins: 500,
            gems: 10,
            stats: {
                totalPins: 0,
                totalStrikes: 0,
                gamesPlayed: 0
            },
            unlockedBalls: ['ball_starter'],
            activeBallId: 'ball_starter'
        };
    }

    public saveProfile() {
        localStorage.setItem('laneshark_v2_profile', JSON.stringify(this.profile));
    }

    public addXP(amount: number) {
        this.profile.xp += amount;
        const xpToNextLevel = this.profile.level * 1000;
        if (this.profile.xp >= xpToNextLevel) {
            this.profile.level++;
            this.profile.xp -= xpToNextLevel;
            console.log('SHARK_OS: LEVEL_UP >>', this.profile.level);
            // In a real app, trigger a level up UI
        }
        this.saveProfile();
    }

    public addCoins(amount: number) {
        this.profile.coins += amount;
        this.saveProfile();
    }

    public updateStats(pins: number, isStrike: boolean) {
        this.profile.stats.totalPins += pins;
        if (isStrike) this.profile.stats.totalStrikes++;
        this.saveProfile();
    }

    public getProfile(): PlayerProfile {
        return this.profile;
    }
}

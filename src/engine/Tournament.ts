/**
 * LaneShark 2.0 - Tournament & Game Session Manager
 */

import { ProgressionManager } from './Progression';

export interface GameResult {
    score: number;
    pinsDown: number;
    strikes: number;
    spares: number;
    xpEarned: number;
    coinsEarned: number;
}

export class TournamentManager {
    private progression: ProgressionManager;
    private currentFrame: number = 1;
    private maxFrames: number = 10;
    private frameScores: { pins: number, isStrike: boolean, total: number }[] = [];

    constructor(progression: ProgressionManager) {
        this.progression = progression;
    }

    public startNewGame() {
        this.currentFrame = 1;
        this.frameScores = [];
        console.log('SHARK_OS: Tournament Started >> FRAME 1');
    }

    public recordFrame(pins: number, isStrike: boolean): GameResult {
        const xp = pins * 50 + (isStrike ? 200 : 0);
        const coins = pins * 10 + (isStrike ? 50 : 0);

        this.progression.addXP(xp);
        this.progression.addCoins(coins);
        this.progression.updateStats(pins, isStrike);

        const currentTotal = (this.frameScores.length > 0 ? this.frameScores[this.frameScores.length - 1].total : 0) + (pins * 10);
        this.frameScores.push({ pins, isStrike, total: currentTotal });

        this.updateScorecardUI();

        const result: GameResult = {
            score: pins * 10,
            pinsDown: pins,
            strikes: isStrike ? 1 : 0,
            spares: 0, // Simplified for now
            xpEarned: xp,
            coinsEarned: coins
        };

        this.currentFrame++;
        if (this.currentFrame > this.maxFrames) {
            this.endGame();
        }

        return result;
    }

    private updateScorecardUI() {
        const grid = document.getElementById('score-grid');
        if (!grid) return;

        grid.innerHTML = '';
        for (let i = 0; i < this.maxFrames; i++) {
            const frame = this.frameScores[i];
            const div = document.createElement('div');
            div.className = `flex flex-col border-r border-white/10 ${i === this.maxFrames - 1 ? 'border-r-0' : ''}`;

            div.innerHTML = `
                <div class="bg-white/5 p-2 text-[8px] font-bold text-center border-b border-white/10 uppercase tracking-widest">${i + 1}</div>
                <div class="flex-1 p-3 flex flex-col items-center justify-center gap-2">
                    <span class="text-xl font-display font-black">${frame ? (frame.isStrike ? 'X' : frame.pins) : '-'}</span>
                    <span class="text-[10px] font-bold text-white/40">${frame ? frame.total : ''}</span>
                </div>
            `;
            grid.appendChild(div);
        }
    }

    private endGame() {
        console.log('SHARK_OS: Tournament Finished >> FINAL_SYNC');
        // Trigger high-score UI or results screen
    }

    public getCurrentFrame() { return this.currentFrame; }
}

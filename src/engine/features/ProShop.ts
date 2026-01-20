/**
 * LaneShark 2.0 - Pro Shop & Arsenal Manager
 */

import { PlayerProfile, ProgressionManager } from '../Progression';
import { BALL_DATABASE, BallDefinition } from '../data/Balls';

export class ProShop {
    private progression: ProgressionManager;
    private overlay: HTMLElement;
    private listContainer: HTMLElement;

    constructor(progression: ProgressionManager) {
        this.progression = progression;
        this.overlay = document.getElementById('shop-overlay')!;
        this.listContainer = document.getElementById('shop-items')!;

        this.setupListeners();
    }

    private setupListeners() {
        document.getElementById('btn-show-shop')?.addEventListener('click', () => this.open());
        document.getElementById('btn-close-shop')?.addEventListener('click', () => this.close());
    }

    public open() {
        this.renderItems();
        this.overlay.classList.remove('hidden');
    }

    public close() {
        this.overlay.classList.add('hidden');
    }

    private renderItems() {
        const profile = this.progression.getProfile();
        this.listContainer.innerHTML = '';

        BALL_DATABASE.forEach(ball => {
            const isUnlocked = profile.unlockedBalls.includes(ball.id);
            const isActive = profile.activeBallId === ball.id;

            const card = document.createElement('div');
            card.className = `glass-panel p-6 flex flex-col gap-4 border ${isActive ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/10'}`;

            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <h3 class="font-display font-bold text-lg tracking-tight">${ball.name}</h3>
                    <span class="text-[8px] font-black tracking-widest px-2 py-1 rounded bg-white/5 ${this.getRarityColor(ball.rarity)}">${ball.rarity}</span>
                </div>
                
                <p class="text-white/40 text-[10px] leading-relaxed mb-2">${ball.description}</p>
                
                <div class="space-y-2">
                    ${this.renderStat('SPD', ball.stats.speed)}
                    ${this.renderStat('HOK', ball.stats.hook)}
                    ${this.renderStat('WGT', ball.stats.weight)}
                </div>

                <div class="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-bold ${ball.currency === 'GEMS' ? 'text-emerald-400' : 'text-blue-400'}">${ball.cost}</span>
                        <span class="text-[8px] opacity-40">${ball.currency}</span>
                    </div>
                    <button class="shop-action-btn glass-button text-[10px] px-4 py-2 ${isUnlocked ? 'border-white/20' : 'border-blue-500/50 bg-blue-500/10'}" 
                            data-id="${ball.id}">
                        ${isActive ? 'EQUIPPED' : (isUnlocked ? 'EQUIP' : 'BUY')}
                    </button>
                </div>
            `;

            const actionBtn = card.querySelector('.shop-action-btn') as HTMLButtonElement;
            actionBtn.onclick = () => this.handleAction(ball);

            this.listContainer.appendChild(card);
        });
    }

    private renderStat(label: string, value: number) {
        return `
            <div class="flex flex-col gap-1">
                <div class="flex justify-between text-[8px] font-bold tracking-widest opacity-50">
                    <span>${label}</span>
                    <span>${value}</span>
                </div>
                <div class="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div class="h-full bg-blue-500/50" style="width: ${value}%"></div>
                </div>
            </div>
        `;
    }

    private getRarityColor(rarity: string) {
        switch (rarity) {
            case 'RARE': return 'text-blue-400';
            case 'EPIC': return 'text-purple-400';
            case 'LEGENDARY': return 'text-orange-400';
            default: return 'text-white/40';
        }
    }

    private handleAction(ball: BallDefinition) {
        const profile = this.progression.getProfile();
        const isUnlocked = profile.unlockedBalls.includes(ball.id);

        if (isUnlocked) {
            profile.activeBallId = ball.id;
            this.progression.saveProfile();
            this.renderItems();
            console.log('SHARK_OS: Ball Equipped >>', ball.name);
        } else {
            // Check funds
            const currency = ball.currency === 'COINS' ? 'coins' : 'gems';
            if (profile[currency] >= ball.cost) {
                profile[currency] -= ball.cost;
                profile.unlockedBalls.push(ball.id);
                profile.activeBallId = ball.id;
                this.progression.saveProfile();
                this.renderItems();
                // We should also trigger a HUD update here
                console.log('SHARK_OS: Ball Purchased >>', ball.name);
            } else {
                alert('INSUFFICIENT FUNDS_');
            }
        }
    }
}

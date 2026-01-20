
import React, { useState } from 'react';
import { Handedness, PlayerProfile, PlayerStats, AvatarAppearance } from '../types';
import AvatarDesigner from './AvatarDesigner';

interface PlayerCreatorProps {
    onComplete: (profile: PlayerProfile) => void;
}

const INITIAL_STATS: PlayerStats = {
    strength: 5,
    accuracy: 5,
    control: 5,
    endurance: 5,
    crowdControl: 5,
    specialty: 2
};

const PlayerCreator: React.FC<PlayerCreatorProps> = ({ onComplete }) => {
    const [name, setName] = useState('');
    const [hand, setHand] = useState<Handedness>('RIGHT');
    const [appearance, setAppearance] = useState<AvatarAppearance | null>(null);
    const [step, setStep] = useState<'NAME' | 'DESIGN'>('NAME');

    const handleCreate = (finalAppearance: AvatarAppearance) => {
        if (!name.trim()) return;
        const newProfile: PlayerProfile = {
            name: name.trim().toUpperCase(),
            handedness: hand,
            stats: { ...INITIAL_STATS },
            level: 1,
            xp: 0,
            statPoints: 0,
            avatar: finalAppearance,
            skillNodes: [],
            career: {
                gamesPlayed: 0,
                soloHighScore: 0,
                vsCpuWins: 0,
                vsCpuLosses: 0,
                currentStreak: 0
            }
        };
        onComplete(newProfile);
    };

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in bg-[#0a0a0c] overflow-y-auto">
            {step === 'NAME' ? (
                <div className="relative w-full max-w-xl glass-card p-10 flex flex-col items-center animate-slide-up bg-black/40 border-2 border-white/10 rounded-3xl">
                    <div className="mb-12 text-center">
                        <h2 className="text-4xl font-['Press_Start_2P'] gradient-text mb-4 tracking-tighter">
                            NEW CHAMPION
                        </h2>
                        <div className="h-1 w-24 bg-gradient-to-r from-transparent via-purple-500 to-transparent mx-auto" />
                    </div>

                    <div className="w-full space-y-10">
                        {/* Name Input */}
                        <div className="w-full">
                            <label className="block text-[8px] font-['Press_Start_2P'] mb-4 text-gray-500 uppercase tracking-[0.3em]">
                                ENTER_PLAYER_NAME
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                maxLength={12}
                                className="w-full bg-white/5 border-2 border-white/10 rounded-2xl p-5 text-white font-['Press_Start_2P'] text-lg focus:border-purple-500 focus:bg-white/10 transition-all outline-none uppercase placeholder:text-gray-800"
                                placeholder="..."
                                autoFocus
                            />
                        </div>

                        {/* Handedness Selection */}
                        <div className="w-full">
                            <label className="block text-[8px] font-['Press_Start_2P'] mb-4 text-gray-500 uppercase tracking-[0.3em]">
                                DOMINANT_HAND
                            </label>
                            <div className="flex gap-4">
                                {(['LEFT', 'RIGHT'] as Handedness[]).map(h => (
                                    <button
                                        key={h}
                                        onClick={() => setHand(h)}
                                        className={`flex-1 py-5 rounded-2xl font-['Press_Start_2P'] text-[10px] transition-all border-2 ${hand === h
                                            ? 'bg-purple-600/20 border-purple-500 text-white shadow-purple-glow'
                                            : 'bg-white/5 border-white/10 text-gray-600 hover:text-gray-400'
                                            }`}
                                    >
                                        {h === 'LEFT' ? '⬅ LEFT' : 'RIGHT ➡'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-16 w-full">
                        <button
                            onClick={() => name.trim() && setStep('DESIGN')}
                            disabled={!name.trim()}
                            className={`w-full py-6 rounded-2xl font-['Press_Start_2P'] text-sm tracking-widest transition-all border-2 ${!name.trim()
                                ? 'bg-gray-900 border-white/5 text-gray-800'
                                : 'btn-gold shadow-gold-glow animate-pulse-glow border-white/20'
                                }`}
                        >
                            NEXT_STEP_➡
                        </button>
                    </div>
                </div>
            ) : (
                <div className="w-full max-w-6xl">
                    <div className="mb-8 flex items-center justify-between px-4">
                        <button
                            onClick={() => setStep('NAME')}
                            className="text-[10px] font-['Press_Start_2P'] text-gray-500 hover:text-white transition-colors"
                        >
                            ⬅ BACK_TO_NAME
                        </button>
                        <div className="text-right">
                            <h2 className="text-2xl font-['Press_Start_2P'] text-white">{name}</h2>
                            <span className="text-[8px] font-['Press_Start_2P'] text-purple-400">DESIGNING_CHAMPION</span>
                        </div>
                    </div>

                    <AvatarDesigner
                        onSave={handleCreate}
                        onCancel={() => setStep('NAME')}
                    />
                </div>
            )}
        </div>
    );
};

export default PlayerCreator;

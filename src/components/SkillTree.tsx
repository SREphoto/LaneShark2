
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlayerProfile, SkillNode, SkillPath } from '../types';

interface SkillTreeProps {
    profile: PlayerProfile;
    onPurchaseSkill: (skillId: string) => void;
    onClose: () => void;
}

const SKILL_TREE_DATA: SkillNode[] = [
    // POWER PATH
    {
        id: 'pow_1', name: 'HEAVY HITTER', path: 'POWER', cost: 1, requirements: [], unlocked: false,
        description: 'Increases base throw strength by 10%.',
        effect: { strength: 1 }
    },
    {
        id: 'pow_2', name: 'KINETIC IMPACT', path: 'POWER', cost: 2, requirements: ['pow_1'], unlocked: false,
        description: 'Pins fly further on direct hits.',
        effect: { strength: 2 }
    },
    {
        id: 'pow_3', name: 'TITANIC ROLL', path: 'POWER', cost: 3, requirements: ['pow_2'], unlocked: false,
        description: 'Significant boost to pin carry.',
        effect: { strength: 3, endurance: 1 }
    },

    // TECHNICAL PATH
    {
        id: 'tech_1', name: 'STEADY HAND', path: 'TECHNICAL', cost: 1, requirements: [], unlocked: false,
        description: 'Reduces aim oscillation speed.',
        effect: { accuracy: 1 }
    },
    {
        id: 'tech_2', name: 'SPIN DOCTOR', path: 'TECHNICAL', cost: 2, requirements: ['tech_1'], unlocked: false,
        description: 'Increases maximum hook potential.',
        effect: { control: 2 }
    },
    {
        id: 'tech_3', name: 'PRECISION PATH', path: 'TECHNICAL', cost: 3, requirements: ['tech_2'], unlocked: false,
        description: 'Highly stabilized throw sequence.',
        effect: { accuracy: 3, control: 1 }
    },

    // SHOWMAN PATH
    {
        id: 'show_1', name: 'CROWD PLEASER', path: 'SHOWMAN', cost: 1, requirements: [], unlocked: false,
        description: 'Earn 10% more money per game.',
        effect: { crowdControl: 1 }
    },
    {
        id: 'show_2', name: 'GRAVITY DEFIANCE', path: 'SHOWMAN', cost: 2, requirements: ['show_1'], unlocked: false,
        description: 'Increase XP gains for conversions.',
        effect: { crowdControl: 2, specialty: 1 }
    },
];

const SkillTree: React.FC<SkillTreeProps> = ({ profile, onPurchaseSkill, onClose }) => {
    const isUnlocked = (id: string) => profile.skillNodes.some(n => n.id === id);
    const canUnlock = (node: SkillNode) => {
        if (isUnlocked(node.id)) return false;
        if (profile.statPoints < node.cost) return false;
        if (node.requirements.length === 0) return true;
        return node.requirements.every(reqId => isUnlocked(reqId));
    };

    const renderPath = (path: SkillPath, color: string) => {
        const nodes = SKILL_TREE_DATA.filter(n => n.path === path);
        return (
            <div className="flex-1 flex flex-col gap-6">
                <h3 className="text-[10px] font-['Press_Start_2P'] text-center mb-4" style={{ color }}>{path}_PATH</h3>
                <div className="flex flex-col items-center gap-8">
                    {nodes.map((node, i) => {
                        const unlocked = isUnlocked(node.id);
                        const available = canUnlock(node);

                        return (
                            <div key={node.id} className="relative flex flex-col items-center">
                                {/* Connector line */}
                                {i > 0 && (
                                    <div className={`absolute -top-8 w-1 h-8 ${unlocked ? 'bg-gradient-to-b from-white to-transparent' : 'bg-white/10'}`} />
                                )}

                                <button
                                    onClick={() => available && onPurchaseSkill(node.id)}
                                    disabled={!available}
                                    className={`group relative w-44 p-4 rounded-xl border-2 transition-all ${unlocked ? 'bg-white/10 border-white shadow-glow' :
                                            available ? 'bg-white/5 border-white/20 hover:border-white/50 hover:bg-white/10' :
                                                'bg-black/40 border-white/5 opacity-40 grayscale'
                                        }`}
                                >
                                    <h4 className="text-[8px] font-['Press_Start_2P'] mb-2 text-white">{node.name}</h4>
                                    <p className="text-[6px] text-gray-400 mb-3 leading-relaxed">{node.description}</p>
                                    <div className="flex justify-between items-center text-[6px] font-['Press_Start_2P']">
                                        <span className={unlocked ? 'text-emerald-400' : 'text-yellow-500'}>
                                            {unlocked ? 'UNLOCKED' : `COST: ${node.cost}PT`}
                                        </span>
                                    </div>

                                    {/* Tooltip Effect */}
                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 p-2 bg-black border border-white/20 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                        <p className="text-[5px] text-gray-300 leading-tight">EFFECT: {Object.entries(node.effect).map(([k, v]) => `+${v} ${k.toUpperCase()}`).join(', ')}</p>
                                    </div>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#0a0a0c]/90 backdrop-blur-xl animate-fade-in">
            <div className="relative w-full max-w-6xl glass-panel p-10 flex flex-col h-[85vh] border-2 border-white/10">
                {/* Header */}
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h2 className="text-3xl font-['Press_Start_2P'] gradient-text mb-2">CAREER_EVOLUTION</h2>
                        <div className="flex gap-4">
                            <span className="text-[8px] font-['Press_Start_2P'] text-emerald-400">LVL {profile.level}</span>
                            <span className="text-[8px] font-['Press_Start_2P'] text-yellow-400">POINTS AVAILABLE: {profile.statPoints}</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-4 bg-white/5 hover:bg-red-600/20 border border-white/10 rounded-xl transition-all font-['Press_Start_2P'] text-[10px]"
                    >
                        CLOSE_X
                    </button>
                </div>

                {/* Tree Content */}
                <div className="flex-1 flex gap-8 overflow-x-auto pb-8 custom-scrollbar">
                    {renderPath('POWER', '#f53b57')}
                    {renderPath('TECHNICAL', '#0fbcf9')}
                    {renderPath('SHOWMAN', '#ffd32a')}
                </div>

                {/* Footer Info */}
                <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center">
                    <div className="flex gap-10">
                        {Object.entries(profile.stats).map(([k, v]) => (
                            <div key={k} className="flex flex-col gap-1">
                                <span className="text-[6px] font-['Press_Start_2P'] text-gray-500 uppercase">{k}</span>
                                <span className="text-[10px] font-['Press_Start_2P'] text-white">{v}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SkillTree;

export { SKILL_TREE_DATA };

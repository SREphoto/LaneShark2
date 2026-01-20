
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AvatarAppearance } from '../types';

interface AvatarDesignerProps {
    initialAppearance?: AvatarAppearance;
    onSave: (appearance: AvatarAppearance) => void;
    onCancel: () => void;
}

const COLORS = {
    skin: ['#ffdbac', '#f1c27d', '#e0ac69', '#8d5524', '#c68642'],
    hair: ['#000000', '#2d3436', '#4b2c20', '#d63031', '#f9ca24', '#ffffff', '#0fbcf9'],
};

const FEATURES = {
    hairStyle: ['RETRO', 'MOHAWK', 'BALD', 'PIXIE', 'LONG', 'SPIKY'],
    eyes: ['NORMAL', 'SQUINT', 'WIDE', 'COOL'],
    nose: ['SMALL', 'POINTY', 'ROUND'],
    mouth: ['NEUTRAL', 'SMILE', 'FLAT'],
    shape: ['OVAL', 'SQUARE', 'ROUND'],
    bodyType: ['SLIM', 'ATHLETIC', 'HEAVY'] as const,
};

const AvatarDesigner: React.FC<AvatarDesignerProps> = ({ initialAppearance, onSave, onCancel }) => {
    const [appearance, setAppearance] = useState<AvatarAppearance>(initialAppearance || {
        gender: 'MALE',
        bodyType: 'ATHLETIC',
        skinTone: COLORS.skin[0],
        hairStyle: 'RETRO',
        hairColor: COLORS.hair[1],
        faceFeatures: {
            eyes: 'NORMAL',
            nose: 'SMALL',
            mouth: 'NEUTRAL',
            shape: 'OVAL'
        },
        apparel: {
            top: 'DEFAULT',
            bottom: 'DEFAULT',
            shoes: 'DEFAULT'
        }
    });

    const updateAppearance = (key: keyof AvatarAppearance, value: any) => {
        setAppearance(prev => ({ ...prev, [key]: value }));
    };

    const updateFeature = (key: keyof AvatarAppearance['faceFeatures'], value: string) => {
        setAppearance(prev => ({
            ...prev,
            faceFeatures: { ...prev.faceFeatures, [key]: value }
        }));
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 w-full max-w-5xl animate-fade-in">
            {/* Preview Section */}
            <div className="lg:w-1/2 flex flex-col items-center justify-center glass-panel p-8 relative min-h-[400px]">
                <div className="absolute top-4 left-4 text-[10px] font-['Press_Start_2P'] text-blue-400 opacity-50">
                    LIVE_PREVIEW_v2.0
                </div>

                {/* Visual Representation (Simplified CSS/SVG for now) */}
                <div className="avatar-preview-container relative w-64 h-80 flex items-center justify-center">
                    {/* Shadow */}
                    <div className="absolute bottom-0 w-32 h-8 bg-black/20 rounded-full blur-md" />

                    {/* Avatar Body */}
                    <div className={`relative flex flex-col items-center transition-all duration-300 ${appearance.bodyType === 'HEAVY' ? 'scale-110' : appearance.bodyType === 'SLIM' ? 'scale-90' : 'scale-100'}`}>
                        {/* Head */}
                        <div
                            className="w-24 h-28 rounded-3xl border-4 border-black/80 relative z-20 shadow-2xl"
                            style={{ backgroundColor: appearance.skinTone, borderRadius: appearance.faceFeatures.shape === 'SQUARE' ? '8px' : appearance.faceFeatures.shape === 'OVAL' ? '40px' : '50%' }}
                        >
                            {/* Hair Rendering */}
                            {appearance.hairStyle !== 'BALD' && (
                                <div
                                    className={`absolute -top-4 -left-2 w-28 ${appearance.gender === 'FEMALE' && appearance.hairStyle === 'LONG' ? 'h-32' : 'h-12'} z-10 transition-all duration-500`}
                                    style={{
                                        backgroundColor: appearance.hairColor,
                                        borderTopLeftRadius: '24px',
                                        borderTopRightRadius: '24px',
                                        borderBottomLeftRadius: appearance.gender === 'FEMALE' && appearance.hairStyle === 'LONG' ? '12px' : '0',
                                        borderBottomRightRadius: appearance.gender === 'FEMALE' && appearance.hairStyle === 'LONG' ? '12px' : '0'
                                    }}
                                >
                                    {appearance.hairStyle === 'MOHAWK' && (
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-8 h-12 bg-inherit rounded-t-full border-t-2 border-black/20" />
                                    )}
                                    {appearance.hairStyle === 'SPIKY' && (
                                        <div className="absolute -top-6 left-0 w-full h-8 flex justify-around">
                                            {[1, 2, 3, 4].map(i => <div key={i} className="w-4 h-8 bg-inherit rotate-45 rounded-t-lg" />)}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Eyes */}
                            <div className="absolute top-10 left-4 right-4 flex justify-between px-1">
                                <div className="flex flex-col items-center">
                                    <div className={`w-4 h-4 bg-white rounded-full flex items-center justify-center border border-black/10`}>
                                        <div className={`w-2 h-2 bg-black rounded-full ${appearance.faceFeatures.eyes === 'SQUINT' ? 'scale-y-[0.3]' : appearance.faceFeatures.eyes === 'COOL' ? 'bg-blue-900' : ''}`} />
                                    </div>
                                    {appearance.gender === 'FEMALE' && <div className="w-5 h-1 bg-black/40 rounded-full mt-[-2px]" />}
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className={`w-4 h-4 bg-white rounded-full flex items-center justify-center border border-black/10`}>
                                        <div className={`w-2 h-2 bg-black rounded-full ${appearance.faceFeatures.eyes === 'SQUINT' ? 'scale-y-[0.3]' : appearance.faceFeatures.eyes === 'COOL' ? 'bg-blue-900' : ''}`} />
                                    </div>
                                    {appearance.gender === 'FEMALE' && <div className="w-5 h-1 bg-black/40 rounded-full mt-[-2px]" />}
                                </div>
                            </div>

                            {/* Nose */}
                            <div
                                className="absolute top-16 left-1/2 -translate-x-1/2 w-3 h-4 bg-black/5 rounded-full border-b border-black/10"
                                style={{ transform: `translateX(-50%) ${appearance.faceFeatures.nose === 'POINTY' ? 'skewY(-10deg)' : ''}` }}
                            />

                            {/* Mouth */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
                                {appearance.faceFeatures.mouth === 'SMILE' ? (
                                    <div className="w-10 h-5 border-b-4 border-black/20 rounded-full" />
                                ) : (
                                    <div className="w-8 h-1.5 bg-black/20 rounded-full" />
                                )}
                                {appearance.gender === 'FEMALE' && <div className="w-6 h-1 bg-pink-400/30 rounded-full mt-1" />}
                            </div>
                        </div>

                        {/* Torso & Body Shaping */}
                        <div
                            className={`h-44 -mt-2 border-x-4 border-t-4 border-black/80 relative flex justify-center transition-all duration-500
                                ${appearance.gender === 'FEMALE' ? 'rounded-t-[40px] rounded-b-[20px]' : 'rounded-t-2xl'}
                                ${appearance.bodyType === 'HEAVY' ? 'w-44' : appearance.bodyType === 'SLIM' ? 'w-24' : 'w-36'}`}
                            style={{
                                backgroundColor: '#4834d4',
                                clipPath: appearance.gender === 'FEMALE'
                                    ? 'polygon(10% 0%, 90% 0%, 100% 40%, 85% 100%, 15% 100%, 0% 40%)'
                                    : 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'
                            }}
                        >
                            <div className="w-full h-full opacity-10 flex flex-col justify-around p-4">
                                <div className="w-full h-1 bg-white" />
                                <div className="w-full h-1 bg-white" />
                                <div className="w-full h-1 bg-white" />
                            </div>

                            {/* Neck */}
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-6 border-x-2 border-black/20" style={{ backgroundColor: appearance.skinTone }} />
                        </div>

                        {/* Legs */}
                        <div className="flex gap-2 w-full justify-center -mt-1">
                            <div className={`h-24 bg-[#1a1c29] border-4 border-black rounded-b-xl ${appearance.bodyType === 'HEAVY' ? 'w-16' : 'w-12'}`} />
                            <div className={`h-24 bg-[#1a1c29] border-4 border-black rounded-b-xl ${appearance.bodyType === 'HEAVY' ? 'w-16' : 'w-12'}`} />
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex gap-4">
                    <button
                        onClick={() => updateAppearance('gender', 'MALE')}
                        className={`px-4 py-2 text-[10px] font-['Press_Start_2P'] rounded-lg transition-all ${appearance.gender === 'MALE' ? 'bg-blue-600 shadow-blue-glow' : 'bg-white/5'}`}
                    >
                        MALE
                    </button>
                    <button
                        onClick={() => updateAppearance('gender', 'FEMALE')}
                        className={`px-4 py-2 text-[10px] font-['Press_Start_2P'] rounded-lg transition-all ${appearance.gender === 'FEMALE' ? 'bg-pink-600 shadow-pink-glow' : 'bg-white/5'}`}
                    >
                        FEMALE
                    </button>
                </div>
            </div>

            {/* Controls Section */}
            <div className="lg:w-1/2 glass-panel p-8 overflow-y-auto max-h-[600px] custom-scrollbar">
                <div className="space-y-8">
                    {/* Head & Features */}
                    <div>
                        <h3 className="text-[10px] font-['Press_Start_2P'] text-purple-400 mb-6 flex items-center gap-2">
                            <span>👤</span> HEAD_&_FEATURES
                        </h3>

                        <div className="space-y-6">
                            {/* Hair Style */}
                            <div className="space-y-3">
                                <label className="text-[8px] font-['Press_Start_2P'] text-gray-500">HAIR_STYLE</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {FEATURES.hairStyle.map(style => (
                                        <button
                                            key={style}
                                            onClick={() => updateAppearance('hairStyle', style)}
                                            className={`py-2 text-[8px] font-['Press_Start_2P'] rounded border border-white/10 ${appearance.hairStyle === style ? 'bg-white/20 border-white/50' : 'bg-white/5 hover:bg-white/10'}`}
                                        >
                                            {style}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Hair Color */}
                            <div className="space-y-3">
                                <label className="text-[8px] font-['Press_Start_2P'] text-gray-500">HAIR_COLOR</label>
                                <div className="flex flex-wrap gap-2">
                                    {COLORS.hair.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => updateAppearance('hairColor', color)}
                                            className={`w-8 h-8 rounded-full border-2 ${appearance.hairColor === color ? 'border-white scale-110 shadow-glow' : 'border-transparent'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Skin Tone */}
                            <div className="space-y-3">
                                <label className="text-[8px] font-['Press_Start_2P'] text-gray-500">SKIN_TONE</label>
                                <div className="flex flex-wrap gap-2">
                                    {COLORS.skin.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => updateAppearance('skinTone', color)}
                                            className={`w-8 h-8 rounded-full border-2 ${appearance.skinTone === color ? 'border-white scale-110 shadow-glow' : 'border-transparent'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Body Type */}
                    <div>
                        <h3 className="text-[10px] font-['Press_Start_2P'] text-emerald-400 mb-6 flex items-center gap-2">
                            <span>💪</span> PHYSIQUE
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                            {FEATURES.bodyType.map(type => (
                                <button
                                    key={type}
                                    onClick={() => updateAppearance('bodyType', type)}
                                    className={`py-3 text-[8px] font-['Press_Start_2P'] rounded border border-white/10 ${appearance.bodyType === type ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300' : 'bg-white/5'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-12 flex gap-4 sticky bottom-0 bg-[#0a0a0c]/80 backdrop-blur-md pt-4">
                    <button
                        onClick={() => onSave(appearance)}
                        className="flex-1 btn-gold py-4 rounded-xl font-['Press_Start_2P'] text-[10px] shadow-gold-glow animate-pulse-glow"
                    >
                        CONFIRM_PROFILE
                    </button>
                    <button
                        onClick={onCancel}
                        className="px-6 py-4 bg-white/5 rounded-xl font-['Press_Start_2P'] text-[10px] text-gray-500 hover:text-white transition-colors"
                    >
                        CANCEL
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AvatarDesigner;

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { Ball, Pin, GameState, Particle, Spectator, PlayerProfile } from '../types';
import {
    CANVAS_WIDTH, CANVAS_HEIGHT, LANE_WIDTH, LANE_COLOR, LANE_BORDER_COLOR,
    GUTTER_COLOR, PIN_RADIUS, PIN_COLOR, PIN_STRIPE_COLOR, BALL_COLOR,
    BALL_RETURN_WIDTH, BALL_START_Y, HEAD_PIN_Y, GUTTER_WIDTH,
    PERSPECTIVE_MIN_SCALE, PERSPECTIVE_MAX_SCALE, PERSPECTIVE_TILT_X
} from '../constants';

interface GameCanvasProps {
    canvasRef: React.RefObject<HTMLCanvasElement>;
    ball: Ball;
    pins: Pin[];
    trail: { x: number, y: number, speed: number }[];
    particles: Particle[];
    gameState: GameState;
    ballImage: HTMLImageElement;
    spectators?: Spectator[];
    laneCondition?: 'NORMAL' | 'DRY' | 'OILY';
    isZoomed?: boolean;
    equippedOutfitId?: string;
    equippedItems?: string[];
    showAimLine?: boolean;

    aimOscillation?: number;
    powerOscillation?: number;
    throwStep?: string;
    screenShake?: number;
    playerProfile?: PlayerProfile;
    onClickBowler?: () => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({
    canvasRef, ball, pins, trail, particles, gameState, ballImage, spectators = [], laneCondition = 'NORMAL', isZoomed = false, equippedOutfitId, equippedItems = [], showAimLine = false,
    aimOscillation = 0, powerOscillation = 0.8, throwStep = 'POSITION', screenShake = 0, playerProfile, onClickBowler
}) => {

    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

    // --- VANISHING POINT PROJECTION HELPER ---
    const project = (x: number, y: number) => {
        // Perspective params
        // y=0 (Top, near pins) should be narrow (PERSPECTIVE_MIN_SCALE)
        // y=CANVAS_HEIGHT (Bottom, near player) should be wide (PERSPECTIVE_MAX_SCALE)

        // Normalized Y from 0 (top) to 1 (bottom) based on logical game coordinates
        const normalizedY = Math.min(1.2, Math.max(-0.2, y / CANVAS_HEIGHT));

        // Linear interpolation for scale
        const scale = PERSPECTIVE_MIN_SCALE + (PERSPECTIVE_MAX_SCALE - PERSPECTIVE_MIN_SCALE) * normalizedY;

        // Tilt Logic (V1.5):
        // Shift lane to bottom-left area and top-right area
        const tiltOffset = (0.2 * CANVAS_WIDTH) - (normalizedY * 0.5 * CANVAS_WIDTH);

        // Center of view
        const cx = CANVAS_WIDTH / 2;

        // Projected X: Scale distance from center + tilt offset
        const px = cx + (x - cx) * scale + tiltOffset;

        // Projected Y: Map logical Y to canvas height
        const py = normalizedY * CANVAS_HEIGHT;

        return { x: px, y: py, scale };
    };

    const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

    // Procedural Lane Scuffs & Wood Knots
    const scuffs = useMemo(() => {
        const items = [];
        const laneX = (CANVAS_WIDTH - LANE_WIDTH) / 2;
        for (let i = 0; i < 100; i++) {
            items.push({
                x: laneX + Math.random() * LANE_WIDTH,
                y: Math.random() * CANVAS_HEIGHT,
                w: 2 + Math.random() * 15,
                h: 1 + Math.random() * 1.5,
                opacity: 0.01 + Math.random() * 0.04,
                color: Math.random() > 0.8 ? '#4a3728' : '#000'
            });
        }
        return items;
    }, []);

    // High-Fidelity Wood Texture (Cached)
    const woodPattern = useMemo(() => {
        if (typeof document === 'undefined') return null;
        const c = document.createElement('canvas');
        c.width = LANE_WIDTH;
        c.height = 1024;
        const ctx = c.getContext('2d');
        if (!ctx) return null;

        // Base Wood
        const woodGradient = ctx.createLinearGradient(0, 0, LANE_WIDTH, 0);
        woodGradient.addColorStop(0, '#eaccad');
        woodGradient.addColorStop(0.2, '#d6a87c');
        woodGradient.addColorStop(0.5, '#cba274');
        woodGradient.addColorStop(0.8, '#d6a87c');
        woodGradient.addColorStop(1, '#eaccad');
        ctx.fillStyle = woodGradient;
        ctx.fillRect(0, 0, c.width, c.height);

        // 39 Boards (Standard Bowling Lane)
        const boardWidth = LANE_WIDTH / 39;
        for (let i = 0; i < 39; i++) {
            // Alternating slight shades
            if (i % 2 === 0) {
                ctx.fillStyle = 'rgba(0,0,0,0.03)';
                ctx.fillRect(i * boardWidth, 0, boardWidth, c.height);
            }

            // Side gaps
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.fillRect(i * boardWidth, 0, 1, c.height);

            // Wood Grain Noise (Vertical streaks)
            for (let j = 0; j < 10; j++) {
                ctx.fillStyle = Math.random() > 0.5 ? 'rgba(74, 55, 40, 0.05)' : 'rgba(255,255,255,0.05)';
                const streakW = 1 + Math.random() * 2;
                const streakX = i * boardWidth + Math.random() * (boardWidth - streakW);
                ctx.fillRect(streakX, 0, streakW, c.height);
            }
        }

        return c;
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const updateSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            ctxRef.current = canvas.getContext('2d', { alpha: false });
            setDimensions({ width: window.innerWidth, height: window.innerHeight });
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, [canvasRef]);

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas || !onClickBowler) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Visual position of the bowler base
        const { x: projX, y: projY, scale: projScale } = project(ball.x, ball.y + 40);

        // Convert projection to actual canvas pixels
        const resizeScale = Math.min(canvas.width / CANVAS_WIDTH, canvas.height / CANVAS_HEIGHT);
        const offsetX = (canvas.width - CANVAS_WIDTH * resizeScale) / 2;
        const offsetY = (canvas.height - CANVAS_HEIGHT * resizeScale) / 2;

        const visualX = projX * resizeScale + offsetX;
        const visualY = projY * resizeScale + offsetY;

        const dist = Math.sqrt(Math.pow(mouseX - visualX, 2) + Math.pow(mouseY - visualY, 2));

        // Hitbox scales with perspective
        if (dist < 100 * projScale * resizeScale) {
            onClickBowler();
        }
    };

    const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        // High-fidelity Arena Background
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, width, height);

        const time = Date.now() / 4000;

        // Atmospheric Glow
        const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.8);
        bgGrad.addColorStop(0, 'rgba(79, 70, 229, 0.08)'); // Indigo glow
        bgGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Volumetric Spotlights (Modern Look)
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        for (let i = 0; i < 4; i++) {
            const angle = (Math.sin(time + i * 1.5) * 0.15);
            const x = width / 2 + (i - 1.5) * (width * 0.25);

            ctx.save();
            ctx.translate(x, -100);
            ctx.rotate(angle);

            const beamGrad = ctx.createLinearGradient(0, 0, 0, height);
            beamGrad.addColorStop(0, `rgba(139, 92, 246, 0.2)`);
            beamGrad.addColorStop(0.5, `rgba(139, 92, 246, 0.05)`);
            beamGrad.addColorStop(1, 'transparent');

            ctx.fillStyle = beamGrad;
            ctx.beginPath();
            ctx.moveTo(-100, 0);
            ctx.lineTo(100, 0);
            ctx.lineTo(400, height);
            ctx.lineTo(-400, height);
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();

        // Subtle Grid for floor depth
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 10; i++) {
            const gy = (height * 0.5) + (i * i * 5);
            ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(width, gy); ctx.stroke();
        }
    };

    const drawBowler = (ctx: CanvasRenderingContext2D, lx: number, ly: number, isHoldingBall: boolean, gameState: GameState, angle: number) => {
        const { x, y, scale } = project(lx, ly);
        const isRolling = gameState === 'ROLLING';
        const time = Date.now();
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.rotate(angle * (Math.PI / 180) * 0.1);

        // Modern Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.ellipse(0, 15, 30, 10, 0, 0, Math.PI * 2); ctx.fill();

        const animY = isRolling ? Math.abs(Math.sin(time / 120)) * 6 : 0;
        ctx.translate(0, -animY);

        let primaryColor = '#4f46e5';
        let accentColor = '#818cf8';

        const appearance = playerProfile?.avatar;
        const skinTone = appearance?.skinTone || '#ffdbac';
        const hairColor = appearance?.hairColor || '#4b2c20';
        const isFemale = appearance?.gender === 'FEMALE';

        // --- MODERN VECTOR BOWLER (V2.0) ---
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // 1. LEGS (Smooth paths)
        ctx.fillStyle = '#111';
        ctx.beginPath();
        if (isFemale) {
            ctx.roundRect(-8, -5, 7, 18, [0, 0, 5, 5]);
            ctx.roundRect(1, -5, 7, 18, [0, 0, 5, 5]);
        } else {
            ctx.roundRect(-10, -5, 9, 15, 4);
            ctx.roundRect(1, -5, 9, 15, 4);
        }
        ctx.fill();

        // 2. TORSO (Gender-specific silhouette)
        const bodyGrad = ctx.createLinearGradient(-15, -30, 15, -30);
        bodyGrad.addColorStop(0, primaryColor);
        bodyGrad.addColorStop(1, accentColor);
        ctx.fillStyle = bodyGrad;

        ctx.beginPath();
        if (isFemale) {
            // Hourglass/Curved silhouette
            ctx.moveTo(-10, -35);
            ctx.quadraticCurveTo(-14, -25, -8, -10); // Left curve
            ctx.lineTo(8, -10);
            ctx.quadraticCurveTo(14, -25, 10, -35); // Right curve
            ctx.closePath();
        } else {
            // Broad shoulders silhouette
            ctx.roundRect(-14, -38, 28, 33, [10, 10, 5, 5]);
        }
        ctx.fill();

        // 3. ARMS
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 10;
        if (isHoldingBall) {
            // Right arm holding ball
            ctx.beginPath();
            ctx.moveTo(isFemale ? 10 : 12, -28);
            ctx.lineTo(25, -24);
            ctx.stroke();
            // Hand
            ctx.fillStyle = skinTone;
            ctx.beginPath(); ctx.arc(28, -24, 6, 0, Math.PI * 2); ctx.fill();
        } else {
            const swing = Math.sin(time / 200) * 15;
            ctx.beginPath(); ctx.moveTo(isFemale ? -10 : -12, -28); ctx.lineTo(-18, -12 + swing); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(isFemale ? 10 : 12, -28); ctx.lineTo(18, -12 - swing); ctx.stroke();
        }

        // 4. HEAD & HAIR
        // Hair (Background part for long hair)
        if (isFemale && appearance?.hairStyle !== 'BALD') {
            ctx.fillStyle = hairColor;
            ctx.beginPath();
            ctx.roundRect(-15, -60, 30, 45, [15, 15, 5, 5]);
            ctx.fill();
        }

        // Face
        ctx.fillStyle = skinTone;
        ctx.beginPath();
        ctx.arc(0, -48, 14, 0, Math.PI * 2);
        ctx.fill();

        // Hair (Foreground/Top part)
        ctx.fillStyle = hairColor;
        if (appearance?.hairStyle === 'MOHAWK') {
            ctx.beginPath();
            ctx.roundRect(-3, -75, 6, 25, 4);
            ctx.fill();
        } else if (appearance?.hairStyle === 'SPIKY') {
            ctx.beginPath();
            for (let i = -12; i < 12; i += 6) {
                ctx.moveTo(i, -58); ctx.lineTo(i + 3, -68); ctx.lineTo(i + 6, -58);
            }
            ctx.fill();
        } else if (appearance?.hairStyle !== 'BALD') {
            ctx.beginPath();
            ctx.arc(0, -52, 14, Math.PI, 0);
            ctx.fill();
        }

        // Eyes (Detailed)
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(-5, -48, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(5, -48, 2, 0, Math.PI * 2); ctx.fill();
        if (isFemale) {
            // Simple eyelashes
            ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(-7, -50); ctx.lineTo(-9, -52); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(7, -50); ctx.lineTo(9, -52); ctx.stroke();
        }

        ctx.restore();
    };

    const drawReflections = (ctx: CanvasRenderingContext2D) => {
        pins.forEach(pin => {
            if (pin.isDown) return;
            const { x, y, scale } = project(pin.x, pin.y - 40); // Offset up for reflection
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale * 0.3); // Flatten
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = '#e6e6e6';
            ctx.shadowBlur = 10; ctx.shadowColor = '#fff';
            ctx.beginPath(); ctx.arc(0, 0, PIN_RADIUS, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        });
    };

    const drawPin = (ctx: CanvasRenderingContext2D, pin: Pin) => {
        const { x, y, scale } = project(pin.x, pin.y);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(pin.angle);
        ctx.globalAlpha = pin.isDown ? 0.3 : 1.0;

        ctx.scale(scale, scale);

        // 1. Drop Shadow (Soft Realism)
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 15; ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.beginPath(); ctx.ellipse(0, 8, PIN_RADIUS * 0.7, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        // 2. Pin Body Shape (Path)
        const createPinPath = () => {
            ctx.beginPath();
            ctx.moveTo(0, -PIN_RADIUS * 1.5); // Top center
            // Neck
            ctx.bezierCurveTo(PIN_RADIUS * 0.7, -PIN_RADIUS * 1.5, PIN_RADIUS * 0.9, -PIN_RADIUS * 0.6, PIN_RADIUS, 0); // Shoulder
            // Belly
            ctx.bezierCurveTo(PIN_RADIUS * 1.05, PIN_RADIUS * 0.8, -PIN_RADIUS * 1.05, PIN_RADIUS * 0.8, -PIN_RADIUS, 0);
            // Other Shoulder
            ctx.bezierCurveTo(-PIN_RADIUS * 0.9, -PIN_RADIUS * 0.6, -PIN_RADIUS * 0.7, -PIN_RADIUS * 1.5, 0, -PIN_RADIUS * 1.5);
            ctx.closePath();
        };

        // 3. Main Gradient with Rim Lighting
        const pGrad = ctx.createLinearGradient(-PIN_RADIUS, -PIN_RADIUS, PIN_RADIUS, PIN_RADIUS);
        pGrad.addColorStop(0.0, '#ffffff'); // Light source
        pGrad.addColorStop(0.3, '#f1f2f6'); // Base
        pGrad.addColorStop(0.7, '#ced6e0'); // Deep shadow
        pGrad.addColorStop(1.0, '#747d8c'); // Rim shade

        ctx.fillStyle = pGrad;
        createPinPath();
        ctx.fill();

        // 4. Dual Stripes (Curved)
        const drawStripe = (yPercent: number, h: number) => {
            ctx.save();
            ctx.fillStyle = '#ff4757';
            ctx.beginPath();
            ctx.ellipse(0, -PIN_RADIUS * yPercent, PIN_RADIUS * 0.8, h, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        };

        ctx.save();
        ctx.clip(); // Clip stripes to body
        drawStripe(0.8, 4);
        drawStripe(0.5, 4);
        ctx.restore();

        // 5. Specular Highlights
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.ellipse(-PIN_RADIUS * 0.3, -PIN_RADIUS * 1.0, 3, 6, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        // 6. Outline
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        createPinPath();
        ctx.stroke();

        ctx.restore();
    };

    const drawSweeper = (ctx: CanvasRenderingContext2D, y: number) => {
        const { x, y: py, scale } = project(CANVAS_WIDTH / 2, y);
        const w = (LANE_WIDTH + 40) * scale;
        ctx.save();
        ctx.translate(x, py);
        ctx.shadowBlur = 10; ctx.shadowColor = '#000';
        ctx.fillStyle = '#2d3436';
        ctx.fillRect(-w / 2, 0, w, 20 * scale);
        ctx.fillStyle = '#636e72';
        ctx.fillRect(-w / 2, 5 * scale, w, 10 * scale);
        ctx.restore();
    };

    const drawBallReturn = (ctx: CanvasRenderingContext2D) => {
        const laneX = (CANVAS_WIDTH - LANE_WIDTH) / 2;
        const trackX = laneX - GUTTER_WIDTH - 20;
        const machineY = BALL_START_Y - 40;
        const { x: pmX, y: pmY, scale: pmScale } = project(trackX, machineY);

        ctx.save();
        ctx.translate(pmX, pmY);
        ctx.scale(pmScale, pmScale);

        const machineH = 120;
        const machineW = 50;
        const machineGrad = ctx.createLinearGradient(-machineW / 2, 0, machineW / 2, 0);
        machineGrad.addColorStop(0, '#1a1a1a');
        machineGrad.addColorStop(0.5, '#454545');
        machineGrad.addColorStop(1, '#1a1a1a');
        ctx.fillStyle = machineGrad;
        ctx.beginPath();
        ctx.roundRect(-machineW / 2, 0, machineW, machineH, 12);
        ctx.fill();

        ctx.strokeStyle = '#666'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#050505'; ctx.beginPath(); ctx.arc(0, 35, 18, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#0fbcf9'; ctx.lineWidth = 1; ctx.stroke();
        ctx.restore();

        // Tracks leading up the lane
        const pStart = project(trackX, 0);
        const pEnd = project(trackX, machineY);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pStart.x - 10 * pStart.scale, pStart.y);
        ctx.lineTo(pEnd.x - 10 * pEnd.scale, pEnd.y);
        ctx.lineTo(pEnd.x + 10 * pEnd.scale, pEnd.y);
        ctx.lineTo(pStart.x + 10 * pStart.scale, pStart.y);
        ctx.fillStyle = '#222';
        ctx.fill();
        ctx.restore();
    };

    useEffect(() => {
        const ctx = ctxRef.current;
        const canvas = canvasRef.current;
        if (!ctx || !canvas) return;

        drawBackground(ctx, canvas.width, canvas.height);

        const scale = Math.min(canvas.width / CANVAS_WIDTH, canvas.height / CANVAS_HEIGHT);
        const scaledWidth = CANVAS_WIDTH * scale;
        const scaledHeight = CANVAS_HEIGHT * scale;

        const offsetX = (canvas.width - scaledWidth) / 2 + (Math.random() - 0.5) * screenShake * 2;
        const offsetY = (canvas.height - scaledHeight) / 2 + (Math.random() - 0.5) * screenShake * 2;

        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);

        const time = Date.now();
        const logoTime = time / 1500;
        const neonGlow = Math.abs(Math.sin(logoTime)) * 25 + 15;

        ctx.save();
        ctx.font = 'bold 60px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const logoX = CANVAS_WIDTH * 0.5;
        const logoY = 60;

        ctx.fillStyle = '#0fbcf9';
        ctx.shadowColor = '#0fbcf9';
        ctx.shadowBlur = neonGlow;
        ctx.fillText("LANE", logoX - 140, logoY);

        ctx.fillStyle = '#f53b57';
        ctx.shadowColor = '#f53b57';
        ctx.shadowBlur = neonGlow;
        ctx.fillText("SHARK 2", logoX + 80, logoY);
        ctx.restore();

        if (isZoomed) {
            const zoomCx = CANVAS_WIDTH / 2;
            const zoomCy = HEAD_PIN_Y - 50;
            const scale = 1.7;
            ctx.translate(zoomCx, zoomCy); ctx.scale(scale, scale); ctx.translate(-zoomCx, -zoomCy);
        }

        const laneX = (CANVAS_WIDTH - LANE_WIDTH) / 2;
        const rightGutterX = laneX + LANE_WIDTH;

        // -- DRAW TRAPEZOIDAL LANE & GUTTERS --
        // Perspective Corners
        const pTL = project(laneX - GUTTER_WIDTH, 0);
        const pTR = project(rightGutterX + GUTTER_WIDTH, 0);
        const pBL = project(laneX - GUTTER_WIDTH, CANVAS_HEIGHT);
        const pBR = project(rightGutterX + GUTTER_WIDTH, CANVAS_HEIGHT);

        const pLTL = project(laneX, 0);
        const pLTR = project(rightGutterX, 0);
        const pLBL = project(laneX, CANVAS_HEIGHT);
        const pLBR = project(rightGutterX, CANVAS_HEIGHT);

        // 1. Gutters (Dark Base)
        ctx.fillStyle = '#111';
        // Left Gutter
        ctx.beginPath();
        ctx.moveTo(pTL.x, pTL.y); ctx.lineTo(pLTL.x, pLTL.y); ctx.lineTo(pLBL.x, pLBL.y); ctx.lineTo(pBL.x, pBL.y);
        ctx.fill();
        // Right Gutter
        ctx.beginPath();
        ctx.moveTo(pTR.x, pTR.y); ctx.lineTo(pLTR.x, pLTR.y); ctx.lineTo(pLBR.x, pLBR.y); ctx.lineTo(pBR.x, pBR.y);
        ctx.fill();

        // 2. Pin Deck (Top area)
        const pDeckY = 150;
        const pDTL = project(laneX, 0);
        const pDTR = project(rightGutterX, 0);
        const pDBL = project(laneX, pDeckY);
        const pDBR = project(rightGutterX, pDeckY);

        ctx.fillStyle = '#1e1e1e';
        ctx.beginPath();
        ctx.moveTo(pDTL.x, pDTL.y); ctx.lineTo(pDTR.x, pDTR.y); ctx.lineTo(pDBR.x, pDBR.y); ctx.lineTo(pDBL.x, pDBL.y);
        ctx.fill();

        // 3. Wood Lane Surface
        const woodGrad = ctx.createLinearGradient(pLBL.x, 0, pLBR.x, 0);
        woodGrad.addColorStop(0, '#63442a');
        woodGrad.addColorStop(0.3, '#8e5d2b');
        woodGrad.addColorStop(0.5, '#d2a679');
        woodGrad.addColorStop(0.7, '#8e5d2b');
        woodGrad.addColorStop(1, '#63442a');
        ctx.fillStyle = woodGrad;

        ctx.beginPath();
        ctx.moveTo(pLTL.x, pLTL.y); ctx.lineTo(pLTR.x, pLTR.y); ctx.lineTo(pLBR.x, pLBR.y); ctx.lineTo(pLBL.x, pLBL.y);
        ctx.fill();

        // Lane Clipping for Pattern/Reflections/Arrows
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pLTL.x, pLTL.y); ctx.lineTo(pLTR.x, pLTR.y); ctx.lineTo(pLBR.x, pLBR.y); ctx.lineTo(pLBL.x, pLBL.y);
        ctx.clip();

        // Apply Wood Pattern (Overlaid)
        if (woodPattern) {
            ctx.save();
            ctx.globalCompositeOperation = 'overlay';
            ctx.globalAlpha = 0.5;
            const pattern = ctx.createPattern(woodPattern, 'repeat');
            if (pattern) {
                ctx.fillStyle = pattern;
                ctx.fillRect(0, 0, CANVAS_WIDTH * 2, CANVAS_HEIGHT);
            }
            ctx.restore();
        }

        // 4. Lane Arrows (Projected)
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        for (let i = 1; i <= 5; i++) {
            const arrowX = laneX + (LANE_WIDTH / 6) * i;
            const arrowY = 300;
            const p = project(arrowX, arrowY);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - 5 * p.scale, p.y - 20 * p.scale);
            ctx.lineTo(p.x + 5 * p.scale, p.y - 20 * p.scale);
            ctx.fill();
        }

        drawReflections(ctx);

        // 5. Board Lines (Projected)
        ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 1; i <= 15; i++) {
            const bx = laneX + (LANE_WIDTH / 15) * i;
            const pTop = project(bx, 0);
            const pBot = project(bx, CANVAS_HEIGHT);
            ctx.moveTo(pTop.x, pTop.y); ctx.lineTo(pBot.x, pBot.y);
        }
        ctx.stroke();

        ctx.restore(); // End clipping

        drawBallReturn(ctx);

        // 6. Ball Emission Glow
        if (gameState === 'ROLLING') {
            const { x, y, scale } = project(ball.x, ball.y);
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            const ballGlow = ctx.createRadialGradient(x, y, 0, x, y, 150 * scale);
            ballGlow.addColorStop(0, 'rgba(96, 165, 250, 0.35)');
            ballGlow.addColorStop(0.5, 'rgba(96, 165, 250, 0.05)');
            ballGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = ballGlow;
            ctx.fillRect(0, 0, CANVAS_WIDTH * 2, CANVAS_HEIGHT);
            ctx.restore();
        }

        // 7. Spectators (Projected)
        spectators.forEach(spec => {
            const { x, y, scale } = project(spec.x, spec.y);
            ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
            const jump = (spec.state === 'CHEER') ? Math.abs(Math.sin(time * 6 + spec.id)) * 14 : 0;
            ctx.translate(0, -jump);
            ctx.shadowBlur = 12; ctx.shadowColor = spec.color;
            ctx.fillStyle = spec.color;
            ctx.beginPath(); ctx.roundRect(-14, 5, 28, 24, 8); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffdbac';
            ctx.beginPath(); ctx.arc(0, -5, 12, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        });

        // 8. Pins (Projected)
        pins.forEach(p => drawPin(ctx, p));

        // 9. Trail (Projected)
        if (gameState === 'ROLLING' && trail.length > 2) {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.beginPath();
            trail.forEach((p, i) => {
                const proj = project(p.x, p.y);
                if (i === 0) ctx.moveTo(proj.x, proj.y);
                else ctx.lineTo(proj.x, proj.y);
            });
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
            ctx.lineWidth = ball.radius * 0.5;
            ctx.stroke();
            ctx.restore();
        }

        // 10. Particles (Projected)
        particles.forEach(p => {
            const proj = project(p.x, p.y);
            const safeLife = Math.max(0, p.life);
            ctx.save();
            ctx.translate(proj.x, proj.y);
            ctx.scale(proj.scale, proj.scale);
            ctx.globalAlpha = safeLife;
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(0, 0, 3 * safeLife, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        });

        // 11. Bowler & Ball (Projected)
        if (!['SPLASH', 'MENU', 'PLAYER_CREATOR'].includes(gameState)) {
            const isPreparing = (gameState === 'READY_TO_BOWL' || gameState === 'THROW_SEQUENCE');
            if (isPreparing) {
                drawBowler(ctx, ball.x, ball.y + 40, true, gameState, ball.angle);
            } else if (gameState === 'ROLLING' && ball.y > BALL_START_Y - 250) {
                drawBowler(ctx, ball.x, BALL_START_Y + 40, false, gameState, ball.angle);
            }

            const isHiddenInReturn = gameState === 'BALL_RETURN' && ball.x <= 30 && ball.y < BALL_START_Y - 40;
            if (!isHiddenInReturn) {
                const { x, y, scale } = project(ball.x, ball.y);
                ctx.save();
                ctx.translate(x, y);
                ctx.scale(scale, scale);

                // Shadows
                ctx.save(); ctx.translate(0, 15); ctx.scale(1, 0.3); ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.beginPath(); ctx.arc(0, 0, ball.radius, 0, Math.PI * 2); ctx.fill(); ctx.restore();

                // Ball Rotation
                if (gameState === 'ROLLING') {
                    ctx.rotate((ball.y / 50) * Math.PI * 2);
                }

                if (ballImage && ballImage.complete) {
                    ctx.save();
                    ctx.beginPath(); ctx.arc(0, 0, ball.radius, 0, Math.PI * 2); ctx.clip();
                    ctx.drawImage(ballImage, -ball.radius, -ball.radius, ball.radius * 2, ball.radius * 2);
                    ctx.restore();
                } else {
                    ctx.fillStyle = ball.material === 'RESIN' ? '#1e3a8a' : '#be123c';
                    ctx.beginPath(); ctx.arc(0, 0, ball.radius, 0, Math.PI * 2); ctx.fill();
                }
                ctx.restore();
            }
        }

        // 12. Aim Line / Throw Sequence (Projected)
        if (gameState === 'THROW_SEQUENCE') {
            const ballP = project(ball.x, ball.y);
            ctx.save(); ctx.translate(ballP.x, ballP.y);
            if (throwStep === 'AIM') {
                const aimAngle = aimOscillation * Math.PI * 0.25;
                ctx.rotate(aimAngle);
                ctx.strokeStyle = '#0fbcf9'; ctx.lineWidth = 10 * ballP.scale;
                ctx.setLineDash([20 * ballP.scale, 10 * ballP.scale]);
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -200 * ballP.scale); ctx.stroke();
            }
            if (throwStep === 'POWER') {
                const h = (powerOscillation / 1.5) * 120;
                ctx.translate(70 * ballP.scale, -60 * ballP.scale);
                ctx.scale(ballP.scale, ballP.scale);
                ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, 30, 120);
                ctx.fillStyle = '#f53b57'; ctx.fillRect(4, 120 - h, 22, h);
            }
            ctx.restore();
        }

        // 13. Sweeper Animation
        if (gameState === 'PIN_SETTLEMENT') {
            const sweepTime = Date.now();
            const sweepY = Math.abs(Math.sin(sweepTime / 500)) * 100;
            drawSweeper(ctx, sweepY);
        }

        ctx.restore();
    }, [ball, pins, trail, particles, gameState, ballImage, spectators, laneCondition, isZoomed, scuffs, equippedOutfitId, showAimLine, aimOscillation, powerOscillation, throwStep, screenShake, dimensions]);

    return <canvas ref={canvasRef} className="game-canvas-element" onClick={handleCanvasClick} style={{ width: '100%', height: '100%', display: 'block' }} />;
};

export default GameCanvas;

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useRef } from 'react';

export interface SwipeData {
    speed: number;
    angle: number;
    spin: number;
    distance: number;
}

export function useSwipeInput(onSwipeComplete?: (data: SwipeData) => void) {
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
    const startTimeRef = useRef<number>(0);

    const handleStart = useCallback((x: number, y: number) => {
        setIsDragging(true);
        setStartPos({ x, y });
        setCurrentPos({ x, y });
        startTimeRef.current = Date.now();
    }, []);

    const handleMove = useCallback((x: number, y: number) => {
        if (!isDragging) return;
        setCurrentPos({ x, y });
    }, [isDragging]);

    const handleEnd = useCallback((x: number, y: number) => {
        if (!isDragging) return;
        setIsDragging(false);

        const endTime = Date.now();
        const duration = (endTime - startTimeRef.current) / 1000; // seconds
        
        const dx = x - startPos.x;
        const dy = y - startPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // We only care about upward swipes for bowling
        // dy should be negative (upwards)
        if (dy < -20 && distance > 50) {
            // Speed: distance / duration (pixels per second)
            // Normalize to a reasonable game speed range (e.g., 5-25)
            const speed = Math.min(25, Math.max(5, distance / (duration * 100)));
            
            // Angle: relative horizontal displacement
            // -15 to 15 degrees based on dx/dy ratio
            let angle = (dx / Math.abs(dy)) * 30;
            angle = Math.min(20, Math.max(-20, angle));

            // Spin: horizontal movement during the swipe
            const spin = (dx / distance) * 0.5;

            if (onSwipeComplete) {
                onSwipeComplete({ speed, angle, spin, distance });
            }
        }
    }, [isDragging, startPos, onSwipeComplete]);

    return {
        isDragging,
        startPos,
        currentPos,
        handleStart,
        handleMove,
        handleEnd
    };
}

/**
 * LaneShark 2.0 - Core Engine
 * Architecture: Vanilla TS / High-Performance Canvas
 */

import { Engine } from './engine/Core';

// Initialize Game on Load
window.addEventListener('load', () => {
    console.log('SHARK_OS: Initializing Engine...');

    // Hide loading screen after a small delay for dramatic effect
    setTimeout(() => {
        const loader = document.getElementById('loading-screen');
        const hud = document.getElementById('hud-top');
        if (loader) loader.style.opacity = '0';
        if (hud) hud.style.opacity = '1';

        setTimeout(() => {
            if (loader) loader.style.display = 'none';
        }, 1000);
    }, 1500);

    // Bootstrap Game
    const canvas = document.getElementById('laneshark-canvas') as HTMLCanvasElement;
    const engine = new Engine(canvas);
    engine.start();
});

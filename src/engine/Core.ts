import { World } from './World';
import { Renderer } from './Renderer';
import { AssetLoader } from './AssetLoader';
import { PhysicsEngine, BallStats, BallPosition, BallVelocity } from './Physics';
import { CharacterCreator } from './features/CharacterCreator';
import { ProgressionManager } from './Progression';
import { ProShop } from './features/ProShop';
import { BALL_DATABASE } from './data/Balls';
import { TournamentManager } from './Tournament';
import { Avatar } from './Avatar';

export class Engine {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private lastTime: number = 0;

    // Core Modules
    private world: World;
    private renderer: Renderer;
    private assets: AssetLoader;
    private charCreator: CharacterCreator;
    private progression: ProgressionManager;
    private proShop: ProShop;
    private tournament: TournamentManager;

    // Player State
    private avatar: Avatar;

    // Simulation State
    private ballPos: BallPosition = { x: 0, y: 0, z: 20000 };
    private ballVel: BallVelocity = { x: 0, y: 0, z: 0 };
    private ballRot = 0;
    private ballStats: BallStats = {
        speed: 80,
        hook: 50,
        weight: 70,
        guide: 60,
        control: 50
    };

    private pins: { x: number, z: number, state: 'STANDING' | 'HIT' | 'DOWN' }[] = [];
    private score: number = 0;
    private isRolling = false;

    // Input State
    private startTouch = { x: 0, y: 0, time: 0 };

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) throw new Error('Render context failure');
        this.ctx = context;

        this.world = new World();
        this.renderer = new Renderer(this.ctx, this.canvas);
        this.assets = new AssetLoader();
        this.charCreator = new CharacterCreator();
        this.progression = new ProgressionManager();
        this.proShop = new ProShop(this.progression);
        this.tournament = new TournamentManager(this.progression);

        // Initialize Avatar from profile
        this.avatar = new Avatar(this.progression.getProfile().unlockedBalls.includes('base') ? {} as any : {} as any);
        // Note: Real initialization will happen in syncAvatar

        this.setupEventListeners();
        this.syncEquippedBall();
        this.syncAvatar();
        this.updateHUD();
        this.init();
    }

    private async init() {
        // Step 1: Initialize Rack
        this.setupPins();
        this.handleResize();

        // Step 2: Load Premium Sprites
        try {
            await this.assets.load({
                ball: './assets/ball_sprites.png',
                pin: './assets/pin_sprites.png'
            });
            this.renderer.setSprites(this.assets.get('ball'), this.assets.get('pin'));

            // Step 3: Boot Engine
            const prompt = document.getElementById('ui-prompt');
            if (prompt) {
                prompt.textContent = 'SWIPE UP TO ROLL';
                prompt.style.opacity = '1';
            }
            this.start();
        } catch (err) {
            console.error('Boot Error:', err);
        }
    }

    private setupPins() {
        this.pins = [];
        const spacing = 1000;
        const startZ = 2000;
        for (let row = 0; row < 4; row++) {
            for (let i = 0; i <= row; i++) {
                this.pins.push({
                    x: (i * spacing) - (row * spacing / 2),
                    z: startZ + (row * spacing * 0.85),
                    state: 'STANDING'
                });
            }
        }
    }

    private setupEventListeners() {
        window.addEventListener('resize', () => this.handleResize());

        // Flick/Swipe Input
        this.canvas.addEventListener('mousedown', (e) => this.inputStart(e.clientX, e.clientY));
        this.canvas.addEventListener('mouseup', (e) => this.inputEnd(e.clientX, e.clientY));
        this.canvas.addEventListener('touchstart', (e) => this.inputStart(e.touches[0].clientX, e.touches[0].clientY));
        this.canvas.addEventListener('touchend', (e) => this.inputEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY));

        // UI Triggers
        document.getElementById('btn-open-creator')?.addEventListener('click', () => this.charCreator.open());

        const scorecard = document.getElementById('scorecard-overlay');
        document.getElementById('btn-show-score')?.addEventListener('click', () => {
            scorecard?.classList.remove('hidden');
        });
        document.getElementById('btn-close-score')?.addEventListener('click', () => {
            scorecard?.classList.add('hidden');
        });

        document.getElementById('btn-show-shop')?.addEventListener('click', () => this.proShop.open());
    }

    private inputStart(x: number, y: number) {
        if (this.isRolling) return;
        this.startTouch = { x, y, time: Date.now() };
    }

    private inputEnd(x: number, y: number) {
        if (this.isRolling) return;

        const dx = x - this.startTouch.x;
        const dy = y - this.startTouch.y;
        const dt = Date.now() - this.startTouch.time;

        if (dy < -50 && dt < 300) {
            // High-speed flick detected
            const power = Math.min(25000, (Math.abs(dy) / dt) * 15000);
            this.ballVel.z = -power;
            this.ballVel.x = (dx / dt) * 500;
            this.isRolling = true;

            const prompt = document.getElementById('ui-prompt');
            if (prompt) prompt.style.opacity = '0';
        }
    }

    private handleResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    public start() {
        requestAnimationFrame((t) => this.loop(t));
    }

    private loop(time: number) {
        const dt = Math.min(0.1, (time - this.lastTime) / 1000);
        this.lastTime = time;

        this.update(dt);
        this.render();
        this.renderer.updateParticles(dt);

        requestAnimationFrame((t) => this.loop(t));
    }

    private update(dt: number) {
        if (this.isRolling) {
            // Use advanced physics simulation
            const next = PhysicsEngine.step(this.ballPos, this.ballVel, this.ballStats, dt);
            this.ballPos = next.pos;
            this.ballVel = next.vel;

            this.ballRot += (this.ballVel.z / 1000) * dt;

            // Cinematic Camera Follow: Smoothly slide camera toward ball
            // Only follow up to a certain point to keep pins in view
            const targetCameraZ = Math.max(8000, this.ballPos.z + 5000);
            this.world.cameraZ += (targetCameraZ - this.world.cameraZ) * 0.05;

            // Collision Detection with force threshold
            this.pins.forEach(pin => {
                if (pin.state === 'STANDING') {
                    const dist = Math.sqrt(Math.pow(this.ballPos.x - pin.x, 2) + Math.pow(this.ballPos.z - pin.z, 2));
                    if (PhysicsEngine.resolvePinCollision(this.ballVel, this.ballStats, dist)) {
                        pin.state = 'HIT';
                        const proj = this.world.project({ x: pin.x, y: 0, z: pin.z }, this.canvas);
                        this.renderer.emitSparks(proj.x, proj.y);

                        this.score += 10;
                        this.tournament.recordFrame(1, true); // Simplified reward trigger
                        this.updateHUD();
                    }
                }
            });

            // Update Real-time Analytics
            this.updateAnalytics();

            // Gutter Detection
            if (Math.abs(this.ballPos.x) > 1500 && this.ballPos.z < 18000) {
                // Ball in gutter
                console.log('SHARK_OS: GUTTER_BALL');
            }

            // End of lane
            if (this.ballPos.z < -2000) {
                this.resetBall();
            }
        }
    }

    private resetBall() {
        this.isRolling = false;
        setTimeout(() => {
            this.syncEquippedBall();
            this.ballPos = { x: 0, y: 0, z: 20000 };
            this.ballVel = { x: 0, y: 0, z: 0 };
            this.world.cameraZ = 25000; // Reset camera
            const prompt = document.getElementById('ui-prompt');
            if (prompt) {
                prompt.textContent = 'READY FOR NEXT FRAME';
                prompt.style.opacity = '1';
            }
        }, 1500);
    }

    private updateHUD() {
        const profile = this.progression.getProfile();
        const elScore = document.getElementById('ui-score');
        const elLevel = document.getElementById('ui-player-level');
        const elCoins = document.getElementById('ui-coins');
        const elGems = document.getElementById('ui-gems');

        if (elScore) elScore.textContent = this.score.toString().padStart(3, '0');
        if (elLevel) elLevel.textContent = `LV. ${profile.level}`;
        if (elCoins) elCoins.textContent = profile.coins.toLocaleString();
        if (elGems) elGems.textContent = profile.gems.toLocaleString();
    }

    private updateAnalytics() {
        const elSpeed = document.getElementById('ui-speed');
        const elRPM = document.getElementById('ui-rpm');

        if (elSpeed) {
            const mph = (Math.abs(this.ballVel.z) / 2000) * 2.237;
            elSpeed.innerHTML = `${mph.toFixed(1)} <span class="text-[8px] opacity-40">MPH</span>`;
        }

        if (elRPM) {
            const rpm = Math.abs(this.ballVel.x) * 0.15 + (this.ballStats.hook * 2);
            elRPM.textContent = Math.round(rpm).toString();
        }
    }

    private syncAvatar() {
        // In a real app, we'd load the saved config
        // For now, let's use the default from the charCreator's internal avatar
        this.avatar = this.charCreator.getAvatar();
    }

    private syncEquippedBall() {
        const profile = this.progression.getProfile();
        const ball = BALL_DATABASE.find(b => b.id === profile.activeBallId);
        if (ball) {
            this.ballStats = { ...ball.stats };
            console.log('SHARK_OS: Stats Synced >>', ball.name, this.ballStats);
        }
    }

    private render() {
        this.renderer.drawLane(this.world);

        // Draw Player (Avatar)
        if (!this.isRolling) {
            this.renderer.drawAvatar(this.avatar);
        }

        // Sort pins by Z for correct depth rendering (Far to Near)
        const sortedPins = [...this.pins].sort((a, b) => a.z - b.z);

        sortedPins.forEach(p => {
            const proj = this.world.project({ x: p.x, y: 0, z: p.z }, this.canvas);
            this.renderer.drawPin(proj, p.state);
        });

        // Draw Ball
        if (this.ballPos.z < 30000) {
            const ballProj = this.world.project({ x: this.ballPos.x, y: 0, z: this.ballPos.z }, this.canvas);
            this.renderer.drawBall(ballProj, this.ballRot);
        }
    }
}

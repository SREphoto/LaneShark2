/**
 * Premium Sprite-Based Renderer
 */

import { Point2D, World } from './World';
import { Avatar } from './Avatar';

export class Renderer {
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    private ballSprites?: HTMLImageElement;
    private pinSprites?: HTMLImageElement;
    private particles: { x: number, y: number, vx: number, vy: number, life: number, color: string }[] = [];

    constructor(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
        this.ctx = ctx;
        this.canvas = canvas;
    }

    public setSprites(ball: HTMLImageElement, pin: HTMLImageElement) {
        this.ballSprites = ball;
        this.pinSprites = pin;
    }

    public drawLane(world: World) {
        const { ctx, canvas } = this;

        // Dynamic Depth Background
        const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(0.5, '#020617');
        grad.addColorStop(1, '#000000');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Cinematic Lane Rendering
        const nearW = canvas.width * 0.45;
        const farW = canvas.width * 0.08;
        const horizonY = canvas.height * 0.38;
        const baseY = canvas.height;
        const cx = canvas.width / 2;

        ctx.save();

        // Floor Reflection Layer
        const floorGrad = ctx.createLinearGradient(0, horizonY, 0, baseY);
        floorGrad.addColorStop(0, '#1e1b4b');
        floorGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = floorGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Lane Shadow/Glow
        ctx.shadowBlur = 60;
        ctx.shadowColor = 'rgba(0,0,0,1)';

        // Wood Lane Geometry
        const laneGrad = ctx.createLinearGradient(0, baseY, 0, horizonY);
        laneGrad.addColorStop(0, '#78350f');
        laneGrad.addColorStop(0.3, '#b45309');
        laneGrad.addColorStop(0.8, '#451a03');
        laneGrad.addColorStop(1, '#020617');

        ctx.fillStyle = laneGrad;
        ctx.beginPath();
        ctx.moveTo(cx - farW, horizonY);
        ctx.lineTo(cx + farW, horizonY);
        ctx.lineTo(cx + nearW, baseY);
        ctx.lineTo(cx - nearW, baseY);
        ctx.closePath();
        ctx.fill();

        // Polish / Specular Overlay
        const polish = ctx.createLinearGradient(0, horizonY, 0, baseY);
        polish.addColorStop(0, 'rgba(255,255,255,0.08)');
        polish.addColorStop(0.2, 'rgba(255,255,255,0.12)');
        polish.addColorStop(0.8, 'rgba(255,255,255,0)');
        ctx.fillStyle = polish;
        ctx.fill();

        ctx.restore();
    }

    public drawPin(p: Point2D, state: 'STANDING' | 'HIT' | 'DOWN' = 'STANDING', frame: number = 0) {
        const { ctx, pinSprites } = this;
        if (!pinSprites) return;

        const s = p.scale * 150; // Visual scale factor for pins

        ctx.save();
        ctx.translate(p.x, p.y);

        // Soft Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.ellipse(0, s * 0.45, s * 0.3, s * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Sprite Mapping (Assuming a grid of pins)
        // Adjust these values based on actual sprite sheet layout
        let srcX = 0;
        let srcY = 0;
        const spriteSize = pinSprites.width / 9; // Assuming roughly 9 pins per row based on generated image

        if (state === 'STANDING') { srcX = 0; srcY = 0; }
        else if (state === 'HIT') { srcX = spriteSize * (1 + (frame % 3)); srcY = spriteSize; }
        else if (state === 'DOWN') { srcX = spriteSize * 4; srcY = spriteSize * 3; }

        ctx.drawImage(
            pinSprites,
            srcX, srcY, spriteSize, spriteSize,
            -s / 2, -s * 0.9, s, s
        );

        ctx.restore();
    }

    public drawBall(p: Point2D, rotation: number = 0) {
        const { ctx, ballSprites } = this;
        if (!ballSprites) return;

        const s = p.scale * 200; // Visual scale for ball

        ctx.save();
        ctx.translate(p.x, p.y);

        // Ground Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.arc(0, s * 0.4, s * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Rotation logic
        ctx.rotate(rotation);

        // Using the first ball in the 2x2 grid (top-left)
        const spriteSize = ballSprites.width / 2;
        ctx.drawImage(
            ballSprites,
            0, 0, spriteSize, spriteSize,
            -s / 2, -s / 2, s, s
        );

        ctx.restore();
    }

    public drawAvatar(avatar: Avatar) {
        // Player is at the start of the lane (near the camera)
        avatar.render(this.ctx, this.canvas.width, this.canvas.height);
    }

    public emitSparks(x: number, y: number) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 400,
                vy: (Math.random() - 0.5) * 400,
                life: 1.0,
                color: '#fde047'
            });
        }
    }

    public updateParticles(dt: number) {
        this.ctx.save();
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt * 1.5;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
        }
        this.ctx.restore();
    }
}

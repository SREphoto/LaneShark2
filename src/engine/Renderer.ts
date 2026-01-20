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
        // Global Bloom Filter
        this.ctx.shadowBlur = 0;
        this.ctx.shadowColor = 'transparent';
    }

    public preRender() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    public postRender() {
        // Simple CRT/Bloom post-pass could go here if needed
    }

    public setSprites(ball: HTMLImageElement, pin: HTMLImageElement) {
        this.ballSprites = ball;
        this.pinSprites = pin;
    }

    public drawLane(world: World) {
        const { ctx, canvas } = this;

        // 1. Dynamic Depth Background (Cyber Arena)
        const bgGrad = ctx.createLinearGradient(0, canvas.height, 0, 0);
        bgGrad.addColorStop(0, '#050505');
        bgGrad.addColorStop(0.5, '#0f172a');
        bgGrad.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Core Lane Dimensions
        const laneHalfWidth = 800;
        const laneNearZ = 25000;
        const laneFarZ = -5000;

        const p1 = world.project({ x: -laneHalfWidth, y: 0, z: laneNearZ }, canvas);
        const p2 = world.project({ x: laneHalfWidth, y: 0, z: laneNearZ }, canvas);
        const p3 = world.project({ x: laneHalfWidth, y: 0, z: laneFarZ }, canvas);
        const p4 = world.project({ x: -laneHalfWidth, y: 0, z: laneFarZ }, canvas);

        ctx.save();

        // 2. Main Lane Surface
        const laneGrad = ctx.createLinearGradient(0, p1.y, 0, p3.y);
        laneGrad.addColorStop(0, '#78350f');   // Near - Rich Brown
        laneGrad.addColorStop(0.4, '#b45309'); // Mid - Amber
        laneGrad.addColorStop(1, '#1e1b4b');   // Far - Deep Blue
        ctx.fillStyle = laneGrad;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.closePath();
        ctx.fill();

        // 3. Procedural Board Lines (For realism)
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        const numBoards = 39;
        for (let i = 1; i < numBoards; i++) {
            const bx = -laneHalfWidth + (i * (laneHalfWidth * 2 / numBoards));
            const start = world.project({ x: bx, y: 0, z: laneNearZ }, canvas);
            const end = world.project({ x: bx, y: 0, z: laneFarZ }, canvas);
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        }

        // 4. Glossy Reflection Polish
        const polish = ctx.createLinearGradient(0, p1.y, 0, p3.y);
        polish.addColorStop(0, 'rgba(255,255,255,0.15)');
        polish.addColorStop(0.2, 'rgba(255,255,255,0.05)');
        polish.addColorStop(0.8, 'rgba(0,0,0,0.4)');
        ctx.fillStyle = polish;
        ctx.fill();

        // 5. Cinematic Vignette
        const vignette = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width * 0.8);
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(1, 'rgba(0,0,0,0.8)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.restore();
    }

    public drawPin(p: Point2D, state: 'STANDING' | 'HIT' | 'DOWN' = 'STANDING', frame: number = 0) {
        const { ctx, pinSprites } = this;
        const s = p.scale * 150;

        ctx.save();
        ctx.translate(p.x, p.y);

        // 1. Reflection (Flipped and Faded)
        ctx.save();
        ctx.scale(1, -0.3);
        ctx.translate(0, -s * 0.8);
        ctx.globalAlpha = 0.2;
        this.drawPinBase(ctx, s, state, pinSprites, frame);
        ctx.restore();

        // 2. Soft Ground Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.beginPath();
        ctx.ellipse(0, s * 0.05, s * 0.4, s * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();

        // 3. Main Pin
        this.drawPinBase(ctx, s, state, pinSprites, frame);

        ctx.restore();
    }

    private drawPinBase(ctx: CanvasRenderingContext2D, s: number, state: string, sprites?: HTMLImageElement, frame: number = 0) {
        if (sprites) {
            const spriteSize = sprites.width / 9;
            let srcX = 0, srcY = 0;
            if (state === 'STANDING') { srcX = 0; srcY = 0; }
            else if (state === 'HIT') { srcX = spriteSize * (1 + (frame % 3)); srcY = spriteSize; }
            else if (state === 'DOWN') { srcX = spriteSize * 4; srcY = spriteSize * 3; }

            ctx.drawImage(sprites, srcX, srcY, spriteSize, spriteSize, -s / 2, -s * 0.9, s, s);
        } else {
            // Premium Vector Fallback
            const grad = ctx.createLinearGradient(-s * 0.15, 0, s * 0.15, 0);
            grad.addColorStop(0, '#f8fafc');
            grad.addColorStop(0.5, '#ffffff');
            grad.addColorStop(1, '#cbd5e1');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(-s * 0.15, -s * 0.9, s * 0.3, s * 0.9, s * 0.1);
            ctx.fill();
            // Stripes
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(-s * 0.15, -s * 0.75, s * 0.3, s * 0.06);
            ctx.fillRect(-s * 0.15, -s * 0.65, s * 0.3, s * 0.06);
        }
    }

    public drawBall(p: Point2D, rotation: number = 0, isRolling: boolean = false) {
        const { ctx, ballSprites } = this;
        const s = p.scale * 200;

        ctx.save();
        ctx.translate(p.x, p.y);

        // 1. Motion Trail (Only if rolling)
        if (isRolling) {
            const trailGrad = ctx.createLinearGradient(0, 0, 0, s);
            trailGrad.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
            trailGrad.addColorStop(1, 'rgba(59, 130, 246, 0)');
            ctx.fillStyle = trailGrad;
            ctx.beginPath();
            ctx.moveTo(-s * 0.4, 0);
            ctx.lineTo(s * 0.4, 0);
            ctx.lineTo(s * 0.2, s * 2);
            ctx.lineTo(-s * 0.2, s * 2);
            ctx.closePath();
            ctx.fill();
        }

        // 2. Reflection
        ctx.save();
        ctx.scale(1, -0.4);
        ctx.globalAlpha = 0.25;
        this.drawBallBase(ctx, s, rotation, ballSprites);
        ctx.restore();

        // 3. Ground Shadow
        const shadowGrad = ctx.createRadialGradient(0, s * 0.4, 0, 0, s * 0.4, s * 0.6);
        shadowGrad.addColorStop(0, 'rgba(0,0,0,0.8)');
        shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = shadowGrad;
        ctx.beginPath();
        ctx.ellipse(0, s * 0.4, s * 0.5, s * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // 4. Main Ball
        this.drawBallBase(ctx, s, rotation, ballSprites);

        // 5. Bloom Glow (Vector mode)
        if (!ballSprites) {
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#3b82f6';
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }

    private drawBallBase(ctx: CanvasRenderingContext2D, s: number, rotation: number, sprites?: HTMLImageElement) {
        ctx.save();
        ctx.rotate(rotation);
        if (sprites) {
            const spriteSize = sprites.width / 2;
            ctx.drawImage(sprites, 0, 0, spriteSize, spriteSize, -s / 2, -s / 2, s, s);
        } else {
            const grad = ctx.createRadialGradient(-s * 0.1, -s * 0.1, 0, 0, 0, s / 2);
            grad.addColorStop(0, '#60a5fa');
            grad.addColorStop(0.7, '#1d4ed8');
            grad.addColorStop(1, '#1e3a8a');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
            ctx.fill();
            // Specular
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.ellipse(-s * 0.15, -s * 0.15, s * 0.1, s * 0.05, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    public drawAvatar(avatar: Avatar) {
        avatar.render(this.ctx, this.canvas.width, this.canvas.height);
    }

    public emitSparks(x: number, y: number) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 600,
                vy: (Math.random() - 0.5) * 600,
                life: 1.0,
                color: Math.random() > 0.5 ? '#fde047' : '#ffffff'
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
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = p.color;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();
    }
}

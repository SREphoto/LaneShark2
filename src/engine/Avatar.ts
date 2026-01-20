/**
 * LaneShark 2.0 - Avatar System
 * High-performance vector-based character rendering
 */

export interface AvatarConfig {
    gender: 'MALE' | 'FEMALE';
    mass: number;       // 0 to 1
    height: number;     // 0.8 to 1.2
    skinTone: string;
    hairColor: string;
    jerseyColor: string;
    gloveColor: string;
    shoeColor: string;
}

export class Avatar {
    private config: AvatarConfig;

    constructor(config: AvatarConfig) {
        this.config = config;
    }

    public updateConfig(newConfig: Partial<AvatarConfig>) {
        this.config = { ...this.config, ...newConfig };
    }

    public getConfig(): AvatarConfig {
        return this.config;
    }

    /**
     * Renders the avatar to a canvas context
     */
    public render(ctx: CanvasRenderingContext2D, width: number, height: number, frame: number = 0) {
        const { gender, mass, height: hFactor, skinTone, hairColor, jerseyColor, gloveColor, shoeColor } = this.config;

        ctx.save();
        ctx.translate(width / 2, height * 0.85);
        ctx.scale(hFactor, hFactor);

        const buildOffset = mass * 20;
        const chestWidth = gender === 'MALE' ? 60 + buildOffset : 45 + buildOffset;
        const waistWidth = gender === 'MALE' ? 50 + buildOffset * 0.5 : 40;
        const shoulderY = -150 - (hFactor * 20);

        // 1. Legs & Shoes
        ctx.fillStyle = '#1e293b'; // Trousers
        this.drawLeg(ctx, -15, -shoulderY * 0.5, 12, shoulderY * 0.5);
        this.drawLeg(ctx, 15, -shoulderY * 0.5, 12, shoulderY * 0.5);

        ctx.fillStyle = shoeColor;
        ctx.beginPath();
        ctx.roundRect(-22, -10, 15, 12, 4);
        ctx.roundRect(7, -10, 15, 12, 4);
        ctx.fill();

        // 2. Torso (Jersey)
        ctx.fillStyle = jerseyColor;
        ctx.beginPath();
        ctx.moveTo(-chestWidth / 2, shoulderY);
        ctx.lineTo(chestWidth / 2, shoulderY);
        ctx.lineTo(waistWidth / 2, shoulderY * 0.4);
        ctx.lineTo(-waistWidth / 2, shoulderY * 0.4);
        ctx.closePath();
        ctx.fill();

        // 3. Shading / Realistic Vents on Jersey
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(-chestWidth / 2, shoulderY, 5, -shoulderY * 0.6);
        ctx.fillRect(chestWidth / 2 - 5, shoulderY, 5, -shoulderY * 0.6);

        // 3.5 Arms & Gloves
        ctx.fillStyle = skinTone;
        this.drawArm(ctx, -chestWidth / 2 - 10, shoulderY + 10, 10, 60);
        this.drawArm(ctx, chestWidth / 2 + 0, shoulderY + 10, 10, 60);

        ctx.fillStyle = gloveColor;
        // Right hand glove
        ctx.beginPath();
        ctx.roundRect(chestWidth / 2 - 2, shoulderY + 55, 14, 18, 5);
        ctx.fill();

        // 4. Head
        ctx.fillStyle = skinTone;
        ctx.beginPath();
        const headY = shoulderY - 30;
        ctx.ellipse(0, headY, 22, 28, 0, 0, Math.PI * 2);
        ctx.fill();

        // 5. Hair
        ctx.fillStyle = hairColor;
        if (gender === 'FEMALE') {
            // Long hair
            ctx.beginPath();
            ctx.moveTo(-25, headY - 10);
            ctx.bezierCurveTo(-35, headY + 40, -30, headY + 80, -20, headY + 90);
            ctx.lineTo(20, headY + 90);
            ctx.bezierCurveTo(30, headY + 80, 35, headY + 40, 25, headY - 10);
            ctx.closePath();
            ctx.fill();
        } else {
            // Short hair/Cropped
            ctx.beginPath();
            ctx.arc(0, headY - 5, 24, Math.PI, 0);
            ctx.fill();
        }

        ctx.restore();
    }

    private drawLeg(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
        ctx.save();
        ctx.translate(x, 0);
        ctx.beginPath();
        ctx.roundRect(-w / 2, -h, w, h, 10);
        ctx.fill();
        ctx.restore();
    }

    private drawArm(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
        ctx.save();
        ctx.translate(x, y);
        ctx.beginPath();
        ctx.roundRect(0, 0, w, h, 5);
        ctx.fill();
        ctx.restore();
    }
}

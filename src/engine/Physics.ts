/**
 * LaneShark 2.0 - Ball Stats & Physics Engine
 */

export interface BallStats {
    speed: number;    // 1-100 (Power multiplier)
    hook: number;     // 1-100 (Sideways spin/curve potential)
    weight: number;   // 1-100 (Pin impact force)
    guide: number;    // 1-100 (Aim line length)
    control: number;  // 1-100 (Stability/Forgiveness)
}

export interface BallPosition {
    x: number;
    y: number;
    z: number;
}

export interface BallVelocity {
    x: number;
    y: number;
    z: number;
}

export class PhysicsEngine {
    private static readonly DRAG = 0.995;
    private static readonly LANE_FRICTION = 0.98;
    private static readonly GRAVITY = 9.8;

    /**
     * Calculates the new position and velocity of the ball based on its stats and the lane conditions.
     */
    public static step(
        pos: BallPosition,
        vel: BallVelocity,
        stats: BallStats,
        dt: number,
        oilPattern: number = 0.5 // Default mid-oil
    ): { pos: BallPosition; vel: BallVelocity } {
        let newVel = { ...vel };

        // 1. Dynamic Oil Factor based on Z position (0 pins, 20000 start)
        const laneLength = 20000;
        const normalizedZ = Math.max(0, pos.z / laneLength);

        // Heads (0.7-1.0): Heavy Oil (1.0 density)
        // Midlane (0.3-0.7): Tapered Oil (1.0 -> 0.2 density)
        // Backend (0.0-0.3): Dry Wood (0.1 density)
        let oilDensity = 0.1;
        if (normalizedZ > 0.7) {
            oilDensity = 1.0;
        } else if (normalizedZ > 0.3) {
            oilDensity = 0.2 + (normalizedZ - 0.3) * 2;
        }

        // Apply global oil pattern factor
        oilDensity *= oilPattern;

        // 2. Friction-Based Hook
        const hookPotential = (stats.hook / 100) * 8000;
        const hookBite = (1 - oilDensity);

        // Apply hook acceleration to X (Sideways spin)
        newVel.x -= hookPotential * hookBite * dt;

        // 3. Friction & Drag (Frame-rate independent)
        const frictionBase = this.LANE_FRICTION * (1 - (oilDensity * 0.05));
        const frictionFactor = Math.pow(frictionBase, dt * 60);

        newVel.z *= frictionFactor;
        newVel.x *= frictionFactor;

        // 4. Hook/Curve Influence
        const curveForce = (stats.hook / 100) * 12000;
        const curveBite = (1 - oilDensity) * 0.8;
        newVel.x -= curveForce * curveBite * dt;

        // 5. Update Position
        const newPos = {
            x: pos.x + newVel.x * dt,
            y: pos.y + newVel.y * dt,
            z: pos.z + newVel.z * dt
        };

        return { pos: newPos, vel: newVel };
    }

    /**
     * Resolves collision with a pin.
     * Returns true if the pin should be knocked down.
     */
    public static resolvePinCollision(
        ballVel: BallVelocity,
        ballStats: BallStats,
        impactDist: number
    ): boolean {
        // Calculate impact force based on velocity and ball weight
        const velocityMagnitude = Math.sqrt(ballVel.z * ballVel.z + ballVel.x * ballVel.x);
        const weightFactor = ballStats.weight / 100;
        const impactForce = velocityMagnitude * (0.5 + weightFactor);

        // Required force to knock down a pin (arbitrary unit)
        const threshold = 2000;

        return impactForce > threshold && impactDist < 1000;
    }
}

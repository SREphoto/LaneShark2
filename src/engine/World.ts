/**
 * LaneShark 2.0 - 3D Math & Projection
 */

export interface Point3D { x: number; y: number; z: number }
export interface Point2D { x: number; y: number; scale: number }

export class World {
    // Standard Lane: 39 boards wide (~106cm), 60ft long (1828cm)
    public static readonly WIDTH = 1060;
    public static readonly LENGTH = 18288;

    // Viewport Params
    private horizon = 0.1;
    private fov = 60;
    public cameraZ = 25000; // Default camera distance

    public project(p: Point3D, canvas: HTMLCanvasElement): Point2D {
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        // Perspective factor
        // Z is distance from camera
        const zNear = 500;
        const zFar = 35000;

        // Calculate depth relative to camera
        const relativeZ = this.cameraZ - p.z;
        const depth = Math.max(0, (relativeZ - zNear) / (zFar - zNear));
        const scale = 1 / (1 + depth * 15);

        const px = cx + (p.x * scale);
        // Near is bottom, Far is top (roughly)
        const py = cy + (p.y * scale) + (depth * 300);

        return { x: px, y: py, scale };
    }
}

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

    public project(p: Point3D, canvas: HTMLCanvasElement): Point2D {
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        // Perspective factor
        // Z is distance from camera (0 is at camera, higher is further)
        const zNear = 500;
        const zFar = 30000;

        // Normalized depth (0 to 1)
        const depth = (p.z - zNear) / (zFar - zNear);
        const scale = 1 / (1 + depth * 10);

        const px = cx + (p.x * scale);
        // Inverse Y: Near is bottom, Far is top
        const py = cy + (p.y * scale) + (depth * 200);

        return { x: px, y: py, scale };
    }
}

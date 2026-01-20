/**
 * LaneShark Asset Loader
 */

export class AssetLoader {
    private assets: Map<string, HTMLImageElement> = new Map();
    private total: number = 0;
    private loaded: number = 0;

    public async load(manifest: { [key: string]: string }): Promise<void> {
        this.total = Object.keys(manifest).length;
        const promises = Object.entries(manifest).map(([key, url]) => {
            return new Promise<void>((resolve, reject) => {
                const img = new Image();
                img.src = url;
                img.onload = () => {
                    this.assets.set(key, img);
                    this.loaded++;
                    resolve();
                };
                img.onerror = (e) => reject(`Failed to load asset: ${url}`);
            });
        });

        await Promise.all(promises);
    }

    public get(key: string): HTMLImageElement {
        const asset = this.assets.get(key);
        if (!asset) throw new Error(`Asset not found: ${key}`);
        return asset;
    }

    public getProgress(): number {
        return this.loaded / this.total;
    }
}

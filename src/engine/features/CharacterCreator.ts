/**
 * LaneShark 2.0 - Character Creator Component
 */

import { Avatar, AvatarConfig } from '../Avatar';

export class CharacterCreator {
    private avatar: Avatar;
    private previewCanvas: HTMLCanvasElement;
    private previewCtx: CanvasRenderingContext2D;
    private overlay: HTMLElement;

    constructor() {
        const config: AvatarConfig = {
            gender: 'MALE',
            mass: 0.5,
            height: 1.0,
            skinTone: '#ffdbac',
            hairColor: '#3b2219',
            jerseyColor: '#8b5cf6',
            gloveColor: '#ffffff',
            shoeColor: '#1e293b'
        };

        this.avatar = new Avatar(config);
        this.previewCanvas = document.getElementById('avatar-preview-canvas') as HTMLCanvasElement;
        this.previewCtx = this.previewCanvas.getContext('2d')!;
        this.overlay = document.getElementById('character-creator-overlay')!;

        this.setupListeners();
        this.handleResize();
    }

    private setupListeners() {
        // Gender Buttons
        const options = document.querySelectorAll('.creator-option');
        options.forEach(opt => {
            opt.addEventListener('click', () => {
                options.forEach(o => o.classList.remove('active', 'border-purple-500/50'));
                options.forEach(o => o.classList.add('border-white/10'));

                opt.classList.add('active', 'border-purple-500/50');
                opt.classList.remove('border-white/10');

                const gender = opt.textContent?.includes('♂') ? 'MALE' : 'FEMALE';
                this.avatar.updateConfig({ gender });
                this.renderPreview();
            });
        });

        // Sliders
        const massSlider = document.querySelector('input[min="0"][max="100"]') as HTMLInputElement;
        massSlider.addEventListener('input', (e) => {
            const val = parseInt((e.target as HTMLInputElement).value) / 100;
            const label = document.getElementById('val-build-mass');
            if (label) label.textContent = `${Math.round(val * 100)}%`;
            this.avatar.updateConfig({ mass: val });
            this.renderPreview();
        });

        const heightSlider = document.querySelector('input[min="80"][max="120"]') as HTMLInputElement;
        heightSlider.addEventListener('input', (e) => {
            const val = parseInt((e.target as HTMLInputElement).value) / 100;
            const label = document.getElementById('val-height');
            if (label) label.textContent = `${val.toFixed(1)}x`;
            this.avatar.updateConfig({ height: val });
            this.renderPreview();
        });

        // Apparel Colors
        const jerseyColors = document.querySelectorAll('.jersey-color');
        jerseyColors.forEach(btn => {
            btn.addEventListener('click', () => {
                const color = (btn as HTMLElement).style.backgroundColor;
                this.avatar.updateConfig({ jerseyColor: color });
                this.renderPreview();
            });
        });

        const gloveColors = document.querySelectorAll('.glove-color');
        gloveColors.forEach(btn => {
            btn.addEventListener('click', () => {
                const color = (btn as HTMLElement).style.backgroundColor;
                this.avatar.updateConfig({ gloveColor: color });
                this.renderPreview();
            });
        });

        // Save/Cancel
        document.getElementById('btn-save-character')?.addEventListener('click', () => {
            this.close();
            // In a real app, this would persist the profile
            console.log('SHARK_OS: Identity Saved', this.avatar.getConfig());
        });

        document.getElementById('btn-cancel-creator')?.addEventListener('click', () => {
            this.close();
        });

        window.addEventListener('resize', () => this.handleResize());
    }

    private handleResize() {
        if (!this.previewCanvas) return;
        const rect = this.previewCanvas.parentElement?.getBoundingClientRect();
        if (rect) {
            this.previewCanvas.width = rect.width;
            this.previewCanvas.height = rect.height;
            this.renderPreview();
        }
    }

    public open() {
        this.overlay.classList.remove('hidden');
        this.handleResize();
    }

    public getAvatar(): Avatar {
        return this.avatar;
    }

    public close() {
        this.overlay.classList.add('hidden');
    }

    private renderPreview() {
        const { width, height } = this.previewCanvas;
        this.previewCtx.clearRect(0, 0, width, height);
        this.avatar.render(this.previewCtx, width, height);
    }
}

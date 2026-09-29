import * as THREE from 'three';
import { TexturePackPalette } from '../types/game';

export const PRESET_TEXTURE_PACKS: TexturePackPalette[] = [
  {
    id: 'pastel-meadows',
    name: 'Pastel Meadows (Default Estetik)',
    description: 'Warna pastel lembut yang menenangkan dengan langit senja nan indah.',
    grassColor: '#82ca9d',
    soilColor: '#c89666',
    waterColor: '#64b5f6',
    woodColor: '#a1887f',
    stoneColor: '#90a4ae',
    roofColor: '#ef5350',
    leavesColor: '#81c784',
    skyMorning: '#fff3e0',
    skyNoon: '#e0f7fa',
    skySunset: '#ffe0b2',
    skyNight: '#1a237e',
    fogColor: '#f1f8e9',
    uiPrimary: '#4caf50',
    uiBackground: '#f5f5f5',
    accentColor: '#ffb74d'
  },
  {
    id: 'autumn-harvest',
    name: 'Cozy Autumn (Panen Musim Gugur)',
    description: 'Suhu hangat emas, jingga terracota, dan dedaunan musim gugur.',
    grassColor: '#d4883f',
    soilColor: '#8d5524',
    waterColor: '#4f9da6',
    woodColor: '#6b4226',
    stoneColor: '#7a7a7a',
    roofColor: '#d9534f',
    leavesColor: '#e67e22',
    skyMorning: '#ffecb3',
    skyNoon: '#ffe0b2',
    skySunset: '#ffcc80',
    skyNight: '#263238',
    fogColor: '#fdf6e3',
    uiPrimary: '#d35400',
    uiBackground: '#fdf6e3',
    accentColor: '#f1c40f'
  },
  {
    id: 'cyber-voxel',
    name: 'Cyber Neon Voxel',
    description: 'Nuansa futuristik neon synthwave dengan kontras tinggi yang mencolok.',
    grassColor: '#00e676',
    soilColor: '#303030',
    waterColor: '#00e5ff',
    woodColor: '#7c4dff',
    stoneColor: '#424242',
    roofColor: '#ff007f',
    leavesColor: '#69f0ae',
    skyMorning: '#2979ff',
    skyNoon: '#121212',
    skySunset: '#d500f9',
    skyNight: '#0d0221',
    fogColor: '#121212',
    uiPrimary: '#00e5ff',
    uiBackground: '#121212',
    accentColor: '#ff007f'
  },
  {
    id: 'retro-earth',
    name: 'Retro 16-Bit Earth',
    description: 'Palet alami klasik yang hangat mengingatkan pada game simulasi nostalgia.',
    grassColor: '#558b2f',
    soilColor: '#6d4c41',
    waterColor: '#0288d1',
    woodColor: '#4e342e',
    stoneColor: '#616161',
    roofColor: '#c62828',
    leavesColor: '#33691e',
    skyMorning: '#fff8e1',
    skyNoon: '#b3e5fc',
    skySunset: '#ffe0b2',
    skyNight: '#0d1b2a',
    fogColor: '#e8f5e9',
    uiPrimary: '#33691e',
    uiBackground: '#fdfbf7',
    accentColor: '#ff8f00'
  },
  {
    id: 'nordic-minimal',
    name: 'Nordic Clean Minimalist',
    description: 'Desain skandinavia bersih dengan nada bumi lembut dan kontras minimal.',
    grassColor: '#93a988',
    soilColor: '#a89d8f',
    waterColor: '#7a9e9f',
    woodColor: '#bcaaa4',
    stoneColor: '#b0bec5',
    roofColor: '#78909c',
    leavesColor: '#a1b59d',
    skyMorning: '#f5f5f5',
    skyNoon: '#eceff1',
    skySunset: '#cfd8dc',
    skyNight: '#1c2526',
    fogColor: '#fafafa',
    uiPrimary: '#546e7a',
    uiBackground: '#f8f9fa',
    accentColor: '#8d6e63'
  }
];

export class TexturePackManager {
  private activePalette: TexturePackPalette;
  private canvasCache: Map<string, THREE.CanvasTexture> = new Map();
  private listeners: (() => void)[] = [];

  constructor(initialPalette?: TexturePackPalette) {
    this.activePalette = initialPalette || PRESET_TEXTURE_PACKS[0];
  }

  public getPalette(): TexturePackPalette {
    return this.activePalette;
  }

  public setPalette(palette: TexturePackPalette) {
    this.activePalette = palette;
    this.canvasCache.clear();
    this.notifyListeners();
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l());
  }

  // Generates low-poly subtle patterned canvas texture for materials
  public createNoiseTexture(baseHex: string, patternType: 'grass' | 'soil' | 'wood' | 'stone' | 'roof' | 'leaves' | 'water' = 'grass'): THREE.CanvasTexture {
    const key = `${baseHex}_${patternType}`;
    if (this.canvasCache.has(key)) {
      return this.canvasCache.get(key)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    // Base fill
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, 64, 64);

    // Low-poly micro-grid / noise for subtle voxel depth
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillRect(32, 32, 32, 32);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
    ctx.fillRect(32, 0, 32, 32);
    ctx.fillRect(0, 32, 32, 32);

    if (patternType === 'grass') {
      // Subtle grass specks
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fillRect(8, 8, 16, 16);
      ctx.fillRect(40, 40, 16, 16);
    } else if (patternType === 'soil') {
      // Furrow lines
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 16); ctx.lineTo(64, 16);
      ctx.moveTo(0, 48); ctx.lineTo(64, 48);
      ctx.stroke();
    } else if (patternType === 'water') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(16, 16, 32, 4);
      ctx.fillRect(8, 40, 24, 4);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;

    this.canvasCache.set(key, texture);
    return texture;
  }

  // Export Texture Pack as JSON
  public exportAsJSON(): string {
    return JSON.stringify(this.activePalette, null, 2);
  }

  // Download JSON file directly
  public downloadJSON() {
    const jsonStr = this.exportAsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `isopolis_texture_pack_${this.activePalette.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Export dynamically rendered texture pack map image
  public exportTextureAtlasPNG(): string {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Background title
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Texture Pack: ${this.activePalette.name}`, 20, 35);

    const swatches = [
      { name: 'Rumput (Grass)', color: this.activePalette.grassColor },
      { name: 'Tanah (Soil)', color: this.activePalette.soilColor },
      { name: 'Air (Water)', color: this.activePalette.waterColor },
      { name: 'Kayu (Wood)', color: this.activePalette.woodColor },
      { name: 'Batu (Stone)', color: this.activePalette.stoneColor },
      { name: 'Atap (Roof)', color: this.activePalette.roofColor },
      { name: 'Daun (Leaves)', color: this.activePalette.leavesColor },
      { name: 'Langit Siang', color: this.activePalette.skyNoon },
      { name: 'Langit Malam', color: this.activePalette.skyNight },
    ];

    swatches.forEach((s, idx) => {
      const x = 20 + (idx % 3) * 160;
      const y = 60 + Math.floor(idx / 3) * 140;

      ctx.fillStyle = s.color;
      ctx.fillRect(x, y, 140, 90);

      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(x, y + 65, 140, 25);

      ctx.fillStyle = '#ffffff';
      ctx.font = '12px sans-serif';
      ctx.fillText(s.name, x + 6, y + 82);
    });

    return canvas.toDataURL('image/png');
  }

  // Import JSON configuration string
  public importFromJSON(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && parsed.grassColor && parsed.soilColor && parsed.waterColor) {
        const customPalette: TexturePackPalette = {
          id: parsed.id || `custom-${Date.now()}`,
          name: parsed.name || 'Custom Texture Pack',
          description: parsed.description || 'Texture pack buatan pengguna.',
          grassColor: parsed.grassColor,
          soilColor: parsed.soilColor,
          waterColor: parsed.waterColor,
          woodColor: parsed.woodColor || '#a1887f',
          stoneColor: parsed.stoneColor || '#90a4ae',
          roofColor: parsed.roofColor || '#ef5350',
          leavesColor: parsed.leavesColor || '#81c784',
          skyMorning: parsed.skyMorning || '#fff3e0',
          skyNoon: parsed.skyNoon || '#e0f7fa',
          skySunset: parsed.skySunset || '#ffe0b2',
          skyNight: parsed.skyNight || '#1a237e',
          fogColor: parsed.fogColor || '#f1f8e9',
          uiPrimary: parsed.uiPrimary || '#4caf50',
          uiBackground: parsed.uiBackground || '#ffffff',
          accentColor: parsed.accentColor || '#ffb74d',
          isCustom: true
        };
        this.setPalette(customPalette);
        return true;
      }
    } catch (e) {
      console.error('Failed to parse texture pack JSON:', e);
    }
    return false;
  }
}

export const texturePackManager = new TexturePackManager();

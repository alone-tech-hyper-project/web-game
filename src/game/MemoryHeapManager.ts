import * as THREE from 'three';
import { TexturePackPalette } from '../types/game';

/**
 * Pre-allocated ArrayBuffer Memory Heap & Lookup Table (LUT) Manager.
 * Stores spatial grid indexes in high-speed TypedArrays (Uint8Array)
 * and pre-computes 24-hour lighting tables in static RAM to ensure 0 CPU overhead.
 */
export class MemoryHeapManager {
  // Pre-allocated Spatial Grid Type Buffers (48x48 = 2304 max capacity per buffer)
  public static readonly MAX_GRID_SIZE = 48 * 48;

  // TypedArray heaps for ultra-fast O(1) cache queries (No Garbage Collection)
  public static tileTypeHeap = new Uint8Array(MemoryHeapManager.MAX_GRID_SIZE); // 0: Grass, 1: Soil, 2: Water, 3: Path
  public static tileWateredHeap = new Uint8Array(MemoryHeapManager.MAX_GRID_SIZE); // 0: Dry, 1: Watered
  public static tileCropStageHeap = new Int8Array(MemoryHeapManager.MAX_GRID_SIZE); // -1: None, 0..3: Growth Stage
  public static tileDebrisHeap = new Uint8Array(MemoryHeapManager.MAX_GRID_SIZE); // 0: None, 1: Weed, 2: Log, 3: WildTree, 4: SmallStone, 5: BigStone

  // Pre-computed 24-Hour Time-Of-Day Lighting LUT (Lookup Table)
  // Pre-allocates Color instances in RAM so we never instantiate THREE.Color in the game loop
  private static lightingLUT: Array<{
    skyColor: THREE.Color;
    ambColor: THREE.Color;
    ambIntensity: number;
    dirColor: THREE.Color;
    dirIntensity: number;
    dirPosX: number;
    dirPosY: number;
    dirPosZ: number;
  }> = [];

  private static isInitialized = false;

  // Pre-generate LUT on startup into contiguous RAM
  public static initializeLUT(palette: TexturePackPalette) {
    if (this.isInitialized) return;

    this.lightingLUT = new Array(24);

    for (let hour = 0; hour < 24; hour++) {
      let skyHex = palette.skyNoon;
      let ambHex = 0xffffff;
      let ambInt = 1.30;
      let dirHex = 0xfffbeb;
      let dirInt = 1.20;
      let sunY = 45;
      let sunX = 25;

      if (hour >= 5 && hour < 8) {
        // Morning Dawn
        skyHex = palette.skyMorning;
        ambHex = 0xfff0e6;
        ambInt = 1.15;
        dirHex = 0xffb380;
        dirInt = 1.05;
        sunY = 22;
        sunX = 35;
      } else if (hour >= 8 && hour < 16) {
        // Crisp, Bright Noon
        skyHex = palette.skyNoon;
        ambHex = 0xffffff;
        ambInt = 1.35;
        dirHex = 0xfffbeb;
        dirInt = 1.25;
        sunY = 45;
        sunX = 25;
      } else if (hour >= 16 && hour < 19) {
        // Dusk / Golden Sunset
        skyHex = palette.skySunset;
        ambHex = 0xffe0cc;
        ambInt = 1.10;
        dirHex = 0xff8a65;
        dirInt = 1.0;
        sunY = 18;
        sunX = 40;
      } else {
        // Night
        skyHex = palette.skyNight;
        ambHex = 0x90caf9;
        ambInt = 0.55;
        dirHex = 0x3f51b5;
        dirInt = 0.35;
        sunY = 25;
        sunX = -20;
      }

      this.lightingLUT[hour] = {
        skyColor: new THREE.Color(skyHex),
        ambColor: new THREE.Color(ambHex),
        ambIntensity: ambInt,
        dirColor: new THREE.Color(dirHex),
        dirIntensity: dirInt,
        dirPosX: sunX,
        dirPosY: sunY,
        dirPosZ: 20,
      };
    }

    this.isInitialized = true;
  }

  // Instant O(1) Fast-LUT reader (Zero allocation)
  public static getLightingForHour(hour: number) {
    const clampedHour = Math.max(0, Math.min(23, Math.floor(hour)));
    return this.lightingLUT[clampedHour] || this.lightingLUT[12];
  }

  // Fast Grid Coordinate to Flat Index (z * width + x)
  public static getIndex(x: number, z: number, width = 48): number {
    return z * width + x;
  }
}

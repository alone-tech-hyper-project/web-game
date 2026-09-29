import { TileState, MapLocation, TexturePackPalette } from '../types/game';
import { MapManager } from './MapManager';

export interface WorldGate {
  id: string;
  name: string;
  triggerArea: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  passageOpeningWorldX?: { minX: number; maxX: number };
  passageOpeningSide?: 'north' | 'south' | 'east' | 'west';
  targetLocation: MapLocation;
  targetSpawn: { x: number; z: number };
  gateProp?: {
    gridX: number;
    gridZ: number;
    isNorth: boolean;
    rotationY?: number;
  };
}

export type StaticPropType =
  | 'farmhouse'
  | 'windmill'
  | 'shipping_bin'
  | 'wooden_bridge'
  | 'gate'
  | 'interior_bed'
  | 'interior_kitchen'
  | 'interior_chest'
  | 'interior_dining_table'
  | 'interior_fireplace'
  | 'interior_rug'
  | 'interior_walls'
  | 'signpost'
  | 'mine_entrance'
  | 'crystal_cluster'
  | 'rest_bench'
  | 'lighthouse'
  | 'pier_dock'
  | 'fishing_boat'
  | 'stone_stairs'
  | 'fishing_shack'
  | 'custom';

export interface StaticProp {
  id: string;
  type: StaticPropType;
  gridX: number;
  gridZ: number;
  rotationY?: number;
  worldY?: number;
}

export interface SolidObstacle {
  id: string;
  minGridX: number;
  maxGridX: number;
  minGridZ: number;
  maxGridZ: number;
}

export interface WorldRegionConfig {
  id: MapLocation;
  name: string;
  subtitle: string;
  description: string;
  width: number;
  height: number;
  defaultSpawn: { x: number; z: number };
  allowFarming: boolean;
  gates: WorldGate[];
  staticProps: StaticProp[];
  solidObstacles?: SolidObstacle[];
  generateTiles: () => Map<string, TileState>;
}

/**
 * WorldRegistry: Central Extensible Hub for World Maps & Regions.
 * To add a new map in the future, simply call `WorldRegistry.registerRegion(...)`!
 */
export class WorldRegistry {
  private static regions = new Map<MapLocation, WorldRegionConfig>();

  public static registerRegion(config: WorldRegionConfig): void {
    this.regions.set(config.id, config);
  }

  public static getRegion(id: MapLocation): WorldRegionConfig {
    const region = this.regions.get(id);
    if (!region) {
      // Default fallback to farm if missing
      return this.regions.get('farm')!;
    }
    return region;
  }

  public static getAllRegions(): WorldRegionConfig[] {
    return Array.from(this.regions.values());
  }

  // Check if player stands on any gate trigger area for current map
  public static checkGateTrigger(
    currentLocation: MapLocation,
    playerGridX: number,
    playerGridZ: number
  ): WorldGate | null {
    const region = this.getRegion(currentLocation);
    for (const gate of region.gates) {
      const { minX, maxX, minZ, maxZ } = gate.triggerArea;
      if (
        playerGridX >= minX &&
        playerGridX <= maxX &&
        playerGridZ >= minZ &&
        playerGridZ <= maxZ
      ) {
        return gate;
      }
    }
    return null;
  }

  // Check if a grid coordinate is blocked by a solid building or furniture
  public static isPositionSolid(
    currentLocation: MapLocation,
    gridX: number,
    gridZ: number
  ): boolean {
    const region = this.getRegion(currentLocation);
    if (!region.solidObstacles) return false;

    for (const obs of region.solidObstacles) {
      if (
        gridX >= obs.minGridX &&
        gridX <= obs.maxGridX &&
        gridZ >= obs.minGridZ &&
        gridZ <= obs.maxGridZ
      ) {
        return true;
      }
    }
    return false;
  }

  // Get boundaries with gate opening allowances for smooth walking through archways
  public static getRegionBoundaries(
    currentLocation: MapLocation,
    curWorldX: number,
    halfW: number,
    halfH: number
  ): { minBoundX: number; maxBoundX: number; minBoundZ: number; maxBoundZ: number } {
    if (currentLocation === 'house_interior') {
      return {
        minBoundX: -(halfW - 0.9),
        maxBoundX: halfW - 0.9,
        minBoundZ: -(halfH - 0.9),
        maxBoundZ: halfH - 0.2, // Open South doorway
      };
    }

    const region = this.getRegion(currentLocation);
    const maxBoundX = halfW - 2.2;
    const minBoundX = -(halfW - 2.2);
    let minBoundZ = -(halfH - 2.2);
    let maxBoundZ = halfH - 2.2;

    for (const gate of region.gates) {
      if (gate.passageOpeningWorldX && gate.passageOpeningSide) {
        const { minX, maxX } = gate.passageOpeningWorldX;
        if (curWorldX >= minX && curWorldX <= maxX) {
          if (gate.passageOpeningSide === 'north') {
            minBoundZ = -halfH + 0.1;
          } else if (gate.passageOpeningSide === 'south') {
            maxBoundZ = halfH - 0.1;
          }
        }
      }
    }

    return { minBoundX, maxBoundX, minBoundZ, maxBoundZ };
  }
}

// ==========================================
// 1. REGION: KEBUN ISOPOLIS (FARM 28x28)
// ==========================================
WorldRegistry.registerRegion({
  id: 'farm',
  name: 'Kebun Isopolis',
  subtitle: 'Lahan Tani Subur & Pusat Peternakan',
  description: 'Tempat bertani, merawat hewan, kincir angin, dan rumah petani yang nyaman.',
  width: 28,
  height: 28,
  defaultSpawn: { x: 7, z: 12 },
  allowFarming: true,
  gates: [
    // Gerbang Utara menuju Simpang Empat (x = 5..7, z = 0..1)
    {
      id: 'farm_north_to_crossroads',
      name: 'Gerbang Utara ke Simpang Empat',
      triggerArea: { minX: 5, maxX: 7, minZ: 0, maxZ: 1 },
      passageOpeningWorldX: { minX: -10.5, maxX: -7.2 },
      passageOpeningSide: 'north',
      targetLocation: 'crossroads',
      targetSpawn: { x: 9, z: 15 }, // Muncul tepat di persimpangan selatan
      gateProp: { gridX: 6, gridZ: 0, isNorth: true },
    },
    // Pintu Depan Rumah Petani (x = 12.8..14.2, z = 5.6..6.3)
    {
      id: 'farm_door_to_interior',
      name: 'Pintu Masuk Rumah Petani',
      triggerArea: { minX: 12.6, maxX: 14.4, minZ: 5.4, maxZ: 6.2 },
      targetLocation: 'house_interior',
      targetSpawn: { x: 5, z: 7.2 }, // Tepat di depan pintu dalam rumah
    },
  ],
  staticProps: [
    { id: 'farmhouse', type: 'farmhouse', gridX: 13, gridZ: 5 },
    { id: 'windmill', type: 'windmill', gridX: 21, gridZ: 5 },
    { id: 'shipping_bin', type: 'shipping_bin', gridX: 16, gridZ: 6 },
    { id: 'wooden_bridge', type: 'wooden_bridge', gridX: 7, gridZ: 23 },
    { id: 'north_gate', type: 'gate', gridX: 6, gridZ: 0, rotationY: 0 },
  ],
  // Solid obstacle collision boxes di lahan kebun luar (TIDAK TEMBUS RUMAH / KINCIR / LUMBUNG)
  solidObstacles: [
    // Badan Rumah Petani (x: 11.8..14.8, z: 3.6..5.3) - Solid!
    { id: 'farmhouse_body', minGridX: 11.8, maxGridX: 14.8, minGridZ: 3.6, maxGridZ: 5.3 },
    // Menara Kincir Angin (x: 19.8..22.2, z: 3.8..6.2) - Solid!
    { id: 'windmill_body', minGridX: 19.8, maxGridX: 22.2, minGridZ: 3.8, maxGridZ: 6.2 },
    // Kotak Pengiriman (x: 15.2..16.8, z: 5.2..6.8) - Solid!
    { id: 'shipping_bin_body', minGridX: 15.2, maxGridX: 16.8, minGridZ: 5.2, maxGridZ: 6.8 },
  ],
  generateTiles: () => MapManager.generateFarmTiles(),
});

// ==========================================
// 2. REGION: DESA ISOPOLIS (VILLAGE 48x48)
// ==========================================
WorldRegistry.registerRegion({
  id: 'village',
  name: 'Desa Isopolis',
  subtitle: 'Hamparan Luas Calon Pemukiman Warga',
  description: 'Pusat pertemuan warga, toko pedagang, dan jalan setapak luas yang menghubungkan berbagai wilayah.',
  width: 48,
  height: 48,
  defaultSpawn: { x: 24, z: 44.5 },
  allowFarming: false,
  gates: [
    {
      id: 'village_south_to_crossroads',
      name: 'Gerbang Selatan ke Simpang Empat',
      triggerArea: { minX: 23, maxX: 25, minZ: 46, maxZ: 47 },
      passageOpeningWorldX: { minX: -1.2, maxX: 2.4 },
      passageOpeningSide: 'south',
      targetLocation: 'crossroads',
      targetSpawn: { x: 9, z: 2.5 }, // Muncul tepat di persimpangan utara
      gateProp: { gridX: 24, gridZ: 47, isNorth: false, rotationY: Math.PI },
    },
    // Gerbang Timur (Kanan Desa) Menurun Tangga ke Pesisir Pantai
    {
      id: 'village_east_to_coast',
      name: 'Jalur Timur Tangga ke Pelabuhan Pantai',
      triggerArea: { minX: 46, maxX: 47, minZ: 22, maxZ: 26 },
      targetLocation: 'coast',
      targetSpawn: { x: 10, z: 3 }, // Muncul tepat di atas tangga pantai
      gateProp: { gridX: 47, gridZ: 24, isNorth: false, rotationY: Math.PI / 2 },
    },
  ],
  staticProps: [
    { id: 'south_gate', type: 'gate', gridX: 24, gridZ: 47, rotationY: Math.PI },
    { id: 'east_gate', type: 'gate', gridX: 47, gridZ: 24, rotationY: Math.PI / 2 },
  ],
  generateTiles: () => MapManager.generateVillageTiles(),
});

// ==========================================
// 3. REGION: INTERIOR RUMAH PETANI (10x10)
// ==========================================
WorldRegistry.registerRegion({
  id: 'house_interior',
  name: 'Rumah Petani',
  subtitle: 'Interior Hangat & Tempat Istirahat',
  description: 'Tempat tidur untuk memulihkan stamina, dapur memasak, perapian, dan peti penyimpanan barang.',
  width: 10,
  height: 10,
  defaultSpawn: { x: 5, z: 7.2 },
  allowFarming: false,
  gates: [
    // Keset Pintu Keluar di tepi paling bawah (x = 3.8..6.2, z = 8.6..9.9) kembali ke depan jalan kebun
    {
      id: 'interior_exit_to_farm',
      name: 'Pintu Keluar ke Kebun',
      triggerArea: { minX: 3.8, maxX: 6.2, minZ: 8.6, maxZ: 9.9 },
      passageOpeningWorldX: { minX: -2.5, maxX: 2.5 },
      passageOpeningSide: 'south',
      targetLocation: 'farm',
      targetSpawn: { x: 13, z: 6.8 }, // Tepat di teras / tangga depan rumah
    },
  ],
  staticProps: [
    { id: 'bed', type: 'interior_bed', gridX: 2, gridZ: 2 },
    { id: 'kitchen', type: 'interior_kitchen', gridX: 7, gridZ: 2 },
    { id: 'chest', type: 'interior_chest', gridX: 2, gridZ: 5 },
    { id: 'table', type: 'interior_dining_table', gridX: 5, gridZ: 5 },
    { id: 'fireplace', type: 'interior_fireplace', gridX: 5, gridZ: 1 },
    { id: 'rug', type: 'interior_rug', gridX: 5, gridZ: 5, worldY: 0.01 },
    { id: 'walls', type: 'interior_walls', gridX: 5, gridZ: 5 },
  ],
  generateTiles: () => MapManager.generateHouseInteriorTiles(),
});

// ==========================================
// 4. REGION: SIMPANG EMPAT ISOPOLIS (CROSSROADS COMPACT 18x18)
// ==========================================
WorldRegistry.registerRegion({
  id: 'crossroads',
  name: 'Simpang Empat Isopolis',
  subtitle: 'Pusat Persimpangan Wilayah Isopolis',
  description: 'Titik temu jalan utama yang menghubungkan Kebun, Desa Isopolis, dan Pegunungan Tambang.',
  width: 18,
  height: 18,
  defaultSpawn: { x: 9, z: 9 },
  allowFarming: false,
  gates: [
    // Gerbang Selatan menuju Kebun
    {
      id: 'crossroads_south_to_farm',
      name: 'Jalur Selatan ke Kebun',
      triggerArea: { minX: 7, maxX: 11, minZ: 16, maxZ: 17 },
      passageOpeningWorldX: { minX: -2.0, maxX: 2.0 },
      passageOpeningSide: 'south',
      targetLocation: 'farm',
      targetSpawn: { x: 6, z: 2.0 },
      gateProp: { gridX: 9, gridZ: 17, isNorth: false, rotationY: Math.PI },
    },
    // Gerbang Utara menuju Desa Isopolis
    {
      id: 'crossroads_north_to_village',
      name: 'Jalur Utara ke Desa',
      triggerArea: { minX: 7, maxX: 11, minZ: 0, maxZ: 1 },
      passageOpeningWorldX: { minX: -2.0, maxX: 2.0 },
      passageOpeningSide: 'north',
      targetLocation: 'village',
      targetSpawn: { x: 24, z: 44.5 },
      gateProp: { gridX: 9, gridZ: 0, isNorth: true },
    },
    // Gerbang Barat menuju Pegunungan & Tambang
    {
      id: 'crossroads_west_to_mountain',
      name: 'Jalur Barat ke Pegunungan Tambang',
      triggerArea: { minX: 0, maxX: 1, minZ: 7, maxZ: 11 },
      targetLocation: 'mountain',
      targetSpawn: { x: 37, z: 20 },
    },
    // Gerbang Timur menuju Pelabuhan Pesisir Pantai
    {
      id: 'crossroads_east_to_coast',
      name: 'Jalur Timur ke Pelabuhan Pantai',
      triggerArea: { minX: 16, maxX: 17, minZ: 7, maxZ: 11 },
      targetLocation: 'coast',
      targetSpawn: { x: 2, z: 20 },
    },
  ],
  staticProps: [
    { id: 'signpost', type: 'signpost', gridX: 9, gridZ: 9 },
    { id: 'rest_bench', type: 'rest_bench', gridX: 12, gridZ: 7 },
    { id: 'south_gate', type: 'gate', gridX: 9, gridZ: 17, rotationY: Math.PI },
    { id: 'north_gate', type: 'gate', gridX: 9, gridZ: 0, rotationY: 0 },
    { id: 'east_gate', type: 'gate', gridX: 17, gridZ: 9, rotationY: -Math.PI / 2 },
  ],
  generateTiles: () => MapManager.generateCrossroadsTiles(),
});

// ==========================================
// 5. REGION: PEGUNUNGAN & GUA TAMBANG (MOUNTAIN 40x40)
// ==========================================
WorldRegistry.registerRegion({
  id: 'mountain',
  name: 'Pegunungan & Gua Tambang',
  subtitle: 'Lanskap Tinggi Rich Ore & Mineral Kristal',
  description: 'Wilayah tebing batu dan gua tua berharga tempat mencari bijih besi, kristal, dan batu tambang.',
  width: 40,
  height: 40,
  defaultSpawn: { x: 37, z: 20 },
  allowFarming: false,
  gates: [
    // Gerbang Timur kembali ke Simpang Empat
    {
      id: 'mountain_east_to_crossroads',
      name: 'Jalur Timur ke Simpang Empat',
      triggerArea: { minX: 38, maxX: 39, minZ: 18, maxZ: 22 },
      targetLocation: 'crossroads',
      targetSpawn: { x: 2.5, z: 8.5 },
    },
  ],
  staticProps: [
    { id: 'mine_entrance', type: 'mine_entrance', gridX: 18, gridZ: 5 },
    { id: 'crystal_1', type: 'crystal_cluster', gridX: 14, gridZ: 7 },
    { id: 'crystal_2', type: 'crystal_cluster', gridX: 22, gridZ: 7 },
    { id: 'east_gate', type: 'gate', gridX: 39, gridZ: 20, rotationY: Math.PI / 2 },
  ],
  generateTiles: () => MapManager.generateMountainTiles(),
});

// ==========================================
// 6. REGION: PELABUHAN & PESISIR PANTAI (COAST 42x28)
// ==========================================
WorldRegistry.registerRegion({
  id: 'coast',
  name: 'Pelabuhan & Pesisir Pantai',
  subtitle: 'Pasir Pantai, Dermaga Memancing & Mercusuar',
  description: 'Area perairan laut jernih, tempat memancing ikan laut, perahu nelayan, dan mercusuar.',
  width: 42,
  height: 28,
  defaultSpawn: { x: 10, z: 5 },
  allowFarming: false,
  gates: [
    // Gerbang Utara Tangga Ke Desa (Atas Cliff)
    {
      id: 'coast_north_to_village',
      name: 'Tangga Batu Naik ke Desa',
      triggerArea: { minX: 8, maxX: 12, minZ: 0, maxZ: 1 },
      targetLocation: 'village',
      targetSpawn: { x: 44, z: 24 },
    },
    // Gerbang Barat ke Simpang Empat
    {
      id: 'coast_west_to_crossroads',
      name: 'Jalur Barat ke Simpang Empat',
      triggerArea: { minX: 0, maxX: 1, minZ: 18, maxZ: 22 },
      targetLocation: 'crossroads',
      targetSpawn: { x: 15, z: 9 },
    },
  ],
  staticProps: [
    { id: 'stone_stairs', type: 'stone_stairs', gridX: 10, gridZ: 2 },
    { id: 'lighthouse', type: 'lighthouse', gridX: 35, gridZ: 12 },
    { id: 'pier_dock', type: 'pier_dock', gridX: 21, gridZ: 21 },
    { id: 'fishing_boat', type: 'fishing_boat', gridX: 24, gridZ: 23 },
    { id: 'fishing_shack', type: 'fishing_shack', gridX: 15, gridZ: 10 },
    { id: 'west_gate', type: 'gate', gridX: 0, gridZ: 20, rotationY: -Math.PI / 2 },
  ],
  generateTiles: () => MapManager.generateCoastTiles(),
});

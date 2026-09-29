import { TileState, DebrisType } from '../types/game';

export class MapManager {
  // Generate Farm (Kebun Isopolis) 28x28 Grid
  public static generateFarmTiles(): Map<string, TileState> {
    const map = new Map<string, TileState>();
    const width = 28;
    const height = 28;

    // 1. Initialize all as grass
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < height; z++) {
        map.set(`${x}_${z}`, { x, z, type: 'grass' });
      }
    }

    // 2. Lake / Natural Pond (South-West Corner)
    for (let x = 0; x <= 4; x++) {
      for (let z = 22; z <= 27; z++) {
        map.set(`${x}_${z}`, { x, z, type: 'water' });
      }
    }

    // 3. Selokan / Saluran Air Irigasi (Coretan Biru dari Danau ke Perbatasan Timur)
    const canalCoords: [number, number][] = [
      [4, 23], [5, 23], [6, 23], [7, 23], [8, 23], [9, 23], [10, 23],
      [11, 23], [12, 23], [13, 22], [14, 22], [15, 22], [16, 21], [17, 21],
      [18, 20], [19, 20], [20, 20], [21, 19], [22, 19], [23, 19], [24, 19],
      [25, 18], [26, 18], [27, 18],
    ];
    canalCoords.forEach(([x, z]) => {
      map.set(`${x}_${z}`, { x, z, type: 'water' });
    });

    // 4. Jalan Setapak (Coretan Oren)
    // A. Jalan Utama Vertikal (Utara - Selatan di x = 7)
    for (let z = 8; z <= 27; z++) {
      map.set(`7_${z}`, { x: 7, z, type: 'path' });
    }
    // Catatan: Petak (7, 23) adalah persimpangan selokan dengan jalan setapak (jembatan kayu)
    map.set('7_23', { x: 7, z: 23, type: 'path' });

    // B. Jalur Utara menuju Gerbang Desa (x = 6, z = 0 .. 7) - Petunjuk Ungu
    const northPath: [number, number][] = [
      [7, 8], [6, 7], [6, 6], [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0]
    ];
    northPath.forEach(([x, z]) => {
      map.set(`${x}_${z}`, { x, z, type: 'path' });
    });

    // C. Cabang Jalan Timur di bawah Rumah & Kincir (z = 8, x = 7 .. 27)
    for (let x = 7; x <= 27; x++) {
      map.set(`${x}_8`, { x, z: 8, type: 'path' });
    }
    // Jalan masuk ke pintu depan Rumah (x = 13..14, z = 6..7)
    map.set('13_7', { x: 13, z: 7, type: 'path' });
    map.set('14_7', { x: 14, z: 7, type: 'path' });
    map.set('13_6', { x: 13, z: 6, type: 'path' });
    map.set('14_6', { x: 14, z: 6, type: 'path' });

    // D. Cabang Jalan Barat (z = 16, x = 0 .. 7)
    for (let x = 0; x <= 7; x++) {
      map.set(`${x}_16`, { x, z: 16, type: 'path' });
    }

    // 5. Lahan Tani Pusat (3x3 Soil)
    for (let x = 12; x <= 14; x++) {
      for (let z = 12; z <= 14; z++) {
        map.set(`${x}_${z}`, {
          x,
          z,
          type: 'soil',
          isWatered: true,
          crop: x === 13 && z === 13 ? { type: 'rice', stage: 2, plantedAt: Date.now(), lastWateredAt: Date.now() } : undefined,
        });
      }
    }

    // 6. Rintangan Liar Ladang Kebun
    const debrisSeeds: { x: number; z: number; debris: DebrisType }[] = [
      { x: 8, z: 12, debris: 'log' },
      { x: 9, z: 18, debris: 'log' },
      { x: 17, z: 13, debris: 'log' },
      { x: 19, z: 16, debris: 'log' },
      { x: 14, z: 20, debris: 'log' },
      { x: 22, z: 12, debris: 'log' },

      { x: 7, z: 15, debris: 'wild_tree' },
      { x: 18, z: 21, debris: 'wild_tree' },
      { x: 23, z: 21, debris: 'wild_tree' },
      { x: 10, z: 24, debris: 'wild_tree' },
      { x: 5, z: 12, debris: 'wild_tree' },

      { x: 11, z: 9, debris: 'small_stone' },
      { x: 15, z: 9, debris: 'small_stone' },
      { x: 16, z: 17, debris: 'small_stone' },
      { x: 11, z: 18, debris: 'small_stone' },
      { x: 8, z: 16, debris: 'small_stone' },
      { x: 20, z: 10, debris: 'small_stone' },
      { x: 24, z: 14, debris: 'small_stone' },

      { x: 9, z: 10, debris: 'big_stone' },
      { x: 21, z: 16, debris: 'big_stone' },
      { x: 16, z: 24, debris: 'big_stone' },
      { x: 24, z: 9, debris: 'big_stone' },

      { x: 10, z: 11, debris: 'weed' },
      { x: 15, z: 11, debris: 'weed' },
      { x: 11, z: 15, debris: 'weed' },
      { x: 15, z: 15, debris: 'weed' },
      { x: 8, z: 14, debris: 'weed' },
      { x: 9, z: 14, debris: 'weed' },
      { x: 17, z: 15, debris: 'weed' },
      { x: 18, z: 14, debris: 'weed' },
      { x: 12, z: 18, debris: 'weed' },
      { x: 13, z: 19, debris: 'weed' },
      { x: 18, z: 10, debris: 'weed' },
      { x: 6, z: 18, debris: 'weed' },
      { x: 22, z: 15, debris: 'weed' },
    ];

    debrisSeeds.forEach(({ x, z, debris }) => {
      const k = `${x}_${z}`;
      const tile = map.get(k);
      if (tile && tile.type === 'grass') {
        map.set(k, { ...tile, debris });
      }
    });

    return map;
  }

  // Generate Village (Lahan Desa Isopolis) 48x48 Grid (2,304 Tiles)
  // Catatan: Lahan Desa BUKAN lahan tanam. Padang rumput tetap bersih & stabil.
  public static generateVillageTiles(): Map<string, TileState> {
    const map = new Map<string, TileState>();
    const width = 48;
    const height = 48;

    // 1. Initialize all as grass
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < height; z++) {
        map.set(`${x}_${z}`, { x, z, type: 'grass' });
      }
    }

    // 2. Jalan Setapak Pendek dari Bawah (South Entrance Path: x = 23..25, z = 44..47)
    for (let z = 44; z <= 47; z++) {
      for (let x = 23; x <= 25; x++) {
        map.set(`${x}_${z}`, { x, z, type: 'path' });
      }
    }

    // 3. Alun-alun / Calon Pusat Desa Sementara (Plaza Tengah di x = 21..27, z = 36..43)
    for (let z = 36; z <= 43; z++) {
      for (let x = 21; x <= 27; x++) {
        map.set(`${x}_${z}`, { x, z, type: 'path' });
      }
    }

    // 4. Jalan setapak horizontal bercabang
    for (let x = 12; x <= 36; x++) {
      map.set(`${x}_39`, { x, z: 39, type: 'path' });
    }

    // 5. Rintangan Liar Alami yang hanya tumbuh di sebagian sudut perbatasan
    const naturalDebris: { x: number; z: number; debris: DebrisType }[] = [
      { x: 8, z: 10, debris: 'wild_tree' },
      { x: 12, z: 8, debris: 'wild_tree' },
      { x: 38, z: 10, debris: 'wild_tree' },
      { x: 42, z: 14, debris: 'wild_tree' },
      { x: 6, z: 36, debris: 'wild_tree' },
      { x: 41, z: 38, debris: 'wild_tree' },

      { x: 10, z: 18, debris: 'log' },
      { x: 37, z: 22, debris: 'log' },

      { x: 7, z: 15, debris: 'big_stone' },
      { x: 40, z: 20, debris: 'big_stone' },
      { x: 14, z: 22, debris: 'small_stone' },
      { x: 34, z: 18, debris: 'small_stone' },
    ];

    naturalDebris.forEach(({ x, z, debris }) => {
      const k = `${x}_${z}`;
      const tile = map.get(k);
      if (tile && tile.type === 'grass') {
        map.set(k, { ...tile, debris });
      }
    });

    return map;
  }

  // Generate Farmhouse Interior (Interior Rumah Petani) 10x10 Grid
  // Lantai kayu parquet hangat yang bersih dan estetik
  public static generateHouseInteriorTiles(): Map<string, TileState> {
    const map = new Map<string, TileState>();
    const width = 10;
    const height = 10;

    for (let x = 0; x < width; x++) {
      for (let z = 0; z < height; z++) {
        // All interior floor as clean polished wood planks (path type for walkability)
        map.set(`${x}_${z}`, { x, z, type: 'path' });
      }
    }

    return map;
  }

  // Generate Compact Crossroads (Simpang Empat Isopolis) 18x18 Grid
  public static generateCrossroadsTiles(): Map<string, TileState> {
    const map = new Map<string, TileState>();
    const width = 18;
    const height = 18;

    // 1. All grass base
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < height; z++) {
        map.set(`${x}_${z}`, { x, z, type: 'grass' });
      }
    }

    // 2. Central Stone Plaza (x: 7..11, z: 7..11)
    for (let x = 7; x <= 11; x++) {
      for (let z = 7; z <= 11; z++) {
        map.set(`${x}_${z}`, { x, z, type: 'path' });
      }
    }

    // 3. South Branch Path to Farm (x: 8..9, z: 12..17)
    for (let z = 12; z <= 17; z++) {
      map.set(`8_${z}`, { x: 8, z, type: 'path' });
      map.set(`9_${z}`, { x: 9, z, type: 'path' });
    }

    // 4. North Branch Path to Village (x: 8..9, z: 0..6)
    for (let z = 0; z <= 6; z++) {
      map.set(`8_${z}`, { x: 8, z, type: 'path' });
      map.set(`9_${z}`, { x: 9, z, type: 'path' });
    }

    // 5. West Branch Path to Mountain Mines (x: 0..6, z: 8..9)
    for (let x = 0; x <= 6; x++) {
      map.set(`${x}_8`, { x, z: 8, type: 'path' });
      map.set(`${x}_9`, { x, z: 9, type: 'path' });
    }

    // 6. East Branch Path to Coast (x: 12..17, z: 8..9)
    for (let x = 12; x <= 17; x++) {
      map.set(`${x}_8`, { x, z: 8, type: 'path' });
      map.set(`${x}_9`, { x, z: 9, type: 'path' });
    }

    // Scattered cozy trees & stones along corners
    const debris: { x: number; z: number; debris: DebrisType }[] = [
      { x: 4, z: 4, debris: 'wild_tree' },
      { x: 13, z: 4, debris: 'wild_tree' },
      { x: 4, z: 13, debris: 'wild_tree' },
      { x: 13, z: 13, debris: 'wild_tree' },
      { x: 6, z: 12, debris: 'log' },
      { x: 12, z: 6, debris: 'log' },
      { x: 5, z: 6, debris: 'small_stone' },
      { x: 12, z: 12, debris: 'small_stone' },
    ];

    debris.forEach(({ x, z, debris }) => {
      const k = `${x}_${z}`;
      const tile = map.get(k);
      if (tile && tile.type === 'grass') {
        map.set(k, { ...tile, debris });
      }
    });

    return map;
  }

  // Generate Mountain & Mines (Pegunungan Isopolis) 40x40 Grid
  public static generateMountainTiles(): Map<string, TileState> {
    const map = new Map<string, TileState>();
    const width = 40;
    const height = 40;

    // 1. All grass base with rocky patches
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < height; z++) {
        map.set(`${x}_${z}`, { x, z, type: 'grass' });
      }
    }

    // 2. East Entrance Path (x: 26..39, z: 19..21)
    for (let x = 26; x <= 39; x++) {
      for (let z = 19; z <= 21; z++) {
        map.set(`${x}_${z}`, { x, z, type: 'path' });
      }
    }

    // 3. Winding Mountain Trail up to Mine Mouth (from x:26, z:20 -> x:18, z:12 -> x:18, z:7)
    for (let x = 18; x <= 26; x++) {
      map.set(`${x}_20`, { x, z: 20, type: 'path' });
    }
    for (let z = 7; z <= 20; z++) {
      map.set(`18_${z}`, { x: 18, z, type: 'path' });
      map.set(`19_${z}`, { x: 19, z, type: 'path' });
    }

    // Stone mining plaza in front of mine mouth (x: 16..21, z: 5..8)
    for (let x = 16; x <= 21; x++) {
      for (let z = 5; z <= 8; z++) {
        map.set(`${x}_${z}`, { x, z, type: 'path' });
      }
    }

    // Rich mining ore nodes (big stones, small stones, logs)
    const ores: { x: number; z: number; debris: DebrisType }[] = [
      { x: 12, z: 8, debris: 'big_stone' },
      { x: 14, z: 10, debris: 'big_stone' },
      { x: 23, z: 8, debris: 'big_stone' },
      { x: 25, z: 12, debris: 'big_stone' },
      { x: 10, z: 16, debris: 'big_stone' },
      { x: 28, z: 24, debris: 'big_stone' },

      { x: 13, z: 14, debris: 'small_stone' },
      { x: 15, z: 18, debris: 'small_stone' },
      { x: 22, z: 16, debris: 'small_stone' },
      { x: 24, z: 22, debris: 'small_stone' },
      { x: 11, z: 22, debris: 'small_stone' },
      { x: 16, z: 25, debris: 'small_stone' },

      { x: 8, z: 12, debris: 'log' },
      { x: 30, z: 14, debris: 'log' },
      { x: 12, z: 28, debris: 'log' },

      { x: 6, z: 6, debris: 'wild_tree' },
      { x: 32, z: 8, debris: 'wild_tree' },
      { x: 34, z: 26, debris: 'wild_tree' },
      { x: 8, z: 32, debris: 'wild_tree' },
    ];

    ores.forEach(({ x, z, debris }) => {
      const k = `${x}_${z}`;
      const tile = map.get(k);
      if (tile && tile.type === 'grass') {
        map.set(k, { ...tile, debris });
      }
    });

    return map;
  }

  // Generate Pelabuhan & Pesisir Pantai (42x28 Grid)
  public static generateCoastTiles(): Map<string, TileState> {
    const map = new Map<string, TileState>();
    const width = 42;
    const height = 28;

    // 1. Default Grass Base for Beachland
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < height; z++) {
        map.set(`${x}_${z}`, { x, z, type: 'grass' });
      }
    }

    // 2. Ocean Water Area (z: 20..27)
    for (let x = 0; x < width; x++) {
      for (let z = 20; z < height; z++) {
        // Leave the West Entrance path land bridge (x: 0..4, z: 19..21)
        if (x <= 4 && z <= 21) {
          map.set(`${x}_${z}`, { x, z, type: 'path' });
        } else {
          map.set(`${x}_${z}`, { x, z, type: 'water' });
        }
      }
    }

    // 3. North Stairs Promenade (Stairs coming from Village down the cliff)
    for (let x = 9; x <= 11; x++) {
      for (let z = 0; z <= 6; z++) {
        map.set(`${x}_${z}`, { x, z, type: 'path' });
      }
    }

    // 4. West Entrance Path (From Crossroads East Gate)
    for (let x = 0; x <= 12; x++) {
      for (let z = 19; z <= 20; z++) {
        map.set(`${x}_${z}`, { x, z, type: 'path' });
      }
    }

    // Connect West Path & North Stairs to Pier Dock
    for (let z = 6; z <= 19; z++) {
      map.set(`10_${z}`, { x: 10, z, type: 'path' });
      map.set(`11_${z}`, { x: 11, z, type: 'path' });
    }
    for (let x = 11; x <= 22; x++) {
      map.set(`${x}_18`, { x, z: 18, type: 'path' });
      map.set(`${x}_19`, { x, z: 19, type: 'path' });
    }

    // 5. Pier Dock Walkway extending over water (x: 20..22, z: 18..24)
    for (let x = 20; x <= 22; x++) {
      for (let z = 18; z <= 24; z++) {
        map.set(`${x}_${z}`, { x, z, type: 'path' });
      }
    }

    // Natural beach trees, shells, logs
    const beachDebris: { x: number; z: number; debris: DebrisType }[] = [
      { x: 5, z: 8, debris: 'wild_tree' },
      { x: 28, z: 6, debris: 'wild_tree' },
      { x: 38, z: 10, debris: 'wild_tree' },
      { x: 30, z: 14, debris: 'wild_tree' },
      { x: 16, z: 8, debris: 'log' },
      { x: 26, z: 12, debris: 'log' },
      { x: 6, z: 14, debris: 'small_stone' },
      { x: 32, z: 16, debris: 'small_stone' },
    ];

    beachDebris.forEach(({ x, z, debris }) => {
      const k = `${x}_${z}`;
      const tile = map.get(k);
      if (tile && tile.type === 'grass') {
        map.set(k, { ...tile, debris });
      }
    });

    return map;
  }
}

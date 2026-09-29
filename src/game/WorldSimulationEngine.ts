import { TileState, PlacedAnimal, GrowthStage } from '../types/game';

/**
 * WorldSimulationEngine: Ultra-Fast Background Time & Crop Simulation.
 * Performs in-memory delta calculations for all world regions (active and inactive),
 * ensuring crops grow and soil dries accurately without requiring 3D rendering of distant maps.
 */
export class WorldSimulationEngine {
  // Advance 1 day of simulation across any tile map
  public static simulateDayForTiles(tiles: Map<string, TileState>, isRaining = false): Map<string, TileState> {
    const nextMap = new Map<string, TileState>();

    tiles.forEach((tile, key) => {
      const updated = { ...tile };

      // Crop Growth Check
      if (updated.crop) {
        // If it was watered, grow by 1 stage (max stage 3)
        if (updated.isWatered || isRaining) {
          if (updated.crop.stage < 3) {
            updated.crop = {
              ...updated.crop,
              stage: (updated.crop.stage + 1) as GrowthStage,
              lastWateredAt: Date.now(),
            };
          }
        }
      }

      // Soil Moisture Update
      if (updated.type === 'soil') {
        // If it rains, remain watered; otherwise dry up for the next morning
        updated.isWatered = isRaining;
      }

      nextMap.set(key, updated);
    });

    return nextMap;
  }

  // Simulate animal production & feeding overnight
  public static simulateDayForAnimals(animals: PlacedAnimal[]): PlacedAnimal[] {
    const now = Date.now();
    return animals.map((a) => ({
      ...a,
      lastFedTimestamp: now,
      lastProduceTimestamp: now,
      affection: Math.min(10, a.affection + 1),
    }));
  }
}

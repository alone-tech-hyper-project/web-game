import { PlayerData, TileState, InventoryItem, PlacedAnimal, PerformanceSettings, Quest } from '../types/game';

export interface GameSaveSnapshot {
  version: number;
  timestamp: number;
  player: PlayerData;
  farmTiles: [string, TileState][];
  villageTiles: [string, TileState][];
  houseInteriorTiles?: [string, TileState][];
  inventory: InventoryItem[];
  shippingBin: InventoryItem[];
  animals: PlacedAnimal[];
  quests: Quest[];
  settings?: PerformanceSettings;
}

const STORAGE_KEY = 'isopolis_harvest_save_v2';
const SNAPSHOT_DB_NAME = 'isopolis_offline_db';
const SNAPSHOT_STORE = 'game_snapshots';

class StorageEngine {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private cacheMemorySnapshot: GameSaveSnapshot | null = null;

  constructor() {
    this.initIndexedDB();
  }

  // Initialize high-speed IndexedDB for deep storage & snapshots
  private initIndexedDB() {
    if (typeof window === 'undefined' || !window.indexedDB) return;

    this.dbPromise = new Promise((resolve, reject) => {
      try {
        const request = window.indexedDB.open(SNAPSHOT_DB_NAME, 1);
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(SNAPSHOT_STORE)) {
            db.createObjectStore(SNAPSHOT_STORE, { keyPath: 'id' });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  // Save game state to both LocalStorage (fast-sync) & IndexedDB (deep binary buffer cache)
  public async saveGame(
    player: PlayerData,
    farmTiles: Map<string, TileState>,
    villageTiles: Map<string, TileState>,
    inventory: InventoryItem[],
    shippingBin: InventoryItem[],
    animals: PlacedAnimal[],
    quests: Quest[],
    settings?: PerformanceSettings,
    houseInteriorTiles?: Map<string, TileState>
  ): Promise<boolean> {
    const snapshot: GameSaveSnapshot = {
      version: 2,
      timestamp: Date.now(),
      player,
      farmTiles: Array.from(farmTiles.entries()),
      villageTiles: Array.from(villageTiles.entries()),
      houseInteriorTiles: houseInteriorTiles ? Array.from(houseInteriorTiles.entries()) : undefined,
      inventory,
      shippingBin,
      animals,
      quests,
      settings,
    };

    this.cacheMemorySnapshot = snapshot;

    // 1. Sync to LocalStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch (e) {
      console.warn('LocalStorage save failed, falling back to IndexedDB only:', e);
    }

    // 2. Async deep cache to IndexedDB (supports large world state without 5MB quota cap)
    try {
      if (this.dbPromise) {
        const db = await this.dbPromise;
        const tx = db.transaction(SNAPSHOT_STORE, 'readwrite');
        const store = tx.objectStore(SNAPSHOT_STORE);
        store.put({ id: 'latest_autosave', ...snapshot });
      }
      return true;
    } catch (err) {
      console.error('IndexedDB save failed:', err);
      return false;
    }
  }

  // Load saved state: Memory cache -> LocalStorage -> IndexedDB
  public async loadGame(): Promise<GameSaveSnapshot | null> {
    if (this.cacheMemorySnapshot) {
      return this.cacheMemorySnapshot;
    }

    // 1. Try LocalStorage
    try {
      const localData = localStorage.getItem(STORAGE_KEY);
      if (localData) {
        const parsed = JSON.parse(localData) as GameSaveSnapshot;
        if (parsed && parsed.player) {
          this.cacheMemorySnapshot = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.warn('LocalStorage read error:', e);
    }

    // 2. Try IndexedDB deep storage
    try {
      if (this.dbPromise) {
        const db = await this.dbPromise;
        const tx = db.transaction(SNAPSHOT_STORE, 'readonly');
        const store = tx.objectStore(SNAPSHOT_STORE);
        const req = store.get('latest_autosave');
        return new Promise((resolve) => {
          req.onsuccess = () => {
            if (req.result) {
              this.cacheMemorySnapshot = req.result;
              resolve(req.result);
            } else {
              resolve(null);
            }
          };
          req.onerror = () => resolve(null);
        });
      }
    } catch (err) {
      console.warn('IndexedDB read error:', err);
    }

    return null;
  }

  // Clear save data
  public clearSave(): void {
    this.cacheMemorySnapshot = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {}

    if (this.dbPromise) {
      this.dbPromise.then((db) => {
        const tx = db.transaction(SNAPSHOT_STORE, 'readwrite');
        tx.objectStore(SNAPSHOT_STORE).clear();
      });
    }
  }
}

export const storageEngine = new StorageEngine();

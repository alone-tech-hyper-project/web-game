import React, { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { GameScene } from './game/3d/GameScene';
import { texturePackManager } from './game/TexturePackManager';
import { soundEngine } from './game/SoundEngine';
import { MapManager } from './game/MapManager';
import { storageEngine } from './game/StorageEngine';
import { WorldRegistry } from './game/WorldRegistry';
import { WorldSimulationEngine } from './game/WorldSimulationEngine';
import {
  PlayerData,
  TileState,
  InventoryItem,
  ToolType,
  PerformanceSettings,
  Quest,
  CropType,
  BuildingType,
  PlacedAnimal,
  TexturePackPalette,
  DebrisType,
  MapLocation,
} from './types/game';

import { TouchControls } from './components/TouchControls';
import { HUD } from './components/HUD';
import { BigMapModal } from './components/BigMapModal';
import { ShippingBinModal } from './components/ShippingBinModal';
import { SeedSelectModal } from './components/SeedSelectModal';
import { TexturePackModal } from './components/TexturePackModal';
import { AssetLoadingModal } from './components/AssetLoadingModal';
import { MarketModal } from './components/MarketModal';
import { CraftingModal } from './components/CraftingModal';
import { NPCDialogueModal } from './components/NPCDialogueModal';
import { SettingsModal } from './components/SettingsModal';
import { QuestModal } from './components/QuestModal';
import { Sparkles, Compass } from 'lucide-react';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<GameScene | null>(null);

  // --- GAME STATE ---
  const [player, setPlayer] = useState<PlayerData>({
    name: 'Petani Isopolis',
    farmName: 'Kebun Isopolis',
    currentLocation: 'farm',
    coins: 150,
    level: 1,
    exp: 0,
    maxExp: 100,
    energy: 100,
    maxEnergy: 100,
    day: 1,
    timeHour: 7,
    timeMinute: 0,
    season: 'spring',
    weather: 'sunny',
  });

  const [fps, setFps] = useState(24);
  const [playerPos, setPlayerPos] = useState({ x: 7, z: 12 });
  const [isNearShippingBin, setIsNearShippingBin] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolType>('hoe');
  const [selectedSeed, setSelectedSeed] = useState<CropType>('rice');

  // Selector mode: 'tools' or 'items'
  const [selectorMode, setSelectorMode] = useState<'tools' | 'items'>('tools');

  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: 'seed_rice', name: 'Benih Padi', category: 'seed', count: 6, icon: '🌾', sellPrice: 10, cropType: 'rice' },
    { id: 'seed_corn', name: 'Benih Jagung', category: 'seed', count: 4, icon: '🌽', sellPrice: 15, cropType: 'corn' },
    { id: 'seed_strawberry', name: 'Benih Stroberi', category: 'seed', count: 3, icon: '🍓', sellPrice: 25, cropType: 'strawberry' },
    { id: 'res_wood', name: 'Kayu Gelondong', category: 'material', count: 4, icon: '🪵', sellPrice: 15 },
    { id: 'res_stone', name: 'Batu Kali', category: 'material', count: 4, icon: '🪨', sellPrice: 12 },
  ]);

  const [activeItem, setActiveItem] = useState<InventoryItem | null>(() => inventory[0] || null);

  // Kotak Pengiriman (Shipping Bin) State
  const [shippingBin, setShippingBin] = useState<InventoryItem[]>([]);

  // Distinct Maps: Farm (28x28), Village (48x48), House Interior (10x10), Crossroads (18x18), Mountain (40x40), Coast (42x28)
  const [farmTiles, setFarmTiles] = useState<Map<string, TileState>>(() => MapManager.generateFarmTiles());
  const [villageTiles, setVillageTiles] = useState<Map<string, TileState>>(() => MapManager.generateVillageTiles());
  const [houseInteriorTiles, setHouseInteriorTiles] = useState<Map<string, TileState>>(() => MapManager.generateHouseInteriorTiles());
  const [crossroadsTiles, setCrossroadsTiles] = useState<Map<string, TileState>>(() => MapManager.generateCrossroadsTiles());
  const [mountainTiles, setMountainTiles] = useState<Map<string, TileState>>(() => MapManager.generateMountainTiles());
  const [coastTiles, setCoastTiles] = useState<Map<string, TileState>>(() => MapManager.generateCoastTiles());

  // Current Active Map
  const isFarm = player.currentLocation === 'farm';
  const isVillage = player.currentLocation === 'village';
  const isHouseInterior = player.currentLocation === 'house_interior';
  const activeRegion = WorldRegistry.getRegion(player.currentLocation);
  const gridWidth = activeRegion.width;
  const gridHeight = activeRegion.height;
  const activeTiles =
    player.currentLocation === 'farm'
      ? farmTiles
      : player.currentLocation === 'village'
      ? villageTiles
      : player.currentLocation === 'crossroads'
      ? crossroadsTiles
      : player.currentLocation === 'mountain'
      ? mountainTiles
      : player.currentLocation === 'coast'
      ? coastTiles
      : houseInteriorTiles;

  // Map Transition State: dimming -> loading & pre-rendering -> brightening -> done
  const [mapTransition, setMapTransition] = useState<{
    isTransitioning: boolean;
    targetLocation: MapLocation | null;
    stage: 'idle' | 'dimming' | 'loading' | 'brightening';
  }>({
    isTransitioning: false,
    targetLocation: null,
    stage: 'idle',
  });

  const [animals, setAnimals] = useState<PlacedAnimal[]>([
    { id: 'c1', type: 'chicken', x: 7, z: 7, lastFedTimestamp: Date.now(), lastProduceTimestamp: Date.now(), affection: 5 },
  ]);

  const [quests, setQuests] = useState<Quest[]>([
    { id: 'q1', title: 'Cangkul Ladang Pertamamu', description: 'Gunakan Cangkul untuk membuka 3 petak tanah', rewardCoins: 50, rewardExp: 20, targetType: 'water', requiredCount: 3, currentCount: 1, completed: false },
    { id: 'q2', title: 'Panen Padi Emas', description: 'Panen 1x Padi dewasa', rewardCoins: 100, rewardExp: 40, targetType: 'harvest', requiredCount: 1, currentCount: 0, completed: false },
  ]);

  const [settings, setSettings] = useState<PerformanceSettings>({
    renderScale: 1.0,
    shadowQuality: 'off',
    particleDensity: 'low',
    fpsLimit: 24,
    cameraZoom: 1.4,
    autoOptimize: true,
    showFpsCounter: true,
    postProcessing: false,
  });

  const [soundEnabled, setSoundEnabled] = useState(true);

  // Modals
  const [showBigMapModal, setShowBigMapModal] = useState(false);
  const [showShippingBinModal, setShowShippingBinModal] = useState(false);
  const [showSeedSelectModal, setShowSeedSelectModal] = useState(false);
  const [showTexturePackModal, setShowTexturePackModal] = useState(false);
  const [showMarketModal, setShowMarketModal] = useState(false);
  const [showCraftingModal, setShowCraftingModal] = useState(false);
  const [showNPCModal, setShowNPCModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showQuestModal, setShowQuestModal] = useState(false);

  // Toast Notification
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? null : curr));
    }, 2500);
  };

  const handleTravelToRef = useRef<(target: MapLocation, spawn?: { x: number; z: number }) => void>(() => {});

  // Switch location handler with smooth screen dimming & full asset pre-loading
  const handleTravelTo = useCallback(
    (targetLocation: MapLocation, customSpawn?: { x: number; z: number }) => {
      if (!sceneRef.current || mapTransition.isTransitioning) return;
      soundEngine.playCoin();

      const region = WorldRegistry.getRegion(targetLocation);

      // Step 1: Start dimming screen to black
      setMapTransition({
        isTransitioning: true,
        targetLocation,
        stage: 'dimming',
      });

      // Step 2: Once dimmed (250ms), pre-load and instantiate the entire 3D world
      setTimeout(() => {
        setMapTransition((prev) => ({ ...prev, stage: 'loading' }));

        const nextTiles =
          targetLocation === 'farm'
            ? farmTiles
            : targetLocation === 'village'
            ? villageTiles
            : targetLocation === 'crossroads'
            ? crossroadsTiles
            : targetLocation === 'mountain'
            ? mountainTiles
            : targetLocation === 'coast'
            ? coastTiles
            : houseInteriorTiles;
        const spawnPos = customSpawn || region.defaultSpawn;

        if (sceneRef.current) {
          sceneRef.current.switchLocation(targetLocation, nextTiles, spawnPos);
        }

        setPlayer((p) => ({ ...p, currentLocation: targetLocation }));
        setPlayerPos(spawnPos);

        // Step 3: Keep loading screen steady for 400ms for pre-warming GPU, then smoothly brighten
        setTimeout(() => {
          setMapTransition((prev) => ({ ...prev, stage: 'brightening' }));

          // Step 4: Complete transition & return to normal bright viewport
          setTimeout(() => {
            setMapTransition({
              isTransitioning: false,
              targetLocation: null,
              stage: 'idle',
            });

            showToast(`🗺️ Tiba di ${region.name} (${region.width}x${region.height})!`);
          }, 350);
        }, 400);
      }, 250);
    },
    [farmTiles, villageTiles, houseInteriorTiles, mapTransition.isTransitioning]
  );

  handleTravelToRef.current = handleTravelTo;

  // Check if current targeted tile has collectible crop or wild debris
  const targetTile = activeTiles.get(`${playerPos.x}_${playerPos.z}`);
  const isCollectible = Boolean(targetTile?.crop && targetTile.crop.stage === 3);
  const targetedDebris = targetTile?.debris;

  // Set active tiles helper
  const updateCurrentTiles = useCallback(
    (updater: (prev: Map<string, TileState>) => Map<string, TileState>) => {
      if (player.currentLocation === 'farm') {
        setFarmTiles(updater);
      } else if (player.currentLocation === 'village') {
        setVillageTiles(updater);
      } else {
        setHouseInteriorTiles(updater);
      }
    },
    [player.currentLocation]
  );

  // Harvest / Collect Handler
  const handleCollect = useCallback(
    (gx: number, gz: number) => {
      const key = `${gx}_${gz}`;
      const currentTile = activeTiles.get(key);
      if (!currentTile || !currentTile.crop || currentTile.crop.stage !== 3) return false;

      soundEngine.playHarvest();
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.7 } });

      const harvestedCrop = currentTile.crop.type;

      setInventory((prev) => {
        const existing = prev.find((i) => i.id === `crop_${harvestedCrop}`);
        if (existing) {
          return prev.map((i) => (i.id === existing.id ? { ...i, count: i.count + 1 } : i));
        }
        return [
          ...prev,
          {
            id: `crop_${harvestedCrop}`,
            name: `Hasil ${harvestedCrop}`,
            category: 'crop',
            count: 1,
            icon: harvestedCrop === 'strawberry' ? '🍓' : harvestedCrop === 'corn' ? '🌽' : '🌾',
            sellPrice: 35,
            cropType: harvestedCrop,
          },
        ];
      });

      updateCurrentTiles((prev) => {
        const next = new Map(prev);
        next.set(key, { ...currentTile, crop: undefined });
        return next;
      });

      setPlayer((p) => ({ ...p, exp: p.exp + 15, coins: p.coins + 10 }));
      showToast(`✨ Berhasil mengambil hasil panen ${harvestedCrop}! +10 Koin +15 EXP`);

      setQuests((prev) =>
        prev.map((q) => (q.targetType === 'harvest' ? { ...q, currentCount: q.currentCount + 1 } : q))
      );
      return true;
    },
    [activeTiles, updateCurrentTiles]
  );

  // Ship Item into Shipping Bin
  const handleShipItem = useCallback((item: InventoryItem, count = 1) => {
    soundEngine.playCoin();
    setInventory((prev) => {
      const updated = prev
        .map((i) => (i.id === item.id ? { ...i, count: i.count - count } : i))
        .filter((i) => i.count > 0);
      return updated;
    });

    setShippingBin((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, count: i.count + count } : i));
      }
      return [...prev, { ...item, count }];
    });

    showToast(`📦 Memasukkan ${count}x ${item.name} ke Kotak Pengiriman! Koin cair jam 17:30 (5:30 PM)`);
  }, []);

  // Retrieve Item from Shipping Bin
  const handleRetrieveItem = useCallback((item: InventoryItem) => {
    soundEngine.playCoin();
    setShippingBin((prev) => prev.filter((i) => i.id !== item.id));
    setInventory((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, count: i.count + item.count } : i));
      }
      return [...prev, item];
    });
    showToast(`📥 Mengambil kembali ${item.name} ke tas!`);
  }, []);

  // Stable handler ref
  const handleTileInteractRef = useRef<(gx: number, gz: number) => void>(() => {});

  const handleTileInteract = useCallback(
    (gx: number, gz: number) => {
      const key = `${gx}_${gz}`;
      const currentTile = activeTiles.get(key) || { x: gx, z: gz, type: 'grass' };

      // 0.0 Interior Furniture Interactions (House Interior Map)
      if (isHouseInterior) {
        // Bed interaction (x: 1..3, z: 1..3)
        if (gx >= 1 && gx <= 3 && gz >= 1 && gz <= 3) {
          soundEngine.playHarvest();
          handleSleep();
          showToast('🛏️ Tidur nyenyak di tempat tidur! Energi terisi penuh & hari berganti.');
          return;
        }
        // Kitchen interaction (x: 7..9, z: 1..3)
        if (gx >= 7 && gx <= 9 && gz >= 1 && gz <= 3) {
          soundEngine.playClick();
          setShowCraftingModal(true);
          showToast('🍳 Membuka Dapur & Menu Memasak!');
          return;
        }
        // Storage Chest interaction (x: 1..3, z: 4..7)
        if (gx >= 1 && gx <= 3 && gz >= 4 && gz <= 7) {
          soundEngine.playClick();
          setShowShippingBinModal(true);
          showToast('📦 Membuka Peti Penyimpanan Rumah!');
          return;
        }
        // South Door Mat (x: 4..6, z: 9)
        if (gz >= 9 && gx >= 4 && gx <= 6) {
          handleTravelTo('farm', { x: 13, z: 6.8 });
          return;
        }

        // Fireplace interaction (x: 4..6, z: 1..2)
        if (gx >= 4 && gx <= 6 && gz >= 1 && gz <= 2) {
          soundEngine.playCoin();
          showToast('🔥 Perapian hangat menyala dengan nyaman di rumahmu.');
          return;
        }
        // Dining Table interaction (x: 6..9, z: 4..7)
        if (gx >= 6 && gx <= 9 && gz >= 4 && gz <= 7) {
          soundEngine.playClick();
          showToast('☕ Meja makan kayu dan cangkir teh hangat.');
          return;
        }
        return;
      }

      // 0. Auto-Collect if mature crop present
      if (currentTile.crop && currentTile.crop.stage === 3) {
        handleCollect(gx, gz);
        return;
      }

      // 0.1 Handle Wild Debris / Obstacles (Batang Kayu, Pohon Liar, Batu Kecil/Besar, Rumput Liar)
      if (currentTile.debris) {
        const d = currentTile.debris;

        // A. Rumput Liar (Weed)
        if (d === 'weed') {
          if (activeTool === 'sickle') {
            soundEngine.playHarvest();
            updateCurrentTiles((prev) => {
              const next = new Map(prev);
              next.set(key, { ...currentTile, debris: undefined });
              return next;
            });
            setPlayer((p) => ({ ...p, energy: Math.max(0, p.energy - 1) }));
            showToast('✂️ Membabat rumput liar & ilalang! Lahan kembali bersih.');
            return;
          } else if (activeTool === 'hoe') {
            soundEngine.playHoe();
            updateCurrentTiles((prev) => {
              const next = new Map(prev);
              next.set(key, { ...currentTile, type: 'soil', debris: undefined, isWatered: false });
              return next;
            });
            setPlayer((p) => ({ ...p, energy: Math.max(0, p.energy - 2) }));
            showToast('🌱 Membersihkan rumput liar dan mencangkul tanah!');
            return;
          } else {
            soundEngine.playHarvest();
            updateCurrentTiles((prev) => {
              const next = new Map(prev);
              next.set(key, { ...currentTile, debris: undefined });
              return next;
            });
            setPlayer((p) => ({ ...p, energy: Math.max(0, p.energy - 1) }));
            showToast('🌿 Mencabut rumput liar!');
            return;
          }
        }

        // B. Batang Kayu (Log)
        if (d === 'log') {
          if (activeTool === 'axe') {
            if (player.energy < 2) {
              showToast('⚡ Energi habis! Istirahat sejenak.');
              return;
            }
            soundEngine.playHarvest();
            updateCurrentTiles((prev) => {
              const next = new Map(prev);
              next.set(key, { ...currentTile, debris: undefined });
              return next;
            });

            setPlayer((p) => ({ ...p, energy: Math.max(0, p.energy - 2), exp: p.exp + 6 }));
            setInventory((prev) => {
              const existing = prev.find((i) => i.id === 'res_wood');
              if (existing) {
                return prev.map((i) => (i.id === 'res_wood' ? { ...i, count: i.count + 3 } : i));
              }
              return [
                ...prev,
                { id: 'res_wood', name: 'Kayu Gelondong', category: 'material', count: 3, icon: '🪵', sellPrice: 15 },
              ];
            });
            showToast('🪓 Menebang batang kayu! +3 Kayu Gelondong & +6 EXP');
            return;
          } else {
            showToast('⚠️ Gunakan Kapak untuk menebang batang kayu ini!');
            return;
          }
        }

        // C. Pohon Liar (Wild Tree)
        if (d === 'wild_tree') {
          if (activeTool === 'axe') {
            if (player.energy < 3) {
              showToast('⚡ Energi habis! Istirahat sejenak.');
              return;
            }
            soundEngine.playHarvest();
            updateCurrentTiles((prev) => {
              const next = new Map(prev);
              next.set(key, { ...currentTile, debris: undefined });
              return next;
            });

            setPlayer((p) => ({ ...p, energy: Math.max(0, p.energy - 3), exp: p.exp + 10 }));
            setInventory((prev) => {
              const withWood = prev.map((i) => (i.id === 'res_wood' ? { ...i, count: i.count + 4 } : i));
              const hasWood = prev.some((i) => i.id === 'res_wood');
              const res = hasWood
                ? withWood
                : [...prev, { id: 'res_wood', name: 'Kayu Gelondong', category: 'material' as const, count: 4, icon: '🪵', sellPrice: 15 }];

              const withSeed = res.map((i) => (i.id === 'seed_rice' ? { ...i, count: i.count + 1 } : i));
              const hasSeed = res.some((i) => i.id === 'seed_rice');
              return hasSeed ? withSeed : [...res, { id: 'seed_rice', name: 'Benih Padi', category: 'seed' as const, count: 1, icon: '🌾', sellPrice: 10, cropType: 'rice' as const }];
            });
            showToast('🪓 Menumbangkan pohon liar! +4 Kayu Gelondong & +1 Benih Padi');
            return;
          } else {
            showToast('⚠️ Gunakan Kapak untuk menebang pohon liar ini!');
            return;
          }
        }

        // D. Batu Kecil (Small Stone)
        if (d === 'small_stone') {
          if (activeTool === 'pickaxe') {
            if (player.energy < 2) {
              showToast('⚡ Energi habis! Istirahat sejenak.');
              return;
            }
            soundEngine.playHarvest();
            updateCurrentTiles((prev) => {
              const next = new Map(prev);
              next.set(key, { ...currentTile, debris: undefined });
              return next;
            });

            setPlayer((p) => ({ ...p, energy: Math.max(0, p.energy - 2), exp: p.exp + 5 }));
            setInventory((prev) => {
              const existing = prev.find((i) => i.id === 'res_stone');
              if (existing) {
                return prev.map((i) => (i.id === 'res_stone' ? { ...i, count: i.count + 2 } : i));
              }
              return [
                ...prev,
                { id: 'res_stone', name: 'Batu Kali', category: 'material', count: 2, icon: '🪨', sellPrice: 12 },
              ];
            });
            showToast('⛏️ Memecahkan batu kecil! +2 Batu Kali & +5 EXP');
            return;
          } else {
            showToast('⚠️ Gunakan Beliung untuk menambang batu ini!');
            return;
          }
        }

        // E. Batu Besar (Big Stone)
        if (d === 'big_stone') {
          if (activeTool === 'pickaxe') {
            if (player.energy < 2) {
              showToast('⚡ Energi habis! Istirahat sejenak.');
              return;
            }
            const currentHealth = currentTile.debrisHealth ?? 2;
            if (currentHealth > 1) {
              soundEngine.playHarvest();
              updateCurrentTiles((prev) => {
                const next = new Map(prev);
                next.set(key, { ...currentTile, debrisHealth: 1 });
                return next;
              });
              setPlayer((p) => ({ ...p, energy: Math.max(0, p.energy - 2) }));
              showToast('⛏️ Retakan mulai muncul di batu besar! (Pukul sekali lagi)');
              return;
            } else {
              soundEngine.playHarvest();
              confetti({ particleCount: 30, spread: 50 });
              updateCurrentTiles((prev) => {
                const next = new Map(prev);
                next.set(key, { ...currentTile, debris: undefined, debrisHealth: undefined });
                return next;
              });

              setPlayer((p) => ({ ...p, energy: Math.max(0, p.energy - 3), exp: p.exp + 12 }));
              setInventory((prev) => {
                const existing = prev.find((i) => i.id === 'res_stone');
                if (existing) {
                  return prev.map((i) => (i.id === 'res_stone' ? { ...i, count: i.count + 4 } : i));
                }
                return [
                  ...prev,
                  { id: 'res_stone', name: 'Batu Kali', category: 'material', count: 4, icon: '🪨', sellPrice: 12 },
                ];
              });
              showToast('⛏️ Berhasil menghancurkan batu besar! +4 Batu Kali & +12 EXP');
              return;
            }
          } else {
            showToast('⚠️ Gunakan Beliung untuk memecahkan batu besar ini!');
            return;
          }
        }
      }

      // 1. CANGKUL (Hoe)
      if (activeTool === 'hoe') {
        if (player.currentLocation === 'village') {
          showToast('🏘️ Wilayah Lahan Desa ini untuk calon pemukiman & fasilitas desa, bukan lahan bercocok tanam!');
          return;
        }
        if (player.energy < 2) {
          showToast('⚡ Energi habis! Tidur di rumah untuk memulihkan tenaga.');
          return;
        }
        if (currentTile.type === 'grass') {
          soundEngine.playHoe();
          updateCurrentTiles((prev) => {
            const next = new Map(prev);
            next.set(key, { ...currentTile, type: 'soil', isWatered: false });
            return next;
          });

          setPlayer((p) => ({ ...p, energy: Math.max(0, p.energy - 2) }));
          showToast('🌱 Tanah berhasil dicangkul!');
          return;
        }
      }
      // 2. SIRAM (Watering)
      else if (activeTool === 'water') {
        if (player.currentLocation === 'village') {
          showToast('💧 Wilayah Desa tidak memiliki petak tanaman yang perlu disiram.');
          return;
        }
        if (player.energy < 1) {
          showToast('⚡ Energi habis!');
          return;
        }
        if (currentTile.type === 'soil') {
          soundEngine.playWater();
          updateCurrentTiles((prev) => {
            const next = new Map(prev);
            next.set(key, { ...currentTile, isWatered: true });
            return next;
          });

          setPlayer((p) => ({ ...p, energy: Math.max(0, p.energy - 1) }));
          showToast('💧 Tanah disiram!');
          return;
        }
      }

      // 3. TANAM (Plant) - Smart 3x3 Sowing Area
      if (activeTool === 'plant' || (selectorMode === 'items' && activeItem && activeItem.category === 'seed')) {
        if (player.currentLocation === 'village') {
          showToast('🏘️ Wilayah Lahan Desa ini untuk calon pembangunan & fasilitas desa, bukan lahan bertani!');
          return;
        }
        const seedToPlant = selectorMode === 'items' && activeItem?.cropType ? activeItem.cropType : selectedSeed;
        const seedItem = inventory.find((i) => i.category === 'seed' && i.cropType === seedToPlant && i.count > 0);
        if (!seedItem) {
          showToast(`Tidak ada Benih ${seedToPlant} di tas! Buka menu Bibit / Pasar.`);
          setShowSeedSelectModal(true);
          return;
        }

        if (player.energy < 2) {
          showToast('⚡ Energi habis! Istirahat sejenak.');
          return;
        }

        // Scan 3x3 area around player target (gx, gz)
        const readyTiles: { key: string; tile: TileState }[] = [];
        const limitW = gridWidth;
        const limitH = gridHeight;

        for (let dx = -1; dx <= 1; dx++) {
          for (let dz = -1; dz <= 1; dz++) {
            const tx = gx + dx;
            const tz = gz + dz;
            if (tx >= 0 && tx < limitW && tz >= 0 && tz < limitH) {
              const k = `${tx}_${tz}`;
              const t = activeTiles.get(k);
              if (t && t.type === 'soil' && !t.crop && !t.debris) {
                readyTiles.push({ key: k, tile: t });
              }
            }
          }
        }

        if (readyTiles.length === 0) {
          showToast('⚠️ Tidak ada petak tanah siap tanam di area 3x3 ini! Cangkul tanah terlebih dahulu.');
          return;
        }

        // Consume 1 seed bag
        soundEngine.playPlant();
        confetti({ particleCount: 35, spread: 55, origin: { y: 0.7 } });

        setInventory((prev) =>
          prev.map((i) => (i.id === seedItem.id ? { ...i, count: i.count - 1 } : i)).filter((i) => i.count > 0)
        );

        updateCurrentTiles((prev) => {
          const next = new Map(prev);
          readyTiles.forEach(({ key: k, tile: t }) => {
            next.set(k, {
              ...t,
              crop: {
                type: seedToPlant,
                stage: 0,
                plantedAt: Date.now(),
                lastWateredAt: Date.now(),
              },
            });
          });
          return next;
        });

        setPlayer((p) => ({ ...p, energy: Math.max(0, p.energy - 2) }));
        showToast(`🌾 Menabur benih ${seedItem.name} di ${readyTiles.length} petak tanah siap tanam (Area 3x3)!`);
        return;
      }
      // 4. KAPAK (Axe)
      else if (activeTool === 'axe') {
        if (player.energy < 2) {
          showToast('⚡ Energi habis! Istirahat sejenak.');
          return;
        }
        soundEngine.playHarvest();
        setPlayer((p) => ({ ...p, energy: Math.max(0, p.energy - 2), exp: p.exp + 5 }));
        setInventory((prev) => {
          const existing = prev.find((i) => i.id === 'res_wood');
          if (existing) {
            return prev.map((i) => (i.id === 'res_wood' ? { ...i, count: i.count + 2 } : i));
          }
          return [
            ...prev,
            {
              id: 'res_wood',
              name: 'Kayu Gelondong',
              category: 'material',
              count: 2,
              icon: '🪵',
              sellPrice: 15,
            },
          ];
        });
        showToast('🪓 Menebang kayu! +2 Kayu Gelondong & +5 EXP');
      }
      // 5. BELIUNG (Pickaxe)
      else if (activeTool === 'pickaxe') {
        if (player.energy < 2) {
          showToast('⚡ Energi habis! Istirahat sejenak.');
          return;
        }
        soundEngine.playHarvest();
        setPlayer((p) => ({ ...p, energy: Math.max(0, p.energy - 2), exp: p.exp + 5 }));
        setInventory((prev) => {
          const existing = prev.find((i) => i.id === 'res_stone');
          if (existing) {
            return prev.map((i) => (i.id === 'res_stone' ? { ...i, count: i.count + 2 } : i));
          }
          return [
            ...prev,
            {
              id: 'res_stone',
              name: 'Batu Kali',
              category: 'material',
              count: 2,
              icon: '🪨',
              sellPrice: 12,
            },
          ];
        });
        showToast('⛏️ Menambang batu kali! +2 Batu & +5 EXP');
      }
      // 6. SABIT (Sickle)
      else if (activeTool === 'sickle') {
        if (player.energy < 1) {
          showToast('⚡ Energi habis!');
          return;
        }
        soundEngine.playHarvest();
        setPlayer((p) => ({ ...p, energy: Math.max(0, p.energy - 1) }));

        if (currentTile.crop && currentTile.crop.stage === 3) {
          handleCollect(gx, gz);
        } else {
          showToast('🌿 Membabat ilalang liar di sekitar ladang!');
        }
      }
    },
    [activeTool, activeTiles, player.energy, selectedSeed, inventory, selectorMode, activeItem, handleCollect, updateCurrentTiles, gridWidth, gridHeight]
  );

  handleTileInteractRef.current = handleTileInteract;

  // Initialize Storage Cache & Auto-load
  useEffect(() => {
    storageEngine.loadGame().then((snapshot) => {
      if (snapshot && snapshot.player) {
        setPlayer(snapshot.player);
        if (snapshot.farmTiles) setFarmTiles(new Map(snapshot.farmTiles));
        if (snapshot.villageTiles) setVillageTiles(new Map(snapshot.villageTiles));
        if (snapshot.houseInteriorTiles) setHouseInteriorTiles(new Map(snapshot.houseInteriorTiles));
        if (snapshot.inventory) setInventory(snapshot.inventory);
        if (snapshot.shippingBin) setShippingBin(snapshot.shippingBin);
        if (snapshot.animals) setAnimals(snapshot.animals);
        if (snapshot.quests) setQuests(snapshot.quests);
        if (snapshot.settings) setSettings(snapshot.settings);
      }
    });
  }, []);

  // Periodic Auto-Save to IndexedDB & LocalStorage Buffer Cache every 12 seconds
  useEffect(() => {
    const saveTimer = setInterval(() => {
      storageEngine.saveGame(
        player,
        farmTiles,
        villageTiles,
        inventory,
        shippingBin,
        animals,
        quests,
        settings,
        houseInteriorTiles
      );
    }, 12000);
    return () => clearInterval(saveTimer);
  }, [player, farmTiles, villageTiles, houseInteriorTiles, inventory, shippingBin, animals, quests, settings]);

  // Initialize GameScene ONCE on mount
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new GameScene(mountRef.current, texturePackManager.getPalette(), settings);
    sceneRef.current = scene;

    scene.updateTiles(activeTiles);
    scene.updateAnimals(animals);

    scene.setOnTileTap((gx, gz) => {
      scene.movePlayerToGrid(gx, gz);
      handleTileInteractRef.current(gx, gz);
    });

    // Handle physical gate walk-through transition using stable ref
    scene.setOnExitReached((targetLocation, spawnPos) => {
      handleTravelToRef.current(targetLocation, spawnPos);
    });

    // Monitor interval
    const monitorInterval = setInterval(() => {
      if (sceneRef.current) {
        setFps(sceneRef.current.currentFps);
        const p = sceneRef.current.getPlayerGridPos();
        setPlayerPos((prev) => (prev.x === p.x && prev.z === p.z ? prev : p));
        const near = sceneRef.current.isNearShippingBin();
        setIsNearShippingBin((prev) => (prev === near ? prev : near));
      }
    }, 150);

    return () => {
      clearInterval(monitorInterval);
      scene.destroy();
    };
  }, []); // Run ONCE on mount, NEVER recreate GameScene!

  // Sync 3D Scene Tiles & Animals
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.updateTiles(activeTiles);
      sceneRef.current.updateAnimals(animals);
    }
  }, [activeTiles, animals]);

  // Synchronize 3D Cursor (1x1 vs 3x3 with ready soil detection)
  useEffect(() => {
    if (!sceneRef.current) return;
    const isPlanting = activeTool === 'plant' || (selectorMode === 'items' && activeItem?.category === 'seed');
    if (isPlanting) {
      let readyCount = 0;
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          const tx = playerPos.x + dx;
          const tz = playerPos.z + dz;
          if (tx >= 0 && tx < gridWidth && tz >= 0 && tz < gridHeight) {
            const t = activeTiles.get(`${tx}_${tz}`);
            if (t && t.type === 'soil' && !t.crop && !t.debris) {
              readyCount++;
            }
          }
        }
      }
      sceneRef.current.setCursorMode('3x3', readyCount > 0);
    } else {
      sceneRef.current.setCursorMode('single');
    }
  }, [activeTool, selectorMode, activeItem, playerPos, activeTiles, gridWidth, gridHeight]);

  // Daily 17:30 (5:30 PM) Shipping Bin Payout Handler (+40% Premium Profit)
  const triggerShippingPayout = useCallback(() => {
    setShippingBin((currentBin) => {
      if (currentBin.length === 0) return currentBin;
      const totalRev = currentBin.reduce((acc, it) => acc + it.count * Math.round(it.sellPrice * 1.4), 0);
      if (totalRev > 0) {
        soundEngine.playCoin();
        confetti({ particleCount: 60, spread: 80, origin: { y: 0.5 } });
        setPlayer((prev) => ({ ...prev, coins: prev.coins + totalRev }));
        showToast(`💰 PUKUL 17:30 (5:30 PM)! Hasil penjualan Kotak Pengiriman (+40% Bonus) cair: +${totalRev} Koin!`);
      }
      return [];
    });
  }, []);

  // Game Time Clock Loop
  useEffect(() => {
    const timer = setInterval(() => {
      setPlayer((p) => {
        let newMin = p.timeMinute + 5;
        let newHour = p.timeHour;

        if (newMin >= 60) {
          newMin = 0;
          newHour += 1;
        }

        if (newHour >= 24) {
          newHour = 0;
        }

        if (newHour === 17 && newMin === 30) {
          triggerShippingPayout();
        }

        if (sceneRef.current) {
          sceneRef.current.setTimeAndWeather(newHour, p.weather);
        }

        return { ...p, timeHour: newHour, timeMinute: newMin };
      });
    }, 1800);

    return () => clearInterval(timer);
  }, [triggerShippingPayout]);

  // Quick Action Button
  const handleActionButton = useCallback(() => {
    if (!sceneRef.current) return;
    const pos = sceneRef.current.getPlayerGridPos();

    // 1. Collect mature crop first
    const tile = activeTiles.get(`${pos.x}_${pos.z}`);
    if (tile?.crop && tile.crop.stage === 3) {
      handleCollect(pos.x, pos.z);
      return;
    }

    // 2. Clear debris
    if (tile?.debris) {
      handleTileInteract(pos.x, pos.z);
      return;
    }

    // 3. Near Shipping Bin interaction (Farm only)
    if (sceneRef.current.isNearShippingBin()) {
      if (selectorMode === 'items' && activeItem && activeItem.count > 0) {
        handleShipItem(activeItem, 1);
        return;
      } else {
        setShowShippingBinModal(true);
        return;
      }
    }

    // 4. Regular tile interact
    handleTileInteract(pos.x, pos.z);
  }, [handleTileInteract, handleCollect, activeTiles, selectorMode, activeItem, handleShipItem]);

  // Direct joystick movement vector
  const handleMoveVector = useCallback((dx: number, dz: number) => {
    if (sceneRef.current) {
      sceneRef.current.setInputVector(dx, dz);
    }
  }, []);

  // Sleep & Daily Wild Growth for both maps
  const handleSleep = () => {
    soundEngine.playCoin();

    // Pay out any remaining items in shipping bin
    setShippingBin((currentBin) => {
      if (currentBin.length > 0) {
        const totalRev = currentBin.reduce((acc, it) => acc + it.count * Math.round(it.sellPrice * 1.4), 0);
        setPlayer((prev) => ({ ...prev, coins: prev.coins + totalRev }));
        showToast(`💰 Hasil penjualan kotak pengiriman hari kemarin (+40% Bonus) cair: +${totalRev} Koin!`);
      }
      return [];
    });

    setPlayer((p) => ({
      ...p,
      day: p.day + 1,
      timeHour: 6,
      timeMinute: 0,
      energy: p.maxEnergy,
    }));

    // Daily background simulation across world maps using WorldSimulationEngine
    setFarmTiles((prev) => WorldSimulationEngine.simulateDayForTiles(prev, player.weather === 'rainy'));
    setAnimals((prev) => WorldSimulationEngine.simulateDayForAnimals(prev));

    showToast('☀️ Selamat pagi! Hari baru dimulai. Energi terisi penuh.');
  };

  // Buy item
  const handleBuyItem = (item: { name: string; cost: number; category: 'seed' | 'building' | 'tool'; cropType?: CropType; buildingType?: BuildingType }) => {
    if (player.coins < item.cost) {
      showToast('Koin Anda tidak cukup!');
      return;
    }

    soundEngine.playCoin();
    setPlayer((p) => ({ ...p, coins: p.coins - item.cost }));

    if (item.category === 'seed' && item.cropType) {
      setInventory((prev) => {
        const existing = prev.find((i) => i.category === 'seed' && i.cropType === item.cropType);
        if (existing) {
          return prev.map((i) => (i.id === existing.id ? { ...i, count: i.count + 1 } : i));
        }
        return [
          ...prev,
          {
            id: `seed_${item.cropType}`,
            name: item.name,
            category: 'seed',
            count: 1,
            icon: '🌱',
            sellPrice: Math.floor(item.cost * 0.6),
            cropType: item.cropType,
          },
        ];
      });
      setSelectedSeed(item.cropType);
      showToast(`Membeli 1x ${item.name}!`);
    }
  };

  // Sell item directly in Market
  const handleSellItem = (itemId: string, count: number, price: number) => {
    soundEngine.playCoin();
    setInventory((prev) => prev.map((i) => (i.id === itemId ? { ...i, count: i.count - count } : i)).filter((i) => i.count > 0));
    setPlayer((p) => ({ ...p, coins: p.coins + price }));
    showToast(`Berhasil menjual item +${price} Koin!`);
  };

  // Craft item
  const handleCraftItem = (recipe: { id: string; name: string; reqId: string; reqCount: number; outputIcon: string; sellPrice: number }) => {
    soundEngine.playHarvest();
    confetti({ particleCount: 30, spread: 50 });

    setInventory((prev) =>
      prev.map((i) => (i.id === recipe.reqId ? { ...i, count: i.count - recipe.reqCount } : i)).filter((i) => i.count > 0)
    );

    setInventory((prev) => {
      const existing = prev.find((i) => i.id === recipe.id);
      if (existing) {
        return prev.map((i) => (i.id === recipe.id ? { ...i, count: i.count + 1 } : i));
      }
      return [
        ...prev,
        {
          id: recipe.id,
          name: recipe.name,
          category: 'artisan',
          count: 1,
          icon: recipe.outputIcon,
          sellPrice: recipe.sellPrice,
        },
      ];
    });

    showToast(`✨ Berhasil membuat ${recipe.name}!`);
  };

  // Claim quest
  const handleClaimQuest = (questId: string) => {
    const q = quests.find((q) => q.id === questId);
    if (!q) return;

    soundEngine.playCoin();
    confetti({ particleCount: 50, spread: 70 });

    setQuests((prev) => prev.map((item) => (item.id === questId ? { ...item, completed: true } : item)));
    setPlayer((p) => ({ ...p, coins: p.coins + q.rewardCoins, exp: p.exp + q.rewardExp }));
    showToast(`Misi Selesai! +${q.rewardCoins} Koin & +${q.rewardExp} EXP!`);
  };

  // State for camera shutter flash effect
  const [isShutterFlashing, setIsShutterFlashing] = useState(false);

  // Take Clean 3D Screenshot Handler (Tanpa UI / Tombol di Layar)
  const handleTakeCleanScreenshot = useCallback(() => {
    if (!sceneRef.current) return;

    // 1. Shutter sound
    soundEngine.playCameraShutter();

    // 2. Camera flash visual effect
    setIsShutterFlashing(true);
    setTimeout(() => setIsShutterFlashing(false), 250);

    // 3. Capture clean 3D frame
    const dataUrl = sceneRef.current.captureCleanScreenshot();

    // 4. Download file
    const locName = player.currentLocation === 'farm' ? 'kebun' : player.currentLocation === 'village' ? 'desa' : 'rumah';
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `isopolis_${locName}_hari${player.day}_${Date.now()}.png`;
    a.click();

    showToast('📸 Foto 3D bersih berhasil diambil & disimpan!');
  }, [player.currentLocation, player.day]);

  // Apply texture pack
  const handlePaletteChanged = (palette: TexturePackPalette) => {
    if (sceneRef.current) {
      sceneRef.current.applyTexturePack(palette);
    }
  };

  // Apply performance settings
  const handleUpdateSettings = (newSettings: PerformanceSettings) => {
    setSettings(newSettings);
    if (sceneRef.current) {
      sceneRef.current.applyPerformanceSettings(newSettings);
    }
  };

  // Save / Load / Reset
  const handleExportSave = () => {
    const saveData = JSON.stringify({ player, farmTiles: Array.from(farmTiles.entries()), villageTiles: Array.from(villageTiles.entries()), inventory, shippingBin, animals }, null, 2);
    const blob = new Blob([saveData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `isopolis_farm_save_day${player.day}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSave = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && parsed.player) {
        setPlayer(parsed.player);
        if (parsed.farmTiles) setFarmTiles(new Map(parsed.farmTiles));
        if (parsed.villageTiles) setVillageTiles(new Map(parsed.villageTiles));
        if (parsed.inventory) setInventory(parsed.inventory);
        if (parsed.shippingBin) setShippingBin(parsed.shippingBin);
        if (parsed.animals) setAnimals(parsed.animals);
        showToast('Save data berhasil dimuat!');
      }
    } catch (_) {
      showToast('Gagal memuat save file.');
    }
  };

  const handleResetGame = () => {
    if (window.confirm('Apakah Anda yakin ingin memulai ulang dari awal?')) {
      window.location.reload();
    }
  };

  const getActionButtonText = () => {
    if (isHouseInterior) {
      if (playerPos.z >= 6) return 'Keluar';
      if (playerPos.x <= 3 && playerPos.z <= 3) return 'Tidur';
      if (playerPos.x >= 7 && playerPos.z <= 3) return 'Dapur';
      if (playerPos.x <= 3 && playerPos.z >= 4) return 'Peti';
      return 'Keluar';
    }

    if (isCollectible) {
      return 'Ambil';
    }
    if (targetedDebris) {
      if (targetedDebris === 'weed') return 'Babat';
      if (targetedDebris === 'log' || targetedDebris === 'wild_tree') return 'Tebang';
      if (targetedDebris === 'small_stone' || targetedDebris === 'big_stone') return 'Hancur';
    }
    if (isNearShippingBin) {
      return selectorMode === 'items' && activeItem ? 'Kirim' : 'Kotak';
    }
    if (selectorMode === 'items' && activeItem) {
      return 'Gunakan';
    }
    switch (activeTool) {
      case 'hoe':
        return 'Cangkul';
      case 'water':
        return 'Siram';
      case 'plant':
        return 'Tanam';
      case 'axe':
        return 'Tebang';
      case 'sickle':
        return 'Babat';
      case 'pickaxe':
        return 'Tambang';
      default:
        return 'Aksi';
    }
  };

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-slate-950 font-['Plus_Jakarta_Sans',sans-serif] select-none touch-none">
      {/* 3D Canvas Viewport */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-pointer touch-none" />

      {/* Tilt-Shift Miniature Depth Blur Mask (Top & Bottom Atmospheric Vignette) */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between">
        <div className="h-14 bg-gradient-to-b from-black/30 via-black/10 to-transparent backdrop-blur-[1px]" />
        <div className="h-16 bg-gradient-to-t from-black/35 via-black/10 to-transparent backdrop-blur-[1px]" />
      </div>

      {/* Camera Shutter Flash Animation Effect */}
      {isShutterFlashing && (
        <div className="fixed inset-0 z-50 bg-white pointer-events-none animate-out fade-out duration-300" />
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-black/85 text-emerald-300 border border-emerald-500/40 px-3.5 py-1.5 rounded-2xl shadow-xl text-[10px] font-bold animate-in fade-in duration-150 max-w-[85vw] text-center pointer-events-none">
          {toastMsg}
        </div>
      )}

      {/* Main HUD Top Overlay with Live Graphical Mini-Map */}
      <HUD
        player={player}
        fps={fps}
        playerGridPos={playerPos}
        tiles={activeTiles}
        gridWidth={gridWidth}
        gridHeight={gridHeight}
        onOpenBigMap={() => setShowBigMapModal(true)}
        onSleep={handleSleep}
        onFastTravel={handleTravelTo}
      />

      {/* Direct House Exit Button Overlay */}
      {isHouseInterior && (
        <div className="absolute top-16 right-3 z-30 pointer-events-auto">
          <button
            onClick={() => handleTravelTo('farm', { x: 13, z: 6.8 })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-600/90 hover:bg-amber-500 text-white font-extrabold text-xs shadow-lg border border-amber-300/40 active:scale-95 transition-all"
          >
            <span>🚪 Keluar ke Kebun</span>
          </button>
        </div>
      )}

      {/* Bottom Touch Controls */}
      <TouchControls
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
        inventory={inventory}
        selectorMode={selectorMode}
        onToggleSelectorMode={() => setSelectorMode((m) => (m === 'tools' ? 'items' : 'tools'))}
        onOpenSeedSelect={() => setShowSeedSelectModal(true)}
        onMoveVector={handleMoveVector}
        onActionButton={handleActionButton}
        actionButtonText={getActionButtonText()}
        isCollectible={isCollectible}
        isNearShippingBin={isNearShippingBin}
        targetedDebris={targetedDebris}
      />

      {/* DYNAMIC SCREEN DIMMING & MAP PRE-LOADING OVERLAY ("meredup lalu tampil memuat selesai memuat menerang ke normal") */}
      {mapTransition.isTransitioning && (
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-auto bg-slate-950 transition-opacity duration-300 ${
            mapTransition.stage === 'brightening' ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-slate-900/90 border border-emerald-500/30 shadow-2xl max-w-[85vw] text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600/30 to-purple-600/30 border border-emerald-400/40 flex items-center justify-center shadow-inner animate-pulse">
              <span className="text-3xl drop-shadow">
                {mapTransition.targetLocation === 'house_interior'
                  ? '🏠'
                  : mapTransition.targetLocation === 'village'
                  ? '🏘️'
                  : '🌾'}
              </span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <span>
                  {mapTransition.targetLocation
                    ? `Menuju ${WorldRegistry.getRegion(mapTransition.targetLocation).name}`
                    : 'Memuat Wilayah...'}
                </span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              </h3>
              <p className="text-[10.5px] text-slate-400 max-w-[260px]">
                {mapTransition.targetLocation
                  ? WorldRegistry.getRegion(mapTransition.targetLocation).subtitle
                  : 'Mempersiapkan dunia 3D...'}
              </p>
            </div>

            {/* Glowing animated progress bar */}
            <div className="w-48 h-2 bg-black/60 rounded-full overflow-hidden border border-emerald-500/30 mt-1">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-purple-500 transition-all duration-300 rounded-full"
                style={{
                  width: mapTransition.stage === 'dimming' ? '30%' : mapTransition.stage === 'loading' ? '85%' : '100%',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* BIG MAP & COMMAND HUB MODAL */}
      <BigMapModal
        isOpen={showBigMapModal}
        onClose={() => setShowBigMapModal(false)}
        player={player}
        playerGridPos={playerPos}
        farmTiles={farmTiles}
        villageTiles={villageTiles}
        onTravelTo={handleTravelTo}
        onOpenTexturePack={() => setShowTexturePackModal(true)}
        onOpenMarket={() => setShowMarketModal(true)}
        onOpenCrafting={() => setShowCraftingModal(true)}
        onOpenNPC={() => setShowNPCModal(true)}
        onOpenQuests={() => setShowQuestModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        onTakeCleanScreenshot={handleTakeCleanScreenshot}
      />

      {/* KOTAK PENGIRIMAN (SHIPPING BIN) MODAL */}
      <ShippingBinModal
        isOpen={showShippingBinModal}
        onClose={() => setShowShippingBinModal(false)}
        shippingBin={shippingBin}
        inventory={inventory}
        timeHour={player.timeHour}
        timeMinute={player.timeMinute}
        onShipItem={handleShipItem}
        onRetrieveItem={handleRetrieveItem}
      />

      {/* SEED SELECTION MODAL */}
      <SeedSelectModal
        isOpen={showSeedSelectModal}
        onClose={() => setShowSeedSelectModal(false)}
        inventory={inventory}
        selectedSeed={selectedSeed}
        onSelectSeed={(crop) => {
          setSelectedSeed(crop);
          showToast(`🌱 Memilih Benih ${crop}!`);
        }}
        onOpenMarket={() => setShowMarketModal(true)}
      />

      {/* Sub-Modals */}
      <TexturePackModal
        isOpen={showTexturePackModal}
        onClose={() => setShowTexturePackModal(false)}
        onPaletteChanged={handlePaletteChanged}
      />

      <MarketModal
        isOpen={showMarketModal}
        onClose={() => setShowMarketModal(false)}
        player={player}
        inventory={inventory}
        onBuyItem={handleBuyItem}
        onSellItem={handleSellItem}
      />

      <CraftingModal
        isOpen={showCraftingModal}
        onClose={() => setShowCraftingModal(false)}
        inventory={inventory}
        onCraftItem={handleCraftItem}
      />

      <NPCDialogueModal isOpen={showNPCModal} onClose={() => setShowNPCModal(false)} />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          soundEngine.enabled = !soundEnabled;
          setSoundEnabled(!soundEnabled);
        }}
        onExportSave={handleExportSave}
        onImportSave={handleImportSave}
        onResetGame={handleResetGame}
      />

      <QuestModal
        isOpen={showQuestModal}
        onClose={() => setShowQuestModal(false)}
        quests={quests}
        onClaimQuest={handleClaimQuest}
      />

      {/* 3D ASSET & TEXTURE PRELOADER OVERLAY */}
      <AssetLoadingModal />
    </div>
  );
}

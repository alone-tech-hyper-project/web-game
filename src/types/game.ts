export type CropType = 'rice' | 'corn' | 'strawberry' | 'carrot' | 'tomato' | 'sunflower' | 'pumpkin';

export type GrowthStage = 0 | 1 | 2 | 3; // 0: Seed, 1: Sprout, 2: Growing, 3: Mature/Ready

export interface CropData {
  id: CropType;
  name: string;
  seedCost: number;
  sellPrice: number;
  growthTimeSeconds: number; // Time per stage
  color: string;
  icon: string;
  expYield: number;
}

export type AnimalType = 'chicken' | 'cow' | 'sheep' | 'bee';

export interface AnimalData {
  id: AnimalType;
  name: string;
  cost: number;
  productName: string;
  productIcon: string;
  productPrice: number;
  produceIntervalSeconds: number;
  color: string;
}

export interface PlacedAnimal {
  id: string;
  type: AnimalType;
  x: number;
  z: number;
  lastFedTimestamp: number;
  lastProduceTimestamp: number;
  affection: number;
}

export type ToolType = 'select' | 'hoe' | 'water' | 'plant' | 'harvest' | 'axe' | 'sickle' | 'pickaxe' | 'craft' | 'build';

export type BuildingType = 'fence' | 'path' | 'scarecrow' | 'sprinkler' | 'preserves_jar' | 'cheese_press' | 'windmill' | 'flower_box' | 'coop' | 'barn' | 'greenhouse';

export type DebrisType = 'log' | 'wild_tree' | 'small_stone' | 'big_stone' | 'weed';

export interface TileState {
  x: number;
  z: number;
  type: 'grass' | 'soil' | 'water' | 'path' | 'stone' | 'log' | 'building';
  debris?: DebrisType;
  debrisHealth?: number;
  isWatered?: boolean;
  crop?: {
    type: CropType;
    stage: GrowthStage;
    plantedAt: number; // timestamp
    lastWateredAt: number;
  };
  buildingType?: BuildingType;
}

export interface InventoryItem {
  id: string; // crop_rice, seed_rice, egg, etc.
  name: string;
  category: 'seed' | 'crop' | 'product' | 'artisan' | 'building' | 'tool' | 'material';
  count: number;
  icon: string;
  sellPrice: number;
  cropType?: CropType;
  buildingType?: BuildingType;
}

export interface TexturePackPalette {
  id: string;
  name: string;
  description: string;
  grassColor: string;
  soilColor: string;
  waterColor: string;
  woodColor: string;
  stoneColor: string;
  roofColor: string;
  leavesColor: string;
  skyMorning: string;
  skyNoon: string;
  skySunset: string;
  skyNight: string;
  fogColor: string;
  uiPrimary: string;
  uiBackground: string;
  accentColor: string;
  isCustom?: boolean;
}

export interface PerformanceSettings {
  renderScale: number; // 0.5 to 1.5
  shadowQuality: 'off' | 'low' | 'high';
  particleDensity: 'off' | 'low' | 'high';
  fpsLimit: 24 | 30 | 60 | 120;
  cameraZoom?: number; // 1.0 to 1.8
  autoOptimize: boolean;
  showFpsCounter: boolean;
  postProcessing: boolean;
}

export interface WeatherType {
  id: 'sunny' | 'rainy' | 'foggy' | 'golden';
  name: string;
  icon: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  rewardCoins: number;
  rewardExp: number;
  targetType: 'harvest' | 'water' | 'sell' | 'animal' | 'craft';
  targetItem?: string;
  requiredCount: number;
  currentCount: number;
  completed: boolean;
}

export interface VillagerNPC {
  id: string;
  name: string;
  role: string;
  avatar: string;
  location: string;
  dialogues: string[];
  personality: string;
}

export type MapLocation = 'farm' | 'village' | 'house_interior' | 'crossroads' | 'mountain' | 'coast';

export interface PlayerData {
  name: string;
  farmName: string;
  currentLocation: MapLocation;
  coins: number;
  level: number;
  exp: number;
  maxExp: number;
  energy: number;
  maxEnergy: number;
  day: number;
  timeHour: number; // 6 to 22 (6 AM to 10 PM)
  timeMinute: number;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  weather: 'sunny' | 'rainy' | 'foggy' | 'golden';
}

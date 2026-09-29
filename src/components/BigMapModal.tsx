import React, { useState } from 'react';
import { PlayerData, TileState, MapLocation } from '../types/game';
import {
  MapPin,
  X,
  Palette,
  ShoppingBag,
  Wrench,
  MessageSquare,
  Award,
  Settings,
  Home,
  Droplets,
  Sprout,
  Compass,
  ArrowUpRight,
  Sparkles,
  Camera,
  Download,
  Coins,
} from 'lucide-react';

interface BigMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerData;
  playerGridPos: { x: number; z: number };
  farmTiles: Map<string, TileState>;
  villageTiles: Map<string, TileState>;
  houseTiles?: Map<string, TileState>;
  onTravelTo: (target: MapLocation) => void;
  onOpenTexturePack: () => void;
  onOpenMarket: () => void;
  onOpenCrafting: () => void;
  onOpenNPC: () => void;
  onOpenQuests: () => void;
  onOpenSettings: () => void;
  onTakeCleanScreenshot: () => void;
}

export const BigMapModal: React.FC<BigMapModalProps> = ({
  isOpen,
  onClose,
  player,
  playerGridPos,
  farmTiles,
  villageTiles,
  houseTiles,
  onTravelTo,
  onOpenTexturePack,
  onOpenMarket,
  onOpenCrafting,
  onOpenNPC,
  onOpenQuests,
  onOpenSettings,
  onTakeCleanScreenshot,
}) => {
  const [activeTab, setActiveTab] = useState<MapLocation>(player.currentLocation);

  if (!isOpen) return null;

  const currentViewLocation = activeTab;
  const isViewingFarm = currentViewLocation === 'farm';
  const isViewingVillage = currentViewLocation === 'village';
  const isViewingHouse = currentViewLocation === 'house_interior';

  const gridWidth = isViewingFarm ? 28 : isViewingVillage ? 48 : 10;
  const gridHeight = isViewingFarm ? 28 : isViewingVillage ? 48 : 10;
  const currentTiles = isViewingFarm ? farmTiles : isViewingVillage ? villageTiles : houseTiles || farmTiles;
  const isPlayerOnThisMap = player.currentLocation === currentViewLocation;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-2.5 select-none animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg max-h-[94vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-slate-100 flex items-center gap-1.5">
                <span>Peta Wilayah & Pusat Kendali</span>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.2 rounded-full font-mono">
                  {gridWidth}x{gridHeight}
                </span>
              </h2>
              <p className="text-[10px] text-slate-400">
                {isPlayerOnThisMap
                  ? `Posisi Anda: Petak [${playerGridPos.x}, ${playerGridPos.z}]`
                  : `Anda sedang berada di ${
                      player.currentLocation === 'farm'
                        ? 'Kebun (28x28)'
                        : player.currentLocation === 'village'
                        ? 'Desa (48x48)'
                        : 'Rumah Petani (10x10)'
                    }`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Money Badge inside Big Map Modal */}
            <div className="bg-amber-500/15 border border-amber-400/30 rounded-xl px-2.5 py-1 flex items-center gap-1.5 text-amber-300 shadow-sm">
              <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-mono font-black text-xs text-amber-200">{player.coins} G</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 active:scale-95 transition-transform"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Map Tab Switcher */}
        <div className="flex items-center gap-1 p-1.5 bg-slate-950/40 border-b border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => setActiveTab('farm')}
            className={`flex-1 min-w-[65px] py-1.5 px-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 'farm'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40 border border-emerald-400/40'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🌾 Kebun</span>
            {player.currentLocation === 'farm' && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('crossroads')}
            className={`flex-1 min-w-[65px] py-1.5 px-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 'crossroads'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 border border-blue-400/40'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🚦 Simpang</span>
            {player.currentLocation === 'crossroads' && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('village')}
            className={`flex-1 min-w-[65px] py-1.5 px-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 'village'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40 border border-purple-400/40'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🏘️ Desa</span>
            {player.currentLocation === 'village' && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('mountain')}
            className={`flex-1 min-w-[65px] py-1.5 px-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 'mountain'
                ? 'bg-stone-600 text-white shadow-md shadow-stone-900/40 border border-stone-400/40'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🏔️ Tambang</span>
            {player.currentLocation === 'mountain' && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('coast')}
            className={`flex-1 min-w-[65px] py-1.5 px-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 'coast'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40 border border-cyan-400/40'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🌊 Pantai</span>
            {player.currentLocation === 'coast' && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('house_interior')}
            className={`flex-1 min-w-[65px] py-1.5 px-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 'house_interior'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40 border border-amber-400/40'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🏠 Rumah</span>
            {player.currentLocation === 'house_interior' && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-3 overflow-y-auto space-y-3 flex-1">
          {/* Quick Travel Prompt if viewing another map */}
          {!isPlayerOnThisMap && (
            <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-emerald-950/60 border border-purple-500/40 rounded-2xl p-2.5 flex items-center justify-between gap-2 shadow-lg">
              <div className="text-[11px] text-slate-200">
                <span className="font-bold text-amber-300">
                  {isViewingFarm ? 'Kembali ke Kebun Isopolis?' : 'Pindah ke Wilayah Lahan Desa?'}
                </span>
                <p className="text-[9px] text-slate-400">
                  {isViewingFarm
                    ? 'Kembali ke kebun 28x28 untuk merawat tanaman & hewan.'
                    : 'Menuju lahan baru 48x48 (calon desa & NPC masa depan).'}
                </p>
              </div>
              <button
                onClick={() => {
                  onTravelTo(currentViewLocation);
                  onClose();
                }}
                className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[11px] font-black shadow hover:brightness-110 active:scale-95 transition-all shrink-0 flex items-center gap-1"
              >
                <span>Pindah Ke Sini</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Interactive Visual Map Grid */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-2.5 flex flex-col items-center">
            <div
              className="relative w-full aspect-square max-w-[320px] rounded-xl overflow-hidden border border-emerald-500/30 shadow-inner grid"
              style={{
                gridTemplateColumns: `repeat(${gridWidth}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${gridHeight}, minmax(0, 1fr))`,
                backgroundColor: '#2e7d32',
              }}
            >
              {Array.from({ length: gridHeight }).map((_, z) =>
                Array.from({ length: gridWidth }).map((_, x) => {
                  const key = `${x}_${z}`;
                  const tile = currentTiles.get(key);

                  const isWater = tile?.type === 'water';
                  const isPath = tile?.type === 'path';
                  const isSoil = tile?.type === 'soil';

                  // Farm Specific Landmarks (28x28)
                  const isHouse = isViewingFarm && (x >= 12 && x <= 15) && (z >= 2 && z <= 5);
                  const isWindmill = isViewingFarm && (x >= 19 && x <= 21) && (z >= 2 && z <= 5);
                  const isShippingBin = isViewingFarm && (x === 16 || x === 17) && (z === 5 || z === 6);
                  const isBridge = isViewingFarm && x === 7 && z === 23;
                  const isNorthGate = isViewingFarm && (x >= 5 && x <= 7) && z === 0;

                  // Village Specific Landmarks (48x48)
                  const isSouthGate = !isViewingFarm && (x >= 23 && x <= 25) && z === 47;

                  const isPerimeterTree = x === 0 || x === gridWidth - 1 || z === 0 || z === gridHeight - 1;
                  const isPlayer = isPlayerOnThisMap && playerGridPos.x === x && playerGridPos.z === z;

                  let cellColor = '#2e7d32'; // grass
                  if (isWater) cellColor = '#0284c7'; // canal or lake
                  else if (isPath) cellColor = '#d97706'; // orange path
                  else if (isBridge) cellColor = '#8d5b4c'; // wooden bridge
                  else if (isNorthGate) cellColor = '#9333ea'; // purple gate to village
                  else if (isSouthGate) cellColor = '#16a34a'; // green gate to farm
                  else if (isHouse) cellColor = '#dc2626'; // farmhouse roof
                  else if (isWindmill) cellColor = '#64748b'; // windmill
                  else if (isShippingBin) cellColor = '#8B4513'; // shipping bin
                  else if (tile?.debris === 'weed') cellColor = '#84cc16'; // rumput liar
                  else if (tile?.debris === 'small_stone') cellColor = '#94a3b8'; // batu kecil
                  else if (tile?.debris === 'big_stone') cellColor = '#475569'; // batu besar
                  else if (tile?.debris === 'log') cellColor = '#78350f'; // batang kayu
                  else if (tile?.debris === 'wild_tree') cellColor = '#15803d'; // pohon liar
                  else if (isSoil) cellColor = tile?.isWatered ? '#3e2723' : '#6d4c41';
                  else if (isPerimeterTree) cellColor = '#14532d'; // perimeter forest

                  return (
                    <div
                      key={key}
                      className="relative w-full h-full"
                      style={{ backgroundColor: cellColor }}
                      title={`Petak [${x}, ${z}]`}
                    >
                      {/* Crop Indicator */}
                      {tile?.crop && (
                        <div
                          className="absolute inset-0.5 rounded-full"
                          style={{
                            backgroundColor: tile.crop.stage === 3 ? '#eab308' : '#84cc16',
                          }}
                        />
                      )}

                      {/* Blinking Player Pin */}
                      {isPlayer && (
                        <div className="absolute -inset-1 z-10 flex items-center justify-center animate-bounce">
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-white shadow-lg animate-ping" />
                          <div className="absolute w-2 h-2 rounded-full bg-amber-400 border border-white" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Map Legend */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2.5 text-[8.5px] text-slate-300 font-medium">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-amber-400 ring-1 ring-white" /> Anda
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-[#d97706]" /> Jalan Setapak
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-[#0284c7]" /> Selokan / Danau
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-[#9333ea]" /> Gerbang Desa
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-[#6d4c41]" /> Lahan Tani
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-[#84cc16]" /> Rumput Liar
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-[#475569]" /> Batu
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-[#78350f]" /> Batang Kayu
              </span>
            </div>
          </div>

          {/* Featured Clean Screenshot Button */}
          <div className="bg-gradient-to-r from-sky-950/60 via-slate-900 to-emerald-950/60 border border-sky-500/40 rounded-2xl p-2.5 flex items-center justify-between gap-2 shadow-lg">
            <div className="text-[11px] text-slate-200">
              <span className="font-bold text-sky-300 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-sky-400" />
                <span>Foto Screenshot Bersih (HD 3D)</span>
              </span>
              <p className="text-[9px] text-slate-400">
                Ambil foto panorama 3D penuh tanpa tombol HUD / joystick di layar.
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                onTakeCleanScreenshot();
              }}
              className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-[11px] font-black shadow-md border border-sky-300/40 active:scale-95 transition-all shrink-0 flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Ambil Foto</span>
            </button>
          </div>

          {/* Hub Navigation Quick Access Buttons */}
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => {
                onClose();
                onTakeCleanScreenshot();
              }}
              className="p-2.5 rounded-2xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 flex flex-col items-center gap-1 text-sky-300 active:scale-95 transition-all"
            >
              <Camera className="w-5 h-5" />
              <span className="text-[9.5px] font-bold">Foto Bersih</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenMarket();
              }}
              className="p-2.5 rounded-2xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 flex flex-col items-center gap-1 text-amber-300 active:scale-95 transition-all"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="text-[9.5px] font-bold">Pasar Desa</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenCrafting();
              }}
              className="p-2.5 rounded-2xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 flex flex-col items-center gap-1 text-cyan-300 active:scale-95 transition-all"
            >
              <Wrench className="w-5 h-5" />
              <span className="text-[9.5px] font-bold">Pengrajin</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenNPC();
              }}
              className="p-2.5 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 flex flex-col items-center gap-1 text-emerald-300 active:scale-95 transition-all"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-[9.5px] font-bold">Warga Desa</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenQuests();
              }}
              className="p-2.5 rounded-2xl bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 flex flex-col items-center gap-1 text-yellow-300 active:scale-95 transition-all"
            >
              <Award className="w-5 h-5" />
              <span className="text-[9.5px] font-bold">Misi Harian</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenTexturePack();
              }}
              className="p-2.5 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 flex flex-col items-center gap-1 text-indigo-300 active:scale-95 transition-all"
            >
              <Palette className="w-5 h-5" />
              <span className="text-[9.5px] font-bold">Tekstur</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="p-2.5 rounded-2xl bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/40 flex flex-col items-center gap-1 text-slate-300 active:scale-95 transition-all col-span-2"
            >
              <Settings className="w-5 h-5" />
              <span className="text-[9.5px] font-bold">Pengaturan Game & Grafis</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

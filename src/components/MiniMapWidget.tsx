import React, { useRef, useEffect } from 'react';
import { TileState, MapLocation } from '../types/game';
import { Compass, MapPin } from 'lucide-react';

interface MiniMapWidgetProps {
  currentLocation: MapLocation;
  playerGridPos: { x: number; z: number };
  tiles: Map<string, TileState>;
  gridWidth: number;
  gridHeight: number;
  onClick: () => void;
}

export const MiniMapWidget: React.FC<MiniMapWidgetProps> = ({
  currentLocation,
  playerGridPos,
  tiles,
  gridWidth,
  gridHeight,
  onClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw real-time miniature map
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const cellW = size / gridWidth;
    const cellH = size / gridHeight;

    // 1. Base grass
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(0, 0, size, size);

    // 2. Perimeter border trees with gate openings
    ctx.fillStyle = '#14532d';
    // North & South
    ctx.fillRect(0, 0, size, cellH * 1.5);
    ctx.fillRect(0, size - cellH * 1.5, size, cellH * 1.5);
    // West & East
    ctx.fillRect(0, 0, cellW * 1.5, size);
    ctx.fillRect(size - cellW * 1.5, 0, cellW * 1.5, size);

    if (currentLocation === 'farm') {
      // Clear opening for North Gate to Village (x=6)
      ctx.fillStyle = '#9333ea'; // Purple gate indicator
      ctx.fillRect(cellW * 5.5, 0, cellW * 2, cellH * 1.5);

      // Water Pond (South-West)
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(cellW * 1.5, cellH * 22, cellW * 4, cellH * 5);

      // Farmhouse & Windmill (North)
      ctx.fillStyle = '#dc2626'; // Farmhouse red
      ctx.fillRect(cellW * 12, cellH * 2, cellW * 3.5, cellH * 3);
      ctx.fillStyle = '#64748b'; // Windmill gray
      ctx.fillRect(cellW * 19, cellH * 2, cellW * 2.5, cellH * 3);
      // Kotak Pengiriman (Shipping Bin)
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(cellW * 16, cellH * 5.5, cellW * 1.5, cellH * 1.2);
    } else {
      // Village 48x48: South Gate opening to Farm
      ctx.fillStyle = '#16a34a'; // Green gate to farm
      ctx.fillRect(cellW * 23, size - cellH * 1.5, cellW * 3, cellH * 1.5);
    }

    // 3. Tile types (Paths, Canal Water, Tilled Soil, Debris)
    tiles.forEach((tile) => {
      // Paths (Orange path)
      if (tile.type === 'path') {
        ctx.fillStyle = '#d97706';
        ctx.fillRect(tile.x * cellW, tile.z * cellH, cellW, cellH);
      }
      // Canal / Water
      else if (tile.type === 'water') {
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(tile.x * cellW, tile.z * cellH, cellW, cellH);
      }
      // Tilled soil & crops
      else if (tile.type === 'soil') {
        ctx.fillStyle = tile.isWatered ? '#3e2723' : '#6d4c41';
        ctx.fillRect(tile.x * cellW, tile.z * cellH, cellW, cellH);

        if (tile.crop) {
          ctx.fillStyle = tile.crop.stage === 3 ? '#facc15' : '#84cc16';
          ctx.beginPath();
          ctx.arc((tile.x + 0.5) * cellW, (tile.z + 0.5) * cellH, cellW * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Wild debris
      if (tile.debris) {
        if (tile.debris === 'weed') {
          ctx.fillStyle = '#a3e635';
        } else if (tile.debris === 'small_stone' || tile.debris === 'big_stone') {
          ctx.fillStyle = '#94a3b8';
        } else {
          ctx.fillStyle = '#a16207';
        }
        const dw = tile.debris === 'big_stone' || tile.debris === 'wild_tree' ? cellW * 0.85 : cellW * 0.55;
        ctx.fillRect((tile.x + 0.2) * cellW, (tile.z + 0.2) * cellH, dw, dw);
      }
    });

    // 4. Real-time Player Pin (Glowing Amber Blip)
    const px = Math.max(0, Math.min(gridWidth - 1, playerGridPos.x));
    const pz = Math.max(0, Math.min(gridHeight - 1, playerGridPos.z));
    const playerCenterX = (px + 0.5) * cellW;
    const playerCenterZ = (pz + 0.5) * cellH;

    // Glowing halo
    ctx.fillStyle = 'rgba(250, 204, 21, 0.45)';
    ctx.beginPath();
    ctx.arc(playerCenterX, playerCenterZ, Math.max(2, cellW * 2.2), 0, Math.PI * 2);
    ctx.fill();

    // Solid core
    ctx.fillStyle = '#f59e0b';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(playerCenterX, playerCenterZ, Math.max(1.5, cellW * 1.1), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }, [playerGridPos, tiles, gridWidth, gridHeight, currentLocation]);

  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-center bg-black/60 hover:bg-black/80 active:scale-95 border border-emerald-400/50 hover:border-emerald-400 rounded-2xl p-1 shadow-lg transition-transform pointer-events-auto"
      title="Buka Peta Besar Wilayah"
    >
      {/* Visual Canvas Radar */}
      <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-emerald-500/40 shadow-inner bg-slate-950">
        <canvas ref={canvasRef} width={64} height={64} className="w-full h-full object-cover" />

        {/* Location badge on radar */}
        <div className="absolute bottom-0.5 left-0.5 text-[6.5px] font-black text-amber-200 bg-black/80 px-1 rounded-sm border border-white/20">
          {currentLocation === 'farm' ? 'KEBUN' : 'DESA'}
        </div>

        {/* Radar Crosshair & North Pin */}
        <div className="absolute top-0.5 right-0.5 text-[7px] font-black text-white/90 bg-emerald-950/80 px-1 rounded-sm border border-emerald-500/40">
          U
        </div>

        {/* Live radar scanner line effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-400/10 to-transparent pointer-events-none opacity-40 animate-pulse" />
      </div>

      {/* Mini-Map Footer Tag */}
      <div className="flex items-center gap-0.5 mt-0.5 text-[8px] font-bold text-emerald-300 font-mono">
        <Compass className="w-2.5 h-2.5 text-emerald-400" />
        <span>{gridWidth}x{gridHeight}</span>
      </div>
    </button>
  );
};

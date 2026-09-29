import React, { useState, useEffect } from 'react';
import { PlayerData, TileState, MapLocation } from '../types/game';
import { Sun, Moon, CloudRain, Clock, Zap, Activity, Maximize, Minimize } from 'lucide-react';
import { MiniMapWidget } from './MiniMapWidget';
import { WorldRegistry } from '../game/WorldRegistry';

interface HUDProps {
  player: PlayerData;
  fps: number;
  playerGridPos: { x: number; z: number };
  tiles: Map<string, TileState>;
  gridWidth: number;
  gridHeight: number;
  onOpenBigMap: () => void;
  onSleep: () => void;
  onFastTravel?: (target: MapLocation) => void;
}

export const HUD: React.FC<HUDProps> = ({
  player,
  fps,
  playerGridPos,
  tiles,
  gridWidth,
  gridHeight,
  onOpenBigMap,
  onSleep,
  onFastTravel,
}) => {
  const isNight = player.timeHour >= 19 || player.timeHour < 6;

  const format12Hour = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    const h = h12 < 10 ? `0${h12}` : `${h12}`;
    const m = minute < 10 ? `0${minute}` : `${minute}`;
    return `${h}:${m} ${period}`;
  };

  const energyPercent = Math.min(100, Math.max(0, (player.energy / player.maxEnergy) * 100));
  const activeRegion = WorldRegistry.getRegion(player.currentLocation);

  return (
    <div className="absolute top-0 left-0 right-0 p-2 pointer-events-none z-20 flex items-start justify-between gap-1.5 select-none w-full max-w-full">
      {/* 1. Main Header Status Bar (Left & Center) */}
      <div className="pointer-events-auto bg-black/60 border border-white/15 rounded-2xl p-2 shadow-lg flex items-center justify-between gap-2 text-slate-100 flex-1 min-w-0">
        {/* Farm Profile & Clock */}
        <div className="flex items-center gap-1.5 min-w-0 shrink">
          <div className="p-1 rounded-xl bg-white/10 text-amber-300 shrink-0">
            {isNight ? (
              <Moon className="w-3.5 h-3.5" />
            ) : player.weather === 'rainy' ? (
              <CloudRain className="w-3.5 h-3.5 text-cyan-300" />
            ) : (
              <Sun className="w-3.5 h-3.5" />
            )}
          </div>
          <div className="flex flex-col min-w-0 leading-tight">
            <div className="flex items-center gap-1 font-bold text-[11px] text-emerald-400 truncate">
              <span className="truncate max-w-[90px]">
                {activeRegion.name}
              </span>
              <span className="text-[8px] bg-emerald-500/30 text-emerald-300 px-1 rounded-full shrink-0">
                {activeRegion.width}x{activeRegion.height}
              </span>
            </div>
            <div className="text-[9px] text-slate-300 font-mono truncate">
              Hari ke-{player.day}
            </div>
          </div>
        </div>

        {/* Stamina Zap Bar */}
        <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-400/30 rounded-xl px-2 py-1 shrink-0">
          <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse shrink-0" />
          <div className="flex flex-col leading-none">
            <span className="text-[8px] uppercase tracking-wider font-extrabold text-amber-300">Stamina</span>
            <div className="flex items-center gap-1 mt-0.5">
              <div className="w-10 h-1.5 bg-black/40 rounded-full overflow-hidden border border-amber-400/30">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-200"
                  style={{ width: `${energyPercent}%` }}
                />
              </div>
              <span className="text-[9px] font-mono font-black text-amber-200 leading-none">{player.energy}</span>
            </div>
          </div>
        </div>

        {/* 12-Hour AM/PM Clock & FPS */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="bg-sky-500/15 border border-sky-400/30 rounded-xl px-2 py-1 flex items-center gap-1 text-sky-200 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0 animate-pulse" />
            <span className="font-mono font-black text-[11px] tracking-tight">{format12Hour(player.timeHour, player.timeMinute)}</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl px-1.5 py-1 flex items-center gap-0.5 font-mono text-[9px] font-bold text-emerald-400">
            <Activity className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
            <span>{fps}</span>
          </div>

          {/* Fullscreen Portrait Mode Toggle */}
          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
              } else {
                document.exitFullscreen().catch(() => {});
              }
            }}
            className="bg-white/10 hover:bg-white/20 active:scale-95 text-slate-200 p-1.5 rounded-xl border border-white/15 shadow shrink-0 transition-transform"
            title="Toggle Fullscreen"
          >
            <Maximize className="w-3.5 h-3.5 text-emerald-300" />
          </button>

          {/* Sleep button if Night */}
          {(isNight || player.energy < 20) && (
            <button
              onClick={onSleep}
              className="bg-indigo-600/80 active:bg-indigo-500 text-white p-1 rounded-xl shadow border border-indigo-300/40 text-[9px] font-bold shrink-0 animate-bounce"
              title="Tidur"
            >
              <Moon className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 2. REAL VISUAL MINI-MAP RADAR WIDGET (Top Right) */}
      <MiniMapWidget
        currentLocation={player.currentLocation}
        playerGridPos={playerGridPos}
        tiles={tiles}
        gridWidth={gridWidth}
        gridHeight={gridHeight}
        onClick={onOpenBigMap}
      />
    </div>
  );
};

import React, { useRef, useCallback } from 'react';
import { ToolType, InventoryItem, DebrisType } from '../types/game';
import { Droplets, Sprout, Hand, Shovel, Axe, Pickaxe, Scissors, Package, Wrench } from 'lucide-react';

interface TouchControlsProps {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  activeItem: InventoryItem | null;
  setActiveItem: (item: InventoryItem) => void;
  inventory: InventoryItem[];
  selectorMode: 'tools' | 'items';
  onToggleSelectorMode: () => void;
  onOpenSeedSelect?: () => void;
  onMoveVector: (dx: number, dz: number) => void;
  onActionButton: () => void;
  actionButtonText: string;
  isCollectible?: boolean;
  isNearShippingBin?: boolean;
  targetedDebris?: DebrisType;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  activeTool,
  setActiveTool,
  activeItem,
  setActiveItem,
  inventory,
  selectorMode,
  onToggleSelectorMode,
  onOpenSeedSelect,
  onMoveVector,
  onActionButton,
  actionButtonText,
  isCollectible = false,
  isNearShippingBin = false,
  targetedDebris,
}) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    pointerIdRef.current = e.pointerId;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    updateKnob(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || pointerIdRef.current !== e.pointerId) return;
    updateKnob(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (pointerIdRef.current === e.pointerId) {
      isDraggingRef.current = false;
      pointerIdRef.current = null;
      if (knobRef.current) {
        knobRef.current.style.transform = 'translate3d(0px, 0px, 0px)';
      }
      onMoveVector(0, 0);
    }
  };

  const updateKnob = (clientX: number, clientY: number) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const maxRadius = 38;

    let knobX = dx;
    let knobY = dy;

    if (dist > maxRadius) {
      const angle = Math.atan2(dy, dx);
      knobX = Math.cos(angle) * maxRadius;
      knobY = Math.sin(angle) * maxRadius;
    }

    if (knobRef.current) {
      knobRef.current.style.transform = `translate3d(${knobX}px, ${knobY}px, 0px)`;
    }

    onMoveVector(knobX / maxRadius, knobY / maxRadius);
  };

  const handleAction = useCallback(() => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(15);
      }
    } catch (_) {}
    onActionButton();
  }, [onActionButton]);

  // Tools without 'panen'
  const tools: { id: ToolType; label: string; icon: React.ReactNode }[] = [
    { id: 'hoe', label: 'Cangkul', icon: <Shovel className="w-4 h-4" /> },
    { id: 'water', label: 'Siram', icon: <Droplets className="w-4 h-4 text-cyan-300" /> },
    { id: 'plant', label: 'Tanam', icon: <Sprout className="w-4 h-4 text-lime-300" /> },
    { id: 'axe', label: 'Kapak', icon: <Axe className="w-4 h-4 text-orange-300" /> },
    { id: 'sickle', label: 'Sabit', icon: <Scissors className="w-4 h-4 text-yellow-300" /> },
    { id: 'pickaxe', label: 'Beliung', icon: <Pickaxe className="w-4 h-4 text-slate-300" /> },
  ];

  const getActionIcon = () => {
    // 1. If tile has mature crop/item ready to pick up
    if (isCollectible) {
      return <Hand className="w-7 h-7 drop-shadow text-amber-300 animate-bounce" />;
    }

    // 2. If tile has debris / wild obstacle (batang kayu, pohon liar, batu kecil/besar, rumput liar)
    if (targetedDebris) {
      if (targetedDebris === 'weed') {
        return <Scissors className="w-7 h-7 drop-shadow text-lime-300 animate-pulse" />;
      }
      if (targetedDebris === 'log' || targetedDebris === 'wild_tree') {
        return <Axe className="w-7 h-7 drop-shadow text-amber-300 animate-pulse" />;
      }
      if (targetedDebris === 'small_stone' || targetedDebris === 'big_stone') {
        return <Pickaxe className="w-7 h-7 drop-shadow text-cyan-200 animate-pulse" />;
      }
    }

    // 3. If near Shipping Bin (Kotak Pengiriman)
    if (isNearShippingBin) {
      return <Package className="w-7 h-7 drop-shadow text-amber-200 animate-pulse" />;
    }

    // 4. If in Item Mode and item selected
    if (selectorMode === 'items' && activeItem) {
      return <span className="text-2xl drop-shadow">{activeItem.icon}</span>;
    }

    // 5. Tool Icon
    switch (activeTool) {
      case 'water':
        return <Droplets className="w-7 h-7 drop-shadow text-cyan-200" />;
      case 'plant':
        return <Sprout className="w-7 h-7 drop-shadow text-lime-200" />;
      case 'axe':
        return <Axe className="w-7 h-7 drop-shadow text-orange-200" />;
      case 'sickle':
        return <Scissors className="w-7 h-7 drop-shadow text-yellow-200" />;
      case 'pickaxe':
        return <Pickaxe className="w-7 h-7 drop-shadow text-slate-200" />;
      default:
        return <Shovel className="w-7 h-7 drop-shadow" />;
    }
  };

  const getButtonText = () => {
    if (isCollectible) return 'AMBIL';
    if (targetedDebris) {
      if (targetedDebris === 'weed') return 'BABAT';
      if (targetedDebris === 'log' || targetedDebris === 'wild_tree') return 'TEBANG';
      if (targetedDebris === 'small_stone' || targetedDebris === 'big_stone') return 'HANCUR';
    }
    if (isNearShippingBin) {
      return selectorMode === 'items' && activeItem ? 'KIRIM' : 'KOTAK';
    }
    return actionButtonText;
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-2 select-none w-full max-w-full overflow-hidden">
      <div />

      {/* Main Touch Controls Bottom Container */}
      <div className="flex flex-col gap-2 w-full pb-1">
        {/* Joystick (Left), Mode Switcher near Analog, and Action Button (Right) */}
        <div className="flex justify-between items-end px-2">
          {/* Left Block: Analog Joystick + Mode Switcher */}
          <div className="flex flex-col items-start gap-2">
            {/* SWITCHER DEKAT ANALOG: Beralih Antara Mode Alat dan Mode Barang */}
            <button
              onClick={onToggleSelectorMode}
              className={`pointer-events-auto px-2.5 py-1 rounded-xl border flex items-center gap-1.5 shadow-lg active:scale-95 transition-all text-[10px] font-black tracking-wide ${
                selectorMode === 'items'
                  ? 'bg-amber-600/90 text-white border-amber-300/60 shadow-amber-500/20'
                  : 'bg-emerald-700/85 text-white border-emerald-300/40 shadow-emerald-500/20'
              }`}
              title="Ganti Mode Alat / Seleksi Barang"
            >
              {selectorMode === 'items' ? (
                <>
                  <Package className="w-3.5 h-3.5 text-amber-200" />
                  <span>MODE BARANG</span>
                  <span className="text-[8px] bg-black/40 px-1 py-0.2 rounded-full font-mono text-amber-200">
                    {inventory.length}
                  </span>
                </>
              ) : (
                <>
                  <Wrench className="w-3.5 h-3.5 text-emerald-200" />
                  <span>MODE ALAT</span>
                  <span className="text-[8px] bg-black/40 px-1 py-0.2 rounded-full font-mono text-emerald-200">
                    6
                  </span>
                </>
              )}
            </button>

            {/* Transparent Virtual Joystick */}
            <div
              ref={joystickRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="pointer-events-auto relative w-24 h-24 rounded-full bg-black/40 border border-white/25 flex items-center justify-center touch-none shadow-lg active:border-emerald-400/60"
            >
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <div className="w-full h-[1px] bg-white" />
                <div className="absolute h-full w-[1px] bg-white" />
              </div>

              {/* Glowing Thumb Knob */}
              <div
                ref={knobRef}
                className="w-11 h-11 rounded-full bg-emerald-500/80 shadow-md border border-white/60 will-change-transform flex items-center justify-center pointer-events-none"
              >
                <div className="w-3 h-3 rounded-full bg-white/60" />
              </div>
            </div>
          </div>

          {/* Right Block: Dynamic Action Button */}
          <div className="pointer-events-auto flex flex-col items-center">
            <button
              onClick={handleAction}
              className={`w-20 h-20 rounded-full text-white font-extrabold shadow-xl flex flex-col items-center justify-center gap-0.5 active:scale-90 transition-all duration-75 border-2 ${
                isCollectible
                  ? 'bg-gradient-to-t from-amber-600 to-yellow-500 border-amber-200 shadow-amber-500/50 ring-2 ring-yellow-400/40 animate-pulse'
                  : targetedDebris === 'weed'
                  ? 'bg-gradient-to-t from-lime-700 to-emerald-600 border-lime-300 shadow-lime-500/40 ring-2 ring-lime-400/30'
                  : targetedDebris === 'log' || targetedDebris === 'wild_tree'
                  ? 'bg-gradient-to-t from-amber-800 to-orange-600 border-orange-300 shadow-orange-500/40 ring-2 ring-orange-400/30'
                  : targetedDebris === 'small_stone' || targetedDebris === 'big_stone'
                  ? 'bg-gradient-to-t from-slate-700 to-cyan-800 border-cyan-300 shadow-cyan-500/40 ring-2 ring-cyan-400/30'
                  : isNearShippingBin
                  ? 'bg-gradient-to-t from-amber-700 to-amber-500 border-amber-300 shadow-amber-600/40 ring-2 ring-amber-400/30'
                  : 'bg-emerald-600/85 active:bg-emerald-500 border-emerald-300/40'
              }`}
            >
              {getActionIcon()}
              <span className={`text-[11px] font-black tracking-wider uppercase drop-shadow ${isCollectible || targetedDebris || isNearShippingBin ? 'text-amber-100' : ''}`}>
                {getButtonText()}
              </span>
            </button>
          </div>
        </div>

        {/* Bottom Selector Bar (Switchable between Tools & Items with smooth horizontal swipe) */}
        <div className="pointer-events-auto w-full bg-black/60 border border-white/15 rounded-2xl p-1 shadow-lg overflow-x-auto no-scrollbar scroll-smooth flex items-center gap-1.5 touch-pan-x">
          {selectorMode === 'tools' ? (
            /* Mode 1: Alat Tani */
            tools.map((t) => {
              const isActive = activeTool === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTool(t.id);
                    if (t.id === 'plant' && onOpenSeedSelect) {
                      onOpenSeedSelect();
                    }
                    try {
                      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                        navigator.vibrate(10);
                      }
                    } catch (_) {}
                  }}
                  className={`min-w-[58px] py-1.5 px-2 rounded-xl flex flex-col items-center justify-center transition-all shrink-0 active:scale-95 ${
                    isActive
                      ? 'bg-emerald-600/90 text-white font-black shadow-md border border-emerald-300/50 scale-[1.03]'
                      : 'text-slate-300 hover:text-white hover:bg-white/5 font-semibold'
                  }`}
                >
                  {t.icon}
                  <span className="text-[9px] mt-0.5 tracking-tight truncate whitespace-nowrap">
                    {t.label}
                  </span>
                </button>
              );
            })
          ) : (
            /* Mode 2: Seleksi Barang */
            inventory.length > 0 ? (
              inventory.map((item) => {
                const isActive = activeItem?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveItem(item);
                      try {
                        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                          navigator.vibrate(10);
                        }
                      } catch (_) {}
                    }}
                    className={`min-w-[64px] py-1 px-2 rounded-xl flex flex-col items-center justify-center transition-all shrink-0 active:scale-95 border ${
                      isActive
                        ? 'bg-amber-600/90 text-white font-black shadow-md border-amber-300 scale-[1.03]'
                        : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-base leading-none">{item.icon}</span>
                      <span className="text-[8px] bg-black/50 text-amber-300 px-1 rounded-full font-mono font-bold">
                        {item.count}
                      </span>
                    </div>
                    <span className="text-[8px] mt-0.5 tracking-tight truncate max-w-[58px] whitespace-nowrap">
                      {item.name}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="w-full text-center py-1 text-[10px] text-slate-400 italic">
                Tas kosong. Buka Pasar untuk membeli barang!
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

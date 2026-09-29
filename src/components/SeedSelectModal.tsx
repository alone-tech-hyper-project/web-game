import React from 'react';
import { InventoryItem, CropType } from '../types/game';
import { Sprout, X, ShoppingBag, Check } from 'lucide-react';

interface SeedSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  selectedSeed: CropType;
  onSelectSeed: (cropType: CropType) => void;
  onOpenMarket: () => void;
}

export const SeedSelectModal: React.FC<SeedSelectModalProps> = ({
  isOpen,
  onClose,
  inventory,
  selectedSeed,
  onSelectSeed,
  onOpenMarket,
}) => {
  if (!isOpen) return null;

  const availableSeeds = inventory.filter(
    (item) => item.category === 'seed' && item.cropType && item.count > 0
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-3 select-none animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-lime-500/20 text-lime-400 border border-lime-500/30">
              <Sprout className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-slate-100 flex items-center gap-1.5">
                <span>Pilih Bibit Tanaman</span>
                <span className="text-[10px] bg-lime-500/20 text-lime-300 px-1.5 py-0.2 rounded-full font-mono font-bold">
                  {availableSeeds.length} Jenis
                </span>
              </h2>
              <p className="text-[10px] text-slate-400">Pilih benih dari tas yang ingin Anda tanam ke tanah</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3.5 overflow-y-auto space-y-2.5 max-h-[60vh]">
          {availableSeeds.length > 0 ? (
            availableSeeds.map((seed) => {
              const isSelected = selectedSeed === seed.cropType;
              return (
                <button
                  key={seed.id}
                  onClick={() => {
                    if (seed.cropType) {
                      onSelectSeed(seed.cropType);
                      onClose();
                    }
                  }}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-[0.98] ${
                    isSelected
                      ? 'bg-lime-950/60 border-lime-400 shadow-md shadow-lime-500/10'
                      : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl shadow-inner shrink-0">
                      {seed.icon}
                    </div>
                    <div>
                      <div className="font-black text-xs text-slate-100 flex items-center gap-1.5">
                        <span>{seed.name}</span>
                        {isSelected && (
                          <span className="text-[9px] bg-lime-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full">
                            Aktif
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-lime-400 font-mono font-bold mt-0.5">
                        Tersedia di tas: {seed.count} kantong
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-lime-500 text-slate-950 flex items-center justify-center font-bold">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700">
                        Pilih
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="py-6 px-4 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700 flex flex-col items-center text-center gap-2">
              <span className="text-3xl">🌱</span>
              <div className="font-bold text-xs text-slate-200">Tidak Ada Bibit di Tas</div>
              <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                Hasil panen tidak dapat langsung ditanam (generator bibit kincir akan hadir nanti). Silakan beli bibit baru di Pasar Desa!
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenMarket();
                }}
                className="mt-2 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Beli Bibit di Pasar Desa</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
          <span>Ketuk bibit untuk mengaktifkannya di tombol Tanam</span>
          <button
            onClick={() => {
              onClose();
              onOpenMarket();
            }}
            className="text-emerald-400 font-bold hover:underline flex items-center gap-1"
          >
            <ShoppingBag className="w-3 h-3" /> Toko Bibit
          </button>
        </div>
      </div>
    </div>
  );
};

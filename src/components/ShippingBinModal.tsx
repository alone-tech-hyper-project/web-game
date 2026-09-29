import React from 'react';
import { InventoryItem } from '../types/game';
import { Package, X, ArrowDownRight, ArrowUpLeft, Coins, Clock, AlertCircle, Sparkles } from 'lucide-react';

interface ShippingBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  shippingBin: InventoryItem[];
  inventory: InventoryItem[];
  timeHour: number;
  timeMinute: number;
  onShipItem: (item: InventoryItem, count?: number) => void;
  onRetrieveItem: (item: InventoryItem) => void;
}

export const ShippingBinModal: React.FC<ShippingBinModalProps> = ({
  isOpen,
  onClose,
  shippingBin,
  inventory,
  timeHour,
  timeMinute,
  onShipItem,
  onRetrieveItem,
}) => {
  if (!isOpen) return null;

  // Shipping Bin gives +40% higher price compared to selling directly at store!
  const getShippingPrice = (basePrice: number) => Math.round(basePrice * 1.4);

  const totalBinRevenue = shippingBin.reduce(
    (acc, curr) => acc + curr.count * getShippingPrice(curr.sellPrice),
    0
  );

  // Time remaining until 17:30
  const nowMinutes = timeHour * 60 + timeMinute;
  const targetMinutes = 17 * 60 + 30; // 17:30 = 1050 minutes
  let minutesLeft = targetMinutes - nowMinutes;
  if (minutesLeft < 0) minutesLeft += 24 * 60; // Next day
  const hoursLeft = Math.floor(minutesLeft / 60);
  const remMinutes = minutesLeft % 60;

  const sellableInventory = inventory.filter((item) => item.count > 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 select-none animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-800 flex justify-between items-center bg-slate-950/70">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-sm text-slate-100 flex items-center gap-1.5">
                <span>Kotak Pengiriman (Shipping Bin)</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded-full font-mono font-bold">
                  {shippingBin.reduce((a, b) => a + b.count, 0)} Item
                </span>
              </h2>
              <div className="flex items-center gap-2 text-[10px] text-amber-300/90 font-mono mt-0.5">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Pencairan Koin: Setiap 17:30 (5:30 PM) • Sisa {hoursLeft}j {remMinutes}m</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3.5 overflow-y-auto space-y-4 flex-1">
          {/* Estimated Revenue Banner with +40% Bonus Badge */}
          <div className="bg-gradient-to-r from-amber-950/70 via-yellow-950/50 to-amber-900/60 border border-amber-500/50 rounded-2xl p-3 flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-xl bg-amber-500/25 text-amber-300 border border-amber-500/40 flex items-center justify-center">
                <Coins className="w-6 h-6 text-yellow-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-amber-300 font-bold block">
                    Estimasi Hasil Jam 17:30
                  </span>
                  <span className="text-[9px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" /> +40% Lebih Untung
                  </span>
                </div>
                <span className="text-lg font-black text-yellow-300 font-mono">
                  +{totalBinRevenue} Koin
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-slate-300 block">Status Pembayaran:</span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/90 px-2 py-0.5 rounded-full border border-emerald-500/40">
                Otomatis Cair di 17:30
              </span>
            </div>
          </div>

          {/* Section 1: Barang dalam Kotak Hari Ini */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-3 space-y-2">
            <div className="flex justify-between items-center px-1">
              <span className="font-extrabold text-xs text-slate-200 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-amber-400" />
                <span>Barang di dalam Kotak Siap Jual</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {shippingBin.length} varian item
              </span>
            </div>

            {shippingBin.length > 0 ? (
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                {shippingBin.map((item) => {
                  const sPrice = getShippingPrice(item.sellPrice);
                  return (
                    <div
                      key={item.id}
                      className="p-2 rounded-xl bg-slate-900/80 border border-slate-700/80 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{item.icon}</span>
                        <div>
                          <div className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                            <span>{item.name}</span>
                            <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 px-1.5 py-0.2 rounded-full border border-amber-500/30">
                              x{item.count}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Harga Pengiriman: <strong className="text-yellow-400 font-mono">{sPrice} Koin</strong>/unit (Total: {item.count * sPrice} Koin)
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onRetrieveItem(item)}
                        className="px-2 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/50 text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-all"
                        title="Ambil kembali ke tas"
                      >
                        <ArrowUpLeft className="w-3 h-3" /> Ambil Balik
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-4 text-center text-[11px] text-slate-400 italic bg-slate-900/40 rounded-xl border border-dashed border-slate-700">
                Kotak pengiriman masih kosong hari ini.
              </div>
            )}
          </div>

          {/* Section 2: Pilih Barang dari Tas untuk Dimasukkan */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-3 space-y-2">
            <div className="flex justify-between items-center px-1">
              <span className="font-extrabold text-xs text-slate-200 flex items-center gap-1.5">
                <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pilih Barang dari Tas untuk Dikirim (+40% Untung)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {sellableInventory.length} item di tas
              </span>
            </div>

            {sellableInventory.length > 0 ? (
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                {sellableInventory.map((item) => {
                  const sPrice = getShippingPrice(item.sellPrice);
                  return (
                    <div
                      key={item.id}
                      className="p-2 rounded-xl bg-slate-900/80 border border-slate-700/80 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{item.icon}</span>
                        <div>
                          <div className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                            <span>{item.name}</span>
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                              Stok: {item.count}
                            </span>
                          </div>
                          <div className="text-[10px] text-yellow-300 font-mono flex items-center gap-1">
                            <span>+{sPrice} Koin / unit</span>
                            <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1 rounded">
                              +40% Bonus
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onShipItem(item, 1)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] active:scale-95 transition-all shadow"
                        >
                          Kirim 1
                        </button>
                        {item.count > 1 && (
                          <button
                            onClick={() => onShipItem(item, item.count)}
                            className="px-2 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-[10px] active:scale-95 transition-all"
                          >
                            Semua ({item.count})
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-4 text-center text-[11px] text-slate-400 italic bg-slate-900/40 rounded-xl border border-dashed border-slate-700">
                Tidak ada barang di tas. Panen tanaman atau beli bibit untuk menghasilkan panen!
              </div>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-amber-400" />
            <span>Pegang barang di tangan dan tekan Aksi di dekat kotak untuk kirim instan!</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

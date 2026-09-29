import React, { useEffect, useState } from 'react';
import { assetLoadingState } from '../game/3d/GameScene';

export const AssetLoadingModal: React.FC = () => {
  const [progress, setProgress] = useState(assetLoadingState.progress);
  const [isLoaded, setIsLoaded] = useState(assetLoadingState.isLoaded);
  const [shouldRender, setShouldRender] = useState(!assetLoadingState.isLoaded);

  useEffect(() => {
    assetLoadingState.onUpdate((pct, loaded) => {
      setProgress(pct);
      setIsLoaded(loaded);

      if (loaded) {
        // Smooth delay before unmounting preloader overlay
        const timer = setTimeout(() => {
          setShouldRender(false);
        }, 600);
        return () => clearTimeout(timer);
      }
    });
  }, []);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white transition-opacity duration-700 ${
        isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative flex flex-col items-center p-6 max-w-sm w-full text-center">
        {/* Animated Glow Halo */}
        <div className="absolute -inset-4 bg-emerald-500/10 rounded-full blur-2xl animate-pulse pointer-events-none" />

        {/* Game Logo & Icon */}
        <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-to-tr from-emerald-600 via-green-500 to-amber-400 p-0.5 shadow-xl shadow-emerald-950/50 animate-bounce">
          <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-2xl font-black">
            🌱
          </div>
        </div>

        <h2 className="text-xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
          ISOPOLIS 3D
        </h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          Memuat Tekstur & Aset 3D Game...
        </p>

        {/* Progress Bar Container */}
        <div className="w-full mt-6 bg-slate-900/90 border border-slate-800 p-1 rounded-full shadow-inner">
          <div
            className="h-2.5 rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 transition-all duration-300 ease-out shadow-sm shadow-emerald-500/50"
            style={{ width: `${Math.max(5, progress)}%` }}
          />
        </div>

        {/* Progress Percentage Badge */}
        <div className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-300">
          <span>{progress}%</span>
          <span className="text-[10px] text-emerald-400 font-medium">
            {isLoaded ? 'Aset Siap!' : 'Mengunduh Tekstur...'}
          </span>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Award, HeartPulse, Home, Play, RotateCcw, Settings } from 'lucide-react';
import { GamePhase, LanguageCode } from '../game/types';
import { getTranslator } from '../i18n/translations';

interface PauseVictoryModalProps {
  language: LanguageCode;
  phase: Extract<GamePhase, 'paused' | 'completed' | 'fallen'>;
  relicsCollected: number;
  relicsTotal: number;
  landmarksDiscovered: number;
  landmarksTotal: number;
  elapsedSeconds: number;
  onResume: () => void;
  onRespawn: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onBackToTitle: () => void;
}

function formatDuration(totalSec: number): string {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const PauseVictoryModal: React.FC<PauseVictoryModalProps> = ({
  language,
  phase,
  relicsCollected,
  relicsTotal,
  landmarksDiscovered,
  landmarksTotal,
  elapsedSeconds,
  onResume,
  onRespawn,
  onRestart,
  onOpenSettings,
  onBackToTitle,
}) => {
  const isVictory = phase === 'completed';
  const isFallen = phase === 'fallen';
  const t = getTranslator(language);
  const isRtl = language === 'ar';

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-4 bg-[#07110c]/75 pointer-events-auto">
      <div
        role="dialog"
        aria-modal="true"
        dir={isRtl ? 'rtl' : 'ltr'}
        className="w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-xl bg-[#0e1f16] border border-[#cde3d1]/15 shadow-2xl p-4 sm:p-6 text-[#f2f7f2]"
      >
        <div className="flex items-start gap-3">
          {isVictory && (
            <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-[#eab308]/15 text-[#eab308] shrink-0">
              <Award className="w-6 h-6" />
            </div>
          )}
          {isFallen && (
            <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-[#ef4444]/15 text-[#f87171] shrink-0">
              <HeartPulse className="w-6 h-6" />
            </div>
          )}
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">
              {isVictory
                ? t.pauseVictory.victoryTitle
                : isFallen
                  ? t.pauseVictory.fallenTitle
                  : t.pauseVictory.pauseTitle}
            </h2>
            <p className="mt-1 text-sm text-[#b7d0be]">
              {isVictory
                ? t.pauseVictory.victoryDesc
                : isFallen
                  ? t.pauseVictory.fallenDesc
                  : t.pauseVictory.pauseDesc}
            </p>
          </div>
        </div>

        {/* Unboxed tabular progress summary */}
        <div className="mt-5 py-3 px-4 rounded-lg bg-[#08130d] flex items-center justify-between text-xs sm:text-sm text-[#d6e9da]">
          <div>
            <span className="text-[#93b39b]">{t.pauseVictory.relics} </span>
            <span className="font-mono-tabular font-semibold text-[#facc15]">
              {relicsCollected}/{relicsTotal}
            </span>
          </div>
          <span aria-hidden="true" className="text-white/20">
            ·
          </span>
          <div>
            <span className="text-[#93b39b]">{t.pauseVictory.landmarks} </span>
            <span className="font-mono-tabular font-semibold text-[#7dd3fc]">
              {landmarksDiscovered}/{landmarksTotal}
            </span>
          </div>
          <span aria-hidden="true" className="text-white/20">
            ·
          </span>
          <div>
            <span className="text-[#93b39b]">{t.pauseVictory.time} </span>
            <span className="font-mono-tabular font-semibold">
              {formatDuration(elapsedSeconds)}
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          {isFallen ? (
            <button
              type="button"
              onClick={onRespawn}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg bg-[#22c55e] hover:bg-[#4ade80] text-[#07180d] font-display font-bold text-sm transition-colors cursor-pointer"
            >
              <HeartPulse className="w-4 h-4" />
              <span>{t.pauseVictory.respawnBtn}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onResume}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg bg-[#eab308] hover:bg-[#facc15] text-[#0c1a12] font-display font-bold text-sm transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isVictory ? t.pauseVictory.resumeVictoryBtn : t.pauseVictory.resumeBtn}</span>
            </button>
          )}

          {!isFallen && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg bg-white/8 hover:bg-white/14 text-[#edf5ee] font-medium text-sm transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4 text-[#a7f3d0]" />
              <span>{t.pauseVictory.settingsBtn}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onRestart}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg bg-white/8 hover:bg-white/14 text-[#edf5ee] font-medium text-sm transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[#b7d0be]" />
            <span>{t.pauseVictory.restartBtn}</span>
          </button>

          <button
            type="button"
            onClick={onBackToTitle}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg text-[#a4bfa9] hover:text-white hover:bg-white/6 font-medium text-sm transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>{t.pauseVictory.backToTitleBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

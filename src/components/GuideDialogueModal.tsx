import React, { useEffect, useState } from 'react';
import { ChevronRight, Compass, UserCheck } from 'lucide-react';
import { TranslationDict } from '../i18n/translations';

interface GuideDialogueModalProps {
  open: boolean;
  t: TranslationDict;
  isRtl: boolean;
  onFinish: () => void;
}

export const GuideDialogueModal: React.FC<GuideDialogueModalProps> = ({
  open,
  t,
  isRtl,
  onFinish,
}) => {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (open) {
      setStepIndex(0);
    }
  }, [open]);

  const pages = t.guide.pages;
  const totalSteps = pages.length;
  const clampedStep = Math.min(Math.max(0, stepIndex), Math.max(0, totalSteps - 1));
  const currentPage = pages[clampedStep];
  const isLast = clampedStep >= totalSteps - 1;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyE') {
        e.preventDefault();
        e.stopPropagation();
        if (isLast) {
          onFinish();
        } else {
          setStepIndex((prev) => Math.min(totalSteps - 1, prev + 1));
        }
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [open, isLast, totalSteps, onFinish]);

  if (!open || !currentPage) return null;

  const handleAdvance = () => {
    if (isLast) {
      onFinish();
    } else {
      setStepIndex((prev) => Math.min(totalSteps - 1, prev + 1));
    }
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-3 sm:p-6 bg-black/55 pointer-events-auto"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-dialogue-title"
        className="w-full max-w-xl rounded-2xl bg-[#0d1f16]/96 border border-[#eab308]/45 shadow-[0_24px_60px_rgba(0,0,0,0.72)] p-4 sm:p-6 text-[#f2f7f2]"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#eab308]/16 border border-[#eab308]/45 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5 text-[#facc15]" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#eab308]">
                {t.guide.badge}
              </p>
              <h2 className="font-display text-base sm:text-lg font-bold text-white truncate">
                {t.guide.speaker}
              </h2>
            </div>
          </div>

          <span className="font-mono-tabular text-xs font-semibold text-[#cde3d1] bg-white/8 border border-white/10 rounded-md px-2.5 py-1">
            {t.guide.stepOf} {clampedStep + 1} / {totalSteps}
          </span>
        </div>

        <div className="mt-4">
          <h3
            id="guide-dialogue-title"
            className="font-display text-base sm:text-lg font-bold text-[#fef08a]"
          >
            {currentPage.title}
          </h3>
          <p className="mt-2 text-sm sm:text-[15px] leading-relaxed text-[#e1efe4]">
            {currentPage.body}
          </p>
        </div>

        <div className="mt-5 pt-3.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {pages.map((_, idx) => (
              <span
                key={idx}
                className={`h-2 rounded-full transition-all duration-200 ${
                  idx === clampedStep
                    ? 'w-6 bg-[#eab308]'
                    : idx < clampedStep
                      ? 'w-2 bg-[#4ade80]'
                      : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleAdvance}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2 rounded-xl bg-[#eab308] hover:bg-[#facc15] active:scale-[0.98] text-[#0b1912] font-display font-bold text-sm shadow-lg transition-all cursor-pointer ms-auto"
          >
            {isLast ? <Compass className="w-4 h-4" /> : null}
            <span>{isLast ? t.guide.startExplore : t.guide.next}</span>
            {!isLast ? (
              <ChevronRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
            ) : null}
          </button>
        </div>
      </section>
    </div>
  );
};

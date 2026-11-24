import React, { useEffect } from 'react';
import { LanguageCode } from '../game/types';
import { getTranslator } from '../i18n/translations';

interface TitleScreenProps {
  language: LanguageCode;
  isFullscreen: boolean;
  onPlay: () => void;
  onOpenSettings: () => void;
  onToggleFullscreen: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  language,
  isFullscreen,
  onPlay,
  onOpenSettings,
  onToggleFullscreen,
}) => {
  const t = getTranslator(language);
  const isRtl = language === 'ar';

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onPlay();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onPlay]);

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="absolute inset-0 z-20 flex flex-col justify-between overflow-y-auto px-5 py-5 sm:px-12 sm:py-10 bg-transparent pointer-events-auto"
      style={{
        paddingTop: 'max(1.25rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1.25rem, env(safe-area-inset-left))',
        paddingRight: 'max(1.25rem, env(safe-area-inset-right))',
      }}
    >
      {/* Hidden SVG filters for rustic weathered paint & stencil erosion */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="title-stencil-wear" x="-4%" y="-4%" width="108%" height="108%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.12"
              numOctaves="3"
              seed="17"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="1.6"
              xChannelSelector="R"
              yChannelSelector="G"
              result="roughEdges"
            />
            <feColorMatrix
              in="noise"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  5.2 0 0 0 -3.35"
              result="grungeMask"
            />
            <feComposite in="roughEdges" in2="grungeMask" operator="out" />
          </filter>

          <filter id="brush-rough-edge" x="-4%" y="-12%" width="108%" height="124%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.065"
              numOctaves="2"
              seed="9"
              result="brushNoise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="brushNoise"
              scale="2.4"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          <filter id="text-rustic-edge" x="-3%" y="-6%" width="106%" height="112%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.14"
              numOctaves="2"
              seed="5"
              result="textNoise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="textNoise"
              scale="0.95"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Directional dark scrims & subtle analog grain so typography reads sharply over the live 3D jungle */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: isRtl
              ? 'linear-gradient(270deg, rgba(7, 10, 7, 0.78) 0%, rgba(8, 11, 8, 0.44) 38%, rgba(8, 10, 7, 0.08) 68%, rgba(6, 8, 6, 0.28) 100%), linear-gradient(180deg, rgba(6, 9, 6, 0.56) 0%, rgba(6, 9, 6, 0.04) 36%, rgba(6, 9, 6, 0.14) 68%, rgba(6, 8, 5, 0.78) 100%)'
              : 'linear-gradient(90deg, rgba(7, 10, 7, 0.78) 0%, rgba(8, 11, 8, 0.44) 38%, rgba(8, 10, 7, 0.08) 68%, rgba(6, 8, 6, 0.28) 100%), linear-gradient(180deg, rgba(6, 9, 6, 0.56) 0%, rgba(6, 9, 6, 0.04) 36%, rgba(6, 9, 6, 0.14) 68%, rgba(6, 8, 5, 0.78) 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: isRtl
              ? 'radial-gradient(ellipse at 36% 50%, rgba(0,0,0,0) 36%, rgba(5, 7, 5, 0.54) 100%)'
              : 'radial-gradient(ellipse at 64% 50%, rgba(0,0,0,0) 36%, rgba(5, 7, 5, 0.54) 100%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.09] mix-blend-overlay"
          style={{
            backgroundImage:
              'repeating-radial-gradient(circle at 18% 32%, rgba(255,235,190,0.35) 0, rgba(0,0,0,0.35) 1px, transparent 2px)',
            backgroundSize: '4px 4px',
          }}
        />
      </div>

      {/* Top Weathered Identity & Distressed Stencil Title */}
      <div className="relative z-10 max-w-2xl">
        {/* Eyebrow: Rustic Circular Leaf Emblem + Darkened Yellow Label */}
        <div className="flex items-center gap-2.5 sm:gap-3 mb-2.5 sm:mb-4">
          <svg
            width="30"
            height="30"
            viewBox="0 0 40 40"
            fill="none"
            aria-hidden="true"
            className="shrink-0 sm:w-[34px] sm:h-[34px]"
            style={{ filter: 'url(#brush-rough-edge)' }}
          >
            <circle
              cx="20"
              cy="20"
              r="17.5"
              stroke="#c7952a"
              strokeWidth="2.1"
              strokeDasharray="24 3 18 2 34 3"
              strokeOpacity="0.9"
            />
            <path
              d="M20 8.5C15 12.6 12.6 17.5 12.6 22.4C12.6 26.8 15.9 30.2 20 30.2C24.1 30.2 27.4 26.8 27.4 22.4C27.4 17.5 25 12.6 20 8.5Z"
              fill="#634c18"
              fillOpacity="0.45"
              stroke="#c7952a"
              strokeWidth="1.75"
            />
            <path d="M20 11.5V29.5" stroke="#d4a336" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M20 18L24.2 15.2" stroke="#c7952a" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M20 22.4L15.8 19.6" stroke="#c7952a" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <span
            className="font-display text-xs sm:text-sm font-bold tracking-[0.14em] uppercase text-[#c8982d]"
            style={{
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.85)',
              filter: 'url(#text-rustic-edge)',
            }}
          >
            {t.titleEyebrow}
          </span>
        </div>

        {/* Main Stencil-Worn White Title */}
        <h1
          className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold uppercase tracking-[0.04em] text-[#f2ece0] leading-[0.98]"
          style={{
            textWrap: 'balance',
            textShadow: '0 4px 18px rgba(0, 0, 0, 0.85), 0 1px 0 rgba(35, 25, 14, 0.9)',
            filter: 'url(#title-stencil-wear)',
          }}
        >
          {t.gameTitle}
        </h1>

        {/* Thin, Worn, Slightly Yellowed Subtitle */}
        <p
          className="mt-3 sm:mt-4 text-xs sm:text-base font-light text-[#d8c98e]/90 max-w-lg leading-relaxed tracking-[0.015em]"
          style={{
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.92)',
          }}
        >
          {t.titleSubtitle}
        </p>
      </div>

      {/* Bottom Survival Actions (No Modern Boxes) & Discreet Footer */}
      <div className="relative z-10 mt-6 flex flex-col items-start gap-4 sm:gap-5">
        {/* Primary CTA: Dark Bold Letters on Irregular Brushed Yellow Paint Streak */}
        <button
          type="button"
          onClick={onPlay}
          className="group relative inline-flex items-center justify-center min-h-[48px] sm:min-h-[54px] px-8 sm:px-11 py-2.5 cursor-pointer transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#eab308]"
        >
          {/* Hand-painted irregular yellow brush stroke SVG behind label */}
          <svg
            viewBox="0 0 280 68"
            preserveAspectRatio="none"
            aria-hidden="true"
            className={`absolute inset-0 w-full h-full pointer-events-none drop-shadow-[0_6px_14px_rgba(0,0,0,0.7)] ${
              isRtl ? '-scale-x-100' : ''
            }`}
            style={{ filter: 'url(#brush-rough-edge)' }}
          >
            <path
              d="M12 15 C55 9, 130 12, 265 11 L274 22 L262 28 L272 44 C215 52, 110 49, 14 55 L4 41 L16 32 L5 21 Z"
              fill="#d49f24"
              className="transition-colors duration-150 group-hover:fill-[#e6b332]"
            />
            <path
              d="M22 19 C92 15, 195 17, 257 18 L263 42 C180 46, 86 45, 19 48 Z"
              fill="#e3b134"
              fillOpacity="0.65"
              className="transition-colors duration-150 group-hover:fill-[#f0c248]"
            />
            <circle cx="274" cy="14" r="2.1" fill="#d49f24" />
            <circle cx="6" cy="52" r="1.8" fill="#c9931f" />
            <path d="M242 54 L268 51 L260 56 Z" fill="#b8841a" fillOpacity="0.7" />
          </svg>

          <span
            className="relative z-10 inline-flex items-center gap-2.5 font-display font-extrabold text-lg sm:text-2xl tracking-[0.08em] uppercase text-[#141009] whitespace-nowrap shrink-0"
            style={{ filter: 'url(#text-rustic-edge)' }}
          >
            <span aria-hidden="true" className={`text-sm sm:text-lg leading-none ${isRtl ? 'rotate-180' : ''}`}>
              ▶
            </span>
            <span>{t.playBtn}</span>
          </span>
        </button>

        {/* Secondary Borderless Boxless Links Side-by-Side */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 sm:gap-x-9">
          <button
            type="button"
            onClick={onOpenSettings}
            className="group inline-flex items-center gap-2.5 min-h-[44px] py-1 bg-transparent border-0 text-[#cfa035] hover:text-[#f2ca5c] active:scale-[0.98] font-display font-bold text-sm sm:text-lg tracking-[0.08em] uppercase transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#eab308] whitespace-nowrap shrink-0"
            style={{
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.92)',
              filter: 'url(#text-rustic-edge)',
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-transform duration-200 group-hover:rotate-45"
            >
              <path
                d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z"
                stroke="currentColor"
                strokeWidth="2.1"
              />
              <path
                d="M19.4 13.5v-3l-2.1-.6a6 6 0 0 0-.6-1.4l1.1-1.9-2.1-2.1-1.9 1.1a6 6 0 0 0-1.4-.6L11.8 2.9h-3l-.6 2.1a6 6 0 0 0-1.4.6L4.9 4.5 2.8 6.6l1.1 1.9a6 6 0 0 0-.6 1.4l-2.1.6v3l2.1.6c.15.5.35.97.6 1.4l-1.1 1.9 2.1 2.1 1.9-1.1c.43.25.9.45 1.4.6l.6 2.1h3l.6-2.1c.5-.15.97-.35 1.4-.6l1.9 1.1 2.1-2.1-1.1-1.9c.25-.43.45-.9.6-1.4l2.1-.6Z"
                transform="translate(1.5, 0) scale(0.92)"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinejoin="round"
              />
            </svg>
            <span>{t.settingsBtn}</span>
          </button>

          <button
            type="button"
            onClick={onToggleFullscreen}
            className="group inline-flex items-center gap-2.5 min-h-[44px] py-1 bg-transparent border-0 text-[#cfa035] hover:text-[#f2ca5c] active:scale-[0.98] font-display font-bold text-sm sm:text-lg tracking-[0.08em] uppercase transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#eab308] whitespace-nowrap shrink-0"
            style={{
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.92)',
              filter: 'url(#text-rustic-edge)',
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-transform duration-150 group-hover:scale-110"
            >
              {isFullscreen ? (
                <>
                  <path d="M4 10h6V4M9.5 9.5L3.5 3.5" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M20 14h-6v6M14.5 14.5l6 6" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M14 4v6h6M14.5 9.5l6-6" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10 20v-6H4M9.5 14.5l-6 6" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
                </>
              ) : (
                <>
                  <path d="M15 3h6v6M20.5 3.5L14 10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 21H3v-6M3.5 20.5L10 14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 15v6h-6M20.5 20.5L14 14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 9V3h6M3.5 3.5L10 10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </>
              )}
            </svg>
            <span>{isFullscreen ? t.fullscreenExit : t.fullscreenEnter}</span>
          </button>
        </div>

        {/* Discreet Muted Yellow Footer: Controls + Welcome Line */}
        <div
          className="pt-1 sm:pt-2 space-y-1 text-[11px] sm:text-xs text-[#bfab6b]/85 tracking-wide"
          style={{ textShadow: '0 1px 6px rgba(0, 0, 0, 0.95)' }}
        >
          <p className="font-semibold text-[#ccb671]/90">{t.welcomeLine}</p>
          <p className="leading-relaxed">{t.controlsFooter}</p>
        </div>
      </div>
    </div>
  );
};

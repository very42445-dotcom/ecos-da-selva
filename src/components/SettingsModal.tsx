import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Globe,
  Maximize2,
  Minimize2,
  Move,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  FpsLimit,
  GameSettings,
  HudPanelPosition,
  LanguageCode,
  TouchControlMode,
  VisualQuality,
} from '../game/types';
import { getTranslator, LANGUAGE_CODES } from '../i18n/translations';

interface SettingsModalProps {
  settings: GameSettings;
  isFullscreen: boolean;
  fromTitle?: boolean;
  onToggleFullscreen: () => void;
  onOpenHudEditor: () => void;
  onChange: (next: GameSettings) => void;
  onClose: () => void;
}

interface LeafSpec {
  leftPct: number;
  sizePx: number;
  durationSec: number;
  delaySec: number;
  driftPx: number;
  rotMidDeg: number;
  rotEndDeg: number;
  opacity: number;
  color: string;
}

const FALLING_LEAVES: LeafSpec[] = [
  { leftPct: 5, sizePx: 18, durationSec: 13.5, delaySec: -2.4, driftPx: 32, rotMidDeg: 130, rotEndDeg: 290, opacity: 0.34, color: '#6b7d3c' },
  { leftPct: 12, sizePx: 14, durationSec: 16.0, delaySec: -9.1, driftPx: -26, rotMidDeg: -140, rotEndDeg: -320, opacity: 0.28, color: '#9a7b2c' },
  { leftPct: 19, sizePx: 21, durationSec: 14.2, delaySec: -5.3, driftPx: 40, rotMidDeg: 165, rotEndDeg: 340, opacity: 0.24, color: '#4d6b38' },
  { leftPct: 26, sizePx: 13, durationSec: 11.8, delaySec: -7.8, driftPx: -22, rotMidDeg: 110, rotEndDeg: 260, opacity: 0.32, color: '#866e2c' },
  { leftPct: 33, sizePx: 17, durationSec: 15.4, delaySec: -1.6, driftPx: 28, rotMidDeg: -150, rotEndDeg: -305, opacity: 0.26, color: '#58743c' },
  { leftPct: 41, sizePx: 15, durationSec: 12.6, delaySec: -10.5, driftPx: -34, rotMidDeg: 145, rotEndDeg: 315, opacity: 0.22, color: '#a17c32' },
  { leftPct: 48, sizePx: 20, durationSec: 17.2, delaySec: -4.2, driftPx: 24, rotMidDeg: -120, rotEndDeg: -280, opacity: 0.2, color: '#4b6635' },
  { leftPct: 56, sizePx: 14, durationSec: 13.1, delaySec: -11.4, driftPx: -28, rotMidDeg: 155, rotEndDeg: 330, opacity: 0.25, color: '#7d8a3f' },
  { leftPct: 64, sizePx: 19, durationSec: 15.8, delaySec: -6.7, driftPx: 36, rotMidDeg: -135, rotEndDeg: -295, opacity: 0.28, color: '#8f6c28' },
  { leftPct: 72, sizePx: 15, durationSec: 12.2, delaySec: -3.0, driftPx: -30, rotMidDeg: 125, rotEndDeg: 285, opacity: 0.31, color: '#56753b' },
  { leftPct: 79, sizePx: 22, durationSec: 16.6, delaySec: -8.9, driftPx: 22, rotMidDeg: -160, rotEndDeg: -345, opacity: 0.24, color: '#697c3b' },
  { leftPct: 86, sizePx: 13, durationSec: 11.4, delaySec: -1.1, driftPx: -24, rotMidDeg: 140, rotEndDeg: 300, opacity: 0.33, color: '#a58034' },
  { leftPct: 92, sizePx: 17, durationSec: 14.8, delaySec: -7.2, driftPx: 30, rotMidDeg: -125, rotEndDeg: -275, opacity: 0.29, color: '#516c38' },
  { leftPct: 96, sizePx: 14, durationSec: 13.9, delaySec: -12.0, driftPx: -20, rotMidDeg: 150, rotEndDeg: 325, opacity: 0.26, color: '#7e692c' },
  { leftPct: 15, sizePx: 16, durationSec: 18.0, delaySec: -14.2, driftPx: 35, rotMidDeg: 170, rotEndDeg: 350, opacity: 0.2, color: '#5b763f' },
  { leftPct: 83, sizePx: 16, durationSec: 17.5, delaySec: -15.6, driftPx: -36, rotMidDeg: -145, rotEndDeg: -310, opacity: 0.22, color: '#7f8c41' },
];

const NATIVE_NAMES: Record<LanguageCode, string> = {
  'pt-BR': 'Português (Brasil)',
  en: 'English',
  es: 'Español',
  zh: '中文',
  ja: '日本語',
  ar: 'العربية',
};

const QUALITY_ORDER: VisualQuality[] = [
  'potato',
  'ultra-low',
  'low',
  'medium',
  'high',
  'ultra-high',
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  isFullscreen,
  fromTitle = false,
  onToggleFullscreen,
  onOpenHudEditor,
  onChange,
  onClose,
}) => {
  const [showLanguages, setShowLanguages] = useState(false);

  const t = getTranslator(settings.language);
  const isRtl = settings.language === 'ar';

  const update = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div
      className={`fixed inset-0 z-40 flex items-center justify-center p-2.5 sm:p-6 pointer-events-auto overflow-hidden ${
        fromTitle ? 'bg-[#040504]' : 'bg-[#060907]/85'
      }`}
    >
      {/* Subtle deep black ambient vignette + softly falling jungle leaves */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
        {fromTitle && (
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 50% 25%, rgba(28, 36, 20, 0.24) 0%, rgba(4, 5, 4, 0.92) 68%, #020302 100%)',
            }}
          />
        )}
        {FALLING_LEAVES.map((leaf, idx) => (
          <svg
            key={idx}
            viewBox="0 0 24 24"
            width={leaf.sizePx}
            height={leaf.sizePx}
            fill="none"
            className="absolute -top-8 jungle-leaf-particle"
            style={
              {
                left: `${leaf.leftPct}%`,
                animationDuration: `${leaf.durationSec}s`,
                animationDelay: `${leaf.delaySec}s`,
                '--leaf-drift': `${leaf.driftPx}px`,
                '--leaf-rot-mid': `${leaf.rotMidDeg}deg`,
                '--leaf-rot-end': `${leaf.rotEndDeg}deg`,
                '--leaf-opacity': String(leaf.opacity),
              } as React.CSSProperties
            }
          >
            <path
              d="M12 2.5C7.2 6.4 5.2 11 5.6 15.5C5.9 19.1 8.6 21.4 12 21.5C15.4 21.4 18.1 19.1 18.4 15.5C18.8 11 16.8 6.4 12 2.5Z"
              fill={leaf.color}
            />
            <path
              d="M12 4.5V20.5M12 10.5L15.4 8.2M12 14.5L8.6 12.1"
              stroke="#12160c"
              strokeOpacity="0.45"
              strokeWidth="1.15"
              strokeLinecap="round"
            />
          </svg>
        ))}
      </div>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        dir={isRtl ? 'rtl' : 'ltr'}
        className={`relative z-10 w-full max-h-[92dvh] overflow-y-auto rounded-xl shadow-2xl p-4 sm:p-6 text-[#f2f7f2] ${
          fromTitle
            ? 'max-w-xl bg-[#0b0e0b]/95 border border-[#c8982d]/25'
            : 'max-w-md bg-[#0e1f16] border border-[#cde3d1]/15'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {showLanguages ? (
              <button
                type="button"
                onClick={() => setShowLanguages(false)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 text-xs font-semibold text-[#e5c15c] transition-colors cursor-pointer"
              >
                <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                <span>{t.settings.title}</span>
              </button>
            ) : (
              fromTitle && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t.settings.backToMenuBtn}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 text-xs font-semibold text-[#e5c15c] transition-colors cursor-pointer"
                >
                  <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                  <span>{t.settings.menuBack}</span>
                </button>
              )
            )}
            <h2
              id="settings-title"
              className={`font-display text-xl font-bold tracking-tight ${
                fromTitle ? 'text-[#f2ece0] uppercase tracking-[0.04em]' : ''
              }`}
            >
              {showLanguages ? t.settings.languagesTitle : t.settings.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.settings.closeAria}
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-[#b7d0be] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {showLanguages ? (
          <div className="mt-5 space-y-4">
            <p className="text-xs text-[#9ebaa5] leading-relaxed">
              {t.settings.languagesDesc}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {LANGUAGE_CODES.map((code) => {
                const selected = settings.language === code;
                const translatedLabel = t.settings.languageOptions[code];
                const nativeLabel = NATIVE_NAMES[code];
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => update('language', code)}
                    className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-start transition-colors cursor-pointer ${
                      selected
                        ? 'bg-[#1e3d2b] border-[#eab308] text-[#fef9c3]'
                        : 'bg-[#08120c] border-white/10 text-[#dceadf] hover:bg-[#102218] hover:border-white/25'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-display text-sm font-bold truncate">
                        {translatedLabel}
                      </p>
                      <p className="text-[11px] text-[#9bb8a3] truncate">{nativeLabel}</p>
                    </div>
                    {selected && <Check className="w-4 h-4 text-[#eab308] shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setShowLanguages(false)}
                className="min-h-[42px] px-5 py-2 rounded-lg bg-[#d49f24] hover:bg-[#eab308] text-[#0c1a12] font-display font-bold text-sm tracking-wide uppercase transition-colors cursor-pointer"
              >
                {t.settings.backToSettings}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-5 space-y-5">
              {/* Top Prominent Languages Selector Button */}
              <button
                type="button"
                onClick={() => setShowLanguages(true)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#08130d] hover:bg-[#102419] border border-[#c8982d]/35 transition-colors cursor-pointer text-start"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#1c3323] border border-[#eab308]/35 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4 text-[#eab308]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-sm font-bold text-[#f3f7f2]">
                      {t.settings.languagesBtn}
                    </p>
                    <p className="text-xs text-[#95b39d] truncate">
                      {t.settings.languagesHint}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 rounded-md bg-[#1f422f] text-[#fef08a] text-xs font-semibold">
                    {t.settings.languageOptions[settings.language]}
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 text-[#9cb8a3] ${isRtl ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

              {/* Camera Sensitivity */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <label htmlFor="sens-range" className="font-medium text-[#dceadf]">
                    {t.settings.cameraSensitivity}
                  </label>
                  <span className="font-mono-tabular text-xs text-[#eab308]">
                    {settings.cameraSensitivity.toFixed(1)}x
                  </span>
                </div>
                <input
                  id="sens-range"
                  type="range"
                  min={0.3}
                  max={2.5}
                  step={0.1}
                  value={settings.cameraSensitivity}
                  onChange={(e) => update('cameraSensitivity', parseFloat(e.target.value))}
                  className="w-full jungle-slider"
                />
              </div>

              {/* Audio Controls */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold tracking-wide text-[#9fd4b1]">
                    {t.settings.jungleAudio}
                  </h3>
                  <button
                    type="button"
                    onClick={() => update('muted', !settings.muted)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/8 hover:bg-white/15 text-xs font-medium transition-colors cursor-pointer"
                  >
                    {settings.muted ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-[#f87171]" />
                        <span>{t.settings.mutedAll}</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-[#a7f3d0]" />
                        <span>{t.settings.muteAll}</span>
                      </>
                    )}
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <label htmlFor="ambient-vol-range" className="font-medium text-[#dceadf]">
                      {t.settings.ambientSound}
                    </label>
                    <span className="font-mono-tabular text-xs text-[#a7f3d0]">
                      {settings.muted
                        ? t.settings.mutedShort
                        : `${Math.round(settings.ambientVolume * 100)}%`}
                    </span>
                  </div>
                  <input
                    id="ambient-vol-range"
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={settings.ambientVolume}
                    onChange={(e) => {
                      const vol = parseFloat(e.target.value);
                      onChange({
                        ...settings,
                        ambientVolume: vol,
                        muted: vol === 0 && settings.sfxVolume === 0,
                      });
                    }}
                    className="w-full jungle-slider"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <label htmlFor="sfx-vol-range" className="font-medium text-[#dceadf]">
                      {t.settings.sfxSound}
                    </label>
                    <span className="font-mono-tabular text-xs text-[#eab308]">
                      {settings.muted
                        ? t.settings.mutedShort
                        : `${Math.round(settings.sfxVolume * 100)}%`}
                    </span>
                  </div>
                  <input
                    id="sfx-vol-range"
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={settings.sfxVolume}
                    onChange={(e) => {
                      const vol = parseFloat(e.target.value);
                      onChange({
                        ...settings,
                        sfxVolume: vol,
                        muted: vol === 0 && settings.ambientVolume === 0,
                      });
                    }}
                    className="w-full jungle-slider"
                  />
                </div>
              </div>

              {/* Invert Y Axis */}
              <div className="flex items-center justify-between gap-4 pt-1">
                <div>
                  <p className="text-sm font-medium text-[#dceadf]">{t.settings.invertY}</p>
                  <p className="text-xs text-[#95b39d]">{t.settings.invertYDesc}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.invertY}
                  onClick={() => update('invertY', !settings.invertY)}
                  className={`min-h-[38px] px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    settings.invertY
                      ? 'bg-[#eab308] text-[#0c1a12]'
                      : 'bg-white/10 text-[#d3e5d7] hover:bg-white/15'
                  }`}
                >
                  {settings.invertY ? t.settings.enabled : t.settings.disabled}
                </button>
              </div>

              {/* Graphics Performance & Atmosphere Section */}
              <div className="pt-3 border-t border-white/10 space-y-4">
                <h3 className="text-xs font-semibold tracking-wide text-[#9fd4b1]">
                  {t.settings.graphicsSection}
                </h3>

                <div>
                  <p className="text-sm font-medium text-[#dceadf]">{t.settings.graphicsQuality}</p>
                  <p className="text-xs text-[#95b39d] mb-2">{t.settings.graphicsQualityDesc}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-1 rounded-lg bg-[#08130d]">
                    {QUALITY_ORDER.map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => update('visualQuality', id)}
                        className={`min-h-[38px] py-2 px-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                          settings.visualQuality === id
                            ? id === 'potato'
                              ? 'bg-[#b45309] text-[#fef3c7]'
                              : 'bg-[#1f422f] text-[#f2f7f2]'
                            : 'text-[#9ab6a2] hover:text-white'
                        }`}
                      >
                        {t.settings.qualities[id]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Atmosphere & Light Shafts Intensity */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <label htmlFor="atmo-range" className="font-medium text-[#dceadf]">
                      {t.settings.atmosphereLabel}
                    </label>
                    <span className="font-mono-tabular text-xs text-[#a7f3d0]">
                      {Math.round(settings.atmosphereIntensity * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-[#95b39d] mb-2">{t.settings.atmosphereDesc}</p>
                  <input
                    id="atmo-range"
                    type="range"
                    min={0.4}
                    max={1.4}
                    step={0.05}
                    value={settings.atmosphereIntensity}
                    onChange={(e) => update('atmosphereIntensity', parseFloat(e.target.value))}
                    className="w-full jungle-slider"
                  />
                </div>

                {/* FPS Limit */}
                <div>
                  <p className="text-sm font-medium text-[#dceadf] mb-2">{t.settings.fpsLimit}</p>
                  <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-[#08130d]">
                    {(
                      [
                        { id: 30, label: '30 FPS' },
                        { id: 60, label: '60 FPS' },
                        { id: 0, label: t.settings.fpsUnlimited },
                      ] as Array<{ id: FpsLimit; label: string }>
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => update('fpsLimit', opt.id)}
                        className={`min-h-[38px] py-2 px-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                          settings.fpsLimit === opt.id
                            ? 'bg-[#1f422f] text-[#f2f7f2]'
                            : 'text-[#9ab6a2] hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* FPS Counter Toggle */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[#dceadf]">{t.settings.fpsCounter}</p>
                    <p className="text-xs text-[#95b39d]">{t.settings.fpsCounterDesc}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.showFps}
                    onClick={() => update('showFps', !settings.showFps)}
                    className={`min-h-[38px] px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      settings.showFps
                        ? 'bg-[#eab308] text-[#0c1a12]'
                        : 'bg-white/10 text-[#d3e5d7] hover:bg-white/15'
                    }`}
                  >
                    {settings.showFps ? t.settings.enabled : t.settings.disabled}
                  </button>
                </div>

                {/* Fullscreen Mode Toggle */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[#dceadf]">
                      {t.settings.fullscreenLabel}
                    </p>
                    <p className="text-xs text-[#95b39d]">{t.settings.fullscreenDesc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleFullscreen}
                    className={`inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      isFullscreen
                        ? 'bg-[#eab308] text-[#0c1a12]'
                        : 'bg-white/10 text-[#d3e5d7] hover:bg-white/15'
                    }`}
                  >
                    {isFullscreen ? (
                      <>
                        <Minimize2 className="w-3.5 h-3.5" />
                        <span>{t.settings.fullscreenExitShort}</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>{t.settings.fullscreenActivate}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* HUD Customization Section */}
              <div className="pt-3 border-t border-white/10 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-semibold tracking-wide text-[#9fd4b1]">
                      {t.settings.hudSection}
                    </h3>
                    <p className="text-xs text-[#95b39d] mt-0.5">{t.settings.hudDragDesc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenHudEditor}
                    className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-2 rounded-lg bg-[#eab308] hover:bg-[#facc15] text-[#0c1a12] font-display font-bold text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Move className="w-3.5 h-3.5" />
                    <span>{t.settings.editHudBtn}</span>
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <label htmlFor="hud-scale-range" className="font-medium text-[#dceadf]">
                      {t.settings.hudScale}
                    </label>
                    <span className="font-mono-tabular text-xs text-[#eab308]">
                      {Math.round(settings.hudScale * 100)}%
                    </span>
                  </div>
                  <input
                    id="hud-scale-range"
                    type="range"
                    min={0.8}
                    max={1.25}
                    step={0.05}
                    value={settings.hudScale}
                    onChange={(e) => update('hudScale', parseFloat(e.target.value))}
                    className="w-full jungle-slider"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <label htmlFor="hud-opacity-range" className="font-medium text-[#dceadf]">
                      {t.settings.hudOpacity}
                    </label>
                    <span className="font-mono-tabular text-xs text-[#a7f3d0]">
                      {Math.round(settings.hudOpacity * 100)}%
                    </span>
                  </div>
                  <input
                    id="hud-opacity-range"
                    type="range"
                    min={0.45}
                    max={1.0}
                    step={0.05}
                    value={settings.hudOpacity}
                    onChange={(e) => update('hudOpacity', parseFloat(e.target.value))}
                    className="w-full jungle-slider"
                  />
                </div>

                <div>
                  <p className="text-sm font-medium text-[#dceadf] mb-2">
                    {t.settings.hudQuickPos}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-[#08130d]">
                    {(
                      [
                        { id: 'top-left', label: t.settings.hudTopLeft },
                        { id: 'bottom-left', label: t.settings.hudBottomLeft },
                      ] as Array<{ id: HudPanelPosition; label: string }>
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          const nextY = opt.id === 'top-left' ? 3 : 78;
                          onChange({
                            ...settings,
                            hudPosition: opt.id,
                            hudLayout: {
                              ...settings.hudLayout,
                              status: {
                                ...settings.hudLayout.status,
                                xPct: 3,
                                yPct: nextY,
                              },
                            },
                          });
                        }}
                        className={`min-h-[38px] py-2 px-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                          settings.hudPosition === opt.id
                            ? 'bg-[#1f422f] text-[#f2f7f2]'
                            : 'text-[#9ab6a2] hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[#dceadf]">{t.settings.showCompass}</p>
                    <p className="text-xs text-[#95b39d]">{t.settings.showCompassDesc}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.showCompass}
                    onClick={() => update('showCompass', !settings.showCompass)}
                    className={`min-h-[38px] px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      settings.showCompass
                        ? 'bg-[#eab308] text-[#0c1a12]'
                        : 'bg-white/10 text-[#d3e5d7] hover:bg-white/15'
                    }`}
                  >
                    {settings.showCompass ? t.settings.enabled : t.settings.disabled}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[#dceadf]">{t.settings.showTips}</p>
                    <p className="text-xs text-[#95b39d]">{t.settings.showTipsDesc}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.showTips}
                    onClick={() => update('showTips', !settings.showTips)}
                    className={`min-h-[38px] px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      settings.showTips
                        ? 'bg-[#eab308] text-[#0c1a12]'
                        : 'bg-white/10 text-[#d3e5d7] hover:bg-white/15'
                    }`}
                  >
                    {settings.showTips ? t.settings.enabled : t.settings.disabled}
                  </button>
                </div>
              </div>

              {/* On-Screen Touch Controls */}
              <div className="pt-3 border-t border-white/10">
                <p className="text-sm font-medium text-[#dceadf] mb-2">
                  {t.settings.touchControls}
                </p>
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-[#08130d]">
                  {(
                    [
                      { id: 'auto', label: t.settings.touchAuto },
                      { id: 'always', label: t.settings.touchAlways },
                      { id: 'hidden', label: t.settings.touchHidden },
                    ] as Array<{ id: TouchControlMode; label: string }>
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => update('touchControls', opt.id)}
                      className={`min-h-[38px] py-2 px-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        settings.touchControls === opt.id
                          ? 'bg-[#1f422f] text-[#f2f7f2]'
                          : 'text-[#9ab6a2] hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[42px] px-5 py-2 rounded-lg bg-[#d49f24] hover:bg-[#eab308] text-[#0c1a12] font-display font-bold text-sm tracking-wide uppercase transition-colors cursor-pointer"
              >
                {fromTitle ? t.settings.backToMenuBtn : t.settings.closeBtn}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

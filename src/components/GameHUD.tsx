import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Backpack,
  BedDouble,
  Compass,
  Eye,
  Flame,
  Flashlight,
  Hand,
  Heart,
  Maximize2,
  Minimize2,
  Moon,
  Pause,
  Sun,
  Sunrise,
  Sunset,
  Sword,
  User,
  Utensils,
  Volume2,
  VolumeX,
  Waves,
  Zap,
} from 'lucide-react';
import {
  DEFAULT_HUD_LAYOUT,
  HudElementId,
  HudLayout,
  HudState,
  LanguageCode,
  TouchControlMode,
} from '../game/types';
import {
  formatObjectiveText,
  formatPromptLabel,
  formatTipText,
  formatToastContent,
  getTranslator,
} from '../i18n/translations';

interface GameHUDProps {
  hud: HudState;
  language: LanguageCode;
  muted: boolean;
  showFps: boolean;
  isFullscreen: boolean;
  touchControlMode: TouchControlMode;
  hudScale: number;
  hudOpacity: number;
  hudLayout: HudLayout;
  showCompass: boolean;
  showTips: boolean;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onToggleLight: () => void;
  onToggleCameraMode: () => void;
  onOpenInventory: () => void;
  onPause: () => void;
  onInteract: () => void;
  onAttack: () => void;
  onJump: () => void;
  onEatBerry: () => void;
  onTouchMove: (x: number, y: number, sprinting: boolean) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  hud,
  language,
  muted,
  showFps,
  isFullscreen,
  touchControlMode,
  hudScale,
  hudOpacity,
  hudLayout,
  showCompass,
  showTips,
  onToggleMute,
  onToggleFullscreen,
  onToggleLight,
  onToggleCameraMode,
  onOpenInventory,
  onPause,
  onInteract,
  onAttack,
  onJump,
  onEatBerry,
  onTouchMove,
}) => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [stickOffset, setStickOffset] = useState({ x: 0, y: 0 });
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  }));

  const stickRef = useRef<HTMLDivElement | null>(null);
  const stickTouchId = useRef<number | null>(null);

  const t = getTranslator(language);
  const isRtl = language === 'ar';

  useEffect(() => {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(hasTouch);

    const onFirstTouch = () => setIsTouchDevice(true);
    window.addEventListener('touchstart', onFirstTouch, { once: true, passive: true });
    return () => window.removeEventListener('touchstart', onFirstTouch);
  }, []);

  useEffect(() => {
    let orientTimer: number | null = null;
    const syncViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    const onOrientation = () => {
      syncViewport();
      if (orientTimer !== null) window.clearTimeout(orientTimer);
      orientTimer = window.setTimeout(syncViewport, 150);
    };

    window.addEventListener('resize', syncViewport);
    window.addEventListener('orientationchange', onOrientation);
    window.visualViewport?.addEventListener('resize', syncViewport);
    return () => {
      if (orientTimer !== null) window.clearTimeout(orientTimer);
      window.removeEventListener('resize', syncViewport);
      window.removeEventListener('orientationchange', onOrientation);
      window.visualViewport?.removeEventListener('resize', syncViewport);
    };
  }, []);

  const isPortrait = viewport.width < viewport.height;
  const isCompactLandscape = !isPortrait && viewport.height <= 520;
  const isNarrowPortrait = isPortrait && viewport.width <= 520;
  const isCompactScreen = isCompactLandscape || isNarrowPortrait;

  const showTouchControls =
    !hud.guideDialogueOpen &&
    (touchControlMode === 'always' || (touchControlMode === 'auto' && isTouchDevice));

  const panelBgStyle: React.CSSProperties = {
    backgroundColor: `rgba(11, 25, 18, ${hudOpacity.toFixed(2)})`,
  };

  const getElementStyle = (id: HudElementId): React.CSSProperties => {
    const cfg = hudLayout[id] ?? DEFAULT_HUD_LAYOUT[id];
    const finalScale = cfg.scale * hudScale;
    return {
      position: 'absolute',
      left: `${cfg.xPct}%`,
      top: `${cfg.yPct}%`,
      transform: `translate(${-cfg.xPct}%, ${-cfg.yPct}%) scale(${finalScale.toFixed(3)})`,
      transformOrigin: `${cfg.xPct}% ${cfg.yPct}%`,
      opacity: cfg.opacity,
    };
  };

  // Safe vertical offset for top-right stacked toast notifications below toolbar + optional FPS counter
  const toolbarCfg = hudLayout.toolbar ?? DEFAULT_HUD_LAYOUT.toolbar;
  const fpsCfg = hudLayout.fps ?? DEFAULT_HUD_LAYOUT.fps;
  const toolbarBottomPx =
    toolbarCfg.xPct > 55 && toolbarCfg.yPct < 40
      ? (toolbarCfg.yPct / 100) * viewport.height +
        (1 - toolbarCfg.yPct / 100) * (isCompactScreen ? 76 : 88) * toolbarCfg.scale * hudScale
      : 12;
  const fpsBottomPx =
    showFps && fpsCfg.xPct > 55 && fpsCfg.yPct < 40
      ? (fpsCfg.yPct / 100) * viewport.height +
        (1 - fpsCfg.yPct / 100) * 30 * fpsCfg.scale * hudScale
      : 12;
  const toastTopPx = Math.max(18, Math.round(Math.max(toolbarBottomPx, fpsBottomPx) + 10));

  // Virtual thumbstick touch handlers
  const updateStickFromPoint = (clientX: number, clientY: number) => {
    const el = stickRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.4;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    setStickOffset({ x: dx, y: dy });
    const normX = dx / maxR;
    const normY = dy / maxR;
    const sprinting = dist > maxR * 0.84;
    onTouchMove(normX, normY, sprinting);
  };

  const handleStickStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (stickTouchId.current === null && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      stickTouchId.current = touch.identifier;
      updateStickFromPoint(touch.clientX, touch.clientY);
    }
  };

  const handleStickMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (stickTouchId.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === stickTouchId.current) {
        updateStickFromPoint(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleStickEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === stickTouchId.current) {
        stickTouchId.current = null;
        setStickOffset({ x: 0, y: 0 });
        onTouchMove(0, 0, false);
        break;
      }
    }
  };

  const compassPercent = hud.compassTarget
    ? Math.max(
        6,
        Math.min(
          94,
          50 + (hud.compassTarget.angleDiffRad / (Math.PI * 0.75)) * 44,
        ),
      )
    : 50;

  const totalItemsCount = hud.inventory.reduce((sum, s) => sum + s.quantity, 0);
  const berryCount = hud.inventory.find((s) => s.id === 'sweet_berry')?.quantity ?? 0;

  const zoneLabel = t.zones[hud.zoneId] ?? hud.zoneName;
  const dayPhaseText = t.dayPhases[hud.dayPhaseKey] ?? hud.dayPhaseLabel;
  const weatherText = t.weather[hud.weatherKey] ?? hud.weatherLabel;
  const objectiveText = formatObjectiveText(language, hud.activeObjective);
  const tipText = formatTipText(language, hud.activeTip);
  const cameraBadge =
    language === 'pt-BR' || language === 'es'
      ? hud.cameraMode === 'first-person'
        ? '1ª'
        : '3ª'
      : hud.cameraMode === 'first-person'
        ? '1P'
        : '3P';

  const compassTitle = hud.compassTarget
    ? t.relics[hud.compassTarget.id]?.title ??
      t.landmarks[hud.compassTarget.id]?.title ??
      hud.compassTarget.title
    : '';

  const renderPhaseIcon = () => {
    if (hud.dayPhaseKey === 'dawn') {
      return <Sunrise className="w-3.5 h-3.5 text-[#fdba74] shrink-0" />;
    }
    if (hud.dayPhaseKey === 'day') {
      return <Sun className="w-3.5 h-3.5 text-[#facc15] shrink-0" />;
    }
    if (hud.dayPhaseKey === 'dusk') {
      return <Sunset className="w-3.5 h-3.5 text-[#fb923c] shrink-0" />;
    }
    return <Moon className="w-3.5 h-3.5 text-[#93c5fd] shrink-0" />;
  };

  return (
    <div dir="ltr" className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
      {/* Subtle 1st-person aiming dot */}
      {hud.cameraMode === 'first-person' && (
        <div
          aria-hidden="true"
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/75 shadow-[0_0_6px_rgba(0,0,0,0.85)] pointer-events-none"
        />
      )}

      {/* 1. Status, Player HP & Compact Active Objective Card */}
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        style={{ ...getElementStyle('status'), ...panelBgStyle }}
        className={`border border-white/12 rounded-xl ${
          isCompactScreen
            ? 'px-2.5 py-2 max-w-[46vw] sm:max-w-xs'
            : 'px-4 py-3 max-w-xs sm:max-w-sm'
        }`}
      >
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] sm:text-xs font-medium text-[#9fd4b1]">
          <span className="truncate max-w-[130px] sm:max-w-none">{zoneLabel}</span>
          <span aria-hidden="true" className="text-white/30">
            ·
          </span>
          <span className="inline-flex items-center gap-1 text-[#f3f7f2]">
            {renderPhaseIcon()}
            <span>{dayPhaseText}</span>
          </span>
          {!isNarrowPortrait && (
            <>
              <span aria-hidden="true" className="text-white/30">
                ·
              </span>
              <span className="text-[#cde6d4]">{weatherText}</span>
            </>
          )}
        </div>

        <div
          className={`mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 font-semibold text-[#f3f7f2] ${
            isCompactScreen ? 'text-xs' : 'text-sm'
          }`}
        >
          <span>
            {t.hud.relics}{' '}
            <span className="font-mono-tabular text-[#facc15]">
              {hud.relicsCollected}/{hud.relicsTotal}
            </span>
          </span>
          <span aria-hidden="true" className="text-white/25">
            ·
          </span>
          <span>
            {t.hud.landmarks}{' '}
            <span className="font-mono-tabular text-[#7dd3fc]">
              {hud.landmarksDiscovered}/{hud.landmarksTotal}
            </span>
          </span>
          {hud.sprintBoostSeconds > 0 && (
            <>
              <span aria-hidden="true" className="text-white/25">
                ·
              </span>
              <span className="font-mono-tabular text-[11px] text-[#4ade80]">
                {t.hud.agility} {hud.sprintBoostSeconds}s
              </span>
            </>
          )}
          {hud.isSwimming && (
            <>
              <span aria-hidden="true" className="text-white/25">
                ·
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#38bdf8]">
                <Waves className="w-3 h-3 shrink-0" />
                <span>{t.hud.swimming}</span>
              </span>
            </>
          )}
        </div>

        {/* HP Bar & Equipped Weapon Status */}
        <div className="mt-2 flex items-center gap-2">
          <Heart
            className={`w-3.5 h-3.5 shrink-0 ${
              hud.hp <= 25 ? 'text-[#f87171]' : hud.hp <= 55 ? 'text-[#fbbf24]' : 'text-[#4ade80]'
            }`}
          />
          <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden min-w-[72px]">
            <div
              className={`h-full transition-all duration-200 ${
                hud.hp <= 25 ? 'bg-[#ef4444]' : hud.hp <= 55 ? 'bg-[#f59e0b]' : 'bg-[#22c55e]'
              }`}
              style={{ width: `${Math.max(0, Math.min(100, (hud.hp / hud.maxHp) * 100))}%` }}
            />
          </div>
          <span className="font-mono-tabular text-[11px] font-semibold text-[#e2efe4]">
            {hud.hp}/{hud.maxHp}
          </span>
          {hud.equippedWeapon !== 'none' && (
            <span className="text-[11px] font-medium text-[#fde047] hidden sm:inline">
              · {hud.equippedWeapon === 'sword' ? t.hud.sword : t.hud.axe}
            </span>
          )}
        </div>

        {/* Stamina Bar (0..100, recovers in 20-point steps) */}
        <div className="mt-1.5 flex items-center gap-2" title={t.hud.stamina}>
          <Zap
            className={`w-3.5 h-3.5 shrink-0 ${
              hud.staminaExhausted
                ? 'text-[#f87171]'
                : hud.stamina <= 25
                  ? 'text-[#fbbf24]'
                  : 'text-[#38bdf8]'
            }`}
          />
          <div className="relative flex-1 h-2 rounded-full bg-white/10 overflow-hidden min-w-[72px]">
            <div
              className={`h-full transition-all duration-150 ${
                hud.staminaExhausted
                  ? 'bg-[#ef4444]'
                  : hud.stamina <= 25
                    ? 'bg-[#f59e0b]'
                    : 'bg-[#38bdf8]'
              }`}
              style={{
                width: `${Math.max(0, Math.min(100, (hud.stamina / Math.max(1, hud.maxStamina)) * 100))}%`,
              }}
            />
            {[20, 40, 60, 80].map((mark) => (
              <span
                key={mark}
                aria-hidden="true"
                className="absolute top-0 bottom-0 w-px bg-[#0b1912]/65 pointer-events-none"
                style={{ left: `${mark}%` }}
              />
            ))}
          </div>
          <span
            className={`font-mono-tabular text-[11px] font-semibold ${
              hud.staminaExhausted ? 'text-[#fca5a5]' : 'text-[#cfe9f7]'
            }`}
          >
            {hud.stamina}/{hud.maxStamina}
          </span>
          {hud.staminaExhausted && (
            <span className="text-[10px] font-semibold text-[#fca5a5] hidden sm:inline">
              · {t.hud.staminaExhausted}
            </span>
          )}
        </div>

        {/* Food / Hunger Bar (0..100, drops 20 every 2 minutes) */}
        <div className="mt-1.5 flex items-center gap-2" title={t.hud.food}>
          <Utensils
            className={`w-3.5 h-3.5 shrink-0 ${
              hud.food <= 0
                ? 'text-[#f87171]'
                : hud.food <= 20
                  ? 'text-[#fb923c]'
                  : 'text-[#fbbf24]'
            }`}
          />
          <div className="relative flex-1 h-2 rounded-full bg-white/10 overflow-hidden min-w-[72px]">
            <div
              className={`h-full transition-all duration-200 ${
                hud.food <= 0
                  ? 'bg-[#ef4444]'
                  : hud.food <= 20
                    ? 'bg-[#f97316]'
                    : 'bg-[#f59e0b]'
              }`}
              style={{
                width: `${Math.max(0, Math.min(100, (hud.food / Math.max(1, hud.maxFood)) * 100))}%`,
              }}
            />
            {[20, 40, 60, 80].map((mark) => (
              <span
                key={mark}
                aria-hidden="true"
                className="absolute top-0 bottom-0 w-px bg-[#0b1912]/65 pointer-events-none"
                style={{ left: `${mark}%` }}
              />
            ))}
          </div>
          <span
            className={`font-mono-tabular text-[11px] font-semibold ${
              hud.food <= 20 ? 'text-[#fdba74]' : 'text-[#fde68a]'
            }`}
          >
            {hud.food}/{hud.maxFood}
          </span>
          {hud.food <= 20 && (
            <span className="text-[10px] font-semibold text-[#fdba74] hidden sm:inline">
              · {t.hud.foodLow}
            </span>
          )}
        </div>

        {/* Compact Progressive Objective inside Status Card */}
        <p className="mt-1.5 pt-1.5 border-t border-white/10 text-[11px] leading-snug text-[#e5f1e7]">
          <span className="font-semibold text-[#facc15]">{t.hud.objectivePrefix}: </span>
          <span>{objectiveText}</span>
        </p>

        {showTips && !isCompactScreen && (
          <p className="mt-1 text-[11px] text-[#cde0d1]/85 leading-snug">{tipText}</p>
        )}
      </div>

      {/* 2. Minimal Compass Strip */}
      {showCompass && hud.compassTarget && viewport.width >= 560 && (
        <div
          style={getElementStyle('compass')}
          className="flex flex-col items-center gap-1 min-w-[150px] md:min-w-[205px]"
        >
          <div
            className={`relative rounded-lg border border-white/12 overflow-hidden flex items-center justify-center ${
              isCompactLandscape ? 'w-40 h-6' : 'w-48 md:w-56 h-7'
            }`}
            style={panelBgStyle}
          >
            <div className="absolute inset-x-4 h-px bg-white/15" />
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center gap-1 transition-transform duration-75"
              style={{ left: `${compassPercent}%` }}
            >
              <Compass
                className={`w-3.5 h-3.5 ${
                  hud.compassTarget.kind === 'relic' ? 'text-[#facc15]' : 'text-[#38bdf8]'
                }`}
              />
              <span className="font-mono-tabular text-[11px] font-semibold text-white">
                {hud.compassTarget.distance}m
              </span>
            </div>
          </div>
          <span
            dir={isRtl ? 'rtl' : 'ltr'}
            className="text-[11px] font-medium text-[#e4f0e6] drop-shadow truncate max-w-[195px]"
          >
            {compassTitle}
          </span>
        </div>
      )}

      {/* 3. Top-Right Organized Action Toolbar */}
      <div
        style={getElementStyle('toolbar')}
        className="flex flex-col items-end gap-1.5"
      >
        <div className="flex items-center justify-end gap-1.5 sm:gap-2 pointer-events-auto flex-nowrap">
          <button
            type="button"
            onClick={onToggleLight}
            aria-label={hud.lightEnabled ? t.hud.lightTurnOffAria : t.hud.lightTurnOnAria}
            title={hud.lightMode === 'torch' ? t.hud.lightTorch : t.hud.lightFlashlight}
            style={hud.lightEnabled ? undefined : panelBgStyle}
            className={`inline-flex items-center gap-1.5 shrink-0 ${
              isCompactScreen ? 'h-9 px-2.5' : 'h-10 px-3'
            } rounded-lg border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              hud.lightEnabled
                ? 'bg-[#2a2310]/92 hover:bg-[#3a3015] border-[#eab308]/65 text-[#fef08a]'
                : 'hover:bg-[#142b1f] border-white/14 text-[#dceadf]'
            }`}
          >
            {hud.lightMode === 'torch' ? (
              <Flame
                className={`w-4 h-4 ${hud.lightEnabled ? 'text-[#fb923c]' : 'text-[#b7d0be]'}`}
              />
            ) : (
              <Flashlight
                className={`w-4 h-4 ${hud.lightEnabled ? 'text-[#fde047]' : 'text-[#b7d0be]'}`}
              />
            )}
            <span className="hidden xl:inline">
              {hud.lightMode === 'torch' ? t.hud.lightTorch : t.hud.lightFlashlight}
            </span>
            {!isCompactScreen && <span className="font-mono-tabular text-[11px] opacity-75">F</span>}
          </button>

          <button
            type="button"
            onClick={onOpenInventory}
            aria-label={t.hud.inventoryAria}
            title={t.hud.inventoryAria}
            style={panelBgStyle}
            className={`inline-flex items-center gap-1.5 shrink-0 ${
              isCompactScreen ? 'h-9 px-2.5' : 'h-10 px-3'
            } rounded-lg hover:bg-[#142b1f] border border-white/14 text-[#e7f2e9] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap`}
          >
            <Backpack className="w-4 h-4 text-[#a7f3d0]" />
            <span className="hidden lg:inline">{t.hud.inventoryBtn}</span>
            <span className="font-mono-tabular text-[11px] text-[#facc15]">
              {totalItemsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleCameraMode}
            aria-label={
              hud.cameraMode === 'first-person' ? t.hud.camera1stAria : t.hud.camera3rdAria
            }
            title={hud.cameraMode === 'first-person' ? t.hud.camera1stAria : t.hud.camera3rdAria}
            style={hud.cameraMode === 'first-person' ? undefined : panelBgStyle}
            className={`inline-flex items-center gap-1.5 shrink-0 ${
              isCompactScreen ? 'h-9 px-2.5' : 'h-10 px-3'
            } rounded-lg border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              hud.cameraMode === 'first-person'
                ? 'bg-[#1a3a2c]/95 hover:bg-[#234d3a] border-[#34d399]/55 text-[#a7f3d0]'
                : 'hover:bg-[#142b1f] border-white/14 text-[#e7f2e9]'
            }`}
          >
            {hud.cameraMode === 'first-person' ? (
              <Eye className="w-4 h-4 text-[#4ade80]" />
            ) : (
              <User className="w-4 h-4 text-[#a7f3d0]" />
            )}
            <span className="font-mono-tabular text-[11px]">{cameraBadge}</span>
            {!isCompactScreen && <span className="hidden md:inline text-[11px] opacity-70">V</span>}
          </button>

          <button
            type="button"
            onClick={onPause}
            aria-label={t.hud.pauseAria}
            title={t.hud.pauseAria}
            style={panelBgStyle}
            className={`inline-flex items-center gap-1.5 shrink-0 ${
              isCompactScreen ? 'h-9 px-2.5' : 'h-10 px-3'
            } rounded-lg hover:bg-[#142b1f] border border-white/14 text-[#e7f2e9] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap`}
          >
            <Pause className="w-4 h-4" />
            <span className="hidden sm:inline">{t.hud.pauseBtn}</span>
          </button>
        </div>

        <div className="flex items-center justify-end gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? t.hud.unmuteAria : t.hud.muteAria}
            title={muted ? t.hud.unmuteAria : t.hud.muteAria}
            style={panelBgStyle}
            className={`inline-flex items-center justify-center shrink-0 ${
              isCompactScreen ? 'w-8 h-8' : 'w-9 h-9'
            } rounded-lg hover:bg-[#142b1f] border border-white/14 text-[#e7f2e9] transition-colors cursor-pointer`}
          >
            {muted ? (
              <VolumeX className="w-4 h-4 text-[#fca5a5]" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#a7f3d0]" />
            )}
          </button>

          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? t.hud.exitFullscreenAria : t.hud.fullscreenAria}
            title={isFullscreen ? t.hud.exitFullscreenAria : t.hud.fullscreenAria}
            style={panelBgStyle}
            className={`inline-flex items-center justify-center shrink-0 ${
              isCompactScreen ? 'w-8 h-8' : 'w-9 h-9'
            } rounded-lg hover:bg-[#142b1f] border border-white/14 text-[#e7f2e9] transition-colors cursor-pointer`}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-[#fde047]" />
            ) : (
              <Maximize2 className="w-4 h-4 text-[#a7f3d0]" />
            )}
          </button>
        </div>
      </div>

      {/* 4. Discrete FPS Counter */}
      {showFps && (
        <div
          style={{ ...getElementStyle('fps'), ...panelBgStyle }}
          className="border border-white/12 rounded-md px-2.5 py-1 font-mono-tabular text-[11px] font-medium text-[#bfe3c8] whitespace-nowrap"
        >
          {hud.currentFps} {t.hud.fpsSuffix}
        </div>
      )}

      {/* Top-Right Non-Overlapping Toast Queue (below toolbar & optional FPS) */}
      {hud.toasts.length > 0 && (
        <div
          style={{ top: `${toastTopPx}px` }}
          className="fixed right-3 sm:right-4 z-20 flex flex-col items-end gap-2 pointer-events-none max-w-[min(295px,48vw)] sm:max-w-[310px]"
        >
          {hud.toasts.slice(-3).map((toast) => {
            const content = formatToastContent(language, toast);
            const accentBorder =
              toast.kind === 'relic'
                ? 'border-[#eab308]/55'
                : toast.kind === 'landmark'
                  ? 'border-[#38bdf8]/55'
                  : toast.kind === 'item'
                    ? 'border-[#4ade80]/55'
                    : toast.kind === 'danger'
                      ? 'border-[#f87171]/65'
                      : 'border-[#a7f3d0]/40';
            const titleColor =
              toast.kind === 'relic'
                ? 'text-[#facc15]'
                : toast.kind === 'landmark'
                  ? 'text-[#7dd3fc]'
                  : toast.kind === 'item'
                    ? 'text-[#4ade80]'
                    : toast.kind === 'danger'
                      ? 'text-[#f87171]'
                      : 'text-[#a7f3d0]';
            return (
              <div
                key={toast.id}
                dir={isRtl ? 'rtl' : 'ltr'}
                style={panelBgStyle}
                className={`w-full rounded-xl border ${accentBorder} px-3 py-2 shadow-lg transition-all duration-200`}
              >
                <div className={`font-display font-bold text-xs leading-tight ${titleColor}`}>
                  {content.title}
                </div>
                <p className="mt-0.5 text-[11px] text-[#d6e8da] leading-snug">{content.detail}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Virtual Touch Joystick */}
      {showTouchControls && (
        <div style={getElementStyle('joystick')}>
          <div
            ref={stickRef}
            onTouchStart={handleStickStart}
            onTouchMove={handleStickMove}
            onTouchEnd={handleStickEnd}
            onTouchCancel={handleStickEnd}
            style={panelBgStyle}
            className={`pointer-events-auto relative rounded-full border border-white/20 flex items-center justify-center touch-none ${
              isCompactScreen ? 'w-22 h-22' : 'w-28 h-28'
            }`}
          >
            <div
              className={`rounded-full bg-[#eab308]/90 border-2 border-[#0b1912] shadow-md ${
                isCompactScreen ? 'w-10 h-10' : 'w-12 h-12'
              }`}
              style={{
                transform: `translate(${stickOffset.x}px, ${stickOffset.y}px)`,
              }}
            />
          </div>
        </div>
      )}

      {/* 6. Action Buttons (Eat Berries + Attack + Interact + Jump on Touch, or Quick Eat + Attack on Desktop) */}
      <div style={getElementStyle('actions')}>
        {showTouchControls ? (
          <div className="pointer-events-auto flex items-center gap-2 sm:gap-2.5">
            {berryCount > 0 && (
              <button
                type="button"
                onTouchStart={(e) => {
                  e.stopPropagation();
                  onEatBerry();
                }}
                onClick={onEatBerry}
                aria-label={`${t.hud.eatBerries} (${berryCount})`}
                className={`relative rounded-full bg-[#881337]/92 border border-[#fda4af]/60 text-[#ffe4e6] font-bold flex items-center justify-center shadow-lg active:scale-95 ${
                  isCompactScreen ? 'w-12 h-12' : 'w-14 h-14'
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" className={isCompactScreen ? 'w-5 h-5' : 'w-6 h-6'} aria-hidden="true">
                  <path d="M12 8C10 5.5 7 5.2 5.5 7C7.8 8 10 8.3 12 8Z" fill="#4ade80" />
                  <path d="M12 8C14 5.5 17 5.2 18.5 7C16.2 8 14 8.3 12 8Z" fill="#22c55e" />
                  <circle cx="9" cy="13" r="3.6" fill="#f43f5e" />
                  <circle cx="15" cy="13" r="3.6" fill="#e11d48" />
                  <circle cx="12" cy="17" r="3.8" fill="#fb7185" />
                </svg>
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-[#facc15] text-[#0b1912] font-mono-tabular text-[10px] font-bold leading-none">
                  {berryCount}
                </span>
              </button>
            )}
            {hud.nearbyPrompt && (
              <button
                type="button"
                onTouchStart={(e) => {
                  e.stopPropagation();
                  onInteract();
                }}
                onClick={onInteract}
                aria-label={t.hud.interactAria}
                className={`rounded-full font-bold flex items-center justify-center shadow-lg active:scale-95 ${
                  hud.nearbyPrompt.kind === 'bed'
                    ? hud.canSleepNow
                      ? 'bg-[#6366f1] text-white border border-[#a5b4fc]/70'
                      : 'bg-[#334155]/90 text-[#cbd5e1] border border-white/25'
                    : 'bg-[#eab308] text-[#0c1a12]'
                } ${isCompactScreen ? 'w-12 h-12' : 'w-14 h-14'}`}
              >
                {hud.nearbyPrompt.kind === 'bed' ? (
                  <BedDouble className={isCompactScreen ? 'w-5 h-5' : 'w-6 h-6'} />
                ) : (
                  <Hand className={isCompactScreen ? 'w-5 h-5' : 'w-6 h-6'} />
                )}
              </button>
            )}
            <button
              type="button"
              onTouchStart={(e) => {
                e.stopPropagation();
                onAttack();
              }}
              onClick={onAttack}
              aria-label={t.hud.attackAria}
              className={`rounded-full bg-[#7f1d1d]/90 border border-[#f87171]/55 text-[#fecaca] font-bold flex items-center justify-center shadow-lg active:scale-95 ${
                isCompactScreen ? 'w-12 h-12' : 'w-14 h-14'
              }`}
            >
              <Sword className={isCompactScreen ? 'w-5 h-5' : 'w-6 h-6'} />
            </button>
            <button
              type="button"
              onTouchStart={(e) => {
                e.stopPropagation();
                onJump();
              }}
              onClick={onJump}
              style={panelBgStyle}
              className={`rounded-full border border-white/25 text-white text-xs font-bold flex items-center justify-center shadow-lg active:scale-95 ${
                isCompactScreen ? 'w-12 h-12' : 'w-14 h-14'
              }`}
            >
              {t.hud.jump}
            </button>
          </div>
        ) : (
          <div className="pointer-events-auto flex items-center gap-2">
            {berryCount > 0 && (
              <button
                type="button"
                onClick={onEatBerry}
                title={t.hud.eatBerriesTitle}
                className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg bg-[#3b1220]/90 hover:bg-[#52182c] border border-[#fda4af]/45 text-[#ffe4e6] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 shrink-0" aria-hidden="true">
                  <path d="M12 8C10 5.5 7 5.2 5.5 7C7.8 8 10 8.3 12 8Z" fill="#4ade80" />
                  <path d="M12 8C14 5.5 17 5.2 18.5 7C16.2 8 14 8.3 12 8Z" fill="#22c55e" />
                  <circle cx="9" cy="13" r="3.6" fill="#f43f5e" />
                  <circle cx="15" cy="13" r="3.6" fill="#e11d48" />
                  <circle cx="12" cy="17" r="3.8" fill="#fb7185" />
                </svg>
                <span>{t.hud.eatBerries}</span>
                <span className="font-mono-tabular text-[11px] text-[#facc15]">×{berryCount}</span>
                <span className="font-mono-tabular text-[11px] text-[#fda4af]">R</span>
              </button>
            )}
            <button
              type="button"
              onClick={onAttack}
              className="inline-flex items-center gap-2 min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#2c1512]/90 hover:bg-[#421f1a] border border-[#f87171]/45 text-[#fde8e8] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <Sword className="w-3.5 h-3.5 text-[#fca5a5]" />
              <span>
                {hud.equippedWeapon === 'sword'
                  ? t.hud.sword
                  : hud.equippedWeapon === 'axe'
                    ? t.hud.axe
                    : t.hud.attack}
              </span>
              <span className="font-mono-tabular text-[11px] text-[#fca5a5]">Q</span>
            </button>
          </div>
        )}
      </div>

      {/* 7. Contextual Interact Button (E) — including "Deitar" near beds */}
      {hud.nearbyPrompt && !hud.guideDialogueOpen && !hud.isSleeping && (
        <div style={getElementStyle('interact')}>
          <button
            type="button"
            dir={isRtl ? 'rtl' : 'ltr'}
            onClick={onInteract}
            className={`pointer-events-auto inline-flex items-center gap-2 min-h-[42px] px-4 py-2 rounded-xl border text-[#f6faf6] shadow-lg transition-transform active:scale-95 cursor-pointer max-w-[85vw] whitespace-nowrap ${
              hud.nearbyPrompt.kind === 'bed'
                ? hud.canSleepNow
                  ? 'hover:bg-[#1e1b4b] border-[#818cf8]/75'
                  : 'hover:bg-[#1e293b] border-white/25 opacity-90'
                : 'hover:bg-[#173625] border-[#eab308]/55'
            }`}
            style={panelBgStyle}
          >
            {hud.nearbyPrompt.kind === 'bed' ? (
              <span
                className={`inline-flex items-center justify-center w-6 h-6 rounded shrink-0 ${
                  hud.canSleepNow
                    ? 'bg-[#6366f1] text-white'
                    : 'bg-[#475569] text-[#e2e8f0]'
                }`}
              >
                <BedDouble className="w-3.5 h-3.5" />
              </span>
            ) : (
              <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-[#eab308] text-[#0b1912] font-mono-tabular text-xs font-bold shrink-0">
                E
              </span>
            )}
            <span className="text-xs sm:text-sm font-semibold truncate">
              {formatPromptLabel(language, hud.nearbyPrompt)}
            </span>
            {hud.nearbyPrompt.kind === 'bed' && !hud.canSleepNow && (
              <span className="text-[11px] font-medium text-[#cbd5e1]/80">
                · {t.hud.sleepNightOnly}
              </span>
            )}
          </button>
        </div>
      )}

      {/* 8. Bottom Control Tips */}
      {showTips && !hud.nearbyPrompt && !showTouchControls && !isCompactLandscape && (
        <div style={getElementStyle('tips')}>
          <p
            dir={isRtl ? 'rtl' : 'ltr'}
            style={panelBgStyle}
            className="text-[11px] text-[#e2efe4]/85 px-3 py-1.5 rounded-lg text-center border border-white/8 whitespace-nowrap"
          >
            {hud.pointerLocked ? t.hud.tipLocked : t.hud.tipUnlocked}
          </p>
        </div>
      )}

      {/* Center Non-Blocking Stack: Combat Target HP + Predator Alert only (no feedback overlaps) */}
      {(hud.combatTarget || hud.predatorAlert !== 'none') && (
        <div className="fixed inset-x-0 top-[14%] flex flex-col items-center gap-2 pointer-events-none px-4">
          {hud.combatTarget && (
            <div
              dir={isRtl ? 'rtl' : 'ltr'}
              style={panelBgStyle}
              className="border border-white/18 rounded-lg px-3.5 py-2 min-w-[190px] max-w-[260px] shadow-lg"
            >
              <div className="flex items-center justify-between gap-3 text-xs font-semibold text-[#f3f7f2]">
                <span className="truncate">
                  {hud.combatTarget.kind === 'tree'
                    ? t.hud.treeTarget
                    : hud.combatTarget.kind === 'rock'
                      ? t.hud.rockTarget
                      : (hud.combatTarget.animalKey && t.animals[hud.combatTarget.animalKey]) ??
                        hud.combatTarget.name}
                </span>
                <span className="font-mono-tabular text-[11px] text-[#fca5a5]">
                  {hud.combatTarget.hp}/{hud.combatTarget.maxHp}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-white/12 overflow-hidden">
                <div
                  className={`h-full transition-all duration-150 ${
                    hud.combatTarget.hp <= 25
                      ? 'bg-[#ef4444]'
                      : hud.combatTarget.hp <= 55
                        ? 'bg-[#f59e0b]'
                        : 'bg-[#4ade80]'
                  }`}
                  style={{
                    width: `${Math.max(0, Math.min(100, (hud.combatTarget.hp / hud.combatTarget.maxHp) * 100))}%`,
                  }}
                />
              </div>
            </div>
          )}

          {hud.predatorAlert !== 'none' && (
            <div
              dir={isRtl ? 'rtl' : 'ltr'}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 border shadow-lg ${
                hud.predatorAlert === 'chase'
                  ? 'bg-[#3a1212]/90 border-[#f87171]/60 text-[#fecaca]'
                  : 'bg-[#2b200c]/88 border-[#fbbf24]/50 text-[#fef08a]'
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="text-xs font-semibold">
                {hud.predatorAlert === 'chase' ? t.hud.predatorChase : t.hud.predatorStalk}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

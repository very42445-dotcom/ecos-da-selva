import { useCallback, useEffect, useRef, useState } from 'react';
import { GameHUD } from './components/GameHUD';
import { GuideDialogueModal } from './components/GuideDialogueModal';
import { HudEditorOverlay } from './components/HudEditorOverlay';
import { InventoryModal } from './components/InventoryModal';
import { PauseVictoryModal } from './components/PauseVictoryModal';
import { SettingsModal } from './components/SettingsModal';
import { TitleScreen } from './components/TitleScreen';
import { createInitialInventory } from './game/inventory';
import { JungleEngine } from './game/JungleEngine';
import {
  DEFAULT_HUD_LAYOUT,
  DEFAULT_SETTINGS,
  GameSettings,
  HudElementId,
  HudLayout,
  HudState,
  InventoryItemId,
  LanguageCode,
} from './game/types';
import { getTranslator, LANGUAGE_CODES } from './i18n/translations';

const SETTINGS_STORAGE_KEY = 'ecos_da_selva_settings_v1';

function loadSavedSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Omit<
      Partial<GameSettings>,
      'visualQuality' | 'soundVolume' | 'language'
    > & {
      language?: string;
      visualQuality?: string;
      soundVolume?: number;
    };

    const language: LanguageCode = LANGUAGE_CODES.includes(parsed.language as LanguageCode)
      ? (parsed.language as LanguageCode)
      : DEFAULT_SETTINGS.language;

    const quality: GameSettings['visualQuality'] =
      parsed.visualQuality === 'potato' ||
      parsed.visualQuality === 'ultra-low' ||
      parsed.visualQuality === 'low' ||
      parsed.visualQuality === 'medium' ||
      parsed.visualQuality === 'high' ||
      parsed.visualQuality === 'ultra-high'
        ? parsed.visualQuality
        : parsed.visualQuality === 'balanced'
          ? 'medium'
          : DEFAULT_SETTINGS.visualQuality;

    const legacyVol =
      typeof parsed.soundVolume === 'number' ? parsed.soundVolume : undefined;
    const ambientVolume =
      typeof parsed.ambientVolume === 'number'
        ? parsed.ambientVolume
        : (legacyVol ?? DEFAULT_SETTINGS.ambientVolume);
    const sfxVolume =
      typeof parsed.sfxVolume === 'number'
        ? parsed.sfxVolume
        : (legacyVol ?? DEFAULT_SETTINGS.sfxVolume);

    const atmosphereIntensity =
      typeof parsed.atmosphereIntensity === 'number'
        ? Math.min(1.4, Math.max(0.4, parsed.atmosphereIntensity))
        : DEFAULT_SETTINGS.atmosphereIntensity;
    const hudScale =
      typeof parsed.hudScale === 'number'
        ? Math.min(1.25, Math.max(0.8, parsed.hudScale))
        : DEFAULT_SETTINGS.hudScale;
    const hudOpacity =
      typeof parsed.hudOpacity === 'number'
        ? Math.min(1.0, Math.max(0.45, parsed.hudOpacity))
        : DEFAULT_SETTINGS.hudOpacity;
    const hudPosition =
      parsed.hudPosition === 'top-left' || parsed.hudPosition === 'bottom-left'
        ? parsed.hudPosition
        : DEFAULT_SETTINGS.hudPosition;

    const hudLayout: HudLayout = { ...DEFAULT_HUD_LAYOUT };
    if (parsed.hudLayout && typeof parsed.hudLayout === 'object') {
      (Object.keys(DEFAULT_HUD_LAYOUT) as HudElementId[]).forEach((key) => {
        const entry = parsed.hudLayout?.[key];
        const fallback = DEFAULT_HUD_LAYOUT[key];
        if (entry && typeof entry === 'object') {
          hudLayout[key] = {
            xPct:
              typeof entry.xPct === 'number'
                ? Math.min(100, Math.max(0, entry.xPct))
                : fallback.xPct,
            yPct:
              typeof entry.yPct === 'number'
                ? Math.min(100, Math.max(0, entry.yPct))
                : fallback.yPct,
            scale:
              typeof entry.scale === 'number'
                ? Math.min(1.45, Math.max(0.65, entry.scale))
                : fallback.scale,
            opacity:
              typeof entry.opacity === 'number'
                ? Math.min(1.0, Math.max(0.35, entry.opacity))
                : fallback.opacity,
          };
        }
      });
    }

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      language,
      visualQuality: quality,
      ambientVolume,
      sfxVolume,
      atmosphereIntensity,
      hudScale,
      hudOpacity,
      hudPosition,
      hudLayout,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

const INITIAL_HUD: HudState = {
  phase: 'title',
  cameraMode: 'third-person',
  zoneId: 'central',
  zoneName: 'Clareira do Sol',
  weatherKey: 'clear',
  weatherLabel: 'Céu Limpo',
  dayPhaseKey: 'day',
  dayPhaseLabel: 'Dia',
  timeOfDay: 0.36,
  hp: 100,
  maxHp: 100,
  stamina: 100,
  maxStamina: 100,
  staminaExhausted: false,
  food: 100,
  maxFood: 100,
  isSwimming: false,
  isSleeping: false,
  canSleepNow: false,
  guideCompleted: false,
  guideDialogueOpen: false,
  lightEnabled: false,
  lightMode: 'flashlight',
  equippedWeapon: 'none',
  sprintBoostSeconds: 0,
  predatorAlert: 'none',
  combatTarget: null,
  relicsCollected: 0,
  relicsTotal: 5,
  landmarksDiscovered: 0,
  landmarksTotal: 3,
  inventory: createInitialInventory(),
  nearbyPrompt: null,
  activeObjective: { key: 'talk_guide' },
  activeTip: { key: 'talk_guide' },
  compassTarget: null,
  playerHeadingDeg: 0,
  pointerLocked: false,
  toasts: [],
  elapsedSeconds: 0,
  currentFps: 60,
  webglError: false,
};

type WebkitDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitFullscreenEnabled?: boolean;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type WebkitHTMLElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<JungleEngine | null>(null);

  const [settings, setSettings] = useState<GameSettings>(() => loadSavedSettings());
  const [hud, setHud] = useState<HudState>(INITIAL_HUD);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hudEditorOpen, setHudEditorOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenNotice, setFullscreenNotice] = useState<string | null>(null);
  const fsNoticeTimerRef = useRef<number | null>(null);

  const t = getTranslator(settings.language);

  useEffect(() => {
    document.documentElement.lang = settings.language;
    document.title = `${t.gameTitle} — 3D`;
  }, [settings.language, t.gameTitle]);

  useEffect(() => {
    const syncFullscreen = () => {
      const doc = document as WebkitDocument;
      setIsFullscreen(Boolean(document.fullscreenElement || doc.webkitFullscreenElement));
    };
    syncFullscreen();
    document.addEventListener('fullscreenchange', syncFullscreen);
    document.addEventListener('webkitfullscreenchange', syncFullscreen);
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen);
      document.removeEventListener('webkitfullscreenchange', syncFullscreen);
      if (fsNoticeTimerRef.current !== null) {
        window.clearTimeout(fsNoticeTimerRef.current);
      }
    };
  }, []);

  const showFsNotice = useCallback((msg: string) => {
    setFullscreenNotice(msg);
    if (fsNoticeTimerRef.current !== null) {
      window.clearTimeout(fsNoticeTimerRef.current);
    }
    fsNoticeTimerRef.current = window.setTimeout(() => {
      fsNoticeTimerRef.current = null;
      setFullscreenNotice(null);
    }, 3400);
  }, []);

  // Mount Three.js JungleEngine once in isolated container
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const engine = new JungleEngine(
      container,
      loadSavedSettings(),
      (nextHud) => setHud(nextHud),
      () => {
        setInventoryOpen(false);
        engine.setPhase('paused');
      },
      () => {
        setInventoryOpen((prev) => {
          const next = !prev;
          engine.audio.playUiClick();
          engine.setInventoryOpen(next);
          return next;
        });
      },
    );
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const handleSettingsChange = useCallback((next: GameSettings) => {
    setSettings(next);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
    engineRef.current?.updateSettings(next);
  }, []);

  const handleToggleMute = useCallback(() => {
    const engine = engineRef.current;
    engine?.audio.unlock();
    setSettings((prev) => {
      const next = { ...prev, muted: !prev.muted };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      engine?.updateSettings(next);
      if (!next.muted) {
        engine?.audio.playUiClick();
      }
      return next;
    });
  }, []);

  const handlePlay = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.audio.unlock();
    engine.audio.playUiClick();
    setInventoryOpen(false);
    engine.startNewExpedition();
    window.requestAnimationFrame(() => {
      engineRef.current?.syncViewportSize();
    });
  }, []);

  const handleOpenSettings = useCallback(() => {
    const engine = engineRef.current;
    engine?.audio.unlock();
    engine?.audio.playUiClick();
    setSettingsOpen(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    engineRef.current?.audio.playUiClick();
    setSettingsOpen(false);
    window.requestAnimationFrame(() => {
      engineRef.current?.syncViewportSize();
    });
  }, []);

  const handleOpenHudEditor = useCallback(() => {
    engineRef.current?.audio.playUiClick();
    setSettingsOpen(false);
    setHudEditorOpen(true);
  }, []);

  const handleSaveHudLayout = useCallback(
    (nextLayout: HudLayout) => {
      engineRef.current?.audio.playUiClick();
      handleSettingsChange({
        ...settings,
        hudLayout: nextLayout,
      });
      setHudEditorOpen(false);
      setSettingsOpen(true);
      window.requestAnimationFrame(() => {
        engineRef.current?.syncViewportSize();
      });
    },
    [handleSettingsChange, settings],
  );

  const handleCancelHudLayout = useCallback(() => {
    engineRef.current?.audio.playUiClick();
    setHudEditorOpen(false);
    setSettingsOpen(true);
    window.requestAnimationFrame(() => {
      engineRef.current?.syncViewportSize();
    });
  }, []);

  const handlePause = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.audio.playUiClick();
    setInventoryOpen(false);
    engine.setPhase('paused');
  }, []);

  const handleResume = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.audio.unlock();
    engine.audio.playUiClick();
    setInventoryOpen(false);
    engine.setPhase('playing');
  }, []);

  const handleRestart = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.audio.unlock();
    engine.audio.playUiClick();
    setInventoryOpen(false);
    engine.startNewExpedition();
  }, []);

  const handleBackToTitle = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.audio.playUiClick();
    setInventoryOpen(false);
    engine.setPhase('title');
  }, []);

  const handleToggleLight = useCallback(() => {
    engineRef.current?.toggleLight();
  }, []);

  const handleToggleCameraMode = useCallback(() => {
    engineRef.current?.toggleCameraMode();
  }, []);

  const handleOpenInventory = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.audio.unlock();
    engine.audio.playUiClick();
    setInventoryOpen(true);
    engine.setInventoryOpen(true);
  }, []);

  const handleCloseInventory = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.audio.playUiClick();
    setInventoryOpen(false);
    engine.setInventoryOpen(false);
  }, []);

  const handleUseItem = useCallback((id: InventoryItemId) => {
    engineRef.current?.useInventoryItem(id);
  }, []);

  const handleEquipItem = useCallback((id: InventoryItemId) => {
    engineRef.current?.equipInventoryItem(id);
  }, []);

  const handleCraftTorch = useCallback(() => {
    engineRef.current?.craftTorch();
  }, []);

  const handleCraftBandage = useCallback(() => {
    engineRef.current?.craftBandage();
  }, []);

  const handleCraftCampfire = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.craftCampfire();
    engine.setInventoryOpen(false);
    setInventoryOpen(false);
  }, []);

  const handleRespawn = useCallback(() => {
    engineRef.current?.respawnAtClearing();
  }, []);

  const handleInteract = useCallback(() => {
    engineRef.current?.triggerInteract();
  }, []);

  const handleAttack = useCallback(() => {
    engineRef.current?.triggerAttack();
  }, []);

  const handleJump = useCallback(() => {
    engineRef.current?.triggerJumpFromUI();
  }, []);

  const handleEatBerry = useCallback(() => {
    engineRef.current?.useSweetBerryQuick();
  }, []);

  const handleTouchMove = useCallback((x: number, y: number, sprinting: boolean) => {
    engineRef.current?.setTouchMove(x, y, sprinting);
  }, []);

  const handleToggleFullscreen = useCallback(async () => {
    engineRef.current?.audio.unlock();
    engineRef.current?.audio.playUiClick();
    const doc = document as WebkitDocument;
    const rootEl = document.documentElement as WebkitHTMLElement;
    const active = Boolean(document.fullscreenElement || doc.webkitFullscreenElement);
    const msgs = getTranslator(settings.language).system;

    try {
      if (active) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else {
          showFsNotice(msgs.fsExitUnsupported);
        }
        return;
      }

      const canRequest =
        Boolean(document.fullscreenEnabled || doc.webkitFullscreenEnabled) &&
        Boolean(rootEl.requestFullscreen || rootEl.webkitRequestFullscreen);

      if (!canRequest) {
        showFsNotice(msgs.fsUnsupported);
        return;
      }

      if (rootEl.requestFullscreen) {
        await rootEl.requestFullscreen();
      } else if (rootEl.webkitRequestFullscreen) {
        await rootEl.webkitRequestFullscreen();
      }
    } catch {
      showFsNotice(msgs.fsBlocked);
    }
  }, [settings.language, showFsNotice]);

  return (
    <main className="relative w-screen h-[100dvh] overflow-hidden bg-[#0b1811]">
      {/* Isolated WebGL mount node — never re-rendered by HUD state */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 w-full h-full"
        aria-label={t.system.canvasAria}
      />

      {/* Safe Fullscreen Unsupported / Blocked Toast */}
      {fullscreenNotice && (
        <div
          dir={settings.language === 'ar' ? 'rtl' : 'ltr'}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-[#0d1f15]/95 border border-[#eab308]/45 text-xs font-medium text-[#fef08a] shadow-xl pointer-events-none text-center max-w-[90vw]"
        >
          {fullscreenNotice}
        </div>
      )}

      {/* Graceful WebGL fallback banner if context fails */}
      {hud.webglError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-[#0b1811]/95">
          <div
            dir={settings.language === 'ar' ? 'rtl' : 'ltr'}
            className="max-w-md rounded-xl bg-[#12261b] border border-white/15 p-6 text-center"
          >
            <h2 className="font-display text-xl font-bold text-[#facc15]">
              {t.system.webglNoticeTitle}
            </h2>
            <p className="mt-2 text-sm text-[#d4e7d8]">{t.system.webglErrorMsg}</p>
          </div>
        </div>
      )}

      {/* Title Screen */}
      {hud.phase === 'title' && !settingsOpen && !hudEditorOpen && (
        <TitleScreen
          language={settings.language}
          isFullscreen={isFullscreen}
          onPlay={handlePlay}
          onOpenSettings={handleOpenSettings}
          onToggleFullscreen={handleToggleFullscreen}
        />
      )}

      {/* Active Gameplay HUD */}
      {hud.phase === 'playing' && !hudEditorOpen && (
        <GameHUD
          hud={hud}
          language={settings.language}
          muted={settings.muted}
          showFps={settings.showFps}
          isFullscreen={isFullscreen}
          touchControlMode={settings.touchControls}
          hudScale={settings.hudScale}
          hudOpacity={settings.hudOpacity}
          hudLayout={settings.hudLayout}
          showCompass={settings.showCompass}
          showTips={settings.showTips}
          onToggleMute={handleToggleMute}
          onToggleFullscreen={handleToggleFullscreen}
          onToggleLight={handleToggleLight}
          onToggleCameraMode={handleToggleCameraMode}
          onOpenInventory={handleOpenInventory}
          onPause={handlePause}
          onInteract={handleInteract}
          onAttack={handleAttack}
          onJump={handleJump}
          onEatBerry={handleEatBerry}
          onTouchMove={handleTouchMove}
        />
      )}

      {/* Smooth Sleep-to-Dawn Fade Overlay */}
      <div
        aria-hidden={!hud.isSleeping}
        className={`fixed inset-0 z-40 flex flex-col items-center justify-center bg-black px-6 text-center transition-opacity duration-500 pointer-events-none ${
          hud.isSleeping ? 'opacity-100 pointer-events-auto' : 'opacity-0'
        }`}
      >
        {hud.isSleeping && (
          <div dir={settings.language === 'ar' ? 'rtl' : 'ltr'} className="max-w-md space-y-2">
            <p className="font-display text-2xl sm:text-3xl font-bold text-[#fde68a] tracking-wide">
              {t.hud.sleepingTitle}
            </p>
            <p className="text-sm text-[#cbd5e1]">{t.hud.sleepingDesc}</p>
          </div>
        )}
      </div>

      {/* Mandatory Starting Guide NPC Briefing Modal */}
      {hud.phase === 'playing' && (
        <GuideDialogueModal
          open={hud.guideDialogueOpen && !settingsOpen && !hudEditorOpen && !inventoryOpen}
          t={t}
          isRtl={settings.language === 'ar'}
          onFinish={() => {
            engineRef.current?.audio.playUiClick();
            engineRef.current?.finishGuideDialogue();
          }}
        />
      )}

      {/* Inventory Modal */}
      {hud.phase === 'playing' && inventoryOpen && !settingsOpen && !hudEditorOpen && (
        <InventoryModal
          language={settings.language}
          inventory={hud.inventory}
          lightEnabled={hud.lightEnabled}
          onUseItem={handleUseItem}
          onEquipItem={handleEquipItem}
          onCraftTorch={handleCraftTorch}
          onCraftBandage={handleCraftBandage}
          onCraftCampfire={handleCraftCampfire}
          onClose={handleCloseInventory}
        />
      )}

      {/* Pause, Fallen, or Expedition Complete Modal */}
      {(hud.phase === 'paused' || hud.phase === 'completed' || hud.phase === 'fallen') &&
        !settingsOpen &&
        !hudEditorOpen && (
          <PauseVictoryModal
            language={settings.language}
            phase={hud.phase}
            relicsCollected={hud.relicsCollected}
            relicsTotal={hud.relicsTotal}
            landmarksDiscovered={hud.landmarksDiscovered}
            landmarksTotal={hud.landmarksTotal}
            elapsedSeconds={hud.elapsedSeconds}
            onResume={handleResume}
            onRespawn={handleRespawn}
            onRestart={handleRestart}
            onOpenSettings={handleOpenSettings}
            onBackToTitle={handleBackToTitle}
          />
        )}

      {/* Settings Modal */}
      {settingsOpen && !hudEditorOpen && (
        <SettingsModal
          settings={settings}
          isFullscreen={isFullscreen}
          fromTitle={hud.phase === 'title'}
          onToggleFullscreen={handleToggleFullscreen}
          onOpenHudEditor={handleOpenHudEditor}
          onChange={handleSettingsChange}
          onClose={handleCloseSettings}
        />
      )}

      {/* Interactive Visual HUD Editor */}
      {hudEditorOpen && (
        <HudEditorOverlay
          language={settings.language}
          initialLayout={settings.hudLayout}
          onSave={handleSaveHudLayout}
          onCancel={handleCancelHudLayout}
        />
      )}
    </main>
  );
}

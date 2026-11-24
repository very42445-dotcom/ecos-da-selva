import React, { useRef, useState } from 'react';
import {
  Backpack,
  Compass,
  Eye,
  Flashlight,
  Hand,
  Heart,
  Move,
  Pause,
  RotateCcw,
  Sword,
  Utensils,
  Zap,
} from 'lucide-react';
import {
  DEFAULT_HUD_LAYOUT,
  HudElementId,
  HudLayout,
  LanguageCode,
} from '../game/types';
import { getTranslator } from '../i18n/translations';

interface HudEditorOverlayProps {
  language: LanguageCode;
  initialLayout: HudLayout;
  onSave: (nextLayout: HudLayout) => void;
  onCancel: () => void;
}

const ELEMENT_ORDER: HudElementId[] = [
  'status',
  'compass',
  'toolbar',
  'fps',
  'joystick',
  'actions',
  'interact',
  'tips',
];

export const HudEditorOverlay: React.FC<HudEditorOverlayProps> = ({
  language,
  initialLayout,
  onSave,
  onCancel,
}) => {
  const [draft, setDraft] = useState<HudLayout>(() => ({
    ...DEFAULT_HUD_LAYOUT,
    ...initialLayout,
  }));
  const [selectedId, setSelectedId] = useState<HudElementId>('status');
  const containerRef = useRef<HTMLDivElement | null>(null);

  const t = getTranslator(language);
  const isRtl = language === 'ar';

  const dragRef = useRef<{
    id: HudElementId;
    pointerId: number;
    startX: number;
    startY: number;
    startXPct: number;
    startYPct: number;
    availW: number;
    availH: number;
  } | null>(null);

  const handleElementPointerDown = (
    id: HudElementId,
    e: React.PointerEvent<HTMLDivElement>,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(id);

    const container = containerRef.current;
    if (!container) return;
    const cRect = container.getBoundingClientRect();
    const elRect = e.currentTarget.getBoundingClientRect();

    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      id,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startXPct: draft[id].xPct,
      startYPct: draft[id].yPct,
      availW: Math.max(48, cRect.width - elRect.width),
      availH: Math.max(48, cRect.height - elRect.height),
    };
  };

  const handleElementPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    e.stopPropagation();
    e.preventDefault();

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    const nextXPct = Math.min(100, Math.max(0, drag.startXPct + (dx / drag.availW) * 100));
    const nextYPct = Math.min(100, Math.max(0, drag.startYPct + (dy / drag.availH) * 100));

    setDraft((prev) => ({
      ...prev,
      [drag.id]: {
        ...prev[drag.id],
        xPct: Math.round(nextXPct * 10) / 10,
        yPct: Math.round(nextYPct * 10) / 10,
      },
    }));
  };

  const handleElementPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
  };

  const selectedCfg = draft[selectedId];
  const inspectorAtTop = selectedCfg.yPct > 52;
  const cameraBadge = language === 'pt-BR' || language === 'es' ? '3ª' : '3P';

  const renderElementPreview = (id: HudElementId) => {
    switch (id) {
      case 'status':
        return (
          <div
            dir={isRtl ? 'rtl' : 'ltr'}
            className="px-3.5 py-2.5 rounded-xl bg-[#0b1912] border border-white/20 w-56"
          >
            <div className="text-[11px] font-medium text-[#9fd4b1]">
              {t.hudEditor.previewStatusZone}
            </div>
            <div className="mt-1 text-xs font-semibold text-[#f3f7f2]">
              {t.hud.relics} <span className="text-[#facc15]">0/5</span> · {t.hud.landmarks}{' '}
              <span className="text-[#7dd3fc]">0/3</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 text-[#4ade80]" />
              <div className="flex-1 h-2 rounded-full bg-white/15 overflow-hidden">
                <div className="h-full w-4/5 bg-[#22c55e]" />
              </div>
              <span className="font-mono-tabular text-[11px] text-[#e2efe4]">100/100</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-[#38bdf8]" />
              <div className="flex-1 h-2 rounded-full bg-white/15 overflow-hidden">
                <div className="h-full w-4/5 bg-[#38bdf8]" />
              </div>
              <span className="font-mono-tabular text-[11px] text-[#cfe9f7]">100/100</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <Utensils className="w-3.5 h-3.5 text-[#fbbf24]" />
              <div className="flex-1 h-2 rounded-full bg-white/15 overflow-hidden">
                <div className="h-full w-4/5 bg-[#f59e0b]" />
              </div>
              <span className="font-mono-tabular text-[11px] text-[#fde68a]">100/100</span>
            </div>
          </div>
        );

      case 'compass':
        return (
          <div className="flex flex-col items-center gap-1">
            <div className="w-44 h-7 rounded-lg bg-[#0b1912] border border-white/20 flex items-center justify-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#facc15]" />
              <span className="font-mono-tabular text-[11px] font-semibold text-white">42m</span>
            </div>
            <span className="text-[10px] font-medium text-[#e4f0e6]">
              {t.hudEditor.previewCompass}
            </span>
          </div>
        );

      case 'toolbar':
        return (
          <div className="flex items-center gap-1.5">
            <div className="h-9 px-2.5 rounded-lg bg-[#0b1912] border border-white/20 flex items-center gap-1 text-[11px] text-[#dceadf]">
              <Flashlight className="w-3.5 h-3.5" />
              <span>F</span>
            </div>
            <div className="h-9 px-2.5 rounded-lg bg-[#0b1912] border border-white/20 flex items-center gap-1 text-[11px] text-[#facc15]">
              <Backpack className="w-3.5 h-3.5 text-[#a7f3d0]" />
              <span>5</span>
            </div>
            <div className="h-9 px-2.5 rounded-lg bg-[#0b1912] border border-white/20 flex items-center gap-1 text-[11px] text-[#dceadf]">
              <Eye className="w-3.5 h-3.5 text-[#a7f3d0]" />
              <span>{cameraBadge}</span>
            </div>
            <div className="h-9 px-2.5 rounded-lg bg-[#0b1912] border border-white/20 flex items-center gap-1 text-[11px] text-[#dceadf]">
              <Pause className="w-3.5 h-3.5" />
            </div>
          </div>
        );

      case 'fps':
        return (
          <div className="rounded-md bg-[#0b1912] border border-white/20 px-2.5 py-1 font-mono-tabular text-[11px] font-medium text-[#bfe3c8]">
            60 {t.hud.fpsSuffix}
          </div>
        );

      case 'joystick':
        return (
          <div className="w-24 h-24 rounded-full bg-[#0b1912] border border-white/25 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-[#eab308]/90 border-2 border-[#0b1912]" />
          </div>
        );

      case 'actions':
        return (
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-[#eab308] text-[#0c1a12] flex items-center justify-center">
              <Hand className="w-5 h-5" />
            </div>
            <div className="w-12 h-12 rounded-full bg-[#7f1d1d] border border-[#f87171]/60 text-[#fecaca] flex items-center justify-center">
              <Sword className="w-5 h-5" />
            </div>
            <div className="w-12 h-12 rounded-full bg-[#0b1912] border border-white/25 text-white text-[11px] font-bold flex items-center justify-center">
              {t.hudEditor.previewJump}
            </div>
          </div>
        );

      case 'interact':
        return (
          <div
            dir={isRtl ? 'rtl' : 'ltr'}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0b1912] border border-[#eab308]/60 text-[#f6faf6] text-xs font-semibold"
          >
            <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[#eab308] text-[#0b1912] font-mono-tabular text-[11px] font-bold">
              E
            </span>
            <span>{t.hudEditor.previewCollect}</span>
          </div>
        );

      case 'tips':
        return (
          <div
            dir={isRtl ? 'rtl' : 'ltr'}
            className="px-3 py-1.5 rounded-lg bg-[#0b1912] border border-white/15 text-[11px] text-[#e2efe4] whitespace-nowrap"
          >
            {t.hudEditor.previewTips}
          </div>
        );
    }
  };

  return (
    <div
      ref={containerRef}
      dir="ltr"
      className="fixed inset-0 z-50 bg-[#050e09]/55 select-none touch-none overflow-hidden"
    >
      {/* Subtle Alignment Grid Guides */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.16) 1px, transparent 1px)',
          backgroundSize: '25% 25%',
        }}
      />

      {/* Draggable HUD Element Previews */}
      {ELEMENT_ORDER.map((id) => {
        const cfg = draft[id];
        const isSelected = selectedId === id;
        const label = t.hudEditor.labels[id];
        return (
          <div
            key={id}
            onPointerDown={(e) => handleElementPointerDown(id, e)}
            onPointerMove={handleElementPointerMove}
            onPointerUp={handleElementPointerUp}
            onPointerCancel={handleElementPointerUp}
            role="button"
            tabIndex={0}
            aria-label={label}
            className={`absolute cursor-grab active:cursor-grabbing rounded-xl transition-shadow ${
              isSelected
                ? 'ring-2 ring-[#eab308] shadow-[0_0_20px_rgba(234,179,8,0.35)] z-20'
                : 'ring-1 ring-white/25 hover:ring-white/60 z-10'
            }`}
            style={{
              left: `${cfg.xPct}%`,
              top: `${cfg.yPct}%`,
              transform: `translate(${-cfg.xPct}%, ${-cfg.yPct}%) scale(${cfg.scale})`,
              transformOrigin: `${cfg.xPct}% ${cfg.yPct}%`,
              opacity: cfg.opacity,
            }}
          >
            <div className="pointer-events-none">{renderElementPreview(id)}</div>
            <div
              dir={isRtl ? 'rtl' : 'ltr'}
              className={`pointer-events-none absolute -top-2.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide whitespace-nowrap ${
                isSelected
                  ? 'bg-[#eab308] text-[#0c1a12]'
                  : 'bg-[#10261b] text-[#b8d4be] border border-white/15'
              }`}
            >
              {label}
            </div>
          </div>
        );
      })}

      {/* Floating Inspector & Save/Reset Bar */}
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className={`fixed left-1/2 -translate-x-1/2 z-30 w-[min(94vw,520px)] rounded-xl bg-[#0d1f16]/95 border border-[#cde3d1]/25 shadow-2xl p-3 sm:p-4 text-[#f2f7f2] ${
          inspectorAtTop ? 'top-3' : 'bottom-3'
        }`}
      >
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2 min-w-0">
            <Move className="w-4 h-4 text-[#eab308] shrink-0" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-display font-bold text-white truncate">
                {t.hudEditor.editing}: {t.hudEditor.labels[selectedId]}
              </p>
              <p className="text-[11px] text-[#9cb8a3] truncate">{t.hudEditor.dragHint}</p>
            </div>
          </div>
          <span className="font-mono-tabular text-[11px] text-[#a7f3d0] shrink-0">
            {Math.round(selectedCfg.xPct)}% · {Math.round(selectedCfg.yPct)}%
          </span>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <label htmlFor="hud-el-scale" className="font-medium text-[#dceadf]">
                {t.hudEditor.scale}
              </label>
              <span className="font-mono-tabular text-[#eab308]">
                {Math.round(selectedCfg.scale * 100)}%
              </span>
            </div>
            <input
              id="hud-el-scale"
              type="range"
              min={0.65}
              max={1.45}
              step={0.05}
              value={selectedCfg.scale}
              onChange={(e) => {
                const scale = parseFloat(e.target.value);
                setDraft((prev) => ({
                  ...prev,
                  [selectedId]: { ...prev[selectedId], scale },
                }));
              }}
              className="w-full jungle-slider"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <label htmlFor="hud-el-opacity" className="font-medium text-[#dceadf]">
                {t.hudEditor.opacity}
              </label>
              <span className="font-mono-tabular text-[#a7f3d0]">
                {Math.round(selectedCfg.opacity * 100)}%
              </span>
            </div>
            <input
              id="hud-el-opacity"
              type="range"
              min={0.35}
              max={1.0}
              step={0.05}
              value={selectedCfg.opacity}
              onChange={(e) => {
                const opacity = parseFloat(e.target.value);
                setDraft((prev) => ({
                  ...prev,
                  [selectedId]: { ...prev[selectedId], opacity },
                }));
              }}
              className="w-full jungle-slider"
            />
          </div>
        </div>

        <div className="mt-3.5 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setDraft({ ...DEFAULT_HUD_LAYOUT })}
            className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 text-xs font-medium text-[#dceadf] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.hudEditor.resetDefault}</span>
          </button>

          <div className="flex items-center gap-2 ms-auto">
            <button
              type="button"
              onClick={onCancel}
              className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 text-xs font-semibold text-[#cde3d1] transition-colors cursor-pointer"
            >
              {t.hudEditor.cancel}
            </button>
            <button
              type="button"
              onClick={() => onSave(draft)}
              className="min-h-[36px] px-4 py-1.5 rounded-lg bg-[#eab308] hover:bg-[#facc15] text-[#0c1a12] font-display font-bold text-xs transition-colors cursor-pointer"
            >
              {t.hudEditor.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

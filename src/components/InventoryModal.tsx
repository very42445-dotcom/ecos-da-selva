import React, { useEffect, useState } from 'react';
import { Flame, HeartPulse, X } from 'lucide-react';
import { INVENTORY_CATALOG } from '../game/inventory';
import { InventoryItemId, InventorySlotState, LanguageCode } from '../game/types';
import { getTranslator } from '../i18n/translations';

interface InventoryModalProps {
  language: LanguageCode;
  inventory: InventorySlotState[];
  lightEnabled: boolean;
  onUseItem: (id: InventoryItemId) => void;
  onEquipItem: (id: InventoryItemId) => void;
  onCraftTorch: () => void;
  onCraftBandage: () => void;
  onCraftCampfire: () => void;
  onClose: () => void;
}

const MIN_GRID_SLOTS = 12;

const ItemArtwork: React.FC<{ id: InventoryItemId; className?: string }> = ({
  id,
  className = 'w-9 h-9',
}) => {
  switch (id) {
    case 'lantern':
      return (
        <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
          <rect x="8" y="13" width="15" height="10" rx="2.5" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.6" />
          <path d="M23 12L28 10V26L23 24V12Z" fill="#d97706" stroke="#fde68a" strokeWidth="1.4" />
          <ellipse cx="28" cy="18" rx="2.2" ry="6.5" fill="#fef08a" />
          <rect x="12" y="15.5" width="7" height="2.5" rx="1" fill="#eab308" />
        </svg>
      );
    case 'torch':
      return (
        <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
          <path d="M16.5 16H19.5L18.8 31H17.2L16.5 16Z" fill="#784b2a" stroke="#a16207" strokeWidth="1.2" />
          <rect x="15.5" y="14" width="5" height="3" rx="1" fill="#451a03" />
          <path d="M18 5C21.5 9 22 12.2 18 14.5C14 12.2 14.5 9 18 5Z" fill="#f97316" />
          <path d="M18 8C19.8 10.2 20 12.2 18 13.6C16 12.2 16.2 10.2 18 8Z" fill="#fef08a" />
        </svg>
      );
    case 'compass':
      return (
        <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
          <circle cx="18" cy="19" r="10.5" fill="#0f2419" stroke="#eab308" strokeWidth="2" />
          <circle cx="18" cy="7" r="2.2" stroke="#eab308" strokeWidth="1.5" />
          <polygon points="18,11.5 21,19 18,17.5 15,19" fill="#ef4444" />
          <polygon points="18,26.5 21,19 18,20.5 15,19" fill="#cbd5e1" />
          <circle cx="18" cy="19" r="1.5" fill="#facc15" />
        </svg>
      );
    case 'fruit':
      return (
        <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
          <path d="M18 10C12.5 10 9.5 14.5 10.5 21C11.5 26 14.8 29 18 29C21.2 29 24.5 26 25.5 21C26.5 14.5 23.5 10 18 10Z" fill="#f97316" stroke="#fdba74" strokeWidth="1.4" />
          <path d="M18 10C18 7.5 20 6 22 6" stroke="#78350f" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M18 9.5C21 7 25 7.5 26.5 10C23.5 11.5 20.5 11.2 18 9.5Z" fill="#22c55e" />
        </svg>
      );
    case 'herb':
      return (
        <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
          <path d="M18 28V12" stroke="#15803d" strokeWidth="2" strokeLinecap="round" />
          <path d="M18 22C12 22 9 18 9.5 14C13.5 14 17 17 18 22Z" fill="#10b981" stroke="#6ee7b7" strokeWidth="1.2" />
          <path d="M18 19C24 19 27 15 26.5 11C22.5 11 19 14 18 19Z" fill="#10b981" stroke="#6ee7b7" strokeWidth="1.2" />
          <circle cx="18" cy="10" r="3.2" fill="#a7f3d0" />
        </svg>
      );
    case 'wood':
      return (
        <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
          <rect x="6" y="18" width="23" height="6" rx="2.5" transform="rotate(-18 6 18)" fill="#784b2a" stroke="#b45309" strokeWidth="1.3" />
          <rect x="8" y="13" width="21" height="5.5" rx="2.5" transform="rotate(14 8 13)" fill="#925e35" stroke="#d97706" strokeWidth="1.2" />
          <circle cx="26.5" cy="19.5" r="2.1" fill="#fde68a" />
        </svg>
      );
    case 'stone':
      return (
        <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
          <polygon points="10,25 7,17 13,10 23,11 28,18 24,26" fill="#64748b" stroke="#cbd5e1" strokeWidth="1.4" />
          <polygon points="13,10 19,17 28,18 23,11" fill="#94a3b8" />
          <polygon points="19,17 24,26 10,25 13,18" fill="#475569" />
        </svg>
      );
    case 'medkit':
      return (
        <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
          <rect x="6" y="10" width="24" height="19" rx="3" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
          <path d="M13 10V7.5C13 6.7 13.7 6 14.5 6H21.5C22.3 6 23 6.7 23 7.5V10" stroke="#94a3b8" strokeWidth="1.8" />
          <rect x="16" y="14" width="4" height="11" rx="1" fill="#ef4444" />
          <rect x="12.5" y="17.5" width="11" height="4" rx="1" fill="#ef4444" />
        </svg>
      );
    case 'rations':
      return (
        <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
          <rect x="7" y="11" width="11" height="17" rx="3" fill="#0284c7" stroke="#7dd3fc" strokeWidth="1.4" />
          <rect x="10.5" y="7" width="4" height="4" rx="1" fill="#94a3b8" />
          <rect x="19" y="15" width="11" height="13" rx="2" fill="#a16207" stroke="#fbbf24" strokeWidth="1.3" />
          <path d="M21 20H28" stroke="#fde68a" strokeWidth="1.4" />
        </svg>
      );
    case 'axe':
      return (
        <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
          <path d="M10 29L24 9" stroke="#925e35" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M19 8C24 8 28 11 29 16L22 18L19 8Z" fill="#cbd5e1" stroke="#f8fafc" strokeWidth="1.3" />
        </svg>
      );
    case 'sword':
      return (
        <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
          <path d="M9 27L28 8" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
          <path d="M24 7L29 7L29 12" stroke="#f8fafc" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M10 20L16 26" stroke="#eab308" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M7 29L12 24" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case 'rope':
      return (
        <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
          <ellipse cx="18" cy="18" rx="10" ry="7.5" stroke="#c29b61" strokeWidth="3.2" />
          <ellipse cx="18" cy="18" rx="6" ry="4" stroke="#eab308" strokeWidth="1.8" strokeOpacity="0.65" />
          <path d="M25 23L29 29" stroke="#c29b61" strokeWidth="2.8" strokeLinecap="round" />
        </svg>
      );
    case 'raw_meat':
      return (
        <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
          <path
            d="M8 22C7.5 16.5 12.5 10.5 19.5 9.5C25.2 8.7 29.2 12.2 28.5 17.8C27.8 23.2 22.8 27 15.5 27.5C11.2 27.8 8.3 25.3 8 22Z"
            fill="#b91c1c"
            stroke="#fca5a5"
            strokeWidth="1.4"
          />
          <path
            d="M14.5 14C17.5 13 21.5 14 23.5 16.5"
            stroke="#fee2e2"
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.85"
          />
          <circle cx="13.5" cy="21.5" r="2.8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
          <circle cx="13.5" cy="21.5" r="1.1" fill="#e2e8f0" />
        </svg>
      );
    case 'cooked_meat':
      return (
        <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
          <path
            d="M8 23C7.5 17.5 12.5 11.5 19.5 10.5C25.2 9.7 29.2 13.2 28.5 18.8C27.8 24.2 22.8 28 15.5 28.5C11.2 28.8 8.3 26.3 8 23Z"
            fill="#7c2d12"
            stroke="#fdba74"
            strokeWidth="1.4"
          />
          <path d="M13 15L17 23" stroke="#451a03" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M18 13.5L22 22" stroke="#451a03" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M23 14.5L25.5 19.5" stroke="#451a03" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M15 8C14.5 6.3 15.8 5.2 15.2 3.8" stroke="#fed7aa" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M21 7.5C20.5 5.8 21.8 4.8 21.2 3.4" stroke="#fed7aa" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="13.2" cy="22.5" r="2.6" fill="#fef3c7" stroke="#d97706" strokeWidth="1.1" />
        </svg>
      );
    case 'sweet_berry':
      return (
        <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
          <path d="M18 13C15.5 9.5 11.5 9 9.5 11.5C12.5 13 15.5 13.5 18 13Z" fill="#22c55e" />
          <path d="M18 13C20.5 9.5 24.5 9 26.5 11.5C23.5 13 20.5 13.5 18 13Z" fill="#16a34a" />
          <circle cx="14" cy="19" r="5" fill="#e11d48" stroke="#fda4af" strokeWidth="1.2" />
          <circle cx="22" cy="19" r="5" fill="#be123c" stroke="#fda4af" strokeWidth="1.2" />
          <circle cx="18" cy="24.5" r="5.2" fill="#f43f5e" stroke="#fecdd3" strokeWidth="1.2" />
          <circle cx="16.5" cy="23" r="1.2" fill="#ffe4e6" />
          <circle cx="12.5" cy="17.5" r="1.1" fill="#ffe4e6" />
        </svg>
      );
  }
};

export const InventoryModal: React.FC<InventoryModalProps> = ({
  language,
  inventory,
  lightEnabled,
  onUseItem,
  onEquipItem,
  onCraftTorch,
  onCraftBandage,
  onCraftCampfire,
  onClose,
}) => {
  const [selectedId, setSelectedId] = useState<InventoryItemId | null>(
    inventory[0]?.id ?? null,
  );

  const t = getTranslator(language);
  const isRtl = language === 'ar';

  useEffect(() => {
    if (selectedId && inventory.some((s) => s.id === selectedId)) return;
    setSelectedId(inventory[0]?.id ?? null);
  }, [inventory, selectedId]);

  const selectedSlot = inventory.find((s) => s.id === selectedId) ?? null;
  const selectedDef = selectedSlot ? INVENTORY_CATALOG[selectedSlot.id] : null;
  const selectedText = selectedSlot ? t.inventory.items[selectedSlot.id] : null;

  const woodCount = inventory.find((s) => s.id === 'wood')?.quantity ?? 0;
  const stoneCount = inventory.find((s) => s.id === 'stone')?.quantity ?? 0;
  const canCraftTorch = woodCount >= 2 && stoneCount >= 1;
  const canCraftCampfire = woodCount >= 2 && stoneCount >= 2;

  const herbCount = inventory.find((s) => s.id === 'herb')?.quantity ?? 0;
  const ropeCount = inventory.find((s) => s.id === 'rope')?.quantity ?? 0;
  const canCraftBandage = herbCount >= 1 && ropeCount >= 1;

  const totalGridSlots = Math.max(MIN_GRID_SLOTS, Math.ceil(inventory.length / 4) * 4);
  const emptySlotCount = Math.max(0, totalGridSlots - inventory.length);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-2.5 sm:p-4 bg-[#07110c]/80 pointer-events-auto"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="inventory-title"
        dir={isRtl ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[92dvh] overflow-y-auto rounded-xl bg-[#0e1f16] border border-[#cde3d1]/15 shadow-2xl p-4 sm:p-6 text-[#f2f7f2]"
      >
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10">
          <div>
            <h2 id="inventory-title" className="font-display text-lg sm:text-xl font-bold tracking-tight">
              {t.inventory.title}
            </h2>
            <p className="text-[11px] sm:text-xs text-[#9cb8a3] mt-0.5">{t.inventory.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.inventory.closeAria}
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-[#b7d0be] hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 sm:mt-5 grid grid-cols-1 min-[560px]:grid-cols-12 gap-4 sm:gap-5">
          {/* Left: Clean Item Grid + Crafting */}
          <div className="min-[560px]:col-span-7">
            <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
              {inventory.map((slot) => {
                const itemText = t.inventory.items[slot.id];
                const isSelected = selectedSlot?.id === slot.id;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setSelectedId(slot.id)}
                    aria-label={`${itemText.name} (${slot.quantity})`}
                    className={`relative min-h-[68px] sm:aspect-square rounded-lg p-1.5 sm:p-2 flex flex-col items-center justify-center transition-colors cursor-pointer border ${
                      isSelected
                        ? 'bg-[#1a3a29] border-[#eab308]'
                        : slot.equipped
                          ? 'bg-[#122a1e] border-[#eab308]/45 hover:bg-[#173526]'
                          : 'bg-[#09160f] border-white/10 hover:border-white/25 hover:bg-[#102419]'
                    }`}
                  >
                    <ItemArtwork id={slot.id} className="w-7 h-7 sm:w-9 sm:h-9" />
                    <span className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] font-medium text-[#dceadf] truncate max-w-full">
                      {itemText.name.split(' ')[0]}
                    </span>
                    <span className="absolute top-1 right-1.5 font-mono-tabular text-[10px] sm:text-[11px] font-bold text-[#facc15]">
                      {slot.quantity}
                    </span>
                    {slot.equipped && (
                      <span className="text-[9px] font-semibold tracking-wide text-[#a7f3d0] leading-none mt-0.5">
                        {t.inventory.inUse}
                      </span>
                    )}
                  </button>
                );
              })}

              {Array.from({ length: emptySlotCount }).map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  aria-hidden="true"
                  className="min-h-[68px] sm:aspect-square rounded-lg bg-[#08130d]/60 border border-dashed border-white/10 flex items-center justify-center"
                >
                  <span className="text-[10px] sm:text-[11px] text-white/15">
                    {t.inventory.emptySlot}
                  </span>
                </div>
              ))}
            </div>

            {/* Crafting Strips */}
            <div className="mt-4 space-y-2.5">
              {/* Campfire Crafting (ONLY via Inventory) */}
              <div className="rounded-lg bg-[#08130d] border border-[#f59e0b]/25 p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#f3f7f2]">
                    <Flame className="w-4 h-4 text-[#facc15] shrink-0" />
                    <span>{t.inventory.craftCampfireTitle}</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-[#9cb8a3] mt-0.5 font-mono-tabular">
                    {t.inventory.woodShort} {woodCount}/2 · {t.inventory.stoneShort} {stoneCount}/2
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!canCraftCampfire}
                  onClick={onCraftCampfire}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                    canCraftCampfire
                      ? 'bg-[#eab308] hover:bg-[#facc15] text-[#0c1a12] cursor-pointer'
                      : 'bg-white/8 text-[#7d9783] cursor-not-allowed'
                  }`}
                >
                  {t.inventory.craftCampfireBtn}
                </button>
              </div>

              <div className="rounded-lg bg-[#08130d] border border-white/10 p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#f3f7f2]">
                    <Flame className="w-4 h-4 text-[#f97316] shrink-0" />
                    <span>{t.inventory.craftTorchTitle}</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-[#9cb8a3] mt-0.5 font-mono-tabular">
                    {t.inventory.woodShort} {woodCount}/2 · {t.inventory.stoneShort} {stoneCount}/1
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!canCraftTorch}
                  onClick={onCraftTorch}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                    canCraftTorch
                      ? 'bg-[#f97316] hover:bg-[#fb923c] text-[#0c1a12] cursor-pointer'
                      : 'bg-white/8 text-[#7d9783] cursor-not-allowed'
                  }`}
                >
                  {t.inventory.craftTorchBtn}
                </button>
              </div>

              <div className="rounded-lg bg-[#08130d] border border-white/10 p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#f3f7f2]">
                    <HeartPulse className="w-4 h-4 text-[#34d399] shrink-0" />
                    <span>{t.inventory.craftBandageTitle}</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-[#9cb8a3] mt-0.5 font-mono-tabular">
                    {t.inventory.herbShort} {herbCount}/1 · {t.inventory.ropeShort} {ropeCount}/1
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!canCraftBandage}
                  onClick={onCraftBandage}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                    canCraftBandage
                      ? 'bg-[#10b981] hover:bg-[#34d399] text-[#061810] cursor-pointer'
                      : 'bg-white/8 text-[#7d9783] cursor-not-allowed'
                  }`}
                >
                  {t.inventory.craftBandageBtn}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Selected Item Details */}
          <div className="min-[560px]:col-span-5 rounded-lg bg-[#08130d] border border-white/10 p-3.5 sm:p-4 flex flex-col justify-between">
            {selectedSlot && selectedDef && selectedText ? (
              <div>
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  <div className="w-12 h-12 rounded-lg bg-[#10251a] border border-white/10 flex items-center justify-center shrink-0">
                    <ItemArtwork id={selectedSlot.id} className="w-9 h-9" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-[#9fd4b1]">
                      {t.inventory.categories[selectedDef.category]}
                    </span>
                    <h3 className="font-display text-base font-bold text-white leading-tight">
                      {selectedText.name}
                    </h3>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-[#b7d0be]">
                  <span>{t.inventory.quantityInBag}</span>
                  <span className="font-mono-tabular font-bold text-sm text-[#facc15]">
                    {selectedSlot.quantity}
                  </span>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-[#cfe1d3]">
                  {selectedText.description}
                </p>

                {(selectedSlot.id === 'lantern' || selectedSlot.id === 'torch') &&
                  selectedSlot.equipped && (
                    <p className="mt-2.5 text-xs font-medium text-[#a7f3d0]">
                      {t.inventory.lightStatus}:{' '}
                      {lightEnabled ? t.inventory.lightOn : t.inventory.lightOff}
                    </p>
                  )}
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-[#8ea894]">
                {t.inventory.selectPrompt}
              </div>
            )}

            <div className="mt-5 pt-3 border-t border-white/10 flex flex-col gap-2">
              {selectedSlot && selectedDef?.usable && (
                <button
                  type="button"
                  onClick={() => onUseItem(selectedSlot.id)}
                  className="w-full min-h-[42px] px-4 py-2 rounded-lg bg-[#22c55e] hover:bg-[#4ade80] text-[#07180d] font-display font-bold text-sm transition-colors cursor-pointer"
                >
                  {t.inventory.useItem}
                </button>
              )}

              {selectedSlot && selectedDef?.equippable && (
                <button
                  type="button"
                  onClick={() => onEquipItem(selectedSlot.id)}
                  className={`w-full min-h-[42px] px-4 py-2 rounded-lg font-display font-bold text-sm transition-colors cursor-pointer ${
                    selectedSlot.equipped
                      ? 'bg-white/12 hover:bg-white/18 text-[#eef5ef]'
                      : 'bg-[#eab308] hover:bg-[#facc15] text-[#0c1a12]'
                  }`}
                >
                  {selectedSlot.equipped ? t.inventory.unequip : t.inventory.equip}
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full min-h-[40px] px-4 py-2 rounded-lg bg-white/8 hover:bg-white/14 text-[#d6e9da] font-medium text-xs transition-colors cursor-pointer"
              >
                {t.inventory.backToExplore}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

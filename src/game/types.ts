export type GamePhase = 'title' | 'playing' | 'paused' | 'completed' | 'fallen';

export type LanguageCode = 'pt-BR' | 'en' | 'es' | 'zh' | 'ja' | 'ar';

export type TouchControlMode = 'auto' | 'always' | 'hidden';
export type VisualQuality =
  | 'potato'
  | 'ultra-low'
  | 'low'
  | 'medium'
  | 'high'
  | 'ultra-high';
export type FpsLimit = 30 | 60 | 0; // 0 = Ilimitado
export type DayPhaseLabel = 'Amanhecer' | 'Dia' | 'Entardecer' | 'Noite';
export type DayPhaseKey = 'dawn' | 'day' | 'dusk' | 'night';
export type WeatherKey = 'clear' | 'starry' | 'mist' | 'light_rain' | 'storm';
export type LightMode = 'flashlight' | 'torch';
export type EquippedWeapon = 'none' | 'axe' | 'sword';
export type CameraMode = 'third-person' | 'first-person';
export type HudPanelPosition = 'top-left' | 'bottom-left';
export type AnimalKey = 'deer' | 'capybara' | 'macaw' | 'jaguar' | 'panther';

export type ZoneId =
  | 'cabin-trail'
  | 'cabin-stream'
  | 'cabin-north'
  | 'cabin-cedars'
  | 'cabin-abandoned'
  | 'cabin-forester'
  | 'village-nascente'
  | 'village-vale'
  | 'village-norte'
  | 'central'
  | 'ruins'
  | 'overlook'
  | 'stream'
  | 'palms'
  | 'grove'
  | 'trail'
  | 'dense_jungle';

export type HudElementId =
  | 'status'
  | 'compass'
  | 'toolbar'
  | 'fps'
  | 'joystick'
  | 'actions'
  | 'interact'
  | 'tips';

export interface HudElementConfig {
  xPct: number; // 0..100 anchor X
  yPct: number; // 0..100 anchor Y
  scale: number; // 0.65..1.45
  opacity: number; // 0.35..1.0
}

export type HudLayout = Record<HudElementId, HudElementConfig>;

export const DEFAULT_HUD_LAYOUT: HudLayout = {
  status: { xPct: 3, yPct: 3, scale: 1.0, opacity: 0.88 },
  compass: { xPct: 50, yPct: 3, scale: 1.0, opacity: 0.88 },
  toolbar: { xPct: 97, yPct: 3, scale: 1.0, opacity: 0.88 },
  fps: { xPct: 97, yPct: 17, scale: 1.0, opacity: 0.88 },
  joystick: { xPct: 4, yPct: 94, scale: 1.0, opacity: 0.88 },
  actions: { xPct: 96, yPct: 94, scale: 1.0, opacity: 0.88 },
  interact: { xPct: 50, yPct: 83, scale: 1.0, opacity: 0.92 },
  tips: { xPct: 50, yPct: 97, scale: 1.0, opacity: 0.88 },
};

export type InventoryItemId =
  | 'lantern'
  | 'compass'
  | 'torch'
  | 'medkit'
  | 'rations'
  | 'raw_meat'
  | 'cooked_meat'
  | 'sweet_berry'
  | 'axe'
  | 'sword'
  | 'rope'
  | 'fruit'
  | 'herb'
  | 'wood'
  | 'stone';

export type InventoryCategory = 'Equipamento' | 'Arma' | 'Consumível' | 'Recurso';

export interface InventoryItemDef {
  id: InventoryItemId;
  name: string;
  category: InventoryCategory;
  description: string;
  usable: boolean;
  equippable: boolean;
}

export interface InventorySlotState {
  id: InventoryItemId;
  quantity: number;
  equipped: boolean;
}

export interface GameSettings {
  language: LanguageCode;
  cameraSensitivity: number; // 0.3 to 2.5
  ambientVolume: number; // 0 to 1
  sfxVolume: number; // 0 to 1
  muted: boolean;
  invertY: boolean;
  touchControls: TouchControlMode;
  visualQuality: VisualQuality;
  fpsLimit: FpsLimit;
  showFps: boolean;
  atmosphereIntensity: number; // 0.4 to 1.4
  hudScale: number; // 0.8 to 1.25
  hudOpacity: number; // 0.45 to 1.0
  hudPosition: HudPanelPosition;
  showCompass: boolean;
  showTips: boolean;
  hudLayout: HudLayout;
}

export interface CircleCollider {
  x: number;
  z: number;
  radius: number;
  kind: 'tree' | 'rock' | 'ruin' | 'pedestal' | 'wall' | 'furniture' | 'npc';
  disabled?: boolean;
}

export interface InteractablePoint {
  id: string;
  kind: 'relic' | 'landmark' | 'gatherable';
  itemId?: InventoryItemId;
  propStyle?: 'crate';
  title: string;
  subtitle: string;
  x: number;
  z: number;
  yOffset?: number;
  radius: number;
  collected: boolean;
  pickupDelay?: number;
}

export type HudToastKind = 'relic' | 'landmark' | 'item' | 'danger' | 'hint';

export type ToastMessageKey =
  | 'expedition_started'
  | 'guide_required'
  | 'low_food'
  | 'starving'
  | 'recovered_clearing'
  | 'no_light'
  | 'used_medkit'
  | 'used_rations'
  | 'used_fruit'
  | 'used_raw_meat'
  | 'used_cooked_meat'
  | 'used_herb'
  | 'used_sweet_berry'
  | 'crafted_torch'
  | 'crafted_bandage'
  | 'crafted_campfire'
  | 'campfire_blocked'
  | 'roasted_meat'
  | 'animal_defeated'
  | 'animal_hit'
  | 'tree_felled'
  | 'rock_shattered'
  | 'relic_collected'
  | 'landmark_discovered'
  | 'item_picked_weapon'
  | 'item_picked_berry'
  | 'item_picked_generic'
  | 'night_fell'
  | 'player_hurt'
  | 'sleep_only_night'
  | 'slept_morning';

export interface HudToast {
  id: number;
  kind: HudToastKind;
  key: ToastMessageKey;
  itemId?: InventoryItemId;
  relicId?: string;
  landmarkId?: string;
  animalKey?: AnimalKey;
  resourceKind?: 'tree' | 'rock';
  damage?: number;
  hp?: number;
  maxHp?: number;
}

export type ObjectiveKey =
  | 'talk_guide'
  | 'gather_resources'
  | 'equip_weapon'
  | 'roast_meat'
  | 'prepare_night'
  | 'recover_relics'
  | 'explore_landmarks'
  | 'expedition_complete';

export interface HudObjective {
  key: ObjectiveKey;
  done?: number;
  total?: number;
}

export type TipKey =
  | 'talk_guide'
  | 'nearby_guide'
  | 'nearby_gatherable'
  | 'nearby_relic'
  | 'nearby_landmark'
  | 'nearby_campfire'
  | 'nearby_bed_night'
  | 'nearby_bed_day'
  | 'swimming'
  | 'predator_chase'
  | 'night_no_light'
  | 'start_explore'
  | 'follow_trail'
  | 'default_compass';

export interface HudTip {
  key: TipKey;
  itemId?: InventoryItemId;
}

export interface HudNearbyPrompt {
  id: string;
  kind: 'relic' | 'landmark' | 'gatherable' | 'campfire' | 'guide' | 'bed';
  itemId?: InventoryItemId;
  label: string;
  sublabel: string;
}

export interface CompassTarget {
  id: string;
  title: string;
  kind: 'relic' | 'landmark';
  angleDiffRad: number; // relative to camera look direction (-PI..PI)
  distance: number;
}

export interface CombatTargetStatus {
  kind: 'animal' | 'tree' | 'rock';
  animalKey?: AnimalKey;
  name: string;
  hp: number;
  maxHp: number;
}

export interface HudState {
  phase: GamePhase;
  cameraMode: CameraMode;
  zoneId: ZoneId;
  zoneName: string;
  weatherKey: WeatherKey;
  weatherLabel: string;
  dayPhaseKey: DayPhaseKey;
  dayPhaseLabel: DayPhaseLabel;
  timeOfDay: number; // 0..1
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  staminaExhausted: boolean;
  food: number;
  maxFood: number;
  isSwimming: boolean;
  isSleeping: boolean;
  canSleepNow: boolean;
  guideCompleted: boolean;
  guideDialogueOpen: boolean;
  lightEnabled: boolean;
  lightMode: LightMode;
  equippedWeapon: EquippedWeapon;
  sprintBoostSeconds: number;
  predatorAlert: 'none' | 'stalk' | 'chase';
  combatTarget: CombatTargetStatus | null;
  relicsCollected: number;
  relicsTotal: number;
  landmarksDiscovered: number;
  landmarksTotal: number;
  inventory: InventorySlotState[];
  nearbyPrompt: HudNearbyPrompt | null;
  activeObjective: HudObjective;
  activeTip: HudTip;
  compassTarget: CompassTarget | null;
  playerHeadingDeg: number;
  pointerLocked: boolean;
  toasts: HudToast[];
  elapsedSeconds: number;
  currentFps: number;
  webglError: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
  language: 'pt-BR',
  cameraSensitivity: 1.0,
  ambientVolume: 0.75,
  sfxVolume: 0.8,
  muted: false,
  invertY: false,
  touchControls: 'auto',
  visualQuality: 'high',
  fpsLimit: 0,
  showFps: false,
  atmosphereIntensity: 1.0,
  hudScale: 1.0,
  hudOpacity: 0.85,
  hudPosition: 'top-left',
  showCompass: true,
  showTips: true,
  hudLayout: DEFAULT_HUD_LAYOUT,
};

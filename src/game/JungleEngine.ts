import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { JungleAudioEngine } from './audio';
import { CABIN_FLOOR_THICKNESS, isInsideAnyCabin } from './cabins';
import { createExplorerCharacter, ExplorerRig } from './character';
import { buildJungleWorld, JungleWorldHandle } from './jungleWorld';
import { createProceduralTextures, ProceduralTextures } from './textures';
import {
  createInitialInteractables,
  getZoneIdAt,
  getZoneNameAt,
  groundHeightAt,
  trailFactorAt,
  WATER_LEVEL,
  WORLD_RADIUS,
} from './terrain';
import { GUIDE_NPC_POS } from './villages';
import { createWorldGatherables, createInitialInventory, INVENTORY_CATALOG } from './inventory';
import {
  AnimalKey,
  CameraMode,
  CombatTargetStatus,
  CompassTarget,
  DayPhaseKey,
  DayPhaseLabel,
  EquippedWeapon,
  GamePhase,
  GameSettings,
  HudNearbyPrompt,
  HudObjective,
  HudState,
  HudTip,
  HudToast,
  HudToastKind,
  InteractablePoint,
  InventoryItemId,
  InventorySlotState,
  LightMode,
  ToastMessageKey,
  VisualQuality,
  WeatherKey,
} from './types';
import { buildWildlifeSystem, WildlifeHandle } from './wildlife';

// Pre-allocated math helpers (Zero GC in render loop)
const _camTarget = new THREE.Vector3();
const _desiredCamPos = new THREE.Vector3();
const _lookAtPos = new THREE.Vector3();
const _titleLoopPoint = new THREE.Vector3();
const _titleLoopAhead = new THREE.Vector3();

const TITLE_TRAIL_CURVE = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(0, 0, 1.0),
    new THREE.Vector3(-8, 0, -5),
    new THREE.Vector3(-16, 0, -13),
    new THREE.Vector3(-22.5, 0, -18),
    new THREE.Vector3(-29.5, 0, -25.5),
    new THREE.Vector3(-14, 0, -33),
    new THREE.Vector3(4, 0, -34),
    new THREE.Vector3(18, 0, -33),
    new THREE.Vector3(27.5, 0, -29),
    new THREE.Vector3(22, 0, -23),
    new THREE.Vector3(17, 0, -15),
    new THREE.Vector3(9, 0, -6),
  ],
  true,
  'centripetal',
  0.5,
);
const TITLE_TRAIL_LENGTH = TITLE_TRAIL_CURVE.getLength();

const _fogColorDay = new THREE.Color(0x5c7f6c);
const _fogColorTwilight = new THREE.Color(0xb57552);
const _fogColorNight = new THREE.Color(0x071219);
const _fogColorMist = new THREE.Color(0x4b6b5d);
const _fogColorRain = new THREE.Color(0x374d52);

const _sunColorDay = new THREE.Color(0xffe19c);
const _sunColorTwilight = new THREE.Color(0xff924c);
const _moonColorNight = new THREE.Color(0x8bb6ef);
const _sunColorRain = new THREE.Color(0xa6bcc4);

const _hemiSkyDay = new THREE.Color(0x88c7b8);
const _hemiSkyTwilight = new THREE.Color(0xe39972);
const _hemiSkyNight = new THREE.Color(0x1b3456);
const _hemiSkyRain = new THREE.Color(0x617f89);

const _hemiGroundDay = new THREE.Color(0x25351b);
const _hemiGroundNight = new THREE.Color(0x07100e);
const _hemiGroundRain = new THREE.Color(0x161f17);

const _skyTintDay = new THREE.Color(0xebf2ec);
const _skyTintTwilight = new THREE.Color(0xf7a474);
const _skyTintNight = new THREE.Color(0x0f1a2b);
const _skyTintRain = new THREE.Color(0x637a84);

const _tmpColorA = new THREE.Color();
const _tmpColorB = new THREE.Color();
const _tmpColorC = new THREE.Color();

function shortestAngleDiff(current: number, target: number): number {
  let diff = ((target - current + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export class JungleEngine {
  private container: HTMLElement;
  private onHudUpdate: (hud: HudState) => void;
  private onRequestPause: () => void;
  private onToggleInventory: () => void;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private hemiLight!: THREE.HemisphereLight;
  private dirLight!: THREE.DirectionalLight;
  private rimLight!: THREE.DirectionalLight;
  private fog!: THREE.FogExp2;
  private envRT: THREE.WebGLRenderTarget | null = null;
  private textures!: ProceduralTextures;
  private character!: ExplorerRig;
  private world!: JungleWorldHandle;
  private wildlife!: WildlifeHandle;
  public readonly audio = new JungleAudioEngine();

  private isSoftwareGl = false;
  private frameId = 0;
  private disposed = false;
  private lastTime = performance.now();
  private lastRenderTime = performance.now();
  private elapsed = 0;
  private hudEmitTimer = 0;

  // FPS tracking
  private fpsFrames = 0;
  private fpsAccum = 0;
  private currentFps = 60;

  // Dynamic Day/Night Cycle & Weather state
  private timeOfDay = 0.63; // Start title in golden afternoon drifting toward sunset
  private readonly cycleDurationSeconds = 165;
  private dayPhaseKey: DayPhaseKey = 'day';
  private dayPhaseLabel: DayPhaseLabel = 'Dia';
  private nightFactor = 0;
  private weatherMist = 0.08;
  private weatherRain = 0.0;
  private targetMist = 0.12;
  private targetRain = 0.0;
  private weatherSwitchTimer = 14;
  private weatherKey: WeatherKey = 'clear';
  private weatherLabel = 'Céu Limpo';

  // Light, Combat, Campfires & Inventory state
  private lightEnabled = false;
  private lightMode: LightMode = 'flashlight';
  private nightAutoLitThisCycle = false;
  private inventory: InventorySlotState[] = createInitialInventory();
  private sprintBoostSeconds = 0;
  private inventoryOpen = false;
  private hp = 100;
  private readonly maxHp = 100;
  private stamina = 100;
  private readonly maxStamina = 100;
  private staminaExhausted = false;
  private staminaRegenDelay = 0;
  private staminaRegenStepTimer = 0;
  private staminaDrainStepTimer = 0.4;
  private food = 100;
  private readonly maxFood = 100;
  private foodDecayTimer = 120;
  private starvationHpTimer = 0;
  private lowFoodWarned = false;
  private isSwimming = false;
  private wasInWater = false;
  private swimStrokeAccum = 0;
  private guideCompleted = false;
  private guideDialogueOpen = false;
  private guideGateToastCooldown = 0;
  private equippedWeapon: EquippedWeapon = 'none';
  private attackPulse = 0;
  private attackCooldown = 0;
  private predatorAlert: 'none' | 'stalk' | 'chase' = 'none';
  private combatTarget: CombatTargetStatus | null = null;
  private combatTargetTimer = 0;
  private dropCounter = 0;
  private pendingDrops: Array<{ delay: number; item: InteractablePoint }> = [];
  private campfires: Array<{ id: string; x: number; z: number }> = [];
  private hasRoastedMeat = false;
  private sleepTimer = 0;
  private sleepSwapped = false;

  // Game state
  private phase: GamePhase = 'title';
  private settings: GameSettings;
  private currentQuality: VisualQuality;
  private interactables: InteractablePoint[] = [
    ...createInitialInteractables(),
    ...createWorldGatherables(),
  ];
  private elapsedPlaySeconds = 0;
  private toastCounter = 0;
  private toasts: Array<HudToast & { expiresAt: number }> = [];
  private webglError = false;

  // Player state
  private playerPos = new THREE.Vector3(0, 0, 2.2);
  private playerVelY = 0;
  private playerYaw = Math.PI; // facing into the jungle clearing
  private horizontalSpeed = 0;
  private isGrounded = true;
  private footstepAccum = 0;
  private interactPulse = 0;
  private readonly playerRadius = 0.42;

  // Camera state
  private cameraMode: CameraMode = 'third-person';
  private camYaw = 0.35;
  private camPitch = 0.28;
  private camDistance = 5.6;
  private targetCamDistance = 5.6;
  private responsiveDistScale = 1.0;
  private responsiveTargetHeight = 1.48;
  private smoothTarget = new THREE.Vector3(0, 1.4, 2.2);
  private smoothCamPos = new THREE.Vector3(2, 3.2, 7.5);
  private cameraShake = 0;
  private headBobPhase = 0;
  private titleOrbitAngle = 0.25;
  private titleWalkProgress = 0.02;
  private titleCamSideSmooth = 0;
  private resizeTimer: number | null = null;

  // Input state
  private heldKeys = new Set<string>();
  private pointerLocked = false;
  private mouseDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private touchLookId: number | null = null;
  private lastTouchX = 0;
  private lastTouchY = 0;
  private joystickVec = { x: 0, y: 0 };
  private touchSprint = false;

  constructor(
    container: HTMLElement,
    initialSettings: GameSettings,
    onHudUpdate: (hud: HudState) => void,
    onRequestPause: () => void,
    onToggleInventory: () => void,
  ) {
    this.container = container;
    this.settings = { ...initialSettings };
    this.currentQuality = initialSettings.visualQuality;
    this.onHudUpdate = onHudUpdate;
    this.onRequestPause = onRequestPause;
    this.onToggleInventory = onToggleInventory;

    this.audio.setSettings(
      this.settings.ambientVolume,
      this.settings.sfxVolume,
      this.settings.muted,
    );
    this.initScene();
    this.bindEvents();
    this.emitHud();
    this.scheduleNextTick();
  }

  private initScene(): void {
    this.isSoftwareGl = detectSoftwareWebGL();

    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: !this.isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      this.webglError = true;
      this.emitHud();
      return;
    }

    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x678a75);
    this.fog = new THREE.FogExp2(0x678a75, 0.0155);
    this.scene.fog = this.fog;

    this.camera = new THREE.PerspectiveCamera(56, width / height, 0.12, 210);
    this.updateResponsiveCameraMetrics();

    // Mandatory RoomEnvironment PMREM for realistic speculars on water, stone, gold & leather
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    this.scene.environment = this.envRT.texture;
    pmrem.dispose();

    // Warm/Cool 3-point Tropical Jungle Lighting
    this.hemiLight = new THREE.HemisphereLight(0x84c2b5, 0x25351b, 0.74);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xffe2a6, 2.08);
    this.dirLight.position.set(22, 34, 16);
    this.dirLight.castShadow = !this.isSoftwareGl;
    this.dirLight.shadow.mapSize.width = 1536;
    this.dirLight.shadow.mapSize.height = 1536;
    this.dirLight.shadow.camera.near = 2;
    this.dirLight.shadow.camera.far = 85;
    const d = 21;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0006;
    this.dirLight.shadow.normalBias = 0.032;
    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);

    // Subtle cool canopy rim light
    this.rimLight = new THREE.DirectionalLight(0x78c7b8, 0.42);
    this.rimLight.position.set(-18, 12, -20);
    this.scene.add(this.rimLight);

    // Procedural Textures + Explorer + Jungle World
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.textures = createProceduralTextures(maxAniso);

    this.character = createExplorerCharacter(this.textures);
    this.playerPos.set(0, groundHeightAt(0, 2.2), 2.2);
    this.character.root.position.copy(this.playerPos);
    this.character.root.rotation.y = this.playerYaw;
    this.scene.add(this.character.root);

    this.world = buildJungleWorld(
      this.textures,
      this.interactables,
      this.currentQuality,
      this.isSoftwareGl,
    );
    this.scene.add(this.world.group);

    this.wildlife = buildWildlifeSystem(this.textures);
    this.scene.add(this.wildlife.group);

    this.applyVisualQuality(this.currentQuality, false);
    this.initTitleWalkPose();

    // Pre-warm shaders on hardware WebGL
    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('orientationchange', this.handleOrientationChange);
    window.visualViewport?.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleWindowBlur);
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);

    const canvas = this.renderer?.domElement;
    if (canvas) {
      canvas.addEventListener('mousedown', this.handleMouseDown);
      window.addEventListener('mousemove', this.handleMouseMove);
      window.addEventListener('mouseup', this.handleMouseUp);
      canvas.addEventListener('wheel', this.handleWheel, { passive: false });
      canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
      canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
      canvas.addEventListener('touchend', this.handleTouchEnd);
      canvas.addEventListener('touchcancel', this.handleTouchEnd);
      canvas.addEventListener('webglcontextlost', this.handleContextLost);
      canvas.addEventListener('webglcontextrestored', this.handleContextRestored);
    }
  }

  private handleContextLost = (e: Event): void => {
    e.preventDefault();
    this.webglError = true;
    this.emitHud();
  };

  private handleContextRestored = (): void => {
    this.webglError = false;
    this.emitHud();
  };

  private getResolutionPixelRatio(quality: VisualQuality): number {
    const base = this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2);
    if (quality === 'potato') return Math.max(0.45, Math.min(base, 1.0) * 0.52);
    if (quality === 'ultra-low') return Math.max(0.55, base * 0.58);
    if (quality === 'low') return Math.max(0.68, base * 0.72);
    if (quality === 'medium') return Math.max(0.82, base * 0.86);
    if (quality === 'high') return Math.max(0.92, base * 0.95);
    return base;
  }

  private getViewDistanceForQuality(quality: VisualQuality): number {
    if (quality === 'potato') return 58;
    if (quality === 'ultra-low') return 74;
    if (quality === 'low') return 96;
    if (quality === 'medium') return 140;
    if (quality === 'high') return 185;
    return 225;
  }

  private isLowLightQuality(quality: VisualQuality): boolean {
    return quality === 'potato' || quality === 'ultra-low' || quality === 'low';
  }

  private applyVisualQuality(quality: VisualQuality, rebuildWorld: boolean): void {
    if (!this.renderer || !this.camera || !this.scene) return;

    this.currentQuality = quality;
    const isPotato = quality === 'potato';
    const isUltraLow = quality === 'ultra-low';
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);

    this.renderer.setPixelRatio(this.getResolutionPixelRatio(quality));
    this.renderer.setSize(width, height);

    const far = this.getViewDistanceForQuality(quality);
    this.camera.far = far;
    this.camera.updateProjectionMatrix();

    // Toggle Fog, Reflections & Tone Mapping for Gráfico Batata vs Normal modes
    if (isPotato) {
      this.scene.fog = null;
      this.scene.environment = null;
      this.scene.environmentIntensity = 0;
      this.renderer.toneMapping = THREE.NoToneMapping;
      this.renderer.toneMappingExposure = 1.0;
    } else {
      this.scene.fog = this.fog;
      this.scene.environment = this.envRT ? this.envRT.texture : null;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.02;
    }

    const enableShadows = !this.isSoftwareGl && !isPotato && !isUltraLow;
    this.renderer.shadowMap.enabled = enableShadows;
    this.dirLight.castShadow = enableShadows;

    const targetShadowSize =
      quality === 'ultra-high' ? 2048 : quality === 'high' ? 1536 : 1024;
    const frustumHalf =
      quality === 'ultra-high' ? 24 : quality === 'high' ? 21 : 16;
    if (this.dirLight.shadow.camera.right !== frustumHalf) {
      this.dirLight.shadow.camera.left = -frustumHalf;
      this.dirLight.shadow.camera.right = frustumHalf;
      this.dirLight.shadow.camera.top = frustumHalf;
      this.dirLight.shadow.camera.bottom = -frustumHalf;
      this.dirLight.shadow.camera.updateProjectionMatrix();
    }

    if (enableShadows && this.dirLight.shadow.mapSize.width !== targetShadowSize) {
      this.dirLight.shadow.mapSize.width = targetShadowSize;
      this.dirLight.shadow.mapSize.height = targetShadowSize;
      if (this.dirLight.shadow.map) {
        this.dirLight.shadow.map.dispose();
        this.dirLight.shadow.map = null;
      }
    }

    if (rebuildWorld) {
      this.scene.remove(this.world.group);
      this.world.dispose();
      this.world = buildJungleWorld(
        this.textures,
        this.interactables,
        this.currentQuality,
        this.isSoftwareGl,
      );
      this.scene.add(this.world.group);
      this.world.setGuideCompleted(this.guideCompleted);
      for (let i = 0; i < this.campfires.length; i++) {
        const cf = this.campfires[i];
        this.world.spawnCampfire(cf.x, cf.z);
      }
    }

    this.character?.setPotatoMode(isPotato);
    this.wildlife?.setPotatoMode(isPotato);
    this.character?.setLightState(
      this.lightEnabled,
      this.lightMode,
      this.isLowLightQuality(this.currentQuality),
    );
    this.updateDayNightAndWeather(0);
    this.renderer.shadowMap.needsUpdate = true;
  }

  private updateResponsiveCameraMetrics(): void {
    if (!this.container) return;
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    const aspect = w / h;
    const isPortrait = aspect < 0.95;
    const isCompactLandscape = aspect >= 1.15 && h <= 540;

    let targetFov = 56;
    if (isPortrait) {
      targetFov = THREE.MathUtils.clamp(56 + (0.95 - aspect) * 26, 56, 70);
    } else if (aspect > 1.45) {
      targetFov = THREE.MathUtils.clamp(56 - (aspect - 1.45) * 10, 45, 56);
    }

    if (isCompactLandscape) {
      this.responsiveDistScale = THREE.MathUtils.clamp(0.68 + (h - 340) * 0.00085, 0.66, 0.84);
      this.responsiveTargetHeight = 1.32;
    } else if (isPortrait) {
      this.responsiveDistScale = 0.92;
      this.responsiveTargetHeight = 1.42;
    } else {
      this.responsiveDistScale = 1.0;
      this.responsiveTargetHeight = 1.48;
    }

    if (this.camera) {
      this.camera.aspect = aspect;
      this.camera.fov = targetFov;
      this.camera.updateProjectionMatrix();
    }
  }

  private handleOrientationChange = (): void => {
    this.handleResize();
    if (this.resizeTimer !== null) {
      window.clearTimeout(this.resizeTimer);
    }
    this.resizeTimer = window.setTimeout(() => {
      this.resizeTimer = null;
      this.handleResize();
    }, 150);
  };

  public syncViewportSize(): void {
    this.handleResize();
  }

  private handleResize = (): void => {
    if (!this.renderer || !this.camera) return;
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.updateResponsiveCameraMetrics();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.getResolutionPixelRatio(this.currentQuality));
  };

  private handleWindowBlur = (): void => {
    this.heldKeys.clear();
    this.mouseDragging = false;
    this.touchLookId = null;
    this.joystickVec = { x: 0, y: 0 };
  };

  private handlePointerLockChange = (): void => {
    this.pointerLocked = document.pointerLockElement === this.renderer?.domElement;
    this.emitHud();
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (this.phase === 'playing') {
      if (this.guideDialogueOpen) {
        return;
      }
      if (e.code === 'KeyI' || e.code === 'Tab') {
        e.preventDefault();
        this.onToggleInventory();
        return;
      }
      if (this.inventoryOpen) {
        if (e.code === 'Escape') {
          e.preventDefault();
          this.onToggleInventory();
        }
        return;
      }
      if (e.code === 'Escape') {
        e.preventDefault();
        this.exitPointerLock();
        this.onRequestPause();
        return;
      }
      if (e.code === 'KeyE') {
        e.preventDefault();
        this.triggerInteract();
        return;
      }
      if (e.code === 'KeyF') {
        e.preventDefault();
        this.toggleLight();
        return;
      }
      if (e.code === 'KeyV') {
        e.preventDefault();
        this.toggleCameraMode();
        return;
      }
      if (e.code === 'KeyQ') {
        e.preventDefault();
        this.triggerAttack();
        return;
      }
      if (e.code === 'KeyR') {
        e.preventDefault();
        this.useSweetBerryQuick();
        return;
      }
      if (e.code === 'Space' && !this.heldKeys.has('Space')) {
        e.preventDefault();
        this.tryJump();
      }
      this.heldKeys.add(e.code);
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.heldKeys.delete(e.code);
  };

  private handleMouseDown = (e: MouseEvent): void => {
    if (this.phase !== 'playing' || this.inventoryOpen || this.guideDialogueOpen) return;
    this.audio.unlock();

    if (e.button === 0 && this.pointerLocked) {
      this.triggerAttack();
      return;
    }

    this.mouseDragging = true;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;

    // Request pointer lock on click for seamless 360° mouselook
    if (e.button === 0 && !this.pointerLocked && this.renderer?.domElement.requestPointerLock) {
      try {
        const res = this.renderer.domElement.requestPointerLock() as unknown as Promise<void> | void;
        if (res && typeof (res as Promise<void>).catch === 'function') {
          (res as Promise<void>).catch(() => {
            // Pointer lock may be blocked in some iframes; mouse-drag fallback works seamlessly
          });
        }
      } catch {
        // Fallback drag remains active
      }
    }
  };

  private handleMouseMove = (e: MouseEvent): void => {
    if (this.phase !== 'playing' || this.inventoryOpen) return;
    let dx = 0;
    let dy = 0;

    if (this.pointerLocked) {
      dx = e.movementX;
      dy = e.movementY;
    } else if (this.mouseDragging) {
      dx = e.clientX - this.lastMouseX;
      dy = e.clientY - this.lastMouseY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    } else {
      return;
    }

    const sens = 0.0032 * this.settings.cameraSensitivity;
    const ySign = this.settings.invertY ? -1 : 1;
    const minPitch = this.cameraMode === 'first-person' ? -0.95 : -0.3;
    const maxPitch = this.cameraMode === 'first-person' ? 0.92 : 1.08;
    this.camYaw -= dx * sens;
    this.camPitch = THREE.MathUtils.clamp(this.camPitch + dy * sens * ySign, minPitch, maxPitch);
  };

  private handleMouseUp = (): void => {
    this.mouseDragging = false;
  };

  private handleWheel = (e: WheelEvent): void => {
    if (this.phase !== 'playing') return;
    e.preventDefault();
    if (this.cameraMode === 'first-person') {
      if (e.deltaY > 0) {
        this.targetCamDistance = 4.2;
        this.setCameraMode('third-person', false);
      }
      return;
    }

    const nextDist = this.targetCamDistance + e.deltaY * 0.004;
    if (nextDist < 2.95) {
      this.setCameraMode('first-person', false);
      return;
    }
    this.targetCamDistance = THREE.MathUtils.clamp(nextDist, 3.2, 9.4);
  };

  private handleTouchStart = (e: TouchEvent): void => {
    if (this.phase !== 'playing') return;
    this.audio.unlock();
    if (this.touchLookId === null && e.changedTouches.length > 0) {
      const t = e.changedTouches[0];
      this.touchLookId = t.identifier;
      this.lastTouchX = t.clientX;
      this.lastTouchY = t.clientY;
    }
  };

  private handleTouchMove = (e: TouchEvent): void => {
    if (this.phase !== 'playing' || this.touchLookId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === this.touchLookId) {
        e.preventDefault();
        const dx = t.clientX - this.lastTouchX;
        const dy = t.clientY - this.lastTouchY;
        this.lastTouchX = t.clientX;
        this.lastTouchY = t.clientY;

        const sens = 0.0052 * this.settings.cameraSensitivity;
        const ySign = this.settings.invertY ? -1 : 1;
        const minPitch = this.cameraMode === 'first-person' ? -0.95 : -0.3;
        const maxPitch = this.cameraMode === 'first-person' ? 0.92 : 1.08;
        this.camYaw -= dx * sens;
        this.camPitch = THREE.MathUtils.clamp(this.camPitch + dy * sens * ySign, minPitch, maxPitch);
        break;
      }
    }
  };

  private handleTouchEnd = (e: TouchEvent): void => {
    if (this.touchLookId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this.touchLookId) {
        this.touchLookId = null;
        break;
      }
    }
  };

  // Public API for React UI
  public setPhase(nextPhase: GamePhase): void {
    this.phase = nextPhase;
    if (nextPhase !== 'playing') {
      this.inventoryOpen = false;
      this.heldKeys.clear();
      this.mouseDragging = false;
      this.joystickVec = { x: 0, y: 0 };
      this.exitPointerLock();
      if (nextPhase === 'title') {
        this.character?.setFirstPersonMode(false);
        this.character?.setLightAimPitch(0, false);
        this.initTitleWalkPose();
      }
    } else {
      this.audio.unlock();
      this.character?.setFirstPersonMode(this.cameraMode === 'first-person');
    }
    this.emitHud();
  }

  public setCameraMode(mode: CameraMode, _notify = true): void {
    if (this.cameraMode === mode) return;
    this.cameraMode = mode;
    if (mode === 'first-person') {
      this.camPitch = THREE.MathUtils.clamp(this.camPitch, -0.8, 0.75);
      this.playerYaw = Math.atan2(-Math.sin(this.camYaw), -Math.cos(this.camYaw));
      if (this.character) {
        this.character.root.rotation.y = this.playerYaw;
        this.character.setFirstPersonMode(true);
        this.character.setLightAimPitch(this.camPitch, true);
      }
    } else {
      this.camPitch = THREE.MathUtils.clamp(this.camPitch, -0.25, 0.95);
      if (this.character) {
        this.character.setFirstPersonMode(false);
        this.character.setLightAimPitch(this.camPitch, false);
      }
      if (this.targetCamDistance < 3.4) {
        this.targetCamDistance = 4.8;
      }
    }
    this.emitHud();
  }

  public toggleCameraMode(): void {
    if (this.phase !== 'playing') return;
    this.audio.unlock();
    this.audio.playUiClick();
    this.setCameraMode(
      this.cameraMode === 'third-person' ? 'first-person' : 'third-person',
      false,
    );
  }

  public setInventoryOpen(open: boolean): void {
    this.inventoryOpen = open;
    if (open) {
      this.heldKeys.clear();
      this.mouseDragging = false;
      this.joystickVec = { x: 0, y: 0 };
      this.exitPointerLock();
    }
    this.emitHud();
  }

  public startNewExpedition(): void {
    this.audio.unlock();
    this.world.clearDynamicVisuals();
    this.campfires = [];
    this.hasRoastedMeat = false;
    this.interactables = [...createInitialInteractables(), ...createWorldGatherables()];
    this.world.resetVisuals(this.interactables);
    this.wildlife.reset();
    this.inventory = createInitialInventory();
    this.sprintBoostSeconds = 0;
    this.inventoryOpen = false;
    this.hp = this.maxHp;
    this.stamina = this.maxStamina;
    this.staminaExhausted = false;
    this.staminaRegenDelay = 0;
    this.staminaRegenStepTimer = 0;
    this.staminaDrainStepTimer = 0.4;
    this.food = this.maxFood;
    this.foodDecayTimer = 120;
    this.starvationHpTimer = 0;
    this.lowFoodWarned = false;
    this.isSwimming = false;
    this.wasInWater = false;
    this.swimStrokeAccum = 0;
    this.guideCompleted = false;
    this.guideDialogueOpen = false;
    this.guideGateToastCooldown = 0;
    this.world.setGuideCompleted(false);
    this.pendingDrops = [];
    this.equippedWeapon = 'none';
    this.attackPulse = 0;
    this.attackCooldown = 0;
    this.predatorAlert = 'none';
    this.combatTarget = null;
    this.combatTargetTimer = 0;
    this.timeOfDay = 0.36;
    this.sleepTimer = 0;
    this.sleepSwapped = false;
    this.nightAutoLitThisCycle = false;
    this.lightMode = 'flashlight';
    this.lightEnabled = false;
    this.character.setLightState(false, this.lightMode, this.isLowLightQuality(this.currentQuality));
    this.character.setWeaponState('none');
    this.character.setFirstPersonMode(this.cameraMode === 'first-person');

    this.playerPos.set(0, groundHeightAt(0, 2.2), 2.2);
    this.playerVelY = 0;
    this.playerYaw = Math.PI;
    this.camYaw = 0.15;
    this.camPitch = 0.28;
    this.targetCamDistance = 5.6;
    this.elapsedPlaySeconds = 0;
    this.toasts = [];
    this.character.root.position.copy(this.playerPos);
    this.character.root.rotation.y = this.playerYaw;
    this.character.setLightAimPitch(this.camPitch, this.cameraMode === 'first-person');
    this.smoothTarget.set(this.playerPos.x, this.playerPos.y + 1.45, this.playerPos.z);
    this.smoothCamPos.set(
      this.playerPos.x + Math.sin(this.camYaw) * 5.2,
      this.playerPos.y + 2.9,
      this.playerPos.z + Math.cos(this.camYaw) * 5.2,
    );
    this.phase = 'playing';
    this.pushToast('hint', 'expedition_started');
    this.emitHud();
  }

  public finishGuideDialogue(): void {
    this.audio.unlock();
    this.audio.playNpcChime();
    this.guideCompleted = true;
    this.guideDialogueOpen = false;
    this.world.setGuideCompleted(true);
    this.pushToast('hint', 'expedition_started');
    this.emitHud();
  }

  public respawnAtClearing(): void {
    this.audio.unlock();
    this.hp = this.maxHp;
    this.stamina = this.maxStamina;
    this.staminaExhausted = false;
    this.staminaRegenDelay = 0;
    this.staminaRegenStepTimer = 0;
    this.staminaDrainStepTimer = 0.4;
    this.food = Math.max(this.food, 60);
    this.foodDecayTimer = 120;
    this.starvationHpTimer = 0;
    this.lowFoodWarned = false;
    this.isSwimming = false;
    this.wasInWater = false;
    this.predatorAlert = 'none';
    this.attackCooldown = 0;
    this.attackPulse = 0;
    if (this.nightFactor > 0.35) {
      this.timeOfDay = 0.32;
      this.nightAutoLitThisCycle = false;
    }
    this.wildlife.reset();
    this.playerPos.set(0, groundHeightAt(0, 2.2), 2.2);
    this.playerVelY = 0;
    this.horizontalSpeed = 0;
    this.isGrounded = true;
    this.character.root.position.copy(this.playerPos);
    this.smoothTarget.set(this.playerPos.x, this.playerPos.y + 1.45, this.playerPos.z);
    this.phase = 'playing';
    this.pushToast('hint', 'recovered_clearing');
    this.emitHud();
  }

  public updateSettings(next: GameSettings): void {
    const qualityChanged = next.visualQuality !== this.currentQuality;
    this.settings = { ...next };
    this.audio.setSettings(
      this.settings.ambientVolume,
      this.settings.sfxVolume,
      this.settings.muted,
    );

    if (qualityChanged) {
      this.applyVisualQuality(next.visualQuality, true);
    }
    this.emitHud();
  }

  public toggleLight(): void {
    if (this.phase !== 'playing') return;
    this.audio.unlock();

    const equippedTorch = this.inventory.find((s) => s.id === 'torch' && s.equipped && s.quantity > 0);
    const equippedLantern = this.inventory.find((s) => s.id === 'lantern' && s.equipped && s.quantity > 0);
    const ownedLantern = this.inventory.find((s) => s.id === 'lantern' && s.quantity > 0);
    const ownedTorch = this.inventory.find((s) => s.id === 'torch' && s.quantity > 0);

    if (!equippedTorch && !equippedLantern) {
      if (ownedTorch) {
        ownedTorch.equipped = true;
        this.lightMode = 'torch';
      } else if (ownedLantern) {
        ownedLantern.equipped = true;
        this.lightMode = 'flashlight';
      } else {
        this.pushToast('hint', 'no_light');
        this.emitHud();
        return;
      }
      this.lightEnabled = true;
    } else {
      this.lightMode = equippedTorch ? 'torch' : 'flashlight';
      this.lightEnabled = !this.lightEnabled;
    }

    this.character.setLightState(
      this.lightEnabled,
      this.lightMode,
      this.isLowLightQuality(this.currentQuality),
    );
    this.audio.playToggleLight(this.lightEnabled);
    this.emitHud();
  }

  public useInventoryItem(id: InventoryItemId): void {
    const def = INVENTORY_CATALOG[id];
    if (!def.usable) return;
    const slot = this.inventory.find((s) => s.id === id && s.quantity > 0);
    if (!slot) return;

    slot.quantity -= 1;
    if (slot.quantity <= 0) {
      this.inventory = this.inventory.filter((s) => s.id !== id);
    }

    this.audio.unlock();
    this.audio.playUseConsumable();

    if (id === 'medkit') {
      this.hp = Math.min(this.maxHp, this.hp + 45);
      this.world.spawnBurst(this.playerPos.x, this.playerPos.y + 1.2, this.playerPos.z, 0xf87171, 18);
      this.pushToast('item', 'used_medkit');
    } else if (id === 'rations') {
      this.hp = Math.min(this.maxHp, this.hp + 25);
      this.stamina = Math.min(this.maxStamina, this.stamina + 40);
      this.food = Math.min(this.maxFood, this.food + 40);
      if (this.stamina >= 20) this.staminaExhausted = false;
      this.sprintBoostSeconds = Math.max(this.sprintBoostSeconds, 14);
      this.world.spawnBurst(this.playerPos.x, this.playerPos.y + 1.2, this.playerPos.z, 0x38bdf8, 16);
      this.pushToast('item', 'used_rations');
    } else if (id === 'fruit') {
      this.hp = Math.min(this.maxHp, this.hp + 12);
      this.stamina = Math.min(this.maxStamina, this.stamina + 20);
      this.food = Math.min(this.maxFood, this.food + 25);
      if (this.stamina >= 20) this.staminaExhausted = false;
      this.sprintBoostSeconds = Math.max(this.sprintBoostSeconds, 14);
      this.world.spawnBurst(this.playerPos.x, this.playerPos.y + 1.2, this.playerPos.z, 0xfb923c, 16);
      this.pushToast('item', 'used_fruit');
    } else if (id === 'raw_meat') {
      this.hp = Math.min(this.maxHp, this.hp + 30);
      this.stamina = Math.min(this.maxStamina, this.stamina + 20);
      this.food = Math.min(this.maxFood, this.food + 20);
      if (this.stamina >= 20) this.staminaExhausted = false;
      this.sprintBoostSeconds = Math.max(this.sprintBoostSeconds, 12);
      this.world.spawnBurst(this.playerPos.x, this.playerPos.y + 1.2, this.playerPos.z, 0xf87171, 16);
      this.pushToast('item', 'used_raw_meat');
    } else if (id === 'cooked_meat') {
      this.hp = Math.min(this.maxHp, this.hp + 55);
      this.stamina = Math.min(this.maxStamina, this.stamina + 60);
      this.food = Math.min(this.maxFood, this.food + 55);
      if (this.stamina >= 20) this.staminaExhausted = false;
      this.sprintBoostSeconds = Math.max(this.sprintBoostSeconds, 20);
      this.world.spawnBurst(this.playerPos.x, this.playerPos.y + 1.2, this.playerPos.z, 0xf59e0b, 20);
      this.pushToast('item', 'used_cooked_meat');
    } else if (id === 'herb') {
      this.hp = Math.min(this.maxHp, this.hp + 18);
      this.stamina = Math.min(this.maxStamina, this.stamina + 20);
      this.food = Math.min(this.maxFood, this.food + 10);
      if (this.stamina >= 20) this.staminaExhausted = false;
      this.sprintBoostSeconds = Math.max(this.sprintBoostSeconds, 10);
      this.world.spawnBurst(this.playerPos.x, this.playerPos.y + 1.2, this.playerPos.z, 0x34d399, 16);
      this.pushToast('item', 'used_herb');
    } else if (id === 'sweet_berry') {
      this.hp = Math.min(this.maxHp, this.hp + 18);
      this.stamina = Math.min(this.maxStamina, this.stamina + 40);
      this.food = Math.min(this.maxFood, this.food + 20);
      if (this.stamina >= 20) this.staminaExhausted = false;
      this.sprintBoostSeconds = Math.max(this.sprintBoostSeconds, 12);
      this.world.spawnBurst(this.playerPos.x, this.playerPos.y + 1.2, this.playerPos.z, 0xf43f5e, 18);
      this.pushToast('item', 'used_sweet_berry');
    }

    if (this.food > 20) {
      this.lowFoodWarned = false;
    }

    this.emitHud();
  }

  public useSweetBerryQuick(): void {
    if (this.phase !== 'playing') return;
    const slot = this.inventory.find((s) => s.id === 'sweet_berry' && s.quantity > 0);
    if (!slot) return;
    this.useInventoryItem('sweet_berry');
  }

  public equipInventoryItem(id: InventoryItemId): void {
    const def = INVENTORY_CATALOG[id];
    if (!def.equippable) return;
    const slot = this.inventory.find((s) => s.id === id && s.quantity > 0);
    if (!slot) return;

    this.audio.unlock();

    if (id === 'lantern' || id === 'torch') {
      if (slot.equipped) {
        slot.equipped = false;
        this.lightEnabled = false;
        this.audio.playToggleLight(false);
      } else {
        this.inventory.forEach((s) => {
          if (s.id === 'lantern' || s.id === 'torch') {
            s.equipped = s.id === id;
          }
        });
        this.lightMode = id === 'torch' ? 'torch' : 'flashlight';
        this.lightEnabled = true;
        this.audio.playToggleLight(true);
      }
      this.character.setLightState(
        this.lightEnabled,
        this.lightMode,
        this.isLowLightQuality(this.currentQuality),
      );
    } else if (id === 'axe' || id === 'sword') {
      if (slot.equipped) {
        slot.equipped = false;
        this.equippedWeapon = 'none';
      } else {
        this.inventory.forEach((s) => {
          if (s.id === 'axe' || s.id === 'sword') {
            s.equipped = s.id === id;
          }
        });
        this.equippedWeapon = id;
      }
      this.character.setWeaponState(this.equippedWeapon);
      this.audio.playUiClick();
    } else {
      slot.equipped = !slot.equipped;
      this.audio.playUiClick();
    }

    this.emitHud();
  }

  public craftTorch(): void {
    const woodSlot = this.inventory.find((s) => s.id === 'wood');
    const stoneSlot = this.inventory.find((s) => s.id === 'stone');
    if (!woodSlot || woodSlot.quantity < 2 || !stoneSlot || stoneSlot.quantity < 1) {
      return;
    }

    woodSlot.quantity -= 2;
    stoneSlot.quantity -= 1;
    this.inventory = this.inventory.filter((s) => s.quantity > 0);

    let torchSlot = this.inventory.find((s) => s.id === 'torch');
    if (torchSlot) {
      torchSlot.quantity += 1;
    } else {
      torchSlot = { id: 'torch', quantity: 1, equipped: false };
      this.inventory.push(torchSlot);
    }

    // Equip newly crafted torch immediately
    this.inventory.forEach((s) => {
      if (s.id === 'lantern' || s.id === 'torch') {
        s.equipped = s.id === 'torch';
      }
    });
    this.lightMode = 'torch';
    this.lightEnabled = true;
    this.character.setLightState(true, 'torch', this.isLowLightQuality(this.currentQuality));

    this.audio.unlock();
    this.audio.playUseConsumable();
    this.world.spawnBurst(this.playerPos.x, this.playerPos.y + 1.2, this.playerPos.z, 0xf59e0b, 18);
    this.pushToast('item', 'crafted_torch');
    this.emitHud();
  }

  public craftBandage(): void {
    const herbSlot = this.inventory.find((s) => s.id === 'herb');
    const ropeSlot = this.inventory.find((s) => s.id === 'rope');
    if (!herbSlot || herbSlot.quantity < 1 || !ropeSlot || ropeSlot.quantity < 1) {
      return;
    }

    herbSlot.quantity -= 1;
    ropeSlot.quantity -= 1;
    this.inventory = this.inventory.filter((s) => s.quantity > 0);

    this.hp = Math.min(this.maxHp, this.hp + 35);
    this.audio.unlock();
    this.audio.playUseConsumable();
    this.world.spawnBurst(this.playerPos.x, this.playerPos.y + 1.2, this.playerPos.z, 0x34d399, 18);
    this.pushToast('item', 'crafted_bandage');
    this.emitHud();
  }

  public craftCampfire(): boolean {
    const woodSlot = this.inventory.find((s) => s.id === 'wood');
    const stoneSlot = this.inventory.find((s) => s.id === 'stone');
    if (!woodSlot || woodSlot.quantity < 2 || !stoneSlot || stoneSlot.quantity < 2) {
      return false;
    }

    const rawX = this.playerPos.x + Math.sin(this.playerYaw) * 1.65;
    const rawZ = this.playerPos.z + Math.cos(this.playerYaw) * 1.65;
    const dist = Math.hypot(rawX, rawZ);
    const maxR = WORLD_RADIUS - 14;
    const cx = dist > maxR ? (rawX / dist) * maxR : rawX;
    const cz = dist > maxR ? (rawZ / dist) * maxR : rawZ;

    if (
      isInsideAnyCabin(this.playerPos.x, this.playerPos.z) ||
      isInsideAnyCabin(cx, cz) ||
      groundHeightAt(cx, cz) < WATER_LEVEL + 0.15
    ) {
      this.audio.unlock();
      this.pushToast('hint', 'campfire_blocked');
      this.emitHud();
      return false;
    }

    woodSlot.quantity -= 2;
    stoneSlot.quantity -= 2;
    this.inventory = this.inventory.filter((s) => s.quantity > 0);

    const cf = this.world.spawnCampfire(cx, cz);
    this.campfires.push(cf);
    this.audio.unlock();
    this.audio.playCampfireLight();
    this.world.spawnBurst(cx, groundHeightAt(cx, cz) + 0.45, cz, 0xf97316, 20);
    this.pushToast('item', 'crafted_campfire');
    this.emitHud();
    return true;
  }

  public triggerAttack(): void {
    if (this.phase !== 'playing' || this.inventoryOpen || this.guideDialogueOpen || this.sleepTimer > 0 || this.attackCooldown > 0) return;
    this.audio.unlock();
    this.attackCooldown = 0.42;
    this.attackPulse = 1.0;

    // Every landed strike reduces animal HP by exact 30 points (100 -> 70 -> 40 -> 10 -> 0)
    const damage = 30;
    const range = this.equippedWeapon === 'sword' ? 3.5 : this.equippedWeapon === 'axe' ? 3.1 : 2.6;
    const heavy = this.equippedWeapon === 'axe';

    this.audio.playSwingWeapon(heavy);

    const res = this.wildlife.tryPlayerAttack(
      this.playerPos,
      this.playerYaw,
      damage,
      range,
      this.world,
      this.audio,
      heavy,
    );

    if (res.hit) {
      this.cameraShake = 0.14;
      if (res.defeated) {
        this.combatTarget = {
          kind: 'animal',
          animalKey: res.animalKey,
          name: res.animalName,
          hp: 0,
          maxHp: res.maxHp,
        };
        this.combatTargetTimer = 2.0;

        this.dropCounter += 1;
        const meatDrop: InteractablePoint = {
          id: `drop-meat-${this.dropCounter}`,
          kind: 'gatherable',
          itemId: 'raw_meat',
          title: 'Carne Crua',
          subtitle: 'Alimento obtido da caça na selva',
          x: res.dropX,
          z: res.dropZ,
          radius: 2.2,
          collected: false,
          pickupDelay: 0.65,
        };
        this.interactables.push(meatDrop);
        this.world.spawnDynamicGatherable(meatDrop);

        this.pushToast('item', 'animal_defeated', { animalKey: res.animalKey });
      } else {
        this.combatTarget = {
          kind: 'animal',
          animalKey: res.animalKey,
          name: res.animalName,
          hp: res.hp,
          maxHp: res.maxHp,
        };
        this.combatTargetTimer = 3.5;
        this.pushToast('hint', 'animal_hit', {
          animalKey: res.animalKey,
          hp: res.hp,
          maxHp: res.maxHp,
        });
      }
      this.emitHud();
      return;
    }

    // If no animal in range, strike destructible trees & rocks (-30 HP per hit)
    const propRes = this.world.tryPlayerAttackResource(
      this.playerPos,
      this.playerYaw,
      damage,
      range,
      this.audio,
      heavy,
    );
    if (propRes && propRes.hit) {
      this.cameraShake = heavy ? 0.13 : 0.09;
      this.combatTarget = {
        kind: propRes.kind,
        name: propRes.kind === 'tree' ? 'Árvore' : 'Rocha',
        hp: propRes.hp,
        maxHp: propRes.maxHp,
      };
      this.combatTargetTimer = propRes.destroyed ? 1.8 : 3.2;

      if (propRes.destroyed) {
        const dropItemId: InventoryItemId = propRes.kind === 'tree' ? 'wood' : 'stone';
        const dropTitle = propRes.kind === 'tree' ? 'Madeira Firme' : 'Pedra de Sílex';
        const dropSubtitle =
          propRes.kind === 'tree'
            ? 'Tronco cortado de árvore derrubada'
            : 'Fragmento obtido de rocha quebrada';
        const dropDelay = propRes.kind === 'tree' ? 0.85 : 0.42;

        for (let i = 0; i < propRes.dropPoints.length; i++) {
          const pt = propRes.dropPoints[i];
          this.dropCounter += 1;
          const dropPoint: InteractablePoint = {
            id: `drop-${dropItemId}-${this.dropCounter}`,
            kind: 'gatherable',
            itemId: dropItemId,
            title: dropTitle,
            subtitle: dropSubtitle,
            x: pt.x,
            z: pt.z,
            radius: 2.2,
            collected: false,
            pickupDelay: 0.45,
          };
          this.pendingDrops.push({ delay: dropDelay + i * 0.06, item: dropPoint });
        }

        this.pushToast(
          'item',
          propRes.kind === 'tree' ? 'tree_felled' : 'rock_shattered',
          { resourceKind: propRes.kind },
        );
      }
      this.emitHud();
    }
  }

  public setTouchMove(x: number, y: number, sprinting: boolean): void {
    this.joystickVec.x = x;
    this.joystickVec.y = y;
    this.touchSprint = sprinting;
  }

  public triggerJumpFromUI(): void {
    if (this.phase !== 'playing' || this.inventoryOpen || this.guideDialogueOpen) return;
    this.audio.unlock();
    this.tryJump();
  }

  private isNightForSleep(): boolean {
    return this.dayPhaseKey === 'night' || this.nightFactor >= 0.42;
  }

  public triggerInteract(): void {
    if (this.phase !== 'playing' || this.inventoryOpen || this.guideDialogueOpen || this.sleepTimer > 0) return;
    const action = this.findNearestAction();
    if (!action) return;

    if (action.kind === 'guide') {
      this.audio.unlock();
      this.audio.playNpcChime();
      this.heldKeys.clear();
      this.mouseDragging = false;
      this.joystickVec = { x: 0, y: 0 };
      this.guideDialogueOpen = true;
      this.exitPointerLock();
      this.emitHud();
      return;
    }
    if (action.kind === 'bed') {
      this.audio.unlock();
      if (!this.isNightForSleep()) {
        this.audio.playUiClick();
        this.pushToast('hint', 'sleep_only_night');
        this.emitHud();
        return;
      }
      this.heldKeys.clear();
      this.mouseDragging = false;
      this.joystickVec = { x: 0, y: 0 };
      this.sleepTimer = 1.65;
      this.sleepSwapped = false;
      this.exitPointerLock();
      this.audio.playSleepChime();
      this.emitHud();
      return;
    }
    if (action.kind === 'campfire') {
      this.roastMeatAtCampfire(action.campfire);
    } else if (!action.item.collected) {
      this.collectOrDiscover(action.item);
    }
  }

  public exitPointerLock(): void {
    if (document.pointerLockElement === this.renderer?.domElement) {
      document.exitPointerLock();
    }
  }

  private tryJump(): void {
    if (this.isGrounded && !this.isSwimming) {
      this.playerVelY = 7.0;
      this.isGrounded = false;
      this.audio.playJump();
    }
  }

  private pushToast(
    kind: HudToastKind,
    key: ToastMessageKey,
    extra?: Omit<HudToast, 'id' | 'kind' | 'key'>,
  ): void {
    this.toastCounter++;
    const toast: HudToast & { expiresAt: number } = {
      id: this.toastCounter,
      kind,
      key,
      expiresAt: this.elapsed + 4.0,
      ...extra,
    };
    this.toasts.push(toast);
    if (this.toasts.length > 3) {
      this.toasts = this.toasts.slice(-3);
    }
  }

  private addItemToInventory(itemId: InventoryItemId, amount = 1): void {
    const existing = this.inventory.find((s) => s.id === itemId);
    if (existing) {
      existing.quantity += amount;
    } else {
      this.inventory.push({ id: itemId, quantity: amount, equipped: false });
    }
  }

  private roastMeatAtCampfire(campfire: { id: string; x: number; z: number }): void {
    const meatSlot = this.inventory.find((s) => s.id === 'raw_meat' && s.quantity > 0);
    if (!meatSlot) return;

    meatSlot.quantity -= 1;
    if (meatSlot.quantity <= 0) {
      this.inventory = this.inventory.filter((s) => s.id !== 'raw_meat');
    }

    this.addItemToInventory('cooked_meat', 1);
    this.hasRoastedMeat = true;
    this.interactPulse = 1.0;
    this.audio.unlock();
    this.audio.playRoastMeat();
    this.world.spawnBurst(campfire.x, groundHeightAt(campfire.x, campfire.z) + 0.55, campfire.z, 0xfbbf24, 18);
    this.pushToast('item', 'roasted_meat', { itemId: 'cooked_meat' });
    this.emitHud();
  }

  private collectOrDiscover(item: InteractablePoint): void {
    if (item.collected) return;
    item.collected = true;
    this.interactPulse = 1.0;

    const gy = groundHeightAt(item.x, item.z);
    if (item.kind === 'relic') {
      this.cameraShake = 0.22;
      this.world.spawnBurst(item.x, gy + 1.5, item.z, 0xfacc15, 22);
      this.audio.playCollectRelic();
      this.pushToast('relic', 'relic_collected', { relicId: item.id });
    } else if (item.kind === 'landmark') {
      this.cameraShake = 0.18;
      this.world.spawnBurst(item.x, gy + 2.4, item.z, 0x38bdf8, 22);
      this.audio.playDiscoverLandmark();
      this.pushToast('landmark', 'landmark_discovered', { landmarkId: item.id });
    } else if (item.itemId) {
      this.cameraShake = 0.06;
      const burstColor =
        item.itemId === 'fruit'
          ? 0xfb923c
          : item.itemId === 'sweet_berry'
            ? 0xf43f5e
            : item.itemId === 'herb'
              ? 0x34d399
              : item.itemId === 'medkit'
                ? 0xf87171
                : item.itemId === 'rations'
                  ? 0x38bdf8
                  : item.itemId === 'axe' || item.itemId === 'sword'
                    ? 0xfbbf24
                    : item.itemId === 'raw_meat'
                      ? 0xef4444
                      : item.itemId === 'wood' || item.itemId === 'rope'
                        ? 0xd97706
                        : 0x94a3b8;
      this.world.spawnBurst(item.x, gy + (item.yOffset ?? 0) + 0.45, item.z, burstColor, 14);
      this.audio.playPickupItem();
      this.addItemToInventory(item.itemId, 1);

      // Auto-equip first picked-up weapon if empty-handed
      if ((item.itemId === 'axe' || item.itemId === 'sword') && this.equippedWeapon === 'none') {
        const wSlot = this.inventory.find((s) => s.id === item.itemId);
        if (wSlot) {
          wSlot.equipped = true;
          this.equippedWeapon = item.itemId;
          this.character.setWeaponState(this.equippedWeapon);
        }
      }

      const key: ToastMessageKey =
        item.itemId === 'axe' || item.itemId === 'sword'
          ? 'item_picked_weapon'
          : item.itemId === 'sweet_berry'
            ? 'item_picked_berry'
            : 'item_picked_generic';
      this.pushToast('item', key, { itemId: item.itemId });
    }
    this.world.markInteractableCollected(item.id, item.kind);

    const allDone = this.interactables.every((it) => it.kind === 'gatherable' || it.collected);
    if (allDone) {
      this.phase = 'completed';
      this.inventoryOpen = false;
      this.exitPointerLock();
    }
    this.emitHud();
  }

  private findNearestAction():
    | { kind: 'guide'; distSq: number }
    | { kind: 'item'; item: InteractablePoint; distSq: number }
    | { kind: 'campfire'; campfire: { id: string; x: number; z: number }; distSq: number }
    | { kind: 'bed'; bed: { id: string; x: number; z: number }; distSq: number }
    | null {
    const gdx = GUIDE_NPC_POS.x - this.playerPos.x;
    const gdz = GUIDE_NPC_POS.z - this.playerPos.z;
    const guideDistSq = gdx * gdx + gdz * gdz;
    if (guideDistSq <= 3.2 * 3.2 && !this.guideCompleted) {
      return { kind: 'guide', distSq: guideDistSq };
    }

    let bestItem: InteractablePoint | null = null;
    let bestItemDistSq = Infinity;
    for (let i = 0; i < this.interactables.length; i++) {
      const it = this.interactables[i];
      if (it.collected) continue;
      const dx = it.x - this.playerPos.x;
      const dz = it.z - this.playerPos.z;
      const dSq = dx * dx + dz * dz;
      if (dSq <= it.radius * it.radius && dSq < bestItemDistSq) {
        bestItemDistSq = dSq;
        bestItem = it;
      }
    }

    const hasRawMeat = this.inventory.some((s) => s.id === 'raw_meat' && s.quantity > 0);
    let bestCf: { id: string; x: number; z: number } | null = null;
    let bestCfDistSq = Infinity;
    if (hasRawMeat) {
      for (let i = 0; i < this.campfires.length; i++) {
        const cf = this.campfires[i];
        const dx = cf.x - this.playerPos.x;
        const dz = cf.z - this.playerPos.z;
        const dSq = dx * dx + dz * dz;
        if (dSq <= 2.7 * 2.7 && dSq < bestCfDistSq) {
          bestCfDistSq = dSq;
          bestCf = cf;
        }
      }
    }

    let bestBed: { id: string; x: number; z: number } | null = null;
    let bestBedDistSq = Infinity;
    for (let i = 0; i < this.world.bedSpots.length; i++) {
      const b = this.world.bedSpots[i];
      const dx = b.x - this.playerPos.x;
      const dz = b.z - this.playerPos.z;
      const dSq = dx * dx + dz * dz;
      if (dSq <= 2.85 * 2.85 && dSq < bestBedDistSq) {
        bestBedDistSq = dSq;
        bestBed = b;
      }
    }

    if (bestCf && (!bestItem || bestCfDistSq <= bestItemDistSq + 0.2)) {
      return { kind: 'campfire', campfire: bestCf, distSq: bestCfDistSq };
    }
    if (bestItem && (!bestBed || bestItemDistSq <= bestBedDistSq)) {
      return { kind: 'item', item: bestItem, distSq: bestItemDistSq };
    }
    if (bestBed) {
      return { kind: 'bed', bed: bestBed, distSq: bestBedDistSq };
    }
    if (guideDistSq <= 3.1 * 3.1) {
      return { kind: 'guide', distSq: guideDistSq };
    }
    return null;
  }

  private updatePlayer(dt: number): void {
    // Combine keyboard + touch joystick input
    let inX = this.joystickVec.x;
    let inZ = this.joystickVec.y;

    if (this.heldKeys.has('KeyA') || this.heldKeys.has('ArrowLeft')) inX -= 1;
    if (this.heldKeys.has('KeyD') || this.heldKeys.has('ArrowRight')) inX += 1;
    if (this.heldKeys.has('KeyW') || this.heldKeys.has('ArrowUp')) inZ -= 1;
    if (this.heldKeys.has('KeyS') || this.heldKeys.has('ArrowDown')) inZ += 1;

    const inputLen = Math.hypot(inX, inZ);
    if (inputLen > 1) {
      inX /= inputLen;
      inZ /= inputLen;
    }

    if (this.sprintBoostSeconds > 0) {
      this.sprintBoostSeconds = Math.max(0, this.sprintBoostSeconds - dt);
    }

    const hasMove = inputLen > 0.05;
    const wantsSprint =
      this.heldKeys.has('ShiftLeft') || this.heldKeys.has('ShiftRight') || this.touchSprint;
    const isActivelySprinting =
      wantsSprint && hasMove && !this.staminaExhausted && this.stamina > 0;
    const isExertingStamina = isActivelySprinting || (this.isSwimming && hasMove);

    // Stamina consumes in stepped 10-point increments while sprinting (and gently while swimming),
    // and recovers in 20-point increments up to 100 when resting or exhausted.
    if (isExertingStamina) {
      const stepPeriod = isActivelySprinting
        ? this.sprintBoostSeconds > 0
          ? 0.65
          : 0.42
        : 0.95;
      this.staminaDrainStepTimer -= dt;
      if (this.staminaDrainStepTimer <= 0) {
        this.stamina = Math.max(0, Math.round(this.stamina) - 10);
        this.staminaDrainStepTimer = stepPeriod;
        if (this.stamina <= 0) {
          this.stamina = 0;
          this.staminaExhausted = true;
          this.staminaRegenDelay = 1.25;
        }
        this.emitHud();
      }
      this.staminaRegenDelay = Math.max(this.staminaRegenDelay, 0.85);
      this.staminaRegenStepTimer = 0.55;
    } else if (this.stamina < this.maxStamina) {
      this.staminaDrainStepTimer = 0.28;
      if (this.staminaRegenDelay > 0) {
        this.staminaRegenDelay = Math.max(0, this.staminaRegenDelay - dt);
      } else {
        this.staminaRegenStepTimer -= dt;
        if (this.staminaRegenStepTimer <= 0) {
          this.stamina = Math.min(this.maxStamina, Math.round(this.stamina) + 20);
          this.staminaRegenStepTimer = 0.55;
          if (this.stamina >= 20) {
            this.staminaExhausted = false;
          }
          this.emitHud();
        }
      }
    } else {
      this.staminaDrainStepTimer = 0.28;
    }

    const boostMult = this.sprintBoostSeconds > 0 ? 1.28 : 1.0;
    const maxSpeed = this.isSwimming
      ? (isActivelySprinting ? 4.5 : 3.4) * boostMult
      : (isActivelySprinting ? 8.8 : 5.4) * boostMult;

    // Camera-relative movement direction
    const forwardX = -Math.sin(this.camYaw);
    const forwardZ = -Math.cos(this.camYaw);
    const rightX = Math.cos(this.camYaw);
    const rightZ = -Math.sin(this.camYaw);

    // Note: inZ < 0 means W/Forward
    const moveDirX = rightX * inX + forwardX * -inZ;
    const moveDirZ = rightZ * inX + forwardZ * -inZ;

    const targetSpeed = hasMove ? maxSpeed * Math.min(1, inputLen) : 0;
    this.horizontalSpeed = THREE.MathUtils.damp(
      this.horizontalSpeed,
      targetSpeed,
      hasMove ? 12 : 14,
      dt,
    );

    let animStrafeNorm = 0;
    let animForwardNorm = 1;

    if (this.cameraMode === 'first-person') {
      // Lock explorer heading directly with camera look so attacks & flashlight beam never lag
      this.playerYaw = Math.atan2(forwardX, forwardZ);
      const stepX = moveDirX * this.horizontalSpeed * dt;
      const stepZ = moveDirZ * this.horizontalSpeed * dt;
      this.playerPos.x += stepX;
      this.playerPos.z += stepZ;
      animStrafeNorm = inX;
      animForwardNorm = hasMove ? -inZ : 1;
    } else {
      if (hasMove) {
        const targetYaw = Math.atan2(moveDirX, moveDirZ);
        const turnDelta = shortestAngleDiff(this.playerYaw, targetYaw);
        this.playerYaw += turnDelta * (1 - Math.exp(-13 * dt));
        animStrafeNorm = THREE.MathUtils.clamp(turnDelta / 0.85, -1, 1);
      }
      // Apply horizontal displacement
      const stepX = Math.sin(this.playerYaw) * this.horizontalSpeed * dt;
      const stepZ = Math.cos(this.playerYaw) * this.horizontalSpeed * dt;
      this.playerPos.x += stepX;
      this.playerPos.z += stepZ;
    }

    // Sliding circle collision against trees, boulders, pedestals, ruins, village huts, fences & NPCs
    const colliders = this.world.colliders;
    for (let i = 0; i < colliders.length; i++) {
      const c = colliders[i];
      if (c.disabled) continue;
      const dx = this.playerPos.x - c.x;
      const dz = this.playerPos.z - c.z;
      const minDist = this.playerRadius + c.radius;
      const distSq = dx * dx + dz * dz;
      if (distSq < minDist * minDist) {
        const dist = Math.sqrt(distSq) || 0.001;
        const push = minDist - dist;
        this.playerPos.x += (dx / dist) * push;
        this.playerPos.z += (dz / dist) * push;
      }
    }

    // Mandatory Guide NPC gate: hold explorer inside starting clearing until speaking to Guide
    if (this.guideGateToastCooldown > 0) {
      this.guideGateToastCooldown = Math.max(0, this.guideGateToastCooldown - dt);
    }
    const distFromOrigin = Math.hypot(this.playerPos.x, this.playerPos.z);
    if (!this.guideCompleted && distFromOrigin > 10.6) {
      const clampScale = 10.6 / distFromOrigin;
      this.playerPos.x *= clampScale;
      this.playerPos.z *= clampScale;
      if (this.guideGateToastCooldown <= 0) {
        this.guideGateToastCooldown = 3.2;
        this.audio.playNpcChime();
        this.pushToast('hint', 'guide_required');
        this.emitHud();
      }
    }

    // Soft mountain rim containment
    const maxExploreRadius = WORLD_RADIUS - 12;
    if (distFromOrigin > maxExploreRadius) {
      const scale = maxExploreRadius / distFromOrigin;
      this.playerPos.x *= scale;
      this.playerPos.z *= scale;
    }

    // Vertical terrain following, wooden cabin floorboards, swimming buoyancy & jump physics
    const terrainY = groundHeightAt(this.playerPos.x, this.playerPos.z);
    const insideCabin = isInsideAnyCabin(this.playerPos.x, this.playerPos.z);
    const cabinStepY = insideCabin ? terrainY + CABIN_FLOOR_THICKNESS : terrainY;
    const waterDepth = insideCabin ? -1 : WATER_LEVEL - terrainY;
    const nowInWater = waterDepth > 0.12;
    const nowSwimming = waterDepth > 0.56;

    if (nowInWater && !this.wasInWater) {
      this.audio.playWaterSplash(nowSwimming);
      this.world.spawnBurst(
        this.playerPos.x,
        WATER_LEVEL + 0.08,
        this.playerPos.z,
        0x99f6e4,
        nowSwimming ? 12 : 6,
      );
    }
    this.wasInWater = nowInWater;
    this.isSwimming = nowSwimming;

    if (nowSwimming) {
      const swimFloatY = WATER_LEVEL - 0.88 + Math.sin(this.elapsed * 3.2) * 0.04;
      this.playerPos.y = THREE.MathUtils.damp(this.playerPos.y, swimFloatY, 8, dt);
      this.playerVelY = 0;
      this.isGrounded = true;
    } else {
      const floorY = Math.max(cabinStepY, WATER_LEVEL - 0.55);
      if (!this.isGrounded) {
        this.playerVelY -= 19.5 * dt;
        this.playerPos.y += this.playerVelY * dt;
        if (this.playerPos.y <= floorY) {
          this.playerPos.y = floorY;
          if (this.playerVelY < -4.5) {
            this.audio.playLand();
            this.cameraShake = 0.08;
          }
          this.playerVelY = 0;
          this.isGrounded = true;
        }
      } else {
        this.playerPos.y = floorY;
      }
    }

    // Footstep / Swim stroke cadence & 1st-person head-bob phase
    if (this.isGrounded && this.horizontalSpeed > 0.4) {
      this.headBobPhase += dt * (4.8 + Math.min(1.4, this.horizontalSpeed / 8.8) * 6.5);
    }
    if (this.isSwimming && this.horizontalSpeed > 0.4) {
      this.swimStrokeAccum += dt * (1.25 + this.horizontalSpeed * 0.35);
      if (this.swimStrokeAccum >= 1.0) {
        this.swimStrokeAccum = 0;
        this.audio.playSwimStroke();
        this.world.spawnBurst(this.playerPos.x, WATER_LEVEL + 0.06, this.playerPos.z, 0xbae6fd, 5);
      }
    } else if (this.isGrounded && this.horizontalSpeed > 0.8) {
      this.footstepAccum += this.horizontalSpeed * dt;
      const strideLen = isActivelySprinting ? 2.15 : 1.75;
      if (this.footstepAccum >= strideLen) {
        this.footstepAccum = 0;
        if (nowInWater) {
          this.audio.playWaterSplash(false);
          this.world.spawnBurst(this.playerPos.x, WATER_LEVEL + 0.05, this.playerPos.z, 0xbae6fd, 4);
        } else {
          const onTrail = trailFactorAt(this.playerPos.x, this.playerPos.z) > 0.35;
          this.audio.playFootstep(onTrail, isActivelySprinting);
        }
      }
    }

    // Auto-collect if player walks directly into a relic or gatherable item (respecting drop pickupDelay)
    for (let i = 0; i < this.interactables.length; i++) {
      const it = this.interactables[i];
      if (it.collected) continue;
      if (it.pickupDelay && it.pickupDelay > 0) {
        it.pickupDelay = Math.max(0, it.pickupDelay - dt);
        continue;
      }
      const dx = it.x - this.playerPos.x;
      const dz = it.z - this.playerPos.z;
      const triggerR = it.kind === 'relic' ? 1.35 : it.kind === 'gatherable' ? 1.25 : 1.75;
      if (dx * dx + dz * dz <= triggerR * triggerR) {
        this.collectOrDiscover(it);
      }
    }

    // Update 3D character mesh & animation
    if (this.interactPulse > 0) {
      this.interactPulse = Math.max(0, this.interactPulse - dt * 2.6);
    }
    if (this.attackCooldown > 0) {
      this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    }
    if (this.attackPulse > 0) {
      this.attackPulse = Math.max(0, this.attackPulse - dt * 2.6);
    }
    this.character.root.position.copy(this.playerPos);
    this.character.root.rotation.y = this.playerYaw;
    this.character.updateAnimation(
      dt,
      this.horizontalSpeed,
      8.8,
      this.isGrounded,
      this.playerVelY,
      this.interactPulse,
      this.lightEnabled,
      this.attackPulse,
      animStrafeNorm,
      animForwardNorm,
      isActivelySprinting,
      this.isSwimming,
    );
  }

  private clampCameraDistanceAgainstObstacles(
    originX: number,
    originZ: number,
    camDirX: number,
    camDirZ: number,
    desiredHorizDist: number,
  ): number {
    if (desiredHorizDist <= 0.4) return desiredHorizDist;
    let maxDist = desiredHorizDist;
    const colliders = this.world.colliders;
    const pad = 0.34;

    for (let i = 0; i < colliders.length; i++) {
      const c = colliders[i];
      if (c.disabled || c.kind === 'furniture') continue;
      const dx = c.x - originX;
      const dz = c.z - originZ;
      const proj = dx * camDirX + dz * camDirZ;
      if (proj <= 0 || proj >= maxDist) continue;
      const perpSq = dx * dx + dz * dz - proj * proj;
      const r = c.radius + pad;
      if (perpSq < r * r) {
        const hitDist = Math.max(0.55, proj - Math.sqrt(r * r - perpSq));
        if (hitDist < maxDist) {
          maxDist = hitDist;
        }
      }
    }
    return maxDist;
  }

  private initTitleWalkPose(): void {
    if (!this.character || !this.camera) return;
    TITLE_TRAIL_CURVE.getPointAt(this.titleWalkProgress % 1, _titleLoopPoint);
    TITLE_TRAIL_CURVE.getPointAt((this.titleWalkProgress + 0.018) % 1, _titleLoopAhead);
    const y = groundHeightAt(_titleLoopPoint.x, _titleLoopPoint.z);
    this.playerPos.set(_titleLoopPoint.x, y, _titleLoopPoint.z);
    this.playerYaw = Math.atan2(
      _titleLoopAhead.x - _titleLoopPoint.x,
      _titleLoopAhead.z - _titleLoopPoint.z,
    );
    this.character.root.position.copy(this.playerPos);
    this.character.root.rotation.y = this.playerYaw;

    const panAngle = this.playerYaw + Math.PI * 0.72 + Math.sin(this.titleOrbitAngle) * 0.36;
    const dist = 4.65 * this.responsiveDistScale;
    const cx = this.playerPos.x + Math.sin(panAngle) * dist;
    const cz = this.playerPos.z + Math.cos(panAngle) * dist;
    const cy = Math.max(groundHeightAt(cx, cz) + 0.85, this.playerPos.y + 1.95);
    this.smoothCamPos.set(cx, cy, cz);
    this.smoothTarget.set(this.playerPos.x, this.playerPos.y + 1.38, this.playerPos.z);
    this.camera.position.copy(this.smoothCamPos);
    this.camera.lookAt(this.smoothTarget);
  }

  private updateTitleWalk(dt: number): void {
    const walkSpeed = 2.38;
    this.titleWalkProgress = (this.titleWalkProgress + (walkSpeed * dt) / TITLE_TRAIL_LENGTH) % 1;
    TITLE_TRAIL_CURVE.getPointAt(this.titleWalkProgress, _titleLoopPoint);
    TITLE_TRAIL_CURVE.getPointAt((this.titleWalkProgress + 0.022) % 1, _titleLoopAhead);

    // Steer smoothly toward the curve point so collisions never snag the showcase walk
    const dx = _titleLoopPoint.x - this.playerPos.x;
    const dz = _titleLoopPoint.z - this.playerPos.z;
    const distToPoint = Math.hypot(dx, dz);
    if (distToPoint > 0.001) {
      const step = Math.min(distToPoint, walkSpeed * 1.35 * dt + 0.02);
      this.playerPos.x += (dx / distToPoint) * step;
      this.playerPos.z += (dz / distToPoint) * step;
    }

    // Gentle obstacle clearance around steles/boulders along the trail
    const colliders = this.world.colliders;
    for (let i = 0; i < colliders.length; i++) {
      const c = colliders[i];
      if (c.disabled) continue;
      const cdx = this.playerPos.x - c.x;
      const cdz = this.playerPos.z - c.z;
      const minDist = this.playerRadius + c.radius + 0.15;
      const distSq = cdx * cdx + cdz * cdz;
      if (distSq < minDist * minDist) {
        const dist = Math.sqrt(distSq) || 0.001;
        const push = minDist - dist;
        this.playerPos.x += (cdx / dist) * push;
        this.playerPos.z += (cdz / dist) * push;
      }
    }

    const groundY = groundHeightAt(this.playerPos.x, this.playerPos.z);
    this.playerPos.y = THREE.MathUtils.damp(this.playerPos.y, groundY, 14, dt);

    const lookDx = _titleLoopAhead.x - this.playerPos.x;
    const lookDz = _titleLoopAhead.z - this.playerPos.z;
    if (lookDx * lookDx + lookDz * lookDz > 0.01) {
      const desiredYaw = Math.atan2(lookDx, lookDz);
      this.playerYaw += shortestAngleDiff(this.playerYaw, desiredYaw) * (1 - Math.exp(-5.5 * dt));
    }

    // Auto-toggle flashlight during night phase of the live title cycle
    const shouldLight = this.nightFactor > 0.52;
    if (shouldLight !== this.lightEnabled) {
      this.lightEnabled = shouldLight;
      this.lightMode = 'flashlight';
      this.character.setLightState(
        this.lightEnabled,
        this.lightMode,
        this.isLowLightQuality(this.currentQuality),
      );
    }

    this.character.root.position.copy(this.playerPos);
    this.character.root.rotation.y = this.playerYaw;
    this.character.updateAnimation(dt, walkSpeed, 8.8, true, 0, 0, this.lightEnabled, 0);

    // Subtle exploratory head gaze scanning the canopy and trail ahead
    const exploreLookY = Math.sin(this.elapsed * 0.62) * 0.18 + Math.cos(this.elapsed * 0.31) * 0.07;
    const exploreLookX = -0.04 + Math.sin(this.elapsed * 0.45) * 0.04;
    this.character.head.rotation.y = THREE.MathUtils.damp(
      this.character.head.rotation.y,
      exploreLookY,
      3.5,
      dt,
    );
    this.character.head.rotation.x = THREE.MathUtils.damp(
      this.character.head.rotation.x,
      exploreLookX,
      3.5,
      dt,
    );
  }

  private updateCamera(dt: number): void {
    if (this.phase === 'title') {
      // Slow cinematic crane/steadicam pan following the explorer walking the trail,
      // framed slightly right-of-center so left-aligned weathered title stays unobscured.
      this.titleOrbitAngle += dt * 0.085;
      const aspect = this.container
        ? Math.max(0.5, this.container.clientWidth / Math.max(1, this.container.clientHeight))
        : 1.6;
      const panAngle = this.playerYaw + Math.PI * 0.72 + Math.sin(this.titleOrbitAngle) * 0.42;
      const desiredDist = 4.65 * this.responsiveDistScale;

      const camDirX = Math.sin(panAngle);
      const camDirZ = Math.cos(panAngle);
      const safeDist = this.clampCameraDistanceAgainstObstacles(
        this.playerPos.x,
        this.playerPos.z,
        camDirX,
        camDirZ,
        desiredDist,
      );

      const camHeightOffset = 1.72 + Math.sin(this.titleOrbitAngle * 1.4) * 0.24;
      const cx = this.playerPos.x + camDirX * safeDist;
      const cz = this.playerPos.z + camDirZ * safeDist;
      const camFloorY = groundHeightAt(cx, cz) + 0.72;
      _desiredCamPos.set(cx, Math.max(camFloorY, this.playerPos.y + camHeightOffset), cz);

      // Compute camera-left vector from (playerPos - camPos) x up to offset framing right
      const fwdX = this.playerPos.x - cx;
      const fwdZ = this.playerPos.z - cz;
      const fwdLen = Math.hypot(fwdX, fwdZ) || 1;
      const camLeftX = fwdZ / fwdLen;
      const camLeftZ = -fwdX / fwdLen;
      const targetSideBias = aspect >= 1.05 ? 0.92 : 0.14;
      this.titleCamSideSmooth = THREE.MathUtils.damp(this.titleCamSideSmooth, targetSideBias, 3.0, dt);

      _camTarget.set(
        this.playerPos.x + Math.sin(this.playerYaw) * 0.45 + camLeftX * this.titleCamSideSmooth,
        this.playerPos.y + this.responsiveTargetHeight - 0.08,
        this.playerPos.z + Math.cos(this.playerYaw) * 0.45 + camLeftZ * this.titleCamSideSmooth,
      );

      this.smoothCamPos.x = THREE.MathUtils.damp(this.smoothCamPos.x, _desiredCamPos.x, 3.2, dt);
      this.smoothCamPos.y = THREE.MathUtils.damp(this.smoothCamPos.y, _desiredCamPos.y, 3.2, dt);
      this.smoothCamPos.z = THREE.MathUtils.damp(this.smoothCamPos.z, _desiredCamPos.z, 3.2, dt);

      this.smoothTarget.x = THREE.MathUtils.damp(this.smoothTarget.x, _camTarget.x, 4.0, dt);
      this.smoothTarget.y = THREE.MathUtils.damp(this.smoothTarget.y, _camTarget.y, 4.0, dt);
      this.smoothTarget.z = THREE.MathUtils.damp(this.smoothTarget.z, _camTarget.z, 4.0, dt);

      this.camera.position.copy(this.smoothCamPos);
      this.camera.lookAt(this.smoothTarget);
      this.character.setLightAimPitch(0.28, false);
      return;
    }

    if (this.cameraMode === 'first-person') {
      const speedNorm = this.isGrounded ? Math.min(1.2, this.horizontalSpeed / 8.8) : 0;
      const bobY = Math.sin(this.headBobPhase * 2) * 0.032 * speedNorm;
      const eyeX = this.playerPos.x;
      const eyeY = this.playerPos.y + 1.62 + bobY;
      const eyeZ = this.playerPos.z;

      this.camera.position.set(eyeX, eyeY, eyeZ);

      if (this.cameraShake > 0.001) {
        this.camera.position.x += (Math.random() - 0.5) * this.cameraShake * 0.65;
        this.camera.position.y += (Math.random() - 0.5) * this.cameraShake * 0.65;
        this.cameraShake = THREE.MathUtils.damp(this.cameraShake, 0, 12, dt);
      }

      const cosP = Math.cos(this.camPitch);
      const sinP = Math.sin(this.camPitch);
      _lookAtPos.set(
        eyeX - Math.sin(this.camYaw) * cosP * 10,
        eyeY - sinP * 10,
        eyeZ - Math.cos(this.camYaw) * cosP * 10,
      );
      this.camera.lookAt(_lookAtPos);
      this.playerYaw = Math.atan2(-Math.sin(this.camYaw), -Math.cos(this.camYaw));
      this.character.root.rotation.y = this.playerYaw;
      this.character.setLightAimPitch(this.camPitch, true);
      return;
    }

    this.character.setLightAimPitch(this.camPitch, false);

    this.camDistance = THREE.MathUtils.damp(this.camDistance, this.targetCamDistance, 10, dt);
    const desiredDist = THREE.MathUtils.clamp(
      this.camDistance * this.responsiveDistScale,
      2.4,
      9.4,
    );

    _camTarget.set(
      this.playerPos.x,
      this.playerPos.y + this.responsiveTargetHeight,
      this.playerPos.z,
    );
    this.smoothTarget.x = THREE.MathUtils.damp(this.smoothTarget.x, _camTarget.x, 16, dt);
    this.smoothTarget.y = THREE.MathUtils.damp(this.smoothTarget.y, _camTarget.y, 12, dt);
    this.smoothTarget.z = THREE.MathUtils.damp(this.smoothTarget.z, _camTarget.z, 16, dt);

    const camDirX = Math.sin(this.camYaw);
    const camDirZ = Math.cos(this.camYaw);
    const cosPitch = Math.cos(this.camPitch);
    const safeHorizDist = this.clampCameraDistanceAgainstObstacles(
      this.smoothTarget.x,
      this.smoothTarget.z,
      camDirX,
      camDirZ,
      cosPitch * desiredDist,
    );
    const safeScale = cosPitch > 0.05 ? safeHorizDist / (cosPitch * desiredDist) : 1;
    const vertDist = Math.sin(this.camPitch) * desiredDist * safeScale;

    _desiredCamPos.set(
      this.smoothTarget.x + camDirX * safeHorizDist,
      this.smoothTarget.y + vertDist,
      this.smoothTarget.z + camDirZ * safeHorizDist,
    );

    // Prevent camera from clipping below jungle floor
    const camGroundY = groundHeightAt(_desiredCamPos.x, _desiredCamPos.z) + 0.48;
    if (_desiredCamPos.y < camGroundY) {
      _desiredCamPos.y = camGroundY;
    }

    this.smoothCamPos.x = THREE.MathUtils.damp(this.smoothCamPos.x, _desiredCamPos.x, 16, dt);
    this.smoothCamPos.y = THREE.MathUtils.damp(this.smoothCamPos.y, _desiredCamPos.y, 16, dt);
    this.smoothCamPos.z = THREE.MathUtils.damp(this.smoothCamPos.z, _desiredCamPos.z, 16, dt);

    this.camera.position.copy(this.smoothCamPos);

    if (this.cameraShake > 0.001) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;
      this.cameraShake = THREE.MathUtils.damp(this.cameraShake, 0, 12, dt);
    }

    this.camera.lookAt(this.smoothTarget);
  }

  private computeCompassTarget(): CompassTarget | null {
    const compassEquipped = this.inventory.some((s) => s.id === 'compass' && s.equipped && s.quantity > 0);
    if (!compassEquipped) return null;

    let closest: InteractablePoint | null = null;
    let minDist = Infinity;
    for (let i = 0; i < this.interactables.length; i++) {
      const it = this.interactables[i];
      if (it.collected || it.kind === 'gatherable') continue;
      const d = Math.hypot(it.x - this.playerPos.x, it.z - this.playerPos.z);
      if (d < minDist) {
        minDist = d;
        closest = it;
      }
    }
    if (!closest) return null;

    // World vector from player to target
    const dx = closest.x - this.playerPos.x;
    const dz = closest.z - this.playerPos.z;
    // Camera forward vector is (-sin(camYaw), -cos(camYaw))
    const camForwardAngle = Math.atan2(-Math.sin(this.camYaw), -Math.cos(this.camYaw));
    const targetAngle = Math.atan2(dx, dz);
    const angleDiff = shortestAngleDiff(camForwardAngle, targetAngle);

    return {
      id: closest.id,
      title: closest.title,
      kind: closest.kind === 'landmark' ? 'landmark' : 'relic',
      angleDiffRad: angleDiff,
      distance: Math.round(minDist),
    };
  }

  private getActiveObjective(
    relicsCollected: number,
    relicsTotal: number,
    landmarksDiscovered: number,
    landmarksTotal: number,
  ): HudObjective {
    if (!this.guideCompleted) {
      return { key: 'talk_guide' };
    }
    const hasWoodOrStone = this.inventory.some(
      (s) => (s.id === 'wood' || s.id === 'stone') && s.quantity >= 2,
    );
    const hasAnyWeapon = this.inventory.some(
      (s) => (s.id === 'axe' || s.id === 'sword') && s.quantity > 0,
    );
    const hasRawMeat = this.inventory.some((s) => s.id === 'raw_meat' && s.quantity > 0);

    if (relicsCollected === 0 && !hasWoodOrStone && this.elapsedPlaySeconds < 45) {
      return { key: 'gather_resources' };
    }
    if (hasAnyWeapon && this.equippedWeapon === 'none') {
      return { key: 'equip_weapon' };
    }
    if (hasRawMeat && !this.hasRoastedMeat) {
      return { key: 'roast_meat' };
    }
    if (this.nightFactor > 0.5 && !this.lightEnabled) {
      return { key: 'prepare_night' };
    }
    if (relicsCollected < relicsTotal) {
      return { key: 'recover_relics', done: relicsCollected, total: relicsTotal };
    }
    if (landmarksDiscovered < landmarksTotal) {
      return { key: 'explore_landmarks', done: landmarksDiscovered, total: landmarksTotal };
    }
    return { key: 'expedition_complete' };
  }

  private getContextualTip(nearby: HudNearbyPrompt | null): HudTip {
    if (nearby) {
      if (nearby.kind === 'guide') {
        return { key: 'nearby_guide' };
      }
      if (nearby.kind === 'campfire') {
        return { key: 'nearby_campfire' };
      }
      if (nearby.kind === 'bed') {
        return { key: this.isNightForSleep() ? 'nearby_bed_night' : 'nearby_bed_day' };
      }
      if (nearby.kind === 'gatherable') {
        return { key: 'nearby_gatherable', itemId: nearby.itemId };
      }
      return nearby.kind === 'relic' ? { key: 'nearby_relic' } : { key: 'nearby_landmark' };
    }
    if (!this.guideCompleted) {
      return { key: 'talk_guide' };
    }
    if (this.isSwimming) {
      return { key: 'swimming' };
    }
    if (this.predatorAlert === 'chase') {
      return { key: 'predator_chase' };
    }
    if (this.nightFactor > 0.5 && !this.lightEnabled) {
      return { key: 'night_no_light' };
    }
    const relicsLeft = this.interactables.filter((i) => i.kind === 'relic' && !i.collected).length;
    if (relicsLeft === 5 && this.elapsedPlaySeconds < 12) {
      return { key: 'start_explore' };
    }
    if (trailFactorAt(this.playerPos.x, this.playerPos.z) > 0.35) {
      return { key: 'follow_trail' };
    }
    return { key: 'default_compass' };
  }

  private updateDayNightAndWeather(dt: number): void {
    // Advance time of day smoothly (paused while game is paused)
    if (this.phase === 'playing' && !this.inventoryOpen) {
      this.timeOfDay = (this.timeOfDay + dt / this.cycleDurationSeconds) % 1;
    } else if (this.phase === 'title') {
      this.timeOfDay = (this.timeOfDay + (dt * 0.45) / this.cycleDurationSeconds) % 1;
    }

    const t = this.timeOfDay;
    if (t >= 0.21 && t < 0.31) {
      this.dayPhaseKey = 'dawn';
      this.dayPhaseLabel = 'Amanhecer';
    } else if (t >= 0.31 && t < 0.69) {
      this.dayPhaseKey = 'day';
      this.dayPhaseLabel = 'Dia';
    } else if (t >= 0.69 && t < 0.80) {
      this.dayPhaseKey = 'dusk';
      this.dayPhaseLabel = 'Entardecer';
    } else {
      this.dayPhaseKey = 'night';
      this.dayPhaseLabel = 'Noite';
    }

    const sunAngle = (t - 0.25) * Math.PI * 2;
    const sunElev = Math.sin(sunAngle);
    const nightT = THREE.MathUtils.smoothstep(-sunElev, -0.18, 0.32);
    const twilightT = Math.exp(-Math.pow((sunElev - 0.06) / 0.22, 2));
    this.nightFactor = nightT;

    // Auto-activate flashlight/torch gently when night deepens on each cycle
    if (this.phase === 'playing') {
      if (nightT > 0.58 && !this.nightAutoLitThisCycle) {
        this.nightAutoLitThisCycle = true;
        if (!this.lightEnabled) {
          const hasTorch = this.inventory.some((s) => s.id === 'torch' && s.quantity > 0);
          const hasLantern = this.inventory.some((s) => s.id === 'lantern' && s.quantity > 0);
          if (hasTorch || hasLantern) {
            const torchEquipped = this.inventory.some((s) => s.id === 'torch' && s.equipped);
            const lanternEquipped = this.inventory.some((s) => s.id === 'lantern' && s.equipped);
            if (!torchEquipped && !lanternEquipped) {
              const chosen = hasTorch ? 'torch' : 'lantern';
              this.inventory.forEach((s) => {
                if (s.id === 'torch' || s.id === 'lantern') {
                  s.equipped = s.id === chosen;
                }
              });
              this.lightMode = chosen === 'torch' ? 'torch' : 'flashlight';
            } else {
              this.lightMode = torchEquipped ? 'torch' : 'flashlight';
            }
            this.lightEnabled = true;
            this.character.setLightState(
              true,
              this.lightMode,
              this.isLowLightQuality(this.currentQuality),
            );
            this.audio.playToggleLight(true);
            this.pushToast('hint', 'night_fell');
          }
        }
      } else if (nightT < 0.16 && this.nightAutoLitThisCycle) {
        this.nightAutoLitThisCycle = false;
        if (this.lightEnabled) {
          this.lightEnabled = false;
          this.character.setLightState(
            false,
            this.lightMode,
            this.isLowLightQuality(this.currentQuality),
          );
          this.audio.playToggleLight(false);
        }
      }
    }

    // Dynamic Weather oscillation
    this.weatherSwitchTimer -= dt;
    if (this.weatherSwitchTimer <= 0) {
      this.weatherSwitchTimer = 15 + Math.random() * 14;
      const roll = Math.random();
      if (roll < 0.4) {
        this.targetMist = 0.05 + Math.random() * 0.14;
        this.targetRain = 0;
      } else if (roll < 0.68) {
        this.targetMist = 0.62 + Math.random() * 0.24;
        this.targetRain = Math.random() < 0.3 ? 0.16 : 0;
      } else if (roll < 0.86) {
        this.targetMist = 0.72 + Math.random() * 0.18;
        this.targetRain = 0.44 + Math.random() * 0.24;
      } else {
        this.targetMist = 0.85 + Math.random() * 0.15;
        this.targetRain = 0.78 + Math.random() * 0.22;
      }
    }

    this.weatherMist = THREE.MathUtils.damp(this.weatherMist, this.targetMist, 0.28, dt);
    this.weatherRain = THREE.MathUtils.damp(this.weatherRain, this.targetRain, 0.32, dt);

    if (this.weatherRain > 0.72) {
      this.weatherKey = 'storm';
      this.weatherLabel = 'Tempestade';
    } else if (this.weatherRain > 0.28) {
      this.weatherKey = 'light_rain';
      this.weatherLabel = 'Chuva Leve';
    } else if (this.weatherMist > 0.36) {
      this.weatherKey = 'mist';
      this.weatherLabel = 'Névoa Úmida';
    } else {
      this.weatherKey = nightT > 0.55 ? 'starry' : 'clear';
      this.weatherLabel = nightT > 0.55 ? 'Céu Estrelado' : 'Céu Limpo';
    }

    // Directional Sun/Moon arc following player shadow frustum
    const isMoon = sunElev <= -0.04;
    const lx = isMoon ? -Math.cos(sunAngle) * 32 : Math.cos(sunAngle) * 34;
    const ly = isMoon ? Math.max(10, -sunElev * 34) : Math.max(7, sunElev * 36);
    const lz = isMoon ? 12 : -10 + Math.cos(sunAngle) * 6;
    this.dirLight.position.set(this.playerPos.x + lx, this.playerPos.y + ly, this.playerPos.z + lz);
    this.dirLight.target.position.copy(this.playerPos);
    this.dirLight.target.updateMatrixWorld();

    const atmo = THREE.MathUtils.clamp(this.settings.atmosphereIntensity ?? 1.0, 0.4, 1.4);

    // Fog color & density combining Day/Twilight/Night + Mist/Rain + atmosphereIntensity
    _tmpColorA.copy(_fogColorDay);
    _tmpColorA.lerp(_fogColorTwilight, twilightT * 0.76);
    _tmpColorA.lerp(_fogColorNight, nightT);
    _tmpColorB.copy(_fogColorMist).lerp(_fogColorNight, nightT * 0.84);
    _tmpColorA.lerp(_tmpColorB, Math.min(1, this.weatherMist * 0.78));
    _tmpColorC.copy(_fogColorRain).lerp(_fogColorNight, nightT * 0.74);
    _tmpColorA.lerp(_tmpColorC, Math.min(1, this.weatherRain * 0.85));

    const isPotato = this.currentQuality === 'potato';

    this.fog.color.copy(_tmpColorA);
    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.copy(_tmpColorA);
    }

    if (isPotato) {
      this.scene.fog = null;
      this.scene.environmentIntensity = 0;
    } else {
      this.scene.fog = this.fog;
      const qualityFogBoost =
        this.currentQuality === 'ultra-low'
          ? 0.0058
          : this.currentQuality === 'low'
            ? 0.0042
            : this.currentQuality === 'medium'
              ? 0.0018
              : 0;
      const baseFog =
        0.0112 +
        this.weatherMist * 0.0076 +
        this.weatherRain * 0.0042 +
        nightT * 0.0045;
      this.fog.density = baseFog * (0.65 + atmo * 0.35) + qualityFogBoost;
      this.scene.environmentIntensity = THREE.MathUtils.lerp(0.86, 0.2, nightT);
    }

    // Directional Sun/Moon light color & dramatic contrast
    _tmpColorB.copy(_sunColorDay).lerp(_sunColorTwilight, twilightT * 0.88);
    _tmpColorB.lerp(_moonColorNight, nightT);
    _tmpColorC.copy(_sunColorRain).lerp(_moonColorNight, nightT * 0.7);
    _tmpColorB.lerp(_tmpColorC, this.weatherRain * 0.78);
    this.dirLight.color.copy(_tmpColorB);

    const baseDirIntensity =
      (THREE.MathUtils.lerp(2.08, 0.48, nightT) - twilightT * 0.22 * (1 - nightT)) *
      (0.84 + atmo * 0.18);
    this.dirLight.intensity = isPotato
      ? THREE.MathUtils.lerp(1.45, 0.55, nightT)
      : Math.max(
          0.22,
          baseDirIntensity * (1 - this.weatherMist * 0.24 - this.weatherRain * 0.42),
        );

    // Hemisphere ambient lighting & Environment IBL intensity
    _tmpColorB.copy(_hemiSkyDay).lerp(_hemiSkyTwilight, twilightT * 0.74);
    _tmpColorB.lerp(_hemiSkyNight, nightT);
    _tmpColorC.copy(_hemiSkyRain).lerp(_hemiSkyNight, nightT * 0.75);
    this.hemiLight.color.copy(_tmpColorB).lerp(_tmpColorC, this.weatherRain * 0.8);

    _tmpColorB.copy(_hemiGroundDay).lerp(_hemiGroundNight, nightT);
    this.hemiLight.groundColor.copy(_tmpColorB).lerp(_hemiGroundRain, this.weatherRain * 0.55);

    this.hemiLight.intensity = isPotato
      ? THREE.MathUtils.lerp(0.92, 0.44, nightT)
      : THREE.MathUtils.lerp(0.74, 0.32, nightT) * (1 - this.weatherRain * 0.18);
    this.rimLight.intensity = isPotato
      ? 0.12
      : THREE.MathUtils.lerp(0.48, 0.19, nightT) *
        (1 - this.weatherRain * 0.25) *
        (0.7 + atmo * 0.3);

    // SkyDome tint & canopy god-ray sunbeams modulated by atmosphereIntensity
    _tmpColorB.copy(_skyTintDay).lerp(_skyTintTwilight, twilightT * 0.85);
    _tmpColorB.lerp(_skyTintNight, nightT);
    _tmpColorC.copy(_skyTintRain).lerp(_skyTintNight, nightT * 0.78);
    _tmpColorB.lerp(_tmpColorC, this.weatherRain * 0.8);

    const sunbeamOpacity = isPotato
      ? 0
      : Math.max(
          0.004,
          0.068 *
            atmo *
            (1 - nightT * 0.94) *
            (1 - this.weatherRain * 0.82 - this.weatherMist * 0.28),
        );
    this.world.setTimeAndWeather(
      sunAngle,
      nightT,
      twilightT,
      _tmpColorB.getHex(),
      sunbeamOpacity,
      this.weatherMist,
      this.weatherRain,
      this.camera.far,
    );

    this.audio.setNightFactor(nightT, twilightT);
    this.audio.setRainIntensity(this.weatherRain);
  }

  private handlePlayerHurt = (
    damage: number,
    sourceName: string,
    dirX: number,
    dirZ: number,
  ): void => {
    if (this.phase !== 'playing') return;
    this.hp = Math.max(0, this.hp - damage);
    this.cameraShake = 0.28;
    this.audio.playPlayerHurt();
    this.playerPos.x += dirX * 0.9;
    this.playerPos.z += dirZ * 0.9;
    this.world.spawnBurst(this.playerPos.x, this.playerPos.y + 1.1, this.playerPos.z, 0xef4444, 14);

    if (this.hp <= 0) {
      this.phase = 'fallen';
      this.inventoryOpen = false;
      this.exitPointerLock();
    } else {
      const animalKey: AnimalKey = /Pantera/i.test(sourceName) ? 'panther' : 'jaguar';
      this.pushToast('danger', 'player_hurt', { animalKey, damage });
    }
    this.emitHud();
  };

  private emitHud(): void {
    const action =
      this.phase === 'playing' && !this.inventoryOpen && !this.guideDialogueOpen && this.sleepTimer <= 0
        ? this.findNearestAction()
        : null;
    const canSleepNow = this.isNightForSleep();
    const nearbyPrompt: HudNearbyPrompt | null = action
      ? action.kind === 'guide'
        ? {
            id: 'guide-npc',
            kind: 'guide',
            label: 'Conversar com o Guia',
            sublabel: 'Instruções de sobrevivência na selva',
          }
        : action.kind === 'campfire'
          ? {
              id: action.campfire.id,
              kind: 'campfire',
              label: 'Assar Carne na Fogueira',
              sublabel: 'Carne Crua → Carne Assada',
            }
          : action.kind === 'bed'
            ? {
                id: action.bed.id,
                kind: 'bed',
                label: 'Deitar',
                sublabel: canSleepNow
                  ? 'Dormir até o amanhecer'
                  : 'Só é possível dormir à noite',
              }
            : {
                id: action.item.id,
                kind: action.item.kind,
                itemId: action.item.itemId,
                label:
                  action.item.kind === 'relic'
                    ? `Coletar ${action.item.title}`
                    : action.item.kind === 'gatherable'
                      ? `Pegar ${action.item.title}`
                      : `Inspecionar ${action.item.title}`,
                sublabel: action.item.subtitle,
              }
      : null;

    const relicsCollected = this.interactables.filter(
      (i) => i.kind === 'relic' && i.collected,
    ).length;
    const relicsTotal = this.interactables.filter((i) => i.kind === 'relic').length;
    const landmarksDiscovered = this.interactables.filter(
      (i) => i.kind === 'landmark' && i.collected,
    ).length;
    const landmarksTotal = this.interactables.filter((i) => i.kind === 'landmark').length;

    const headingDeg =
      ((Math.round(THREE.MathUtils.radToDeg(-this.camYaw)) % 360) + 360) % 360;

    this.onHudUpdate({
      phase: this.phase,
      cameraMode: this.cameraMode,
      zoneId: getZoneIdAt(this.playerPos.x, this.playerPos.z),
      zoneName: getZoneNameAt(this.playerPos.x, this.playerPos.z),
      weatherKey: this.weatherKey,
      weatherLabel: this.weatherLabel,
      dayPhaseKey: this.dayPhaseKey,
      dayPhaseLabel: this.dayPhaseLabel,
      timeOfDay: this.timeOfDay,
      hp: Math.round(this.hp),
      maxHp: this.maxHp,
      stamina: Math.round(this.stamina),
      maxStamina: this.maxStamina,
      staminaExhausted: this.staminaExhausted,
      food: Math.round(this.food),
      maxFood: this.maxFood,
      isSwimming: this.isSwimming,
      isSleeping: this.sleepTimer > 0,
      canSleepNow,
      guideCompleted: this.guideCompleted,
      guideDialogueOpen: this.guideDialogueOpen,
      lightEnabled: this.lightEnabled,
      lightMode: this.lightMode,
      equippedWeapon: this.equippedWeapon,
      sprintBoostSeconds: Math.ceil(this.sprintBoostSeconds),
      predatorAlert: this.predatorAlert,
      combatTarget: this.combatTarget ? { ...this.combatTarget } : null,
      relicsCollected,
      relicsTotal,
      landmarksDiscovered,
      landmarksTotal,
      inventory: this.inventory.map((s) => ({ ...s })),
      nearbyPrompt,
      activeObjective: this.getActiveObjective(
        relicsCollected,
        relicsTotal,
        landmarksDiscovered,
        landmarksTotal,
      ),
      activeTip: this.getContextualTip(nearbyPrompt),
      compassTarget: this.computeCompassTarget(),
      playerHeadingDeg: headingDeg,
      pointerLocked: this.pointerLocked,
      toasts: this.toasts.map(({ expiresAt: _expiresAt, ...rest }) => rest),
      elapsedSeconds: Math.floor(this.elapsedPlaySeconds),
      currentFps: this.currentFps,
      webglError: this.webglError,
    });
  }

  private tick = (): void => {
    if (this.disposed) return;

    const now = performance.now();

    // Respect FPS limit on GPU devices without stalling software WebGL pacing
    if (!this.isSoftwareGl && this.settings.fpsLimit > 0) {
      const minIntervalMs = 1000 / this.settings.fpsLimit - 1.5;
      if (now - this.lastRenderTime < minIntervalMs) {
        this.scheduleNextTick();
        return;
      }
    }
    this.lastRenderTime = now;

    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = Math.min(rawDt, 0.05);
    this.elapsed += dt;

    // Rolling FPS counter
    this.fpsFrames++;
    this.fpsAccum += rawDt;
    if (this.fpsAccum >= 0.45) {
      this.currentFps = Math.max(1, Math.round(this.fpsFrames / this.fpsAccum));
      this.fpsFrames = 0;
      this.fpsAccum = 0;
    }

    if (this.phase === 'playing') {
      if (this.sleepTimer > 0) {
        this.sleepTimer -= dt;
        if (this.sleepTimer <= 0.9 && !this.sleepSwapped) {
          this.sleepSwapped = true;
          this.timeOfDay = 0.24; // Advance smoothly to crisp morning dawn
          this.nightAutoLitThisCycle = false;
          if (this.lightEnabled) {
            this.lightEnabled = false;
            this.character.setLightState(
              false,
              this.lightMode,
              this.isLowLightQuality(this.currentQuality),
            );
          }
          this.hp = Math.min(this.maxHp, this.hp + 30);
          this.stamina = this.maxStamina;
          this.staminaExhausted = false;
          this.wildlife.reset();
          this.predatorAlert = 'none';
          this.pushToast('hint', 'slept_morning');
          this.emitHud();
        }
        if (this.sleepTimer <= 0) {
          this.sleepTimer = 0;
          this.emitHud();
        }
        this.character.updateAnimation(dt, 0, 8.8, true, 0, 0, this.lightEnabled, 0, 0, 1, false, false);
      } else if (!this.inventoryOpen && !this.guideDialogueOpen) {
        this.elapsedPlaySeconds += dt;
        this.updatePlayer(dt);

        // Hunger/Food bar: starts at 100, drops 20 every 2 minutes (120s) after tutorial
        if (this.guideCompleted) {
          this.foodDecayTimer -= dt;
          if (this.foodDecayTimer <= 0) {
            this.foodDecayTimer += 120;
            this.food = Math.max(0, this.food - 20);
            if (this.food <= 20 && this.food > 0 && !this.lowFoodWarned) {
              this.lowFoodWarned = true;
              this.pushToast('danger', 'low_food');
            } else if (this.food === 0) {
              this.pushToast('danger', 'starving');
            }
            this.emitHud();
          }
          if (this.food <= 0) {
            this.starvationHpTimer += dt;
            if (this.starvationHpTimer >= 2.5) {
              this.starvationHpTimer = 0;
              this.hp = Math.max(0, this.hp - 3);
              if (this.hp <= 0) {
                this.phase = 'fallen';
                this.inventoryOpen = false;
                this.exitPointerLock();
              }
              this.emitHud();
            }
          } else {
            this.starvationHpTimer = 0;
          }
        }

        if (this.pendingDrops.length > 0) {
          for (let i = this.pendingDrops.length - 1; i >= 0; i--) {
            const pd = this.pendingDrops[i];
            pd.delay -= dt;
            if (pd.delay <= 0) {
              this.interactables.push(pd.item);
              this.world.spawnDynamicGatherable(pd.item);
              const gy = groundHeightAt(pd.item.x, pd.item.z);
              this.world.spawnBurst(
                pd.item.x,
                gy + 0.35,
                pd.item.z,
                pd.item.itemId === 'wood' ? 0xd97706 : 0x94a3b8,
                8,
              );
              this.pendingDrops.splice(i, 1);
            }
          }
        }
        this.wildlife.update(
          dt,
          this.elapsed,
          this.playerPos,
          this.camera.position,
          this.nightFactor,
          isInsideAnyCabin(this.playerPos.x, this.playerPos.z) || !this.guideCompleted,
          this.audio,
          this.handlePlayerHurt,
        );
        this.predatorAlert = this.wildlife.getAlertState();
      } else {
        this.character.updateAnimation(dt, 0, 8.8, true, 0, 0, this.lightEnabled, 0, 0, 1, false, this.isSwimming);
      }
    } else if (this.phase === 'title') {
      this.updateTitleWalk(dt);
      this.wildlife.update(
        dt,
        this.elapsed,
        this.playerPos,
        this.camera.position,
        this.nightFactor,
        true,
        this.audio,
        this.handlePlayerHurt,
      );
      this.predatorAlert = 'none';
    }

    if (this.combatTargetTimer > 0) {
      this.combatTargetTimer -= dt;
      if (this.combatTargetTimer <= 0) {
        this.combatTarget = null;
      }
    }

    if (this.toasts.length > 0) {
      const before = this.toasts.length;
      this.toasts = this.toasts.filter((t) => this.elapsed < t.expiresAt);
      if (this.toasts.length !== before) {
        this.emitHud();
      }
    }

    this.updateDayNightAndWeather(dt);
    this.world.update(
      dt,
      this.elapsed,
      this.playerPos.x,
      this.playerPos.z,
      this.weatherRain,
      this.nightFactor,
    );
    this.updateCamera(dt);

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }

    this.hudEmitTimer += dt;
    if (this.hudEmitTimer >= 0.075) {
      this.hudEmitTimer = 0;
      this.emitHud();
    }

    this.scheduleNextTick();
  };

  private scheduleNextTick(): void {
    if (this.disposed) return;
    if (this.isSoftwareGl && this.renderer) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    if (this.resizeTimer !== null) {
      window.clearTimeout(this.resizeTimer);
      this.resizeTimer = null;
    }

    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('orientationchange', this.handleOrientationChange);
    window.visualViewport?.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleWindowBlur);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);

    const canvas = this.renderer?.domElement;
    if (canvas) {
      canvas.removeEventListener('mousedown', this.handleMouseDown);
      canvas.removeEventListener('wheel', this.handleWheel);
      canvas.removeEventListener('touchstart', this.handleTouchStart);
      canvas.removeEventListener('touchmove', this.handleTouchMove);
      canvas.removeEventListener('touchend', this.handleTouchEnd);
      canvas.removeEventListener('touchcancel', this.handleTouchEnd);
      canvas.removeEventListener('webglcontextlost', this.handleContextLost);
      canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);
    }

    this.exitPointerLock();
    this.audio.dispose();
    this.character?.dispose();
    this.wildlife?.dispose();
    this.world?.dispose();
    this.textures?.dispose();
    this.envRT?.dispose();
    if (this.renderer) {
      this.renderer.dispose();
      if (canvas && canvas.parentElement === this.container) {
        this.container.removeChild(canvas);
      }
    }
  }
}

import * as THREE from 'three';
import { JungleAudioEngine } from './audio';
import { isInsideAnyCabin } from './cabins';
import { JungleWorldHandle } from './jungleWorld';
import { groundHeightAt, POND_CENTER } from './terrain';
import { ProceduralTextures } from './textures';
import { AnimalKey } from './types';

export interface WildlifeAlertState {
  state: 'none' | 'stalk' | 'chase';
}

export interface AttackHitResult {
  hit: boolean;
  defeated: boolean;
  animalKey: AnimalKey;
  animalName: string;
  hp: number;
  maxHp: number;
  dropX: number;
  dropZ: number;
}

export interface WildlifeHandle {
  group: THREE.Group;
  update: (
    dt: number,
    elapsed: number,
    playerPos: THREE.Vector3,
    cameraPos: THREE.Vector3,
    nightFactor: number,
    isPlayerSheltered: boolean,
    audio: JungleAudioEngine,
    onHurtPlayer: (damage: number, sourceName: string, dirX: number, dirZ: number) => void,
  ) => void;
  tryPlayerAttack: (
    playerPos: THREE.Vector3,
    playerYaw: number,
    damage: number,
    range: number,
    world: JungleWorldHandle,
    audio: JungleAudioEngine,
    heavy?: boolean,
  ) => AttackHitResult;
  setPotatoMode: (enabled: boolean) => void;
  getAlertState: () => WildlifeAlertState['state'];
  reset: () => void;
  dispose: () => void;
}

interface HealthBarVisual {
  group: THREE.Group;
  fill: THREE.Mesh;
  fillMat: THREE.MeshBasicMaterial;
}

interface PeacefulAnimal {
  animalKey: AnimalKey;
  name: string;
  kind: 'deer' | 'capybara' | 'macaw';
  root: THREE.Group;
  legs: THREE.Object3D[];
  wings?: [THREE.Object3D, THREE.Object3D];
  head?: THREE.Object3D;
  hpBar?: HealthBarVisual;
  flashMats: THREE.MeshStandardMaterial[];
  homeX: number;
  homeZ: number;
  x: number;
  z: number;
  yaw: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  respawnTimer: number;
  hitFlashTimer: number;
  staggerTimer: number;
  fleeTimer: number;
  targetX: number;
  targetZ: number;
  waitTimer: number;
  orbitAngle: number;
  orbitRadius: number;
  cruiseHeight: number;
}

type PredatorAIState = 'patrol' | 'stalk' | 'chase' | 'retreat';

interface PredatorAnimal {
  animalKey: AnimalKey;
  name: string;
  variant: 'jaguar' | 'panther';
  root: THREE.Group;
  legs: THREE.Object3D[];
  tail: THREE.Object3D;
  head: THREE.Object3D;
  hpBar: HealthBarVisual;
  flashMats: THREE.MeshStandardMaterial[];
  homeX: number;
  homeZ: number;
  x: number;
  z: number;
  yaw: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  hitFlashTimer: number;
  staggerTimer: number;
  state: PredatorAIState;
  stateTimer: number;
  attackCooldown: number;
  growlCooldown: number;
  respawnTimer: number;
  patrolAngle: number;
}

interface MatPreset {
  mat: THREE.MeshStandardMaterial;
  map: THREE.Texture | null;
  color: number;
  potatoColor: number;
  roughness: number;
  metalness: number;
  envMapIntensity: number;
}

function shortestDiff(a: number, b: number): number {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function buildWildlifeSystem(textures: ProceduralTextures): WildlifeHandle {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const matPresets: MatPreset[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  const makeAnimalMat = (opts: {
    color: number;
    potatoColor?: number;
    map?: THREE.Texture | null;
    roughness: number;
    metalness?: number;
    envMapIntensity?: number;
    emissive?: number;
    emissiveIntensity?: number;
  }): THREE.MeshStandardMaterial => {
    const mat = trackMat(
      new THREE.MeshStandardMaterial({
        color: opts.color,
        map: opts.map ?? null,
        roughness: opts.roughness,
        metalness: opts.metalness ?? 0.02,
        envMapIntensity: opts.envMapIntensity ?? 0.85,
        emissive: opts.emissive ?? 0x000000,
        emissiveIntensity: opts.emissiveIntensity ?? 0,
      }),
    );
    matPresets.push({
      mat,
      map: opts.map ?? null,
      color: opts.color,
      potatoColor: opts.potatoColor ?? opts.color,
      roughness: opts.roughness,
      metalness: opts.metalness ?? 0.02,
      envMapIntensity: opts.envMapIntensity ?? 0.85,
    });
    return mat;
  };

  let potatoActive = false;
  const cloneInstanceMat = (base: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial => {
    const preset = matPresets.find((p) => p.mat === base);
    const cloned = trackMat(base.clone());
    if (preset) {
      matPresets.push({
        ...preset,
        mat: cloned,
      });
    }
    return cloned;
  };

  const applyHitFlash = (mats: THREE.MeshStandardMaterial[], timer: number) => {
    const intensity = !potatoActive && timer > 0 ? Math.sin((timer / 0.24) * Math.PI) * 0.78 : 0;
    for (let m = 0; m < mats.length; m++) {
      const mat = mats[m];
      if (intensity > 0.01) {
        mat.emissive.setHex(0xef4444);
        mat.emissiveIntensity = intensity;
      } else if (mat.emissiveIntensity !== 0) {
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
      }
    }
  };

  // GTA 6-style textured wildlife materials
  const deerCoatMat = makeAnimalMat({
    color: 0xffffff,
    potatoColor: 0xb97a45,
    map: textures.animalDeerFur,
    roughness: 0.78,
    metalness: 0.02,
  });
  const deerBellyMat = makeAnimalMat({
    color: 0xf1dfc5,
    potatoColor: 0xebd4b4,
    roughness: 0.86,
    metalness: 0.01,
  });
  const deerInnerEarMat = makeAnimalMat({
    color: 0xd9a896,
    potatoColor: 0xd9a896,
    roughness: 0.75,
  });
  const antlerMat = makeAnimalMat({
    color: 0xc2ab87,
    potatoColor: 0xbda47e,
    roughness: 0.65,
    metalness: 0.05,
  });
  const hoofMat = makeAnimalMat({
    color: 0x201c1a,
    potatoColor: 0x26211e,
    roughness: 0.38,
    metalness: 0.08,
  });

  const capyCoatMat = makeAnimalMat({
    color: 0xffffff,
    potatoColor: 0x7c5838,
    map: textures.animalCapybaraFur,
    roughness: 0.85,
    metalness: 0.02,
  });
  const capySnoutDarkMat = makeAnimalMat({
    color: 0x453224,
    potatoColor: 0x4d3828,
    roughness: 0.72,
    metalness: 0.04,
  });

  const jaguarCoatMat = makeAnimalMat({
    color: 0xffffff,
    potatoColor: 0xd99b38,
    map: textures.animalJaguarFur,
    roughness: 0.72,
    metalness: 0.02,
  });
  const jaguarBellyMat = makeAnimalMat({
    color: 0xf2dfc0,
    potatoColor: 0xf2dfc0,
    roughness: 0.84,
  });
  const pantherCoatMat = makeAnimalMat({
    color: 0xffffff,
    potatoColor: 0x1e2024,
    map: textures.animalPantherFur,
    roughness: 0.56,
    metalness: 0.08,
    envMapIntensity: 1.05,
  });
  const wetNoseMat = makeAnimalMat({
    color: 0x1a1514,
    potatoColor: 0x1d1816,
    roughness: 0.22,
    metalness: 0.08,
  });
  const pawPadMat = makeAnimalMat({
    color: 0x241d1a,
    potatoColor: 0x2a221e,
    roughness: 0.68,
  });

  const macawRedMat = makeAnimalMat({
    color: 0xffffff,
    potatoColor: 0xe11d48,
    map: textures.animalMacawPlumage,
    roughness: 0.62,
  });
  const macawBlueMat = makeAnimalMat({
    color: 0x0284c7,
    potatoColor: 0x0284c7,
    roughness: 0.6,
  });
  const macawGoldMat = makeAnimalMat({
    color: 0xfacc15,
    potatoColor: 0xfacc15,
    roughness: 0.58,
  });
  const macawFaceMat = makeAnimalMat({
    color: 0xfef3e8,
    potatoColor: 0xfef3e8,
    roughness: 0.72,
  });

  const darkEyeMat = makeAnimalMat({
    color: 0x111010,
    potatoColor: 0x141212,
    roughness: 0.14,
    metalness: 0.12,
  });
  const glowingEyeMat = trackMat(
    new THREE.MeshBasicMaterial({ color: 0xfde047 }),
  );

  // Shared 3D Health Bar Geometry & Backing Material
  const hpBgGeo = trackGeo(new THREE.PlaneGeometry(0.78, 0.11));
  const hpFillGeo = trackGeo(new THREE.PlaneGeometry(0.72, 0.068));
  const hpBgMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: 0x0a130e,
      transparent: true,
      opacity: 0.84,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );

  const createHpBar = (heightY: number): HealthBarVisual => {
    const barGroup = new THREE.Group();
    barGroup.position.y = heightY;
    barGroup.visible = false;

    const bg = new THREE.Mesh(hpBgGeo, hpBgMat);
    barGroup.add(bg);

    const fillMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0x4ade80,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    const fill = new THREE.Mesh(hpFillGeo, fillMat);
    fill.position.z = 0.005;
    barGroup.add(fill);

    return { group: barGroup, fill, fillMat };
  };

  const syncHpBar = (bar: HealthBarVisual | undefined, hp: number, maxHp: number, alive: boolean) => {
    if (!bar) return;
    const show = alive && hp > 0 && hp < maxHp;
    bar.group.visible = show;
    if (!show) return;

    const ratio = Math.max(0.01, Math.min(1, hp / maxHp));
    bar.fill.scale.x = ratio;
    bar.fill.position.x = -0.36 + ratio * 0.36;
    if (hp <= 25) {
      bar.fillMat.color.setHex(0xef4444);
    } else if (hp <= 55) {
      bar.fillMat.color.setHex(0xf59e0b);
    } else {
      bar.fillMat.color.setHex(0x4ade80);
    }
  };

  // Sculpted reusable animal geometries (Lathe profiles for muscular anatomical silhouettes)
  // Deer torso profile along Y, rotated so spine runs along Z
  const deerTorsoGeo = trackGeo(
    new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.01, -0.54),
        new THREE.Vector2(0.18, -0.44),
        new THREE.Vector2(0.24, -0.26), // pelvis
        new THREE.Vector2(0.21, -0.02), // slim waist
        new THREE.Vector2(0.255, 0.24), // deep ribcage
        new THREE.Vector2(0.22, 0.44),  // chest
        new THREE.Vector2(0.02, 0.54),
      ],
      14,
    ),
  );
  deerTorsoGeo.rotateX(Math.PI / 2);

  const deerNeckGeo = trackGeo(new THREE.CylinderGeometry(0.082, 0.135, 0.44, 10));
  const deerCraniumGeo = trackGeo(new THREE.SphereGeometry(0.115, 11, 9));
  const deerMuzzleGeo = trackGeo(new THREE.CylinderGeometry(0.044, 0.082, 0.22, 9));
  deerMuzzleGeo.rotateX(Math.PI / 2);
  const deerEarGeo = trackGeo(new THREE.ConeGeometry(0.045, 0.16, 6));
  const deerLegUpperGeo = trackGeo(new THREE.CapsuleGeometry(0.068, 0.22, 5, 8));
  deerLegUpperGeo.translate(0, -0.14, 0);
  const deerLegLowerGeo = trackGeo(new THREE.CylinderGeometry(0.032, 0.026, 0.36, 8));
  deerLegLowerGeo.translate(0, -0.42, 0);
  const deerHoofGeo = trackGeo(new THREE.CylinderGeometry(0.03, 0.038, 0.06, 8));
  deerHoofGeo.translate(0, -0.6, 0);

  // Capybara torso profile (barrel-shaped aquatic body)
  const capyTorsoGeo = trackGeo(
    new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.01, -0.48),
        new THREE.Vector2(0.22, -0.38),
        new THREE.Vector2(0.275, -0.12),
        new THREE.Vector2(0.27, 0.16),
        new THREE.Vector2(0.225, 0.36),
        new THREE.Vector2(0.02, 0.46),
      ],
      14,
    ),
  );
  capyTorsoGeo.rotateX(Math.PI / 2);
  const capyHeadGeo = trackGeo(new THREE.CapsuleGeometry(0.145, 0.16, 6, 10));
  capyHeadGeo.rotateX(Math.PI / 2);
  const capySnoutGeo = trackGeo(new THREE.CylinderGeometry(0.11, 0.135, 0.14, 10));
  capySnoutGeo.rotateX(Math.PI / 2);
  const capyLegGeo = trackGeo(new THREE.CapsuleGeometry(0.062, 0.18, 4, 8));
  capyLegGeo.translate(0, -0.14, 0);
  const capyPawGeo = trackGeo(new THREE.SphereGeometry(0.055, 8, 6));
  capyPawGeo.scale(1.0, 0.55, 1.35);
  capyPawGeo.translate(0, -0.26, 0.03);

  // Big Cat (Jaguar & Panther) sculpted torso profile (broad chest, tucked waist, muscular haunches)
  const catTorsoGeo = trackGeo(
    new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.01, -0.72),
        new THREE.Vector2(0.2, -0.58),
        new THREE.Vector2(0.255, -0.36), // muscular hindquarters
        new THREE.Vector2(0.215, -0.05), // lean feline waist
        new THREE.Vector2(0.275, 0.3),  // broad muscular shoulders & chest
        new THREE.Vector2(0.23, 0.56),
        new THREE.Vector2(0.02, 0.68),
      ],
      16,
    ),
  );
  catTorsoGeo.rotateX(Math.PI / 2);
  const catSkullGeo = trackGeo(new THREE.SphereGeometry(0.195, 12, 10));
  catSkullGeo.scale(1.08, 0.94, 1.05);
  const catMuzzleGeo = trackGeo(new THREE.CapsuleGeometry(0.092, 0.1, 6, 10));
  catMuzzleGeo.rotateX(Math.PI / 2);
  const catShoulderGeo = trackGeo(new THREE.CapsuleGeometry(0.105, 0.2, 5, 8));
  catShoulderGeo.translate(0, -0.13, 0);
  const catForelimbGeo = trackGeo(new THREE.CylinderGeometry(0.064, 0.052, 0.34, 9));
  catForelimbGeo.translate(0, -0.38, 0);
  const catPawGeo = trackGeo(new THREE.SphereGeometry(0.072, 9, 7));
  catPawGeo.scale(1.05, 0.58, 1.35);
  catPawGeo.translate(0, -0.55, 0.04);
  const catTailSegGeo = trackGeo(new THREE.CylinderGeometry(0.042, 0.052, 0.34, 8));
  catTailSegGeo.rotateX(Math.PI / 2);
  catTailSegGeo.translate(0, 0, -0.17);

  // Macaw sculpted body
  const macawBodyGeo = trackGeo(
    new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.01, -0.32),
        new THREE.Vector2(0.09, -0.16),
        new THREE.Vector2(0.135, 0.04),
        new THREE.Vector2(0.11, 0.2),
        new THREE.Vector2(0.02, 0.3),
      ],
      10,
    ),
  );
  macawBodyGeo.rotateX(Math.PI / 2);

  const peacefulAnimals: PeacefulAnimal[] = [];
  const predators: PredatorAnimal[] = [];

  // 1. Peaceful Daytime Deer (Cervo da Mata - 4)
  const buildDeer = (homeX: number, homeZ: number, hasAntlers: boolean) => {
    const root = new THREE.Group();
    const instCoatMat = cloneInstanceMat(deerCoatMat);
    const instBellyMat = cloneInstanceMat(deerBellyMat);
    const flashMats = [instCoatMat, instBellyMat];

    const torso = new THREE.Mesh(deerTorsoGeo, instCoatMat);
    torso.position.y = 0.84;
    torso.scale.set(0.95, 1.06, 1.05);
    torso.castShadow = true;
    torso.receiveShadow = true;
    root.add(torso);

    // Cream underbelly & white tail patch
    const belly = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.18, 10, 8)), instBellyMat);
    belly.position.set(0, 0.67, 0.02);
    belly.scale.set(0.92, 0.45, 2.2);
    root.add(belly);

    const tail = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.065, 0.18, 7)), instBellyMat);
    tail.position.set(0, 0.88, -0.54);
    tail.rotation.x = -0.65;
    root.add(tail);

    const neck = new THREE.Mesh(deerNeckGeo, instCoatMat);
    neck.position.set(0, 1.08, 0.42);
    neck.rotation.x = 0.42;
    neck.castShadow = true;
    root.add(neck);

    const head = new THREE.Group();
    head.position.set(0, 1.29, 0.54);

    const skull = new THREE.Mesh(deerCraniumGeo, instCoatMat);
    skull.scale.set(0.92, 0.92, 1.15);
    head.add(skull);

    const muzzle = new THREE.Mesh(deerMuzzleGeo, instCoatMat);
    muzzle.position.set(0, -0.025, 0.14);
    head.add(muzzle);

    const nose = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.036, 8, 6)), wetNoseMat);
    nose.position.set(0, -0.018, 0.25);
    head.add(nose);

    [-1, 1].forEach((side) => {
      const ear = new THREE.Mesh(deerEarGeo, instCoatMat);
      ear.position.set(side * 0.095, 0.1, -0.04);
      ear.rotation.z = -side * 0.48;
      ear.rotation.x = -0.22;
      head.add(ear);

      const innerEar = new THREE.Mesh(deerEarGeo, deerInnerEarMat);
      innerEar.scale.set(0.65, 0.72, 0.45);
      innerEar.position.set(side * 0.095, 0.095, -0.022);
      innerEar.rotation.z = -side * 0.48;
      innerEar.rotation.x = -0.22;
      head.add(innerEar);

      const eye = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.022, 7, 6)), darkEyeMat);
      eye.position.set(side * 0.088, 0.028, 0.065);
      head.add(eye);
    });

    if (hasAntlers) {
      const beamGeo = trackGeo(new THREE.CylinderGeometry(0.012, 0.02, 0.26, 6));
      const tineGeo = trackGeo(new THREE.CylinderGeometry(0.007, 0.013, 0.13, 5));
      [-1, 1].forEach((side) => {
        const beam = new THREE.Mesh(beamGeo, antlerMat);
        beam.position.set(side * 0.055, 0.18, -0.02);
        beam.rotation.z = -side * 0.34;
        beam.rotation.x = -0.18;
        head.add(beam);

        const tine = new THREE.Mesh(tineGeo, antlerMat);
        tine.position.set(side * 0.095, 0.23, 0.035);
        tine.rotation.z = -side * 0.15;
        tine.rotation.x = 0.55;
        head.add(tine);
      });
    }
    root.add(head);

    const legs: THREE.Object3D[] = [];
    [
      [-0.145, 0.32],
      [0.145, 0.32],
      [-0.145, -0.34],
      [0.145, -0.34],
    ].forEach(([lx, lz]) => {
      const legGroup = new THREE.Group();
      legGroup.position.set(lx, 0.64, lz);
      const upper = new THREE.Mesh(deerLegUpperGeo, instCoatMat);
      upper.castShadow = true;
      legGroup.add(upper);
      const lower = new THREE.Mesh(deerLegLowerGeo, instCoatMat);
      lower.castShadow = true;
      legGroup.add(lower);
      const hoof = new THREE.Mesh(deerHoofGeo, hoofMat);
      legGroup.add(hoof);
      root.add(legGroup);
      legs.push(legGroup);
    });

    const hpBar = createHpBar(1.86);
    root.add(hpBar.group);

    root.position.set(homeX, groundHeightAt(homeX, homeZ), homeZ);
    group.add(root);

    peacefulAnimals.push({
      animalKey: 'deer',
      name: 'Cervo da Mata',
      kind: 'deer',
      root,
      legs,
      head,
      hpBar,
      flashMats,
      homeX,
      homeZ,
      x: homeX,
      z: homeZ,
      yaw: Math.random() * Math.PI * 2,
      hp: 100,
      maxHp: 100,
      alive: true,
      respawnTimer: 0,
      hitFlashTimer: 0,
      staggerTimer: 0,
      fleeTimer: 0,
      targetX: homeX + 4,
      targetZ: homeZ + 4,
      waitTimer: 1.5,
      orbitAngle: 0,
      orbitRadius: 0,
      cruiseHeight: 0,
    });
  };

  // 2. Peaceful Capybaras (Capivara - 3)
  const buildCapybara = (homeX: number, homeZ: number) => {
    const root = new THREE.Group();
    const instCoatMat = cloneInstanceMat(capyCoatMat);
    const instSnoutMat = cloneInstanceMat(capySnoutDarkMat);
    const flashMats = [instCoatMat, instSnoutMat];

    const body = new THREE.Mesh(capyTorsoGeo, instCoatMat);
    body.position.y = 0.45;
    body.scale.set(1.06, 0.92, 1.0);
    body.castShadow = true;
    body.receiveShadow = true;
    root.add(body);

    const head = new THREE.Group();
    head.position.set(0, 0.56, 0.42);

    const cranium = new THREE.Mesh(capyHeadGeo, instCoatMat);
    cranium.castShadow = true;
    head.add(cranium);

    const snout = new THREE.Mesh(capySnoutGeo, instSnoutMat);
    snout.position.set(0, -0.02, 0.14);
    snout.scale.set(0.95, 0.92, 1.0);
    head.add(snout);

    [-0.042, 0.042].forEach((nx) => {
      const nostril = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.018, 6, 5)), wetNoseMat);
      nostril.position.set(nx, 0.02, 0.215);
      head.add(nostril);
    });

    [-1, 1].forEach((side) => {
      const eye = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.024, 7, 6)), darkEyeMat);
      eye.position.set(side * 0.11, 0.075, 0.05);
      head.add(eye);

      const ear = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.042, 7, 6)), instSnoutMat);
      ear.scale.set(0.55, 1.05, 0.85);
      ear.position.set(side * 0.115, 0.125, -0.08);
      head.add(ear);
    });
    root.add(head);

    const legs: THREE.Object3D[] = [];
    [
      [-0.17, 0.25],
      [0.17, 0.25],
      [-0.17, -0.26],
      [0.17, -0.26],
    ].forEach(([lx, lz]) => {
      const legGroup = new THREE.Group();
      legGroup.position.set(lx, 0.29, lz);
      const leg = new THREE.Mesh(capyLegGeo, instCoatMat);
      leg.castShadow = true;
      legGroup.add(leg);
      const paw = new THREE.Mesh(capyPawGeo, instSnoutMat);
      legGroup.add(paw);
      root.add(legGroup);
      legs.push(legGroup);
    });

    const hpBar = createHpBar(1.22);
    root.add(hpBar.group);

    root.position.set(homeX, groundHeightAt(homeX, homeZ), homeZ);
    group.add(root);

    peacefulAnimals.push({
      animalKey: 'capybara',
      name: 'Capivara',
      kind: 'capybara',
      root,
      legs,
      head,
      hpBar,
      flashMats,
      homeX,
      homeZ,
      x: homeX,
      z: homeZ,
      yaw: Math.random() * Math.PI * 2,
      hp: 100,
      maxHp: 100,
      alive: true,
      respawnTimer: 0,
      hitFlashTimer: 0,
      staggerTimer: 0,
      fleeTimer: 0,
      targetX: homeX - 3,
      targetZ: homeZ + 2,
      waitTimer: 2,
      orbitAngle: 0,
      orbitRadius: 0,
      cruiseHeight: 0,
    });
  };

  // 3. Flying Tropical Macaws (Arara-Vermelha - 2)
  const buildMacaw = (homeX: number, homeZ: number, orbitRadius: number, cruiseHeight: number) => {
    const root = new THREE.Group();

    const body = new THREE.Mesh(macawBodyGeo, macawRedMat);
    root.add(body);

    const head = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.095, 10, 8)), macawRedMat);
    head.position.set(0, 0.04, 0.24);
    root.add(head);

    const facePatch = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.072, 8, 6)), macawFaceMat);
    facePatch.scale.set(1.15, 0.72, 0.9);
    facePatch.position.set(0, 0.03, 0.27);
    root.add(facePatch);

    const upperBeak = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.052, 0.14, 7)), macawGoldMat);
    upperBeak.rotation.x = Math.PI / 2 + 0.22;
    upperBeak.position.set(0, 0.02, 0.36);
    root.add(upperBeak);

    const lowerBeak = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.036, 0.09, 6)), wetNoseMat);
    lowerBeak.rotation.x = Math.PI / 2 + 0.35;
    lowerBeak.position.set(0, -0.015, 0.33);
    root.add(lowerBeak);

    const tailRed = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.055, 0.56, 6)), macawBlueMat);
    tailRed.scale.set(1.2, 1, 0.28);
    tailRed.rotation.x = -Math.PI / 2;
    tailRed.position.set(0, 0.01, -0.52);
    root.add(tailRed);

    const buildWing = (side: -1 | 1) => {
      const wingGroup = new THREE.Group();
      wingGroup.position.set(side * 0.08, 0.04, 0.05);

      const covert = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.18, 8, 6)), macawRedMat);
      covert.scale.set(1.5, 0.16, 0.65);
      covert.position.set(side * 0.22, 0, 0);
      wingGroup.add(covert);

      const midCovert = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.16, 8, 6)), macawGoldMat);
      midCovert.scale.set(1.35, 0.14, 0.52);
      midCovert.position.set(side * 0.3, -0.005, -0.05);
      wingGroup.add(midCovert);

      const primary = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.14, 0.58, 5)), macawBlueMat);
      primary.scale.set(0.95, 1, 0.15);
      primary.rotation.z = -side * (Math.PI / 2 - 0.18);
      primary.position.set(side * 0.45, 0, -0.08);
      wingGroup.add(primary);

      return wingGroup;
    };

    const wingL = buildWing(-1);
    const wingR = buildWing(1);
    root.add(wingL);
    root.add(wingR);

    group.add(root);
    peacefulAnimals.push({
      animalKey: 'macaw',
      name: 'Arara-Vermelha',
      kind: 'macaw',
      root,
      legs: [],
      wings: [wingL, wingR],
      flashMats: [],
      homeX,
      homeZ,
      x: homeX + orbitRadius,
      z: homeZ,
      yaw: 0,
      hp: 100,
      maxHp: 100,
      alive: true,
      respawnTimer: 0,
      hitFlashTimer: 0,
      staggerTimer: 0,
      fleeTimer: 0,
      targetX: homeX,
      targetZ: homeZ,
      waitTimer: 0,
      orbitAngle: Math.random() * Math.PI * 2,
      orbitRadius,
      cruiseHeight,
    });
  };

  buildDeer(-14, -7, true);
  buildDeer(-22, 24, false);
  buildDeer(18, -22, true);
  buildDeer(11, 13, false);
  buildCapybara(POND_CENTER.x - 7.5, POND_CENTER.z - 2.5);
  buildCapybara(POND_CENTER.x - 4.5, POND_CENTER.z - 7.0);
  buildCapybara(7.5, -6.5);
  buildMacaw(0, 0, 14, 9.5);
  buildMacaw(28, -22, 16, 11.2);

  // 4. Nighttime-Only Predators (Onça-Pintada x2 + Pantera Negra x1)
  const buildPredator = (
    name: string,
    variant: 'jaguar' | 'panther',
    homeX: number,
    homeZ: number,
  ) => {
    const root = new THREE.Group();
    const furMat = cloneInstanceMat(variant === 'jaguar' ? jaguarCoatMat : pantherCoatMat);
    const bellyMat =
      variant === 'jaguar' ? cloneInstanceMat(jaguarBellyMat) : furMat;
    const flashMats = variant === 'jaguar' ? [furMat, bellyMat] : [furMat];

    // Sculpted feline body with deep ribcage and muscular shoulder hump
    const torso = new THREE.Mesh(catTorsoGeo, furMat);
    torso.position.y = 0.72;
    torso.scale.set(0.98, 1.02, 1.02);
    torso.castShadow = true;
    torso.receiveShadow = true;
    root.add(torso);

    const chestBelly = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.2, 10, 8)), bellyMat);
    chestBelly.position.set(0, 0.56, 0.14);
    chestBelly.scale.set(0.9, 0.48, 2.2);
    root.add(chestBelly);

    // Muscular neck bridge
    const neck = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.14, 0.185, 0.3, 10)), furMat);
    neck.position.set(0, 0.84, 0.58);
    neck.rotation.x = 0.62;
    neck.castShadow = true;
    root.add(neck);

    // Sculpted feline head, cheekbones, muzzle pads, dark nose & ears
    const head = new THREE.Group();
    head.position.set(0, 0.92, 0.77);

    const skull = new THREE.Mesh(catSkullGeo, furMat);
    skull.castShadow = true;
    head.add(skull);

    const muzzle = new THREE.Mesh(catMuzzleGeo, furMat);
    muzzle.position.set(0, -0.04, 0.17);
    head.add(muzzle);

    const jaw = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.085, 8, 7)), bellyMat);
    jaw.scale.set(0.95, 0.58, 1.15);
    jaw.position.set(0, -0.1, 0.15);
    head.add(jaw);

    const nose = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.042, 0.055, 6)), wetNoseMat);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, -0.02, 0.275);
    head.add(nose);

    [-1, 1].forEach((side) => {
      const ear = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.064, 0.115, 7)), furMat);
      ear.position.set(side * 0.13, 0.18, -0.05);
      ear.rotation.z = -side * 0.25;
      ear.rotation.x = 0.12;
      head.add(ear);

      const earBack = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.042, 6, 5)), wetNoseMat);
      earBack.position.set(side * 0.135, 0.175, -0.075);
      head.add(earBack);

      const eye = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.026, 7, 6)), glowingEyeMat);
      eye.position.set(side * 0.095, 0.048, 0.165);
      head.add(eye);
    });
    root.add(head);

    // 3-segment curved articulated feline tail
    const tailPivot = new THREE.Group();
    tailPivot.position.set(0, 0.78, -0.66);
    const tailSeg1 = new THREE.Mesh(catTailSegGeo, furMat);
    tailSeg1.rotation.x = -0.35;
    tailPivot.add(tailSeg1);
    const tailSeg2 = new THREE.Mesh(catTailSegGeo, furMat);
    tailSeg2.position.set(0, -0.1, -0.29);
    tailSeg2.scale.set(0.84, 0.84, 0.95);
    tailSeg2.rotation.x = -0.08;
    tailPivot.add(tailSeg2);
    const tailTip = new THREE.Mesh(catTailSegGeo, wetNoseMat);
    tailTip.position.set(0, -0.11, -0.56);
    tailTip.scale.set(0.68, 0.68, 0.72);
    tailTip.rotation.x = 0.35;
    tailPivot.add(tailTip);
    root.add(tailPivot);

    // Muscular shoulders/thighs, limbs and padded paws
    const legs: THREE.Object3D[] = [];
    [
      [-0.185, 0.42],
      [0.185, 0.42],
      [-0.185, -0.44],
      [0.185, -0.44],
    ].forEach(([lx, lz]) => {
      const legGroup = new THREE.Group();
      legGroup.position.set(lx, 0.58, lz);
      const shoulder = new THREE.Mesh(catShoulderGeo, furMat);
      shoulder.castShadow = true;
      legGroup.add(shoulder);
      const forearm = new THREE.Mesh(catForelimbGeo, furMat);
      forearm.castShadow = true;
      legGroup.add(forearm);
      const paw = new THREE.Mesh(catPawGeo, pawPadMat);
      legGroup.add(paw);
      root.add(legGroup);
      legs.push(legGroup);
    });

    const hpBar = createHpBar(1.56);
    root.add(hpBar.group);

    root.visible = false;
    root.position.set(homeX, groundHeightAt(homeX, homeZ), homeZ);
    group.add(root);

    predators.push({
      animalKey: variant,
      name,
      variant,
      root,
      legs,
      tail: tailPivot,
      head,
      hpBar,
      flashMats,
      homeX,
      homeZ,
      x: homeX,
      z: homeZ,
      yaw: Math.random() * Math.PI * 2,
      hp: 100,
      maxHp: 100,
      alive: true,
      hitFlashTimer: 0,
      staggerTimer: 0,
      state: 'patrol',
      stateTimer: 0,
      attackCooldown: 0,
      growlCooldown: 0,
      respawnTimer: 0,
      patrolAngle: Math.random() * Math.PI * 2,
    });
  };

  buildPredator('Onça-Pintada', 'jaguar', -34, 16);
  buildPredator('Onça-Pintada', 'jaguar', 40, -14);
  buildPredator('Pantera Negra', 'panther', -12, -48);

  const reset = () => {
    peacefulAnimals.forEach((a) => {
      a.x = a.homeX;
      a.z = a.homeZ;
      a.hp = a.maxHp;
      a.alive = true;
      a.respawnTimer = 0;
      a.hitFlashTimer = 0;
      a.staggerTimer = 0;
      a.fleeTimer = 0;
      a.waitTimer = 1.0;
      a.root.scale.setScalar(1);
      applyHitFlash(a.flashMats, 0);
      syncHpBar(a.hpBar, a.hp, a.maxHp, true);
    });
    predators.forEach((p) => {
      p.x = p.homeX;
      p.z = p.homeZ;
      p.hp = p.maxHp;
      p.alive = true;
      p.hitFlashTimer = 0;
      p.staggerTimer = 0;
      p.state = 'patrol';
      p.stateTimer = 0;
      p.attackCooldown = 0;
      p.growlCooldown = 0;
      p.respawnTimer = 0;
      p.root.visible = false;
      p.root.scale.setScalar(1);
      applyHitFlash(p.flashMats, 0);
      syncHpBar(p.hpBar, p.hp, p.maxHp, true);
    });
  };

  let farTickAccum = 0;

  const update = (
    dt: number,
    elapsed: number,
    playerPos: THREE.Vector3,
    cameraPos: THREE.Vector3,
    nightFactor: number,
    isPlayerSheltered: boolean,
    audio: JungleAudioEngine,
    onHurtPlayer: (damage: number, sourceName: string, dirX: number, dirZ: number) => void,
  ) => {
    farTickAccum += dt;
    const runFarTick = farTickAccum >= 0.22;
    const farDt = farTickAccum;
    if (runFarTick) {
      farTickAccum = 0;
    }

    // Peaceful daytime wildlife
    const dayVisible = nightFactor < 0.72;
    for (let i = 0; i < peacefulAnimals.length; i++) {
      const a = peacefulAnimals[i];
      if (!dayVisible) {
        a.root.visible = false;
        continue;
      }

      if (!a.alive) {
        a.root.visible = false;
        a.respawnTimer -= dt;
        if (a.respawnTimer <= 0) {
          a.alive = true;
          a.hp = a.maxHp;
          a.x = a.homeX;
          a.z = a.homeZ;
          a.hitFlashTimer = 0;
          a.staggerTimer = 0;
          a.fleeTimer = 0;
          a.root.scale.setScalar(1);
          syncHpBar(a.hpBar, a.hp, a.maxHp, true);
        }
        continue;
      }

      if (a.hitFlashTimer > 0) {
        a.hitFlashTimer = Math.max(0, a.hitFlashTimer - dt);
        const pulse = 1 + Math.sin((a.hitFlashTimer / 0.24) * Math.PI) * 0.14;
        a.root.scale.set(pulse, 1 / Math.sqrt(pulse), pulse);
        applyHitFlash(a.flashMats, a.hitFlashTimer);
      } else {
        a.root.scale.setScalar(1);
        applyHitFlash(a.flashMats, 0);
      }

      if (a.staggerTimer > 0) a.staggerTimer = Math.max(0, a.staggerTimer - dt);
      if (a.fleeTimer > 0) a.fleeTimer = Math.max(0, a.fleeTimer - dt);

      const pDx = a.x - playerPos.x;
      const pDz = a.z - playerPos.z;
      const distSq = pDx * pDx + pDz * pDz;

      if (distSq > 7225) {
        a.root.visible = false;
        continue;
      }
      a.root.visible = true;

      if (a.hpBar && a.hpBar.group.visible) {
        a.hpBar.group.lookAt(cameraPos);
      }

      const isMidRange = distSq > 1936;
      if (isMidRange && !runFarTick) continue;
      const stepDt = isMidRange ? farDt : dt;

      if (a.kind === 'macaw') {
        a.orbitAngle += stepDt * 0.42;
        const nx = a.homeX + Math.cos(a.orbitAngle) * a.orbitRadius;
        const nz = a.homeZ + Math.sin(a.orbitAngle) * a.orbitRadius;
        const dx = nx - a.x;
        const dz = nz - a.z;
        a.x = nx;
        a.z = nz;
        a.yaw = Math.atan2(dx, dz);
        a.root.position.set(
          a.x,
          groundHeightAt(a.x, a.z) + a.cruiseHeight + Math.sin(elapsed * 2 + i) * 0.6,
          a.z,
        );
        a.root.rotation.y = a.yaw;
        if (!isMidRange && a.wings) {
          const flap = Math.sin(elapsed * 11 + i * 2) * 0.55;
          a.wings[0].rotation.z = flap;
          a.wings[1].rotation.z = -flap;
        }
        continue;
      }

      const distPlayer = Math.sqrt(distSq);
      let speed = 1.5;

      if (a.staggerTimer > 0) {
        speed = 0;
      } else if (a.fleeTimer > 0 && distPlayer > 0.05) {
        a.targetX = a.x + (pDx / distPlayer) * 7.5;
        a.targetZ = a.z + (pDz / distPlayer) * 7.5;
        a.waitTimer = 0;
        speed = 3.1;
      } else {
        const spookDist = a.kind === 'capybara' ? 3.2 : 4.2;
        if (distPlayer < spookDist && distPlayer > 0.05) {
          a.targetX = a.x + (pDx / distPlayer) * 6.5;
          a.targetZ = a.z + (pDz / distPlayer) * 6.5;
          a.waitTimer = 0;
          speed = a.kind === 'capybara' ? 2.2 : 2.8;
        }
      }

      if (a.staggerTimer > 0) {
        // Brief impact stagger pause
      } else if (a.waitTimer > 0) {
        a.waitTimer -= stepDt;
        if (!isMidRange) {
          if (a.head) {
            a.head.rotation.x = Math.sin(elapsed * 2.2 + i) * 0.14;
          }
          for (let l = 0; l < a.legs.length; l++) {
            a.legs[l].rotation.x = THREE.MathUtils.damp(a.legs[l].rotation.x, 0, 10, stepDt);
          }
        }
      } else {
        const tx = a.targetX - a.x;
        const tz = a.targetZ - a.z;
        const td = Math.hypot(tx, tz);
        if (td < 0.7) {
          a.waitTimer = 2.0 + Math.random() * 3.5;
          const randAng = Math.random() * Math.PI * 2;
          const r = 4 + Math.random() * 10;
          a.targetX = a.homeX + Math.cos(randAng) * r;
          a.targetZ = a.homeZ + Math.sin(randAng) * r;
        } else {
          const targetYaw = Math.atan2(tx, tz);
          a.yaw += shortestDiff(a.yaw, targetYaw) * Math.min(1, stepDt * 6);
          a.x += (tx / td) * speed * stepDt;
          a.z += (tz / td) * speed * stepDt;
          if (!isMidRange && a.legs.length === 4) {
            const stride = Math.sin(elapsed * speed * 3.2 + i) * 0.52;
            a.legs[0].rotation.x = stride;
            a.legs[3].rotation.x = stride;
            a.legs[1].rotation.x = -stride;
            a.legs[2].rotation.x = -stride;
          }
        }
      }

      const hop = a.hitFlashTimer > 0 ? Math.sin((a.hitFlashTimer / 0.24) * Math.PI) * 0.22 : 0;
      a.root.position.set(a.x, groundHeightAt(a.x, a.z) + hop, a.z);
      a.root.rotation.y = a.yaw;
    }

    // Nighttime-only Predators (strictly active only when nightFactor > 0.58)
    const isNightActive = nightFactor > 0.58;
    for (let i = 0; i < predators.length; i++) {
      const p = predators[i];

      if (!isNightActive) {
        if (p.root.visible || !p.alive) {
          p.root.visible = false;
          p.state = 'patrol';
          p.alive = true;
          p.hp = p.maxHp;
          p.x = p.homeX;
          p.z = p.homeZ;
          p.hitFlashTimer = 0;
          p.staggerTimer = 0;
          syncHpBar(p.hpBar, p.hp, p.maxHp, true);
        }
        continue;
      }

      if (!p.alive || p.respawnTimer > 0) {
        p.respawnTimer -= dt;
        p.root.visible = false;
        if (p.respawnTimer <= 0) {
          p.alive = true;
          p.hp = p.maxHp;
          p.x = p.homeX;
          p.z = p.homeZ;
          p.state = 'patrol';
          p.hitFlashTimer = 0;
          p.staggerTimer = 0;
          p.root.scale.setScalar(1);
          syncHpBar(p.hpBar, p.hp, p.maxHp, true);
        }
        continue;
      }

      if (p.hitFlashTimer > 0) {
        p.hitFlashTimer = Math.max(0, p.hitFlashTimer - dt);
        const pulse = 1 + Math.sin((p.hitFlashTimer / 0.24) * Math.PI) * 0.14;
        p.root.scale.set(pulse, 1 / Math.sqrt(pulse), pulse);
        applyHitFlash(p.flashMats, p.hitFlashTimer);
      } else {
        p.root.scale.setScalar(1);
        applyHitFlash(p.flashMats, 0);
      }
      if (p.staggerTimer > 0) p.staggerTimer = Math.max(0, p.staggerTimer - dt);

      const dx = playerPos.x - p.x;
      const dz = playerPos.z - p.z;
      const distSq = dx * dx + dz * dz;

      const isFarPatrol = distSq > 3025 && p.state === 'patrol';
      if (isFarPatrol && !runFarTick) {
        p.root.visible = distSq <= 7225;
        continue;
      }
      const stepDt = isFarPatrol ? farDt : dt;

      p.root.visible = distSq <= 7225;
      if (p.hpBar.group.visible) {
        p.hpBar.group.lookAt(cameraPos);
      }

      if (p.attackCooldown > 0) p.attackCooldown = Math.max(0, p.attackCooldown - stepDt);
      if (p.growlCooldown > 0) p.growlCooldown = Math.max(0, p.growlCooldown - stepDt);
      if (p.stateTimer > 0) p.stateTimer = Math.max(0, p.stateTimer - stepDt);

      const dist = Math.sqrt(distSq) || 0.001;
      const playerSafeInClearing = Math.hypot(playerPos.x, playerPos.z) < 11.5;
      const playerSafe = isPlayerSheltered || playerSafeInClearing;

      if (p.state === 'retreat') {
        if (p.stateTimer <= 0) {
          p.state = 'patrol';
        }
      } else if (playerSafe) {
        if (p.state === 'chase' || p.state === 'stalk') {
          p.state = 'retreat';
          p.stateTimer = 3.0;
        }
      } else {
        if (dist < 10.5) {
          p.state = 'chase';
        } else if (dist < 22) {
          if (p.state !== 'chase') {
            p.state = 'stalk';
            if (p.growlCooldown <= 0) {
              p.growlCooldown = 5.5;
              const pan = THREE.MathUtils.clamp(-dx / 15, -0.8, 0.8);
              audio.playPredatorGrowl(pan);
            }
          } else if (dist > 28) {
            p.state = 'patrol';
          }
        } else {
          p.state = 'patrol';
        }
      }

      let moveX = 0;
      let moveZ = 0;
      let speed = 2.1;

      if (p.staggerTimer > 0) {
        speed = 0;
      } else if (p.state === 'patrol') {
        p.patrolAngle += stepDt * 0.25;
        const tx = p.homeX + Math.cos(p.patrolAngle) * 11;
        const tz = p.homeZ + Math.sin(p.patrolAngle) * 11;
        const vx = tx - p.x;
        const vz = tz - p.z;
        const vd = Math.hypot(vx, vz) || 1;
        moveX = vx / vd;
        moveZ = vz / vd;
        speed = 2.0;
      } else if (p.state === 'stalk') {
        moveX = dx / dist;
        moveZ = dz / dist;
        speed = 2.6;
      } else if (p.state === 'chase') {
        moveX = dx / dist;
        moveZ = dz / dist;
        speed = p.variant === 'panther' ? 5.9 : 5.5;

        if (dist < 1.65 && p.attackCooldown <= 0) {
          p.attackCooldown = 2.4;
          p.state = 'retreat';
          p.stateTimer = 1.8;
          onHurtPlayer(p.variant === 'panther' ? 18 : 14, p.name, dx / dist, dz / dist);
        }
      } else {
        moveX = -dx / dist;
        moveZ = -dz / dist;
        speed = 3.8;
      }

      if (p.staggerTimer <= 0) {
        const nextX = p.x + moveX * speed * stepDt;
        const nextZ = p.z + moveZ * speed * stepDt;

        if (!isInsideAnyCabin(nextX, nextZ) && Math.hypot(nextX, nextZ) > 9.5) {
          p.x = nextX;
          p.z = nextZ;
        } else if (p.state === 'chase') {
          p.state = 'retreat';
          p.stateTimer = 2.2;
        }

        const targetYaw = Math.atan2(moveX, moveZ);
        p.yaw += shortestDiff(p.yaw, targetYaw) * Math.min(1, stepDt * 8);
      }

      if (!isFarPatrol) {
        const stride = p.staggerTimer > 0 ? 0 : Math.sin(elapsed * speed * 2.4 + i) * 0.58;
        p.legs[0].rotation.x = stride;
        p.legs[3].rotation.x = stride;
        p.legs[1].rotation.x = -stride;
        p.legs[2].rotation.x = -stride;
        p.tail.rotation.y = Math.sin(elapsed * 4.5 + i) * 0.3;
        p.head.rotation.x = p.state === 'stalk' ? 0.18 : Math.sin(elapsed * 2.2 + i) * 0.05;
      }

      const hop = p.hitFlashTimer > 0 ? Math.sin((p.hitFlashTimer / 0.24) * Math.PI) * 0.22 : 0;
      p.root.position.set(p.x, groundHeightAt(p.x, p.z) + hop, p.z);
      p.root.rotation.y = p.yaw;
    }
  };

  const tryPlayerAttack = (
    playerPos: THREE.Vector3,
    playerYaw: number,
    damage: number,
    range: number,
    world: JungleWorldHandle,
    audio: JungleAudioEngine,
    heavy = false,
  ): AttackHitResult => {
    const fwdX = Math.sin(playerYaw);
    const fwdZ = Math.cos(playerYaw);

    type TargetCandidate =
      | { kind: 'peaceful'; entity: PeacefulAnimal; dist: number }
      | { kind: 'predator'; entity: PredatorAnimal; dist: number };

    let best: TargetCandidate | null = null;

    // 1. Scan active nighttime predators
    for (let i = 0; i < predators.length; i++) {
      const p = predators[i];
      if (!p.alive || !p.root.visible) continue;
      const dx = p.x - playerPos.x;
      const dz = p.z - playerPos.z;
      const dist = Math.hypot(dx, dz);
      if (dist > range) continue;
      const dot = (dx * fwdX + dz * fwdZ) / Math.max(0.01, dist);
      if ((dot > 0.05 || dist < 1.8) && (!best || dist < best.dist)) {
        best = { kind: 'predator', entity: p, dist };
      }
    }

    // 2. Scan peaceful ground animals (Cervo & Capivara)
    for (let i = 0; i < peacefulAnimals.length; i++) {
      const a = peacefulAnimals[i];
      if (a.kind === 'macaw' || !a.alive || !a.root.visible) continue;
      const dx = a.x - playerPos.x;
      const dz = a.z - playerPos.z;
      const dist = Math.hypot(dx, dz);
      if (dist > range) continue;
      const dot = (dx * fwdX + dz * fwdZ) / Math.max(0.01, dist);
      if ((dot > 0.05 || dist < 1.8) && (!best || dist < best.dist)) {
        best = { kind: 'peaceful', entity: a, dist };
      }
    }

    if (!best) {
      return {
        hit: false,
        defeated: false,
        animalKey: 'deer',
        animalName: '',
        hp: 0,
        maxHp: 100,
        dropX: 0,
        dropZ: 0,
      };
    }

    const target = best.entity;
    const hitX = target.x;
    const hitZ = target.z;
    const gy = groundHeightAt(hitX, hitZ);

    // Apply exact fixed damage (30 per hit: 100 -> 70 -> 40 -> 10 -> 0)
    target.hp = Math.max(0, target.hp - damage);
    target.hitFlashTimer = 0.24;
    target.staggerTimer = 0.36;
    applyHitFlash(target.flashMats, target.hitFlashTimer);

    const kx = target.x - playerPos.x;
    const kz = target.z - playerPos.z;
    const kd = Math.hypot(kx, kz) || 1;
    const pushDist = target.hp <= 0 ? 0.55 : 0.95;
    target.x += (kx / kd) * pushDist;
    target.z += (kz / kd) * pushDist;

    if (target.hp <= 0) {
      audio.playAnimalHit(heavy);
      audio.playAnimalDeath();
      target.alive = false;
      target.root.visible = false;
      target.respawnTimer = 55;
      applyHitFlash(target.flashMats, 0);
      syncHpBar(target.hpBar, 0, target.maxHp, false);
      world.spawnBurst(hitX, gy + 0.75, hitZ, 0xef4444, 22);
      world.spawnBurst(hitX, gy + 0.65, hitZ, 0xfbbf24, 10);
      return {
        hit: true,
        defeated: true,
        animalKey: target.animalKey,
        animalName: target.name,
        hp: 0,
        maxHp: target.maxHp,
        dropX: hitX,
        dropZ: hitZ,
      };
    }

    audio.playAnimalHit(heavy);
    world.spawnBurst(hitX, gy + 0.85, hitZ, 0xfbbf24, 14);
    syncHpBar(target.hpBar, target.hp, target.maxHp, true);

    if (best.kind === 'peaceful') {
      best.entity.fleeTimer = 2.0;
    } else {
      best.entity.state = 'retreat';
      best.entity.stateTimer = 0.95;
    }

    return {
      hit: true,
      defeated: false,
      animalKey: target.animalKey,
      animalName: target.name,
      hp: target.hp,
      maxHp: target.maxHp,
      dropX: target.x,
      dropZ: target.z,
    };
  };

  const setPotatoMode = (enabled: boolean) => {
    potatoActive = enabled;
    for (let i = 0; i < matPresets.length; i++) {
      const p = matPresets[i];
      if (enabled) {
        p.mat.map = null;
        p.mat.color.setHex(p.potatoColor);
        p.mat.roughness = 0.94;
        p.mat.metalness = 0.0;
        p.mat.envMapIntensity = 0;
        p.mat.emissive.setHex(0x000000);
        p.mat.emissiveIntensity = 0;
        p.mat.flatShading = false;
      } else {
        p.mat.map = p.map;
        p.mat.color.setHex(p.color);
        p.mat.roughness = p.roughness;
        p.mat.metalness = p.metalness;
        p.mat.envMapIntensity = p.envMapIntensity;
      }
      p.mat.needsUpdate = true;
    }
  };

  const getAlertState = (): WildlifeAlertState['state'] => {
    let alert: WildlifeAlertState['state'] = 'none';
    for (let i = 0; i < predators.length; i++) {
      const p = predators[i];
      if (!p.alive || !p.root.visible) continue;
      if (p.state === 'chase') return 'chase';
      if (p.state === 'stalk') alert = 'stalk';
    }
    return alert;
  };

  return {
    group,
    update,
    tryPlayerAttack,
    setPotatoMode,
    getAlertState,
    reset,
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}

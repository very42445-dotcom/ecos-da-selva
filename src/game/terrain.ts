import { CABINS } from './cabins';
import { InteractablePoint, ZoneId } from './types';
import { VILLAGES } from './villages';

export const PLAYABLE_RADIUS = 160;
export const WORLD_RADIUS = 175;
export const WATER_LEVEL = -0.52;

export interface ClearingDef {
  id: string;
  name: string;
  x: number;
  z: number;
  radius: number;
  elevation: number;
}

export const CLEARINGS: ClearingDef[] = [
  { id: 'central', name: 'Clareira do Sol', x: 0, z: 0, radius: 11.5, elevation: 0.0 },
  { id: 'ruins', name: 'Altar das Ruínas', x: -30, z: -25, radius: 10.5, elevation: 0.45 },
  { id: 'overlook', name: 'Mirante da Pedra Alta', x: 28, z: -30, radius: 9.5, elevation: 2.35 },
  { id: 'stream', name: 'Riacho Esmeralda', x: 32, z: 22, radius: 11.0, elevation: -0.2 },
  { id: 'palms', name: 'Bosque das Palmeiras', x: -27, z: 28, radius: 10.0, elevation: 0.25 },
  { id: 'grove', name: 'Santuário da Raiz', x: 0, z: 43, radius: 8.5, elevation: 0.65 },
];

// Pond center inside Riacho Esmeralda clearing
export const POND_CENTER = { x: 35.5, z: 24.5, radius: 6.4 };

// Scenic winding swimmable rivers across the eastern & western valleys
export const RIVER_PATHS: Array<Array<[number, number]>> = [
  // East River: Northern valley -> east of Cabana do Riacho -> Riacho Esmeralda -> South valley
  [
    [62, -138],
    [60, -92],
    [61, -50],
    [58, -12],
    [54, 14],
    [38, 25],
    [32, 36],
    [25, 62],
    [14, 102],
    [6, 144],
  ],
  // West River: Northwest canyon -> west of Cabana dos Cedros -> Southwest valley
  [
    [-90, -132],
    [-82, -88],
    [-69, -42],
    [-66, -2],
    [-68, 36],
    [-62, 78],
    [-55, 118],
    [-50, 146],
  ],
];

// Dramatic interior rocky mountain peaks (away from clearings, cabins, villages, and rivers)
export const MOUNTAIN_PEAKS: Array<{ x: number; z: number; radius: number; height: number }> = [
  { x: 96, z: -78, radius: 26, height: 18.5 },
  { x: -102, z: -72, radius: 25, height: 17.0 },
  { x: 94, z: 74, radius: 26, height: 16.5 },
  { x: -98, z: 78, radius: 24, height: 15.8 },
  { x: 26, z: -108, radius: 24, height: 15.2 },
  { x: -34, z: 108, radius: 24, height: 14.5 },
];

// Winding trail polylines connecting clearings & scattered villages organically
const TRAIL_PATHS: Array<Array<[number, number]>> = [
  // Central -> Altar das Ruínas (NW)
  [
    [0, 0],
    [-8, -5],
    [-16, -13],
    [-23, -18],
    [-30, -25],
  ],
  // Central -> Mirante da Pedra Alta (NE)
  [
    [0, 0],
    [9, -6],
    [17, -15],
    [22, -23],
    [28, -30],
  ],
  // Central -> Riacho Esmeralda (SE)
  [
    [0, 0],
    [10, 5],
    [19, 13],
    [26, 17],
    [32, 22],
  ],
  // Central -> Bosque das Palmeiras (SW)
  [
    [0, 0],
    [-8, 7],
    [-15, 16],
    [-22, 21],
    [-27, 28],
  ],
  // Bosque das Palmeiras -> Santuário da Raiz -> Riacho Esmeralda (Southern loop)
  [
    [-27, 28],
    [-14, 37],
    [0, 43],
    [16, 35],
    [27, 27],
  ],
  // Altar das Ruínas -> Mirante (Northern ridge trail)
  [
    [-30, -25],
    [-14, -33],
    [4, -34],
    [18, -33],
    [28, -30],
  ],
  // Riacho Esmeralda / Cabana do Riacho -> Vila da Nascente (crossing East River ford)
  [
    [38, 12],
    [46, 8],
    [56, 11],
    [64, 14],
    [72, 16],
  ],
  // Cabana dos Cedros -> Aldeia do Vale (crossing West River ford)
  [
    [-30, -25],
    [-42, -14],
    [-54, -4],
    [-67, 8],
    [-75, 17],
    [-82, 24],
  ],
  // Northern ridge -> Vila das Montanhas
  [
    [4, -34],
    [10, -48],
    [2, -64],
    [-6, -74],
    [-10, -82],
  ],
];

// Trail signposts at major trail forks
export const TRAIL_SIGNPOSTS: Array<{ x: number; z: number; rotY: number }> = [
  { x: -4.5, z: -4.5, rotY: 0.45 },
  { x: 22.5, z: 14.5, rotY: 1.1 },
  { x: -42.5, z: -13.5, rotY: -0.75 },
  { x: 4.5, z: -36.5, rotY: 0.12 },
  { x: 52.0, z: 10.0, rotY: 1.45 },
  { x: -64.0, z: 9.5, rotY: -0.85 },
];

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function distToSegmentSq(
  px: number,
  pz: number,
  ax: number,
  az: number,
  bx: number,
  bz: number,
): number {
  const vx = bx - ax;
  const vz = bz - az;
  const wx = px - ax;
  const wz = pz - az;
  const lenSq = vx * vx + vz * vz;
  if (lenSq < 1e-6) return wx * wx + wz * wz;
  const t = Math.max(0, Math.min(1, (wx * vx + wz * vz) / lenSq));
  const cx = ax + t * vx - px;
  const cz = az + t * vz - pz;
  return cx * cx + cz * cz;
}

/**
 * Returns 0..1 indicating proximity to a carved river channel.
 */
export function riverFactorAt(x: number, z: number): number {
  let minDistSq = Infinity;
  const wx = x + Math.sin(z * 0.14) * 1.15;
  const wz = z + Math.cos(x * 0.14) * 1.15;

  for (let r = 0; r < RIVER_PATHS.length; r++) {
    const pts = RIVER_PATHS[r];
    for (let i = 0; i < pts.length - 1; i++) {
      const dSq = distToSegmentSq(wx, wz, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
      if (dSq < minDistSq) minDistSq = dSq;
    }
  }

  const dist = Math.sqrt(minDistSq);
  // River channel ~4.2m wide deep center, feathering out to banks at ~7.6m
  return 1 - smoothstep(2.2, 6.4, dist);
}

/**
 * Returns 0..1 indicating rocky mountain height factor at (x, z).
 */
export function mountainFactorAt(x: number, z: number): number {
  const r = Math.hypot(x, z);
  let m = smoothstep(126, 174, r);

  for (let i = 0; i < MOUNTAIN_PEAKS.length; i++) {
    const pk = MOUNTAIN_PEAKS[i];
    const d = Math.hypot(x - pk.x, z - pk.z);
    const f = 1 - smoothstep(pk.radius * 0.18, pk.radius, d);
    if (f > m) m = f;
  }
  return m;
}

/**
 * Returns 0..1 indicating whether (x, z) lies on a beaten jungle trail.
 */
export function trailFactorAt(x: number, z: number): number {
  let minDistSq = Infinity;
  const wx = x + Math.sin(z * 0.22) * 0.65;
  const wz = z + Math.cos(x * 0.22) * 0.65;

  for (let p = 0; p < TRAIL_PATHS.length; p++) {
    const pts = TRAIL_PATHS[p];
    for (let i = 0; i < pts.length - 1; i++) {
      const dSq = distToSegmentSq(wx, wz, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
      if (dSq < minDistSq) minDistSq = dSq;
    }
  }

  const dist = Math.sqrt(minDistSq);
  return 1 - smoothstep(1.35, 3.3, dist);
}

/**
 * Returns 0..1 indicating proximity to one of the open sunlit clearings.
 */
export function clearingFactorAt(x: number, z: number): number {
  let maxFactor = 0;
  for (let i = 0; i < CLEARINGS.length; i++) {
    const c = CLEARINGS[i];
    const dx = x - c.x;
    const dz = z - c.z;
    const d = Math.sqrt(dx * dx + dz * dz);
    const f = 1 - smoothstep(c.radius * 0.55, c.radius * 1.15, d);
    if (f > maxFactor) maxFactor = f;
  }
  return maxFactor;
}

/**
 * Deterministic heightfield for the tropical jungle terrain, rivers, mountains & villages.
 */
export function groundHeightAt(x: number, z: number): number {
  // Base rolling jungle topography
  const baseNoise =
    Math.sin(x * 0.065) * Math.cos(z * 0.07) * 0.85 +
    Math.sin(x * 0.14 + z * 0.11) * 0.28 +
    Math.cos(x * 0.032 - z * 0.045) * 0.55;

  // Flatten slightly along trails so walking feels smooth
  const trail = trailFactorAt(x, z);
  let h = baseNoise * (1 - trail * 0.55);

  // Scenic mountain perimeter ridges + strategic rock peaks (suppressed near rivers/villages)
  const r = Math.hypot(x, z);
  const rimT = smoothstep(130, 175, r);
  const ridgeWave =
    0.55 +
    0.45 * Math.abs(Math.sin(x * 0.048 + z * 0.036)) +
    0.25 * Math.sin(x * 0.11 - z * 0.09);
  let mountainH = rimT * 19.5 * ridgeWave;

  for (let i = 0; i < MOUNTAIN_PEAKS.length; i++) {
    const pk = MOUNTAIN_PEAKS[i];
    const d = Math.hypot(x - pk.x, z - pk.z);
    const f = 1 - smoothstep(pk.radius * 0.12, pk.radius, d);
    if (f > 0.001) {
      const crag = 0.78 + 0.22 * Math.sin(x * 0.22 + z * 0.18);
      mountainH = Math.max(mountainH, f * f * pk.height * crag);
    }
  }
  h += mountainH;

  // Blend in clearing target elevations smoothly
  let clearingWeightSum = 0;
  let clearingTarget = 0;
  for (let i = 0; i < CLEARINGS.length; i++) {
    const c = CLEARINGS[i];
    const dx = x - c.x;
    const dz = z - c.z;
    const d = Math.sqrt(dx * dx + dz * dz);
    const w = 1 - smoothstep(c.radius * 0.45, c.radius * 1.65, d);
    if (w > 0.001) {
      clearingWeightSum += w;
      clearingTarget += c.elevation * w;
    }
  }
  if (clearingWeightSum > 0) {
    const blend = Math.min(1, clearingWeightSum);
    const avgTarget = clearingTarget / clearingWeightSum;
    h = h * (1 - blend) + avgTarget * blend;
  }

  // Flatten natural foundation pads beneath scattered villages
  let villageWeightSum = 0;
  let villageTarget = 0;
  for (let i = 0; i < VILLAGES.length; i++) {
    const v = VILLAGES[i];
    const d = Math.hypot(x - v.x, z - v.z);
    const w = 1 - smoothstep(v.radius * 0.72, v.radius * 1.35, d);
    if (w > 0.001) {
      villageWeightSum += w;
      villageTarget += v.elevation * w;
    }
  }
  if (villageWeightSum > 0) {
    const blend = Math.min(1, villageWeightSum);
    const avgTarget = villageTarget / villageWeightSum;
    h = h * (1 - blend) + avgTarget * blend;
  }

  // Flatten natural foundation pads beneath rustic cabins
  let cabinWeightSum = 0;
  let cabinTarget = 0;
  for (let i = 0; i < CABINS.length; i++) {
    const cab = CABINS[i];
    const d = Math.hypot(x - cab.x, z - cab.z);
    const w = 1 - smoothstep(4.2, 8.8, d);
    if (w > 0.001) {
      cabinWeightSum += w;
      cabinTarget += cab.elevation * w;
    }
  }
  if (cabinWeightSum > 0) {
    const blend = Math.min(1, cabinWeightSum);
    const avgTarget = cabinTarget / cabinWeightSum;
    h = h * (1 - blend) + avgTarget * blend;
  }

  // Carve winding swimmable rivers (with slightly shallower trail fords where trails cross)
  const river = riverFactorAt(x, z);
  if (river > 0.001) {
    const bedDepth = trail > 0.4 ? WATER_LEVEL - 0.36 : WATER_LEVEL - 1.18;
    h = h * (1 - river) + bedDepth * river;
  }

  // Sunken pond basin in Riacho Esmeralda
  const pdx = x - POND_CENTER.x;
  const pdz = z - POND_CENTER.z;
  const pondDist = Math.sqrt(pdx * pdx + pdz * pdz);
  const pondDip = 1 - smoothstep(POND_CENTER.radius * 0.35, POND_CENTER.radius * 1.18, pondDist);
  h -= pondDip * 0.92;

  return h;
}

export function getZoneIdAt(x: number, z: number): ZoneId {
  for (let i = 0; i < VILLAGES.length; i++) {
    const v = VILLAGES[i];
    const dx = x - v.x;
    const dz = z - v.z;
    if (dx * dx + dz * dz <= v.radius * v.radius) {
      return v.id;
    }
  }
  for (let i = 0; i < CABINS.length; i++) {
    const cab = CABINS[i];
    const dx = x - cab.x;
    const dz = z - cab.z;
    if (dx * dx + dz * dz <= 36) {
      return cab.id as ZoneId;
    }
  }
  for (let i = 0; i < CLEARINGS.length; i++) {
    const c = CLEARINGS[i];
    const dx = x - c.x;
    const dz = z - c.z;
    if (dx * dx + dz * dz <= (c.radius + 1.5) * (c.radius + 1.5)) {
      return c.id as ZoneId;
    }
  }
  if (trailFactorAt(x, z) > 0.38) {
    return 'trail';
  }
  return 'dense_jungle';
}

export function getZoneNameAt(x: number, z: number): string {
  for (let i = 0; i < VILLAGES.length; i++) {
    const v = VILLAGES[i];
    const dx = x - v.x;
    const dz = z - v.z;
    if (dx * dx + dz * dz <= v.radius * v.radius) {
      return v.name;
    }
  }
  for (let i = 0; i < CABINS.length; i++) {
    const cab = CABINS[i];
    const dx = x - cab.x;
    const dz = z - cab.z;
    if (dx * dx + dz * dz <= 36) {
      return cab.name;
    }
  }
  for (let i = 0; i < CLEARINGS.length; i++) {
    const c = CLEARINGS[i];
    const dx = x - c.x;
    const dz = z - c.z;
    if (dx * dx + dz * dz <= (c.radius + 1.5) * (c.radius + 1.5)) {
      return c.name;
    }
  }
  if (trailFactorAt(x, z) > 0.38) {
    return 'Trilha da Mata';
  }
  return 'Selva Densa';
}

export function createInitialInteractables(): InteractablePoint[] {
  return [
    {
      id: 'relic-sun',
      kind: 'relic',
      title: 'Relíquia do Sol Nascente',
      subtitle: 'Amuleto dourado deixado junto à clareira inicial',
      x: 5.5,
      z: -6.5,
      radius: 2.4,
      collected: false,
    },
    {
      id: 'relic-jaguar',
      kind: 'relic',
      title: 'Ídolo do Jaguar',
      subtitle: 'Escultura antiga guardada no altar de pedra',
      x: -33.5,
      z: -28.0,
      radius: 2.4,
      collected: false,
    },
    {
      id: 'relic-orchid',
      kind: 'relic',
      title: 'Orquídea Dourada',
      subtitle: 'Flor luminosa rara que cresce no mirante elevado',
      x: 31.0,
      z: -33.0,
      radius: 2.4,
      collected: false,
    },
    {
      id: 'relic-crystal',
      kind: 'relic',
      title: 'Cristal da Nascente',
      subtitle: 'Quartzo esmeralda polido pelas águas do riacho',
      x: 27.5,
      z: 24.5,
      radius: 2.4,
      collected: false,
    },
    {
      id: 'relic-root',
      kind: 'relic',
      title: 'Totem das Raízes',
      subtitle: 'Talismã talhado na madeira do santuário sul',
      x: 0.5,
      z: 44.5,
      radius: 2.4,
      collected: false,
    },
    {
      id: 'landmark-ruins',
      kind: 'landmark',
      title: 'Altar das Ruínas',
      subtitle: 'Monólito ancestral tomado por musgos e cipós',
      x: -27.0,
      z: -22.5,
      radius: 3.1,
      collected: false,
    },
    {
      id: 'landmark-overlook',
      kind: 'landmark',
      title: 'Mirante da Pedra Alta',
      subtitle: 'Platô rochoso com vista aberta sobre a copa das árvores',
      x: 25.0,
      z: -28.0,
      radius: 3.1,
      collected: false,
    },
    {
      id: 'landmark-stream',
      kind: 'landmark',
      title: 'Nascente Esmeralda',
      subtitle: 'Lagoa cristalina cercada por samambaias e pedras lisas',
      x: 29.5,
      z: 19.0,
      radius: 3.1,
      collected: false,
    },
  ];
}

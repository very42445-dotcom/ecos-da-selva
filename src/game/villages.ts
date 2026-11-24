export interface VillageHutDef {
  lx: number;
  lz: number;
  rotY: number;
  scale: number;
}

export interface VillageTorchDef {
  lx: number;
  lz: number;
}

export interface VillageFenceDef {
  lx: number;
  lz: number;
  rotY: number;
  length: number;
}

export interface VillageNpcDef {
  id: string;
  lx: number;
  lz: number;
  patrolRadius: number;
  speed: number;
  shirtHex: number;
  pantsHex: number;
  hasHat: boolean;
}

export interface VillageDef {
  id: 'village-nascente' | 'village-vale' | 'village-norte';
  name: string;
  x: number;
  z: number;
  radius: number;
  elevation: number;
  huts: VillageHutDef[];
  torches: VillageTorchDef[];
  fences: VillageFenceDef[];
  npcs: VillageNpcDef[];
}

export const VILLAGES: VillageDef[] = [
  {
    id: 'village-nascente',
    name: 'Vila da Nascente',
    x: 72,
    z: 16,
    radius: 14.5,
    elevation: 0.35,
    huts: [
      { lx: -5.4, lz: -5.2, rotY: 0.65, scale: 0.92 },
      { lx: 6.2, lz: -4.4, rotY: -0.78, scale: 0.96 },
      { lx: 1.4, lz: 6.6, rotY: Math.PI - 0.25, scale: 0.9 },
    ],
    torches: [
      { lx: -2.2, lz: -1.8 },
      { lx: 3.1, lz: -1.2 },
      { lx: 0.2, lz: 3.1 },
    ],
    fences: [
      { lx: -8.6, lz: 1.5, rotY: 1.38, length: 5.0 },
      { lx: 8.8, lz: 1.6, rotY: -1.45, length: 5.0 },
      { lx: 0.2, lz: -8.8, rotY: 0.04, length: 5.5 },
    ],
    npcs: [
      {
        id: 'villager-nasc-1',
        lx: -1.2,
        lz: -1.6,
        patrolRadius: 2.8,
        speed: 1.25,
        shirtHex: 0x92400e,
        pantsHex: 0x3f3f46,
        hasHat: true,
      },
      {
        id: 'villager-nasc-2',
        lx: 2.8,
        lz: 2.2,
        patrolRadius: 2.2,
        speed: 1.1,
        shirtHex: 0x1e5631,
        pantsHex: 0x44403c,
        hasHat: false,
      },
    ],
  },
  {
    id: 'village-vale',
    name: 'Aldeia do Vale',
    x: -82,
    z: 24,
    radius: 14.5,
    elevation: 0.48,
    huts: [
      { lx: -5.8, lz: -4.6, rotY: 0.72, scale: 0.95 },
      { lx: 5.8, lz: -4.8, rotY: -0.68, scale: 0.9 },
      { lx: -0.6, lz: 6.8, rotY: Math.PI + 0.18, scale: 0.94 },
    ],
    torches: [
      { lx: -2.6, lz: -1.2 },
      { lx: 2.8, lz: -1.5 },
      { lx: -0.4, lz: 3.2 },
    ],
    fences: [
      { lx: -9.0, lz: 1.8, rotY: 1.48, length: 5.2 },
      { lx: 8.8, lz: 2.0, rotY: -1.4, length: 5.2 },
      { lx: 0.0, lz: -8.6, rotY: -0.05, length: 5.4 },
    ],
    npcs: [
      {
        id: 'villager-vale-1',
        lx: -1.6,
        lz: 0.8,
        patrolRadius: 2.6,
        speed: 1.2,
        shirtHex: 0x7c2d12,
        pantsHex: 0x334155,
        hasHat: true,
      },
      {
        id: 'villager-vale-2',
        lx: 2.4,
        lz: -2.0,
        patrolRadius: 0,
        speed: 0,
        shirtHex: 0x365314,
        pantsHex: 0x292524,
        hasHat: false,
      },
    ],
  },
  {
    id: 'village-norte',
    name: 'Vila das Montanhas',
    x: -10,
    z: -82,
    radius: 14.5,
    elevation: 1.05,
    huts: [
      { lx: -5.6, lz: -5.0, rotY: 0.58, scale: 0.96 },
      { lx: 6.0, lz: -4.5, rotY: -0.64, scale: 0.92 },
      { lx: 0.4, lz: 6.4, rotY: Math.PI - 0.14, scale: 0.92 },
    ],
    torches: [
      { lx: -2.4, lz: -1.5 },
      { lx: 2.6, lz: -1.4 },
      { lx: 0.2, lz: 2.8 },
    ],
    fences: [
      { lx: -8.6, lz: 1.4, rotY: 1.44, length: 5.0 },
      { lx: 8.6, lz: 1.4, rotY: -1.44, length: 5.0 },
      { lx: 0.0, lz: -8.8, rotY: 0.0, length: 5.6 },
    ],
    npcs: [
      {
        id: 'villager-norte-1',
        lx: 0.6,
        lz: -0.8,
        patrolRadius: 3.0,
        speed: 1.28,
        shirtHex: 0x1e3a5f,
        pantsHex: 0x3f3f46,
        hasHat: true,
      },
      {
        id: 'villager-norte-2',
        lx: -2.5,
        lz: 2.4,
        patrolRadius: 2.0,
        speed: 1.05,
        shirtHex: 0x713f12,
        pantsHex: 0x44403c,
        hasHat: true,
      },
    ],
  },
];

export const GUIDE_NPC_POS = { x: -1.5, z: -2.5 };

export function villageExclusionAt(x: number, z: number): number {
  let maxEx = 0;
  for (let i = 0; i < VILLAGES.length; i++) {
    const v = VILLAGES[i];
    const d = Math.hypot(x - v.x, z - v.z);
    if (d < v.radius) {
      const f = 1 - Math.max(0, (d - (v.radius - 4.0)) / 4.0);
      if (f > maxEx) maxEx = f;
    }
  }
  return maxEx;
}

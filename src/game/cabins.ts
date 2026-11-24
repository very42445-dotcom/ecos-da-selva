export interface CabinDef {
  id: string;
  name: string;
  x: number;
  z: number;
  rotY: number;
  elevation: number;
  hasLoot: boolean;
}

export const CABIN_HALF_W = 3.0;
export const CABIN_HALF_D = 2.7;
export const CABIN_FLOOR_THICKNESS = 0.16;

export const CABINS: CabinDef[] = [
  {
    id: 'cabin-trail',
    name: 'Cabana da Trilha',
    x: -14,
    z: 10,
    rotY: 0.45,
    elevation: 0.25,
    hasLoot: true,
  },
  {
    id: 'cabin-stream',
    name: 'Abrigo do Riacho',
    x: 44,
    z: 5,
    rotY: -0.85,
    elevation: 0.35,
    hasLoot: false, // Apenas mobiliada / decoração
  },
  {
    id: 'cabin-north',
    name: 'Posto da Mata Alta',
    x: 15,
    z: -48,
    rotY: 2.85,
    elevation: 1.25,
    hasLoot: true,
  },
  {
    id: 'cabin-cedars',
    name: 'Cabana dos Cedros',
    x: -50,
    z: -10,
    rotY: 1.25,
    elevation: 0.5,
    hasLoot: true,
  },
  {
    id: 'cabin-abandoned',
    name: 'Refúgio Abandonado',
    x: -45,
    z: 48,
    rotY: -2.3,
    elevation: 0.45,
    hasLoot: false, // Apenas mobiliada / decoração
  },
  {
    id: 'cabin-forester',
    name: 'Casa do Mateiro',
    x: 54,
    z: 44,
    rotY: -2.65,
    elevation: 0.4,
    hasLoot: true,
  },
];

/**
 * Converts a local offset inside a cabin into world (x, z) coordinates.
 */
export function cabinLocalToWorld(
  cabin: CabinDef,
  lx: number,
  lz: number,
): { x: number; z: number } {
  const c = Math.cos(cabin.rotY);
  const s = Math.sin(cabin.rotY);
  return {
    x: cabin.x + lx * c + lz * s,
    z: cabin.z - lx * s + lz * c,
  };
}

/**
 * Returns 0..1 proximity factor used to keep trees/rocks clear around cabins.
 */
export function cabinExclusionAt(x: number, z: number): number {
  let maxF = 0;
  for (let i = 0; i < CABINS.length; i++) {
    const c = CABINS[i];
    const d = Math.hypot(x - c.x, z - c.z);
    if (d < 7.2) {
      const f = Math.max(0, Math.min(1, (7.2 - d) / 2.2));
      if (f > maxF) maxF = f;
    }
  }
  return maxF;
}

/**
 * Returns true if (x, z) is inside any rustic cabin's sheltered interior.
 */
export function isInsideAnyCabin(x: number, z: number): boolean {
  for (let i = 0; i < CABINS.length; i++) {
    const cab = CABINS[i];
    const dx = x - cab.x;
    const dz = z - cab.z;
    if (dx * dx + dz * dz > 22) continue;
    const c = Math.cos(-cab.rotY);
    const s = Math.sin(-cab.rotY);
    const lx = dx * c + dz * s;
    const lz = -dx * s + dz * c;
    if (Math.abs(lx) < CABIN_HALF_W + 0.35 && Math.abs(lz) < CABIN_HALF_D + 0.35) {
      return true;
    }
  }
  return false;
}

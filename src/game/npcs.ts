import * as THREE from 'three';
import { groundHeightAt } from './terrain';
import { ProceduralTextures } from './textures';
import { CircleCollider } from './types';
import { GUIDE_NPC_POS, VILLAGES } from './villages';

export interface NpcSystem {
  group: THREE.Group;
  colliders: CircleCollider[];
  guidePos: { x: number; z: number };
  setGuideCompleted: (done: boolean) => void;
  setPotatoMode: (potato: boolean) => void;
  update: (dt: number, elapsed: number, playerX: number, playerZ: number) => void;
  dispose: () => void;
}

interface VillagerEntry {
  root: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  homeX: number;
  homeZ: number;
  patrolRadius: number;
  phase: number;
  speed: number;
}

export function createNpcSystem(
  textures: ProceduralTextures,
  isPotato: boolean,
  castShadows: boolean,
): NpcSystem {
  const group = new THREE.Group();
  const colliders: CircleCollider[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const trackedMats: Array<{
    mat: THREE.MeshStandardMaterial;
    map: THREE.Texture | null;
    color: number;
  }> = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = (mat: THREE.MeshStandardMaterial, map: THREE.Texture | null, color: number) => {
    materials.push(mat);
    trackedMats.push({ mat, map, color });
    if (isPotato) {
      mat.map = null;
      mat.flatShading = true;
    } else if (map) {
      mat.map = map;
    }
    return mat;
  };

  const skinMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xbc8863, roughness: 0.72 }),
    textures.survivorSkin,
    0xbc8863,
  );
  const guideTunicMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x3b6645, roughness: 0.85 }),
    textures.survivorJacket,
    0x3b6645,
  );
  const guideScarfMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xd99b26, roughness: 0.78 }),
    null,
    0xd99b26,
  );
  const pantsMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x3f372d, roughness: 0.88 }),
    textures.survivorPants,
    0x3f372d,
  );
  const bootMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x2a1d14, roughness: 0.85 }),
    null,
    0x2a1d14,
  );
  const hatMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x7c5a34, roughness: 0.9 }),
    null,
    0x7c5a34,
  );
  const hairMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x211914, roughness: 0.88 }),
    null,
    0x211914,
  );
  const staffWoodMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x62442a, roughness: 0.9 }),
    textures.bark,
    0x62442a,
  );

  const buildHumanNpc = (
    tunicMat: THREE.MeshStandardMaterial,
    accentMat: THREE.MeshStandardMaterial,
    withHat: boolean,
    withStaff: boolean,
  ): VillagerEntry => {
    const root = new THREE.Group();

    const buildLimb = (
      mat: THREE.MeshStandardMaterial,
      rTop: number,
      rBot: number,
      len: number,
      withBoot: boolean,
    ) => {
      const pivot = new THREE.Group();
      const mesh = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(rTop, rBot, len, 8)), mat);
      mesh.position.y = -len * 0.5;
      mesh.castShadow = castShadows;
      pivot.add(mesh);
      if (withBoot) {
        const boot = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.12, 0.11, 0.21)), bootMat);
        boot.position.set(0, -len + 0.04, 0.04);
        boot.castShadow = castShadows;
        pivot.add(boot);
      }
      return pivot;
    };

    const leftLeg = buildLimb(pantsMat, 0.08, 0.065, 0.84, true);
    leftLeg.position.set(-0.11, 0.84, 0);
    root.add(leftLeg);

    const rightLeg = buildLimb(pantsMat, 0.08, 0.065, 0.84, true);
    rightLeg.position.set(0.11, 0.84, 0);
    root.add(rightLeg);

    const torso = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.18, 0.15, 0.56, 10)),
      tunicMat,
    );
    torso.position.y = 1.12;
    torso.castShadow = castShadows;
    torso.receiveShadow = true;
    root.add(torso);

    // Scarf / belt sash
    const sash = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.19, 0.17, 0.11, 10)),
      accentMat,
    );
    sash.position.y = 1.37;
    sash.castShadow = castShadows;
    root.add(sash);

    const leftArm = buildLimb(tunicMat, 0.065, 0.052, 0.58, false);
    leftArm.position.set(-0.23, 1.36, 0);
    root.add(leftArm);

    const rightArm = buildLimb(tunicMat, 0.065, 0.052, 0.58, false);
    rightArm.position.set(0.23, 1.36, 0);
    root.add(rightArm);

    if (withStaff) {
      const staff = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.025, 0.032, 1.75, 7)),
        staffWoodMat,
      );
      staff.position.set(0, -0.15, 0.12);
      staff.rotation.x = 0.1;
      staff.castShadow = castShadows;
      rightArm.add(staff);
    }

    const head = new THREE.Group();
    head.position.set(0, 1.48, 0);
    root.add(head);

    const skull = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.135, 11, 9)), skinMat);
    skull.position.y = 0.08;
    skull.castShadow = castShadows;
    head.add(skull);

    const hair = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.14, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55)),
      hairMat,
    );
    hair.position.y = 0.09;
    head.add(hair);

    if (withHat) {
      const brim = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.27, 0.29, 0.028, 12)), hatMat);
      brim.position.y = 0.16;
      brim.castShadow = castShadows;
      head.add(brim);

      const crown = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.12, 0.15, 0.13, 10)), hatMat);
      crown.position.y = 0.22;
      crown.castShadow = castShadows;
      head.add(crown);
    }

    return {
      root,
      head,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      homeX: 0,
      homeZ: 0,
      patrolRadius: 0,
      phase: 0,
      speed: 0,
    };
  };

  // 1. Mandatory Starting Guide NPC
  const guideNpc = buildHumanNpc(guideTunicMat, guideScarfMat, true, true);
  const guideY = groundHeightAt(GUIDE_NPC_POS.x, GUIDE_NPC_POS.z);
  guideNpc.root.position.set(GUIDE_NPC_POS.x, guideY, GUIDE_NPC_POS.z);
  guideNpc.root.rotation.y = 0.45;
  group.add(guideNpc.root);

  colliders.push({
    x: GUIDE_NPC_POS.x,
    z: GUIDE_NPC_POS.z,
    radius: 0.65,
    kind: 'npc',
  });

  // Floating visual interaction indicator above Guide NPC (gold diamond + pulse ground ring)
  const indicatorMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xd97706,
    emissiveIntensity: 0.9,
    roughness: 0.25,
    metalness: 0.2,
  });
  materials.push(indicatorMat);

  const guideMarker = new THREE.Group();
  guideMarker.position.set(0, 2.28, 0);
  const diamond = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.19, 0)), indicatorMat);
  diamond.scale.set(0.85, 1.35, 0.85);
  guideMarker.add(diamond);

  const haloRing = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.28, 0.025, 6, 20)),
    indicatorMat,
  );
  haloRing.rotation.x = Math.PI * 0.5;
  guideMarker.add(haloRing);
  guideNpc.root.add(guideMarker);

  const groundRingMat = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide,
  });
  materials.push(groundRingMat);
  const groundRing = new THREE.Mesh(
    trackGeo(new THREE.RingGeometry(0.75, 0.95, 24)),
    groundRingMat,
  );
  groundRing.rotation.x = -Math.PI * 0.5;
  groundRing.position.set(GUIDE_NPC_POS.x, guideY + 0.05, GUIDE_NPC_POS.z);
  group.add(groundRing);

  let guideCompleted = false;

  // 2. Ambient Village NPCs across the 3 scattered villages
  const villagers: VillagerEntry[] = [];

  VILLAGES.forEach((village, vIdx) => {
    village.npcs.forEach((npcSpec, nIdx) => {
      const tunicMat = trackMat(
        new THREE.MeshStandardMaterial({ color: npcSpec.shirtHex, roughness: 0.86 }),
        textures.survivorShirt,
        npcSpec.shirtHex,
      );
      const sashMat = trackMat(
        new THREE.MeshStandardMaterial({ color: npcSpec.pantsHex, roughness: 0.82 }),
        null,
        npcSpec.pantsHex,
      );
      const entry = buildHumanNpc(tunicMat, sashMat, npcSpec.hasHat, false);
      const wx = village.x + npcSpec.lx;
      const wz = village.z + npcSpec.lz;
      entry.homeX = wx;
      entry.homeZ = wz;
      entry.patrolRadius = npcSpec.patrolRadius;
      entry.phase = vIdx * 1.9 + nIdx * 2.4;
      entry.speed = npcSpec.speed || 0.8;
      entry.root.position.set(wx, groundHeightAt(wx, wz), wz);
      entry.root.rotation.y = nIdx * 1.8;
      group.add(entry.root);
      villagers.push(entry);

      if (npcSpec.patrolRadius < 0.2) {
        colliders.push({ x: wx, z: wz, radius: 0.6, kind: 'npc' });
      }
    });
  });

  const setGuideCompleted = (done: boolean) => {
    guideCompleted = done;
    guideMarker.visible = !done;
    groundRing.visible = !done;
  };

  const setPotatoMode = (potato: boolean) => {
    trackedMats.forEach(({ mat, map, color }) => {
      mat.map = potato ? null : map;
      mat.color.setHex(color);
      mat.flatShading = potato;
      mat.needsUpdate = true;
    });
  };

  const update = (dt: number, elapsed: number, playerX: number, playerZ: number) => {
    // Guide NPC turns head gently toward player + waves when not yet spoken to
    const dx = playerX - GUIDE_NPC_POS.x;
    const dz = playerZ - GUIDE_NPC_POS.z;
    const targetYaw = Math.atan2(dx, dz);
    const yawDiff = ((targetYaw - guideNpc.root.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    guideNpc.root.rotation.y += yawDiff * Math.min(1, dt * 3.4);
    guideNpc.head.rotation.y = Math.sin(elapsed * 0.9) * 0.1;

    if (!guideCompleted) {
      guideMarker.position.y = 2.26 + Math.sin(elapsed * 3.1) * 0.11;
      guideMarker.rotation.y = elapsed * 1.7;
      const pulse = 1 + Math.sin(elapsed * 3.6) * 0.14;
      groundRing.scale.set(pulse, pulse, 1);
      groundRingMat.opacity = 0.34 + Math.sin(elapsed * 3.6) * 0.16;
      guideNpc.leftArm.rotation.x = -0.35 + Math.sin(elapsed * 3.0) * 0.18;
      guideNpc.leftArm.rotation.z = -0.25 + Math.sin(elapsed * 3.0) * 0.14;
    } else {
      guideNpc.leftArm.rotation.x = THREE.MathUtils.damp(guideNpc.leftArm.rotation.x, 0, 6, dt);
      guideNpc.leftArm.rotation.z = THREE.MathUtils.damp(guideNpc.leftArm.rotation.z, -0.06, 6, dt);
    }

    // Village ambient NPCs
    for (let i = 0; i < villagers.length; i++) {
      const v = villagers[i];
      if (v.patrolRadius > 0.25) {
        const ang = elapsed * v.speed * 0.45 + v.phase;
        const nx = v.homeX + Math.cos(ang) * v.patrolRadius;
        const nz = v.homeZ + Math.sin(ang) * v.patrolRadius;
        const moveDx = nx - v.root.position.x;
        const moveDz = nz - v.root.position.z;
        v.root.position.set(nx, groundHeightAt(nx, nz), nz);
        if (moveDx * moveDx + moveDz * moveDz > 0.00001) {
          v.root.rotation.y = Math.atan2(moveDx, moveDz);
        }
        const stride = Math.sin(elapsed * 5.2 + v.phase) * 0.45;
        v.leftLeg.rotation.x = stride;
        v.rightLeg.rotation.x = -stride;
        v.leftArm.rotation.x = -stride * 0.7;
        v.rightArm.rotation.x = stride * 0.7;
      } else {
        v.head.rotation.y = Math.sin(elapsed * 0.8 + v.phase) * 0.28;
        v.leftArm.rotation.x = Math.sin(elapsed * 1.6 + v.phase) * 0.08;
        v.rightArm.rotation.x = -Math.sin(elapsed * 1.4 + v.phase) * 0.12 - 0.15;
      }
    }
  };

  return {
    group,
    colliders,
    guidePos: GUIDE_NPC_POS,
    setGuideCompleted,
    setPotatoMode,
    update,
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}

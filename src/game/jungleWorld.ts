import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { ProceduralTextures } from './textures';
import {
  CABINS,
  CABIN_FLOOR_THICKNESS,
  CABIN_HALF_D,
  CABIN_HALF_W,
  cabinExclusionAt,
  cabinLocalToWorld,
  CabinDef,
} from './cabins';
import {
  CLEARINGS,
  clearingFactorAt,
  groundHeightAt,
  MOUNTAIN_PEAKS,
  mountainFactorAt,
  PLAYABLE_RADIUS,
  POND_CENTER,
  RIVER_PATHS,
  riverFactorAt,
  TRAIL_SIGNPOSTS,
  trailFactorAt,
  WATER_LEVEL,
  WORLD_RADIUS,
} from './terrain';
import { CircleCollider, InteractablePoint, VisualQuality } from './types';
import { JungleAudioEngine } from './audio';
import { createTreeTemplateLibrary, TreeArchetype } from './trees';
import { createNpcSystem } from './npcs';
import { GUIDE_NPC_POS, VILLAGES, villageExclusionAt } from './villages';

export interface WorldVisualObject {
  id: string;
  kind: 'relic' | 'landmark' | 'gatherable';
  group: THREE.Group;
  artifact: THREE.Object3D;
  ring: THREE.Mesh;
  light: THREE.PointLight | null;
  baseY: number;
  keepBaseOnCollect?: boolean;
}

export interface ResourceAttackResult {
  hit: boolean;
  kind: 'tree' | 'rock';
  destroyed: boolean;
  hp: number;
  maxHp: number;
  dropX: number;
  dropZ: number;
  dropPoints: Array<{ x: number; z: number }>;
}

export interface BurstParticle {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  active: boolean;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

export interface BedSpot {
  id: string;
  x: number;
  z: number;
}

export interface JungleWorldHandle {
  group: THREE.Group;
  colliders: CircleCollider[];
  bedSpots: BedSpot[];
  visualInteractables: Map<string, WorldVisualObject>;
  spawnBurst: (x: number, y: number, z: number, colorHex: number, count?: number) => void;
  spawnDynamicGatherable: (item: InteractablePoint) => void;
  spawnCampfire: (x: number, z: number) => { id: string; x: number; z: number };
  setGuideCompleted: (done: boolean) => void;
  tryPlayerAttackResource: (
    playerPos: THREE.Vector3,
    playerYaw: number,
    damage: number,
    range: number,
    audio: JungleAudioEngine,
    heavy: boolean,
  ) => ResourceAttackResult | null;
  clearCampfires: () => void;
  clearDynamicVisuals: () => void;
  markInteractableCollected: (id: string, kind: 'relic' | 'landmark' | 'gatherable') => void;
  resetVisuals: (items: InteractablePoint[]) => void;
  setTimeAndWeather: (
    sunAngle: number,
    nightFactor: number,
    twilightFactor: number,
    skyTintHex: number,
    sunbeamOpacity: number,
    mistIntensity: number,
    rainIntensity: number,
    cameraFar: number,
  ) => void;
  update: (
    dt: number,
    elapsed: number,
    focusX: number,
    focusZ: number,
    rainIntensity: number,
    nightFactor: number,
  ) => void;
  dispose: () => void;
}

function makeSeededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function buildJungleWorld(
  textures: ProceduralTextures,
  interactables: InteractablePoint[],
  quality: VisualQuality,
  isSoftwareGl: boolean,
): JungleWorldHandle {
  const group = new THREE.Group();
  const colliders: CircleCollider[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const visualInteractables = new Map<string, WorldVisualObject>();
  const dynamicIds = new Set<string>();

  const isPotato = quality === 'potato';
  const isUltraLow = quality === 'ultra-low';
  const isHighTier = quality === 'high' || quality === 'ultra-high';

  const windTimeUniform = { value: 0 };
  const windStrengthUniform = { value: 1.0 };

  type WindKind = 'canopy' | 'frond' | 'vine' | 'grass' | 'shrub';
  const applyWindSway = <T extends THREE.Material>(mat: T, kind: WindKind): T => {
    mat.customProgramCacheKey = () => `jungle-wind-${kind}-v1`;
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uWindTime = windTimeUniform;
      shader.uniforms.uWindStrength = windStrengthUniform;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>
uniform float uWindTime;
uniform float uWindStrength;`,
      );

      let swaySnippet = '';
      if (kind === 'grass') {
        swaySnippet = `
vec4 windLocal = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
  vec4 windWPos = modelMatrix * instanceMatrix * windLocal;
#else
  vec4 windWPos = modelMatrix * windLocal;
#endif
float windH = clamp(transformed.y, 0.0, 1.1);
float windBend = windH * windH * uWindStrength;
float gustBand = 0.65 + 0.45 * sin(uWindTime * 0.72 + windWPos.x * 0.14 - windWPos.z * 0.12);
float windWaveA = sin(uWindTime * 2.2 + windWPos.x * 0.52 + windWPos.z * 0.41);
float windWaveB = cos(uWindTime * 1.35 + windWPos.z * 0.31 - windWPos.x * 0.24);
transformed.x += (windWaveA * 0.13 + windWaveB * 0.055) * windBend * gustBand;
transformed.z += (windWaveB * 0.105 + windWaveA * 0.045) * windBend * gustBand;`;
      } else if (kind === 'shrub') {
        swaySnippet = `
vec4 windLocal = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
  vec4 windWPos = modelMatrix * instanceMatrix * windLocal;
#else
  vec4 windWPos = modelMatrix * windLocal;
#endif
float windH = clamp((transformed.y + 0.12) * 1.1, 0.0, 1.0);
float windBend = windH * uWindStrength;
float windWaveA = sin(uWindTime * 1.55 + windWPos.x * 0.35 + windWPos.z * 0.29);
float windWaveB = cos(uWindTime * 0.95 + windWPos.z * 0.22);
transformed.x += (windWaveA * 0.065 + windWaveB * 0.025) * windBend;
transformed.z += (windWaveB * 0.055 + windWaveA * 0.02) * windBend;`;
      } else if (kind === 'frond') {
        swaySnippet = `
vec4 windLocal = vec4(transformed, 1.0);
vec4 windWPos = modelMatrix * windLocal;
float windH = clamp((transformed.y - 2.6) / 5.4, 0.2, 1.0);
float windBend = windH * windH * uWindStrength;
float windWaveA = sin(uWindTime * 1.65 + windWPos.x * 0.28 + windWPos.z * 0.25);
float windWaveB = cos(uWindTime * 1.05 + windWPos.z * 0.21);
transformed.z += (windWaveA * 0.19 + windWaveB * 0.08) * windBend;
transformed.x += (windWaveB * 0.12) * windBend;
transformed.y += sin(uWindTime * 2.1 + windWPos.x * 0.45) * 0.045 * windBend;`;
      } else if (kind === 'vine') {
        swaySnippet = `
vec4 windWPos = modelMatrix * vec4(transformed, 1.0);
float windH = clamp(1.0 - smoothstep(2.0, 9.0, transformed.y), 0.15, 1.0);
float windBend = windH * uWindStrength;
float windWaveA = sin(uWindTime * 1.35 + windWPos.x * 0.38 + windWPos.z * 0.31);
float windWaveB = cos(uWindTime * 0.88 + windWPos.z * 0.27);
transformed.x += windWaveA * 0.08 * windBend;
transformed.z += windWaveB * 0.065 * windBend;`;
      } else {
        swaySnippet = `
vec4 windWPos = modelMatrix * vec4(transformed, 1.0);
float windH = smoothstep(2.2, 9.5, transformed.y) * 0.85 + 0.15;
float windBend = windH * uWindStrength;
float windWaveA = sin(uWindTime * 1.28 + windWPos.x * 0.26 + windWPos.z * 0.22);
float windWaveB = cos(uWindTime * 0.84 + windWPos.z * 0.18 - windWPos.x * 0.15);
float leafFlutter = sin(uWindTime * 2.45 + windWPos.x * 1.15 + windWPos.z * 0.95) * 0.038;
transformed.x += (windWaveA * 0.09 + windWaveB * 0.04 + leafFlutter) * windBend;
transformed.z += (windWaveB * 0.075 + windWaveA * 0.03 + leafFlutter * 0.8) * windBend;
transformed.y += sin(uWindTime * 1.75 + windWPos.x * 0.36) * 0.03 * windBend;`;
      }

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
${swaySnippet}`,
      );
    };
    return mat;
  };

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    if (isPotato && m instanceof THREE.MeshStandardMaterial) {
      m.map = null;
      m.normalMap = null;
      m.roughness = 0.94;
      m.metalness = 0.0;
      m.envMapIntensity = 0;
      m.flatShading = false;
      m.needsUpdate = true;
    }
    materials.push(m);
    return m;
  };

  const castHeroShadows = !isSoftwareGl && !isPotato && !isUltraLow;
  const castDetailShadows = !isSoftwareGl && isHighTier;

  const freezeStaticHierarchy = (obj: THREE.Object3D) => {
    obj.traverse((child) => {
      child.updateMatrix();
      child.matrixAutoUpdate = false;
    });
  };

  // 1. Sky Gradient Dome (base radius 100, scaled dynamically inside camera.far)
  const skyGeo = trackGeo(new THREE.SphereGeometry(100, 24, 16));
  const skyPos = skyGeo.attributes.position;
  const skyColors = new Float32Array(skyPos.count * 3);
  const topSky = new THREE.Color(0x4aa8c5);
  const midSky = new THREE.Color(0x88cdb8);
  const horizonSky = new THREE.Color(0x9acbb2);
  const tmpColor = new THREE.Color();
  for (let i = 0; i < skyPos.count; i++) {
    const ny = Math.max(0, Math.min(1, skyPos.getY(i) / 100));
    if (ny > 0.35) {
      tmpColor.lerpColors(midSky, topSky, (ny - 0.35) / 0.65);
    } else {
      tmpColor.lerpColors(horizonSky, midSky, ny / 0.35);
    }
    skyColors[i * 3] = tmpColor.r;
    skyColors[i * 3 + 1] = tmpColor.g;
    skyColors[i * 3 + 2] = tmpColor.b;
  }
  skyGeo.setAttribute('color', new THREE.BufferAttribute(skyColors, 3));
  const skyMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      vertexColors: true,
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
    }),
  );
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  skyDome.scale.setScalar(1.8);
  group.add(skyDome);

  // 1b. Realistic Celestial Sun, Moon & Halos + Night Starfield inside skyDome
  const celestialGroup = new THREE.Group();
  skyDome.add(celestialGroup);

  const sunGroup = new THREE.Group();
  sunGroup.position.set(0, 86, -18);
  sunGroup.rotation.x = Math.PI / 2 - Math.atan2(18, 86);
  celestialGroup.add(sunGroup);

  const sunDiscMat = trackMat(
    new THREE.MeshBasicMaterial({
      map: isPotato ? null : textures.sunDisc,
      color: isPotato ? 0xfff3b8 : 0xffffff,
      transparent: !isPotato,
      opacity: 1.0,
      fog: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  const sunMesh = new THREE.Mesh(
    trackGeo(isPotato ? new THREE.CircleGeometry(5.0, 14) : new THREE.PlaneGeometry(13.5, 13.5)),
    sunDiscMat,
  );
  sunGroup.add(sunMesh);

  const sunHaloMat = trackMat(
    new THREE.MeshBasicMaterial({
      map: isPotato ? null : textures.sunHalo,
      color: 0xffdf9a,
      transparent: true,
      opacity: isPotato ? 0 : 0.65,
      fog: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  );
  const sunHalo = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(34, 34)), sunHaloMat);
  sunHalo.position.z = -0.35;
  sunGroup.add(sunHalo);

  const moonGroup = new THREE.Group();
  moonGroup.position.set(0, -86, 18);
  moonGroup.rotation.x = -Math.PI / 2 - Math.atan2(18, 86);
  celestialGroup.add(moonGroup);

  const moonMat = trackMat(
    new THREE.MeshBasicMaterial({
      map: isPotato ? null : textures.moonDisc,
      color: isPotato ? 0xdbeafe : 0xf4f8ff,
      transparent: !isPotato,
      opacity: 1.0,
      fog: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  const moonMesh = new THREE.Mesh(
    trackGeo(isPotato ? new THREE.CircleGeometry(3.9, 14) : new THREE.PlaneGeometry(10.8, 10.8)),
    moonMat,
  );
  moonGroup.add(moonMesh);

  const moonHaloMat = trackMat(
    new THREE.MeshBasicMaterial({
      map: isPotato ? null : textures.moonHalo,
      color: 0xaecbff,
      transparent: true,
      opacity: isPotato ? 0 : 0.42,
      fog: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  );
  const moonHalo = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(24, 24)), moonHaloMat);
  moonHalo.position.z = -0.35;
  moonGroup.add(moonHalo);

  const starRand = makeSeededRandom(9137);
  const starCount =
    quality === 'potato'
      ? 0
      : quality === 'ultra-low'
        ? 36
        : quality === 'low'
          ? 85
          : quality === 'medium'
            ? 140
            : quality === 'high'
              ? 190
              : 250;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const theta = starRand() * Math.PI * 2;
    const phi = Math.acos(0.08 + starRand() * 0.92);
    const r = 92;
    starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = r * Math.cos(phi);
    starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const starGeo = trackGeo(new THREE.BufferGeometry());
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMat = trackMat(
    new THREE.PointsMaterial({
      color: 0xf1f5f9,
      size: 2.4,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0,
      fog: false,
      depthWrite: false,
    }),
  );
  const starPoints = new THREE.Points(starGeo, starMat);
  starPoints.visible = false;
  if (starCount > 0) {
    skyDome.add(starPoints);
  }

  // 1c. Dynamic Real-Life 3D Sky Clouds (volume, shape, density, speed & colors react to weather + day/night)
  interface CloudPuff {
    mesh: THREE.Mesh;
    ox: number;
    oy: number;
    oz: number;
    sx: number;
    sy: number;
    sz: number;
    isTop: boolean;
  }
  interface CloudCluster {
    group: THREE.Group;
    puffs: CloudPuff[];
    nx: number; // normalized -1..1
    nz: number;
    altNorm: number; // 0..1
    speedMult: number;
    phase: number;
    clearWeight: number; // 0..1 threshold for appearing in clear weather
  }

  const cloudLayer = new THREE.Group();
  group.add(cloudLayer);

  const cloudTopMat = trackMat(
    new THREE.MeshLambertMaterial({
      color: 0xf8fafc,
      emissive: 0x1e293b,
      emissiveIntensity: 0.25,
      transparent: !isPotato,
      opacity: isPotato ? 1.0 : 0.82,
      fog: false,
      depthWrite: isPotato,
    }),
  );
  const cloudBottomMat = trackMat(
    new THREE.MeshLambertMaterial({
      color: 0xcbd5e1,
      emissive: 0x0f172a,
      emissiveIntensity: 0.3,
      transparent: !isPotato,
      opacity: isPotato ? 1.0 : 0.86,
      fog: false,
      depthWrite: isPotato,
    }),
  );

  const cloudPuffGeo = trackGeo(
    isPotato || isUltraLow
      ? new THREE.IcosahedronGeometry(1, 1)
      : new THREE.SphereGeometry(1, 9, 7),
  );
  const cloudRand = makeSeededRandom(5519);
  const cloudClusters: CloudCluster[] = [];
  const cloudCount =
    quality === 'potato'
      ? 8
      : quality === 'ultra-low'
        ? 12
        : quality === 'low'
          ? 16
          : quality === 'medium'
            ? 20
            : quality === 'high'
              ? 24
              : 28;
  const puffsPerCloud = isPotato ? 3 : isUltraLow ? 4 : 6;

  for (let c = 0; c < cloudCount; c++) {
    const cg = new THREE.Group();
    const puffs: CloudPuff[] = [];
    for (let p = 0; p < puffsPerCloud; p++) {
      const isTop = p === 0 || p % 2 === 1;
      const mesh = new THREE.Mesh(cloudPuffGeo, isTop ? cloudTopMat : cloudBottomMat);
      const ox = (p === 0 ? 0 : (cloudRand() - 0.5) * 4.8);
      const oy = isTop ? 0.35 + cloudRand() * 0.65 : -0.3 + cloudRand() * 0.35;
      const oz = (p === 0 ? 0 : (cloudRand() - 0.5) * 3.0);
      const sx = 2.0 + cloudRand() * 2.2;
      const sy = 0.85 + cloudRand() * 0.75;
      const sz = 1.6 + cloudRand() * 1.7;
      mesh.position.set(ox, oy, oz);
      mesh.scale.set(sx, sy, sz);
      cg.add(mesh);
      puffs.push({ mesh, ox, oy, oz, sx, sy, sz, isTop });
    }
    cloudLayer.add(cg);
    cloudClusters.push({
      group: cg,
      puffs,
      nx: (cloudRand() - 0.5) * 2,
      nz: (cloudRand() - 0.5) * 2,
      altNorm: cloudRand(),
      speedMult: 0.78 + cloudRand() * 0.48,
      phase: cloudRand() * Math.PI * 2,
      clearWeight: c / cloudCount,
    });
  }

  let cloudSpanHalf = 85;
  let cloudBaseY = 34;
  let currentCloudCover = 0.22;
  let currentRainState = 0;
  let currentMistState = 0.1;
  let currentNightState = 0;
  let currentTwilightState = 0;

  const _cloudTopDay = new THREE.Color(0xfafcff);
  const _cloudBotDay = new THREE.Color(0xcbd5e1);
  const _cloudTopDawn = new THREE.Color(0xffbe88);
  const _cloudBotDawn = new THREE.Color(0x9b6476);
  const _cloudTopStorm = new THREE.Color(0x6c7a89);
  const _cloudBotStorm = new THREE.Color(0x36414f);
  const _cloudTopNight = new THREE.Color(0x3b4f6e);
  const _cloudBotNight = new THREE.Color(0x182438);
  const _cloudWorkTop = new THREE.Color();
  const _cloudWorkBot = new THREE.Color();

  // 2. Sculpted Vertex-Colored Jungle Terrain
  const terrainSize = WORLD_RADIUS * 2;
  const segs =
    quality === 'potato'
      ? 44
      : quality === 'ultra-low'
        ? 52
        : quality === 'low'
          ? 68
          : quality === 'medium'
            ? 96
            : quality === 'high'
              ? 120
              : 142;
  const terrainGeo = trackGeo(new THREE.PlaneGeometry(terrainSize, terrainSize, segs, segs));
  terrainGeo.rotateX(-Math.PI / 2);

  const posAttr = terrainGeo.attributes.position;
  const colors = new Float32Array(posAttr.count * 3);

  const jungleFloorColor = new THREE.Color(0x1f391d);
  const mossColor = new THREE.Color(0x2f5426);
  const clearingGrassColor = new THREE.Color(0x436a2e);
  const trailColor = new THREE.Color(0x634d38);
  const shoreColor = new THREE.Color(0x6d654d);
  const ridgeRockColor = new THREE.Color(0x364336);

  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const y = groundHeightAt(x, z);
    posAttr.setY(i, y);

    const trail = trailFactorAt(x, z);
    const clearing = clearingFactorAt(x, z);
    const mossMix = 0.5 + 0.5 * Math.sin(x * 0.19 + z * 0.15);

    tmpColor.lerpColors(jungleFloorColor, mossColor, mossMix);
    tmpColor.lerp(clearingGrassColor, clearing * 0.68);
    tmpColor.lerp(trailColor, trail * 0.92);

    // Pond shore sand tint
    const pdx = x - POND_CENTER.x;
    const pdz = z - POND_CENTER.z;
    const pDist = Math.sqrt(pdx * pdx + pdz * pdz);
    if (pDist < POND_CENTER.radius + 2.5) {
      const shoreT = Math.max(0, 1 - Math.abs(pDist - (POND_CENTER.radius - 0.8)) / 3.2);
      tmpColor.lerp(shoreColor, shoreT * 0.82);
    }

    // Riverbank sand & pebbles tint
    const rv = riverFactorAt(x, z);
    if (rv > 0.06) {
      tmpColor.lerp(shoreColor, Math.min(1, rv * 1.15) * 0.84);
    }

    // Mountain & rocky hillside crag blend
    const mtn = mountainFactorAt(x, z);
    if (mtn > 0.14) {
      tmpColor.lerp(ridgeRockColor, Math.min(1, mtn * 1.1) * 0.78);
    }
    const r = Math.sqrt(x * x + z * z);
    if (r > PLAYABLE_RADIUS) {
      const ridgeT = Math.min(1, (r - PLAYABLE_RADIUS) / 22);
      tmpColor.lerp(ridgeRockColor, ridgeT * 0.72);
    }

    colors[i * 3] = tmpColor.r;
    colors[i * 3 + 1] = tmpColor.g;
    colors[i * 3 + 2] = tmpColor.b;
  }

  terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  terrainGeo.computeVertexNormals();

  const terrainMat = trackMat(
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      map: isPotato ? null : textures.groundDetail,
      roughness: 0.94,
      metalness: 0.0,
    }),
  );
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = !isPotato && !isUltraLow;
  group.add(terrainMesh);

  // 3. Realistic Jungle Water: Animated Ripples, Fresnel Sky Reflections, Depth Transparency & Submerged Stones
  const waterTimeUniform = { value: 0 };
  const waterSkyUniform = { value: new THREE.Color(0x88cdb8) };
  const waterSunUniform = { value: new THREE.Color(0xfff0c8) };
  const waterNightUniform = { value: 0 };

  const applyRealisticWaterShader = (
    mat: THREE.MeshPhysicalMaterial,
    isRiver: boolean,
  ): THREE.MeshPhysicalMaterial => {
    mat.customProgramCacheKey = () => (isRiver ? 'jungle-river-water-v1' : 'jungle-pond-water-v1');
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uWaterTime = waterTimeUniform;
      shader.uniforms.uSkyReflectColor = waterSkyUniform;
      shader.uniforms.uSunReflectColor = waterSunUniform;
      shader.uniforms.uNightFactor = waterNightUniform;

      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
uniform float uWaterTime;
varying vec3 vWaterWorldPos;`,
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
vec4 wPosPre = modelMatrix * vec4(transformed, 1.0);
float wFlow = ${isRiver ? 'uWaterTime * 2.2' : 'uWaterTime * 1.4'};
float waveA = sin(wPosPre.x * 0.85 + wPosPre.z * 0.72 + wFlow) * 0.022;
float waveB = cos(wPosPre.z * 1.25 - wPosPre.x * 0.65 - uWaterTime * 1.15) * 0.016;
transformed.y += waveA + waveB;
vWaterWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
        );

      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
uniform float uWaterTime;
uniform vec3 uSkyReflectColor;
uniform vec3 uSunReflectColor;
uniform float uNightFactor;
varying vec3 vWaterWorldPos;`,
        )
        .replace(
          '#include <dithering_fragment>',
          `vec3 waterViewDir = normalize(cameraPosition - vWaterWorldPos);
float fresnel = pow(clamp(1.0 - max(dot(waterViewDir, vec3(0.0, 1.0, 0.0)), 0.0), 0.0, 1.0), 2.8);
float rippleShimmer = sin(vWaterWorldPos.x * 2.4 + uWaterTime * 2.6) * cos(vWaterWorldPos.z * 2.1 - uWaterTime * 2.1);
float depthHue = 0.5 + 0.5 * sin(vWaterWorldPos.x * 0.24 - vWaterWorldPos.z * 0.22 + uWaterTime * 0.35);
vec3 shallowTeal = vec3(0.09, 0.42, 0.40);
vec3 deepEmerald = vec3(0.03, 0.21, 0.25);
vec3 waterTone = mix(deepEmerald, shallowTeal, depthHue);
gl_FragColor.rgb = mix(gl_FragColor.rgb, waterTone, 0.24);
gl_FragColor.rgb = mix(gl_FragColor.rgb, uSkyReflectColor, fresnel * (0.48 - uNightFactor * 0.14));
gl_FragColor.rgb += uSunReflectColor * max(0.0, rippleShimmer) * (0.11 * (1.0 - uNightFactor * 0.72) + fresnel * 0.16);
gl_FragColor.a = clamp(${isRiver ? '0.73' : '0.70'} + fresnel * 0.22, 0.62, 0.94);
#include <dithering_fragment>`,
        );
    };
    return mat;
  };

  const waterGeo = trackGeo(new THREE.CircleGeometry(POND_CENTER.radius + 0.6, isPotato ? 20 : 40));
  waterGeo.rotateX(-Math.PI / 2);
  const waterMat = trackMat(
    isPotato
      ? new THREE.MeshStandardMaterial({
          color: 0x2c9e8b,
          roughness: 0.9,
          metalness: 0.0,
          transparent: false,
          opacity: 1.0,
        })
      : applyRealisticWaterShader(
          new THREE.MeshPhysicalMaterial({
            color: 0x167c72,
            normalMap: textures.waterNormal,
            normalScale: new THREE.Vector2(0.55, 0.55),
            roughness: 0.08,
            metalness: 0.08,
            clearcoat: 0.92,
            clearcoatRoughness: 0.08,
            envMapIntensity: 1.4,
            transparent: true,
            opacity: 0.74,
            depthWrite: false,
          }),
          false,
        ),
  );
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.set(POND_CENTER.x, WATER_LEVEL, POND_CENTER.z);
  waterMesh.receiveShadow = !isPotato && !isUltraLow;
  group.add(waterMesh);

  const riverWaterMat = trackMat(
    isPotato
      ? new THREE.MeshStandardMaterial({
          color: 0x24968f,
          roughness: 0.9,
          metalness: 0.0,
          transparent: false,
          opacity: 1.0,
        })
      : applyRealisticWaterShader(
          new THREE.MeshPhysicalMaterial({
            map: textures.riverWater,
            color: 0x25979b,
            normalMap: textures.waterNormal,
            normalScale: new THREE.Vector2(0.65, 0.65),
            roughness: 0.09,
            metalness: 0.09,
            clearcoat: 0.92,
            clearcoatRoughness: 0.09,
            envMapIntensity: 1.45,
            transparent: true,
            opacity: 0.76,
            depthWrite: false,
          }),
          true,
        ),
  );

  const riverMeshes: THREE.Mesh[] = [];
  RIVER_PATHS.forEach((pts) => {
    const curve = new THREE.CatmullRomCurve3(
      pts.map(([px, pz]) => new THREE.Vector3(px, WATER_LEVEL, pz)),
    );
    const steps = isPotato ? 34 : 76;
    const halfW = 5.6;
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t);
      const nx = -tan.z;
      const nz = tan.x;
      const len = Math.hypot(nx, nz) || 1;
      const ox = (nx / len) * halfW;
      const oz = (nz / len) * halfW;

      positions.push(pt.x - ox, WATER_LEVEL, pt.z - oz);
      positions.push(pt.x + ox, WATER_LEVEL, pt.z + oz);
      uvs.push(0, t * 18);
      uvs.push(1, t * 18);

      if (s < steps) {
        const base = s * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    const rGeo = trackGeo(new THREE.BufferGeometry());
    rGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    rGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    rGeo.setIndex(indices);
    rGeo.computeVertexNormals();
    const rMesh = new THREE.Mesh(rGeo, riverWaterMat);
    rMesh.receiveShadow = !isPotato && !isUltraLow;
    group.add(rMesh);
    riverMeshes.push(rMesh);
  });

  // Submerged riverbed & pond cobbles visible through the semi-transparent water
  if (!isPotato) {
    const pebbleGeo = trackGeo(new THREE.DodecahedronGeometry(0.28, 1));
    pebbleGeo.scale(1.25, 0.55, 1.0);
    const pebbleMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: textures.stone,
        color: 0x6f776c,
        roughness: 0.72,
        metalness: 0.04,
      }),
    );
    const pebbleSamples: Array<{ x: number; y: number; z: number; sx: number; sy: number; sz: number; ry: number; shade: number }> = [];
    const pebbleRand = makeSeededRandom(4402);

    // Scatter pond bed pebbles
    for (let i = 0; i < 65; i++) {
      const ang = pebbleRand() * Math.PI * 2;
      const rad = Math.sqrt(pebbleRand()) * (POND_CENTER.radius - 0.6);
      const px = POND_CENTER.x + Math.cos(ang) * rad;
      const pz = POND_CENTER.z + Math.sin(ang) * rad;
      const gy = groundHeightAt(px, pz);
      if (gy < WATER_LEVEL - 0.06) {
        pebbleSamples.push({
          x: px,
          y: gy + 0.04,
          z: pz,
          sx: 0.7 + pebbleRand() * 1.4,
          sy: 0.6 + pebbleRand() * 0.8,
          sz: 0.7 + pebbleRand() * 1.4,
          ry: pebbleRand() * Math.PI * 2,
          shade: 0.72 + pebbleRand() * 0.35,
        });
      }
    }
    // Scatter riverbed pebbles along curves
    RIVER_PATHS.forEach((pts) => {
      const curve = new THREE.CatmullRomCurve3(
        pts.map(([px, pz]) => new THREE.Vector3(px, WATER_LEVEL, pz)),
      );
      for (let i = 0; i < 85; i++) {
        const pt = curve.getPointAt(pebbleRand());
        const px = pt.x + (pebbleRand() - 0.5) * 7.8;
        const pz = pt.z + (pebbleRand() - 0.5) * 7.8;
        const gy = groundHeightAt(px, pz);
        if (gy < WATER_LEVEL - 0.05) {
          pebbleSamples.push({
            x: px,
            y: gy + 0.04,
            z: pz,
            sx: 0.65 + pebbleRand() * 1.65,
            sy: 0.55 + pebbleRand() * 0.85,
            sz: 0.65 + pebbleRand() * 1.55,
            ry: pebbleRand() * Math.PI * 2,
            shade: 0.68 + pebbleRand() * 0.38,
          });
        }
      }
    });

    if (pebbleSamples.length > 0) {
      const pebbleInst = new THREE.InstancedMesh(pebbleGeo, pebbleMat, pebbleSamples.length);
      const pDummy = new THREE.Object3D();
      const pColor = new THREE.Color();
      for (let i = 0; i < pebbleSamples.length; i++) {
        const s = pebbleSamples[i];
        pDummy.position.set(s.x, s.y, s.z);
        pDummy.rotation.set(0, s.ry, 0);
        pDummy.scale.set(s.sx, s.sy, s.sz);
        pDummy.updateMatrix();
        pebbleInst.setMatrixAt(i, pDummy.matrix);
        pColor.setRGB(s.shade * 0.86, s.shade * 0.92, s.shade * 0.88);
        pebbleInst.setColorAt(i, pColor);
      }
      pebbleInst.instanceMatrix.needsUpdate = true;
      if (pebbleInst.instanceColor) pebbleInst.instanceColor.needsUpdate = true;
      pebbleInst.receiveShadow = !isUltraLow;
      group.add(pebbleInst);
    }
  }

  // Shared materials for jungle props (moody, desaturated organic TLOU palette)
  const barkMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.bark,
      normalMap: textures.barkNormal,
      normalScale: new THREE.Vector2(1.05, 1.05),
      color: 0x624d39,
      roughness: 0.94,
      metalness: 0.02,
    }),
  );
  const stoneMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.stone,
      color: 0x6d766b,
      roughness: 0.88,
      metalness: 0.04,
      flatShading: true,
    }),
  );
  const ruinStoneMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.stone,
      color: 0x7a8376,
      roughness: 0.82,
      metalness: 0.05,
    }),
  );
  const vineMat = applyWindSway(
    trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x325726,
        roughness: 0.9,
        metalness: 0.0,
        vertexColors: true,
      }),
    ),
    'vine',
  );
  const ruinVineMat = applyWindSway(
    trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x355c27,
        roughness: 0.9,
        metalness: 0.0,
      }),
    ),
    'vine',
  );

  // Dedicated TLOU-style realistic tree bark materials (vertex-colored mossy roots + 3D normal-mapped bark ridges)
  const makeTreeBarkMat = (colorHex: number, roughness = 0.93) =>
    trackMat(
      new THREE.MeshStandardMaterial({
        map: textures.bark,
        normalMap: textures.barkNormal,
        normalScale: new THREE.Vector2(1.18, 1.18),
        color: colorHex,
        roughness,
        metalness: 0.02,
        vertexColors: true,
      }),
    );

  const treeBarkByArchetype: Record<TreeArchetype, THREE.MeshStandardMaterial> = {
    sumauma: makeTreeBarkMat(0x614c38, 0.95),
    broadleaf: makeTreeBarkMat(0x6d5843, 0.93),
    slender: makeTreeBarkMat(0x988a72, 0.9),
    gnarled: makeTreeBarkMat(0x5b6444, 0.96),
    palm: makeTreeBarkMat(0x7c674f, 0.91),
  };

  // Multi-tone organic forest green leaf-cluster materials (alpha-cutout organic sprays + clay fallback in Potato)
  const treeLeafTintPalette = [0xe4edd6, 0xd1e2be, 0xecf0cd, 0xc2d8b2, 0xdce6c4];
  const treeLeafMats = treeLeafTintPalette.map((hex) =>
    applyWindSway(
      trackMat(
        new THREE.MeshStandardMaterial({
          map: isPotato ? null : textures.leafCluster,
          color: hex,
          alphaTest: isPotato ? 0 : 0.42,
          side: isPotato ? THREE.FrontSide : THREE.DoubleSide,
          roughness: isPotato ? 0.94 : 0.78,
          metalness: 0.0,
          vertexColors: true,
        }),
      ),
      'canopy',
    ),
  );
  const treeLeafDepthMat = !isPotato
    ? applyWindSway(
        trackMat(
          new THREE.MeshDepthMaterial({
            depthPacking: THREE.RGBADepthPacking,
            map: textures.leafCluster,
            alphaTest: 0.42,
            side: THREE.DoubleSide,
          }),
        ),
        'canopy',
      )
    : null;

  const treePalmFrondMat = applyWindSway(
    trackMat(
      new THREE.MeshStandardMaterial({
        map: isPotato ? null : textures.palmFrond,
        color: isPotato ? 0x628c38 : 0xdde8c8,
        alphaTest: isPotato ? 0 : 0.4,
        side: THREE.DoubleSide,
        roughness: isPotato ? 0.92 : 0.72,
        metalness: 0.02,
        vertexColors: true,
      }),
    ),
    'frond',
  );
  const treePalmFrondDepthMat = !isPotato
    ? applyWindSway(
        trackMat(
          new THREE.MeshDepthMaterial({
            depthPacking: THREE.RGBADepthPacking,
            map: textures.palmFrond,
            alphaTest: 0.4,
            side: THREE.DoubleSide,
          }),
        ),
        'frond',
      )
    : null;

  const treeLibrary = createTreeTemplateLibrary(isPotato);
  const vineCylGeo = trackGeo(new THREE.CylinderGeometry(0.035, 0.025, 1, 5));
  vineCylGeo.translate(0, -0.5, 0);

  const rand = makeSeededRandom(7719);

  interface DestructibleRockPart {
    mesh: THREE.Mesh;
    basePos: THREE.Vector3;
    baseRot: THREE.Euler;
    baseScale: THREE.Vector3;
    dirX: number;
    dirY: number;
    dirZ: number;
  }

  interface DestructibleProp {
    id: string;
    kind: 'tree' | 'rock';
    x: number;
    z: number;
    baseY: number;
    hitRadius: number;
    root: THREE.Group;
    baseQuat: THREE.Quaternion;
    collider: CircleCollider;
    hp: number;
    maxHp: number;
    state: 'intact' | 'falling' | 'shattering' | 'destroyed';
    shakeTimer: number;
    flashTimer: number;
    animTimer: number;
    impactBurstFired: boolean;
    fallAxis: THREE.Vector3;
    hitAxis: THREE.Vector3;
    rockParts?: DestructibleRockPart[];
    origMats?: Array<{
      mesh: THREE.Mesh;
      mat: THREE.Material | THREE.Material[];
      flashMat: THREE.MeshStandardMaterial;
    }>;
    flashMats?: THREE.MeshStandardMaterial[];
  }

  const destructibles: DestructibleProp[] = [];
  const activeDestructibles = new Set<DestructibleProp>();
  const _animQuat = new THREE.Quaternion();
  let destructibleCounter = 0;

  const registerDestructibleTree = (
    tree: THREE.Group,
    x: number,
    z: number,
    collider: CircleCollider,
  ) => {
    destructibleCounter++;
    destructibles.push({
      id: `tree-${destructibleCounter}`,
      kind: 'tree',
      x,
      z,
      baseY: tree.position.y,
      hitRadius: collider.radius + 0.35,
      root: tree,
      baseQuat: tree.quaternion.clone(),
      collider,
      hp: 100,
      maxHp: 100,
      state: 'intact',
      shakeTimer: 0,
      flashTimer: 0,
      animTimer: 0,
      impactBurstFired: false,
      fallAxis: new THREE.Vector3(0, 0, 1),
      hitAxis: new THREE.Vector3(1, 0, 0),
    });
  };

  const registerDestructibleRock = (
    cluster: THREE.Group,
    x: number,
    z: number,
    collider: CircleCollider,
    meshes: THREE.Mesh[],
  ) => {
    destructibleCounter++;
    const rockParts: DestructibleRockPart[] = meshes.map((m, idx) => {
      const dx = idx === 0 ? 0.15 : m.position.x || (idx % 2 === 0 ? -0.6 : 0.6);
      const dz = idx === 0 ? -0.15 : m.position.z || (idx % 2 === 0 ? -0.5 : 0.5);
      const len = Math.hypot(dx, dz) || 1;
      return {
        mesh: m,
        basePos: m.position.clone(),
        baseRot: m.rotation.clone(),
        baseScale: m.scale.clone(),
        dirX: dx / len,
        dirY: idx === 0 ? 1.05 : 0.85,
        dirZ: dz / len,
      };
    });
    destructibles.push({
      id: `rock-${destructibleCounter}`,
      kind: 'rock',
      x,
      z,
      baseY: cluster.position.y,
      hitRadius: collider.radius + 0.3,
      root: cluster,
      baseQuat: cluster.quaternion.clone(),
      collider,
      hp: 100,
      maxHp: 100,
      state: 'intact',
      shakeTimer: 0,
      flashTimer: 0,
      animTimer: 0,
      impactBurstFired: false,
      fallAxis: new THREE.Vector3(0, 0, 1),
      hitAxis: new THREE.Vector3(1, 0, 0),
      rockParts,
    });
  };

  const spawnRealisticTree = (
    archetype: TreeArchetype,
    x: number,
    z: number,
    scale: number,
    addCollider: boolean,
  ) => {
    const gy = groundHeightAt(x, z);
    const variants = treeLibrary.variants[archetype];
    const tpl = variants[Math.floor(rand() * variants.length)];

    const tree = new THREE.Group();
    tree.position.set(x, gy - 0.14, z);
    tree.rotation.y = rand() * Math.PI * 2;
    tree.scale.set(
      scale * (0.94 + rand() * 0.12),
      scale * (0.94 + rand() * 0.14),
      scale * (0.94 + rand() * 0.12),
    );

    const barkMesh = new THREE.Mesh(tpl.barkGeo, treeBarkByArchetype[archetype]);
    barkMesh.castShadow = castHeroShadows;
    barkMesh.receiveShadow = !isPotato && !isUltraLow;
    tree.add(barkMesh);

    const isPalm = archetype === 'palm';
    const foliageMat = isPalm
      ? treePalmFrondMat
      : treeLeafMats[Math.floor(rand() * treeLeafMats.length)];
    const foliageMesh = new THREE.Mesh(tpl.foliageGeo, foliageMat);
    foliageMesh.castShadow = castDetailShadows;
    foliageMesh.receiveShadow = !isPotato && !isUltraLow;
    if (!isPotato) {
      foliageMesh.customDepthMaterial = isPalm
        ? treePalmFrondDepthMat ?? undefined
        : treeLeafDepthMat ?? undefined;
    }
    tree.add(foliageMesh);

    if (tpl.vineGeo) {
      const vineMesh = new THREE.Mesh(tpl.vineGeo, vineMat);
      vineMesh.castShadow = false;
      vineMesh.receiveShadow = !isPotato && !isUltraLow;
      tree.add(vineMesh);
    }

    freezeStaticHierarchy(tree);
    group.add(tree);

    if (addCollider) {
      const colRadius =
        archetype === 'palm'
          ? 0.42 * scale
          : Math.max(0.36, tpl.trunkRadiusAtBase * scale * 0.95 + 0.12);
      const col: CircleCollider = {
        x,
        z,
        radius: colRadius,
        kind: 'tree',
      };
      colliders.push(col);
      registerDestructibleTree(tree, x, z, col);
    }
  };

  // 4. Populate Realistic TLOU-Style Branching Trees & Palms across the Expanded Open Jungle
  const placedTreeCoords: Array<{ x: number; z: number }> = [];
  const treeTargetCount = 275;
  let attempts = 0;

  while (placedTreeCoords.length < treeTargetCount && attempts < 5200) {
    attempts++;
    const angle = rand() * Math.PI * 2;
    const dist = 9 + Math.sqrt(rand()) * (WORLD_RADIUS - 13);
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;

    if (trailFactorAt(x, z) > 0.16) continue;
    if (clearingFactorAt(x, z) > 0.38) continue;
    if (cabinExclusionAt(x, z) > 0.05) continue;
    if (villageExclusionAt(x, z) > 0.04) continue;
    if (riverFactorAt(x, z) > 0.12) continue;
    if (mountainFactorAt(x, z) > 0.36) continue;
    if (Math.hypot(x - GUIDE_NPC_POS.x, z - GUIDE_NPC_POS.z) < 2.8) continue;
    const pdx = x - POND_CENTER.x;
    const pdz = z - POND_CENTER.z;
    if (pdx * pdx + pdz * pdz < (POND_CENTER.radius + 2.5) ** 2) continue;

    let tooClose = false;
    for (let i = 0; i < placedTreeCoords.length; i++) {
      const dx = placedTreeCoords[i].x - x;
      const dz = placedTreeCoords[i].z - z;
      if (dx * dx + dz * dz < 14.5) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;

    placedTreeCoords.push({ x, z });
    const insidePlayable = dist < PLAYABLE_RADIUS + 8;
    const isNearPalms =
      Math.hypot(x - CLEARINGS[4].x, z - CLEARINGS[4].z) < 20 ||
      Math.hypot(x - POND_CENTER.x, z - POND_CENTER.z) < 16;

    if (isNearPalms || rand() < 0.2) {
      spawnRealisticTree('palm', x, z, 0.85 + rand() * 0.45, insidePlayable);
    } else {
      const roll = rand();
      if (roll < 0.19) {
        spawnRealisticTree('sumauma', x, z, 0.88 + rand() * 0.34, insidePlayable);
      } else if (roll < 0.54) {
        spawnRealisticTree('broadleaf', x, z, 0.86 + rand() * 0.46, insidePlayable);
      } else if (roll < 0.8) {
        spawnRealisticTree('slender', x, z, 0.86 + rand() * 0.42, insidePlayable);
      } else {
        spawnRealisticTree('gnarled', x, z, 0.86 + rand() * 0.4, insidePlayable);
      }
    }
  }

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    const px = CLEARINGS[4].x + Math.cos(a) * 9.5;
    const pz = CLEARINGS[4].z + Math.sin(a) * 9.5;
    if (
      trailFactorAt(px, pz) < 0.25 &&
      cabinExclusionAt(px, pz) < 0.05 &&
      riverFactorAt(px, pz) < 0.12 &&
      villageExclusionAt(px, pz) < 0.04
    ) {
      spawnRealisticTree('palm', px, pz, 0.95 + rand() * 0.25, true);
    }
  }

  // 5. Mossy Boulders & Trailside Rocks (composite faceted rock clusters)
  const rockGeo = trackGeo(new THREE.DodecahedronGeometry(1, 0));
  const buildBoulderCluster = (x: number, z: number, scale: number, withCollider: boolean) => {
    const gy = groundHeightAt(x, z);
    const cluster = new THREE.Group();
    cluster.position.set(x, gy - 0.15 * scale, z);
    cluster.rotation.y = rand() * Math.PI * 2;

    const mainRock = new THREE.Mesh(rockGeo, stoneMat);
    mainRock.scale.set(1.1 * scale, 0.78 * scale, 0.95 * scale);
    mainRock.position.y = 0.45 * scale;
    mainRock.rotation.set(rand() * 0.4, rand() * 1.5, rand() * 0.3);
    mainRock.castShadow = castDetailShadows;
    mainRock.receiveShadow = true;
    cluster.add(mainRock);

    const subRock = new THREE.Mesh(rockGeo, stoneMat);
    subRock.scale.set(0.65 * scale, 0.52 * scale, 0.6 * scale);
    subRock.position.set(0.75 * scale, 0.28 * scale, 0.35 * scale);
    subRock.rotation.set(rand() * 0.5, rand() * 2, rand() * 0.4);
    subRock.castShadow = castDetailShadows;
    subRock.receiveShadow = true;
    cluster.add(subRock);

    const pebble = new THREE.Mesh(rockGeo, stoneMat);
    pebble.scale.set(0.4 * scale, 0.3 * scale, 0.42 * scale);
    pebble.position.set(-0.68 * scale, 0.16 * scale, -0.4 * scale);
    cluster.add(pebble);

    freezeStaticHierarchy(cluster);
    group.add(cluster);

    if (withCollider) {
      const col: CircleCollider = {
        x,
        z,
        radius: 1.05 * scale,
        kind: 'rock',
      };
      colliders.push(col);
      registerDestructibleRock(cluster, x, z, col, [mainRock, subRock, pebble]);
    }
  };

  // Scatter boulders along clearings edges, pond banks, and open jungle slopes
  const boulderTarget = 92;
  for (let i = 0; i < boulderTarget; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = 10 + rand() * (PLAYABLE_RADIUS - 6);
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    if (trailFactorAt(x, z) > 0.28) continue;
    if (clearingFactorAt(x, z) > 0.72) continue;
    if (cabinExclusionAt(x, z) > 0.05) continue;
    if (villageExclusionAt(x, z) > 0.04) continue;
    if (riverFactorAt(x, z) > 0.12) continue;
    const pdx = x - POND_CENTER.x;
    const pdz = z - POND_CENTER.z;
    if (pdx * pdx + pdz * pdz < (POND_CENTER.radius - 0.5) ** 2) continue;

    buildBoulderCluster(x, z, 0.65 + rand() * 0.95, true);
  }

  // Mountain rocky outcrops around interior peaks and outer mountain rim
  const mountainRockMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: isPotato ? null : textures.stone,
      color: 0x525a54,
      roughness: 0.92,
      metalness: 0.04,
      flatShading: true,
    }),
  );
  MOUNTAIN_PEAKS.forEach((pk) => {
    for (let k = 0; k < 5; k++) {
      const ang = (k / 5) * Math.PI * 2 + rand() * 0.5;
      const rad = k === 0 ? 0.8 : pk.radius * (0.28 + rand() * 0.35);
      const rx = pk.x + Math.cos(ang) * rad;
      const rz = pk.z + Math.sin(ang) * rad;
      const gy = groundHeightAt(rx, rz);
      const crag = new THREE.Mesh(rockGeo, mountainRockMat);
      const sc = k === 0 ? 3.2 : 1.7 + rand() * 1.4;
      crag.position.set(rx, gy + sc * 0.35, rz);
      crag.scale.set(sc * 1.25, sc * 1.65, sc * 1.1);
      crag.rotation.set(rand() * 0.3, rand() * Math.PI, rand() * 0.3);
      crag.castShadow = castDetailShadows;
      crag.receiveShadow = !isPotato && !isUltraLow;
      group.add(crag);
      colliders.push({ x: rx, z: rz, radius: sc * 0.95, kind: 'rock' });
    }
  });
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2 + rand() * 0.14;
    const d = 128 + rand() * 28;
    const rx = Math.cos(a) * d;
    const rz = Math.sin(a) * d;
    if (riverFactorAt(rx, rz) > 0.2) continue;
    const crag = new THREE.Mesh(rockGeo, mountainRockMat);
    const sc = 3.4 + rand() * 2.8;
    crag.position.set(rx, groundHeightAt(rx, rz) + sc * 0.4, rz);
    crag.scale.set(sc * 1.4, sc * 1.9, sc * 1.2);
    crag.rotation.set(rand() * 0.25, rand() * Math.PI, rand() * 0.25);
    group.add(crag);
  }

  // Stepping stones around the emerald pool shore
  for (let i = 0; i < 7; i++) {
    const a = 2.1 + i * 0.42;
    const sx = POND_CENTER.x + Math.cos(a) * (POND_CENTER.radius + 0.15);
    const sz = POND_CENTER.z + Math.sin(a) * (POND_CENTER.radius + 0.15);
    buildBoulderCluster(sx, sz, 0.52 + rand() * 0.25, false);
  }

  // 6. Ancient Stone Ruins in Altar das Ruínas & Central Clearing Camp Cairn
  const buildRuinArch = (cx: number, cz: number, rotY: number) => {
    const gy = groundHeightAt(cx, cz);
    const arch = new THREE.Group();
    arch.position.set(cx, gy, cz);
    arch.rotation.y = rotY;

    const pillarGeo = trackGeo(new THREE.BoxGeometry(0.95, 3.6, 0.95));
    const capGeo = trackGeo(new THREE.BoxGeometry(1.2, 0.4, 1.2));
    const lintelGeo = trackGeo(new THREE.BoxGeometry(4.4, 0.68, 1.1));

    const leftPillar = new THREE.Mesh(pillarGeo, ruinStoneMat);
    leftPillar.position.set(-1.55, 1.8, 0);
    leftPillar.castShadow = castHeroShadows;
    leftPillar.receiveShadow = true;
    arch.add(leftPillar);

    const rightPillar = new THREE.Mesh(pillarGeo, ruinStoneMat);
    rightPillar.position.set(1.55, 1.8, 0);
    rightPillar.castShadow = castHeroShadows;
    rightPillar.receiveShadow = true;
    arch.add(rightPillar);

    const baseL = new THREE.Mesh(capGeo, ruinStoneMat);
    baseL.position.set(-1.55, 0.2, 0);
    arch.add(baseL);
    const baseR = new THREE.Mesh(capGeo, ruinStoneMat);
    baseR.position.set(1.55, 0.2, 0);
    arch.add(baseR);

    const lintel = new THREE.Mesh(lintelGeo, ruinStoneMat);
    lintel.position.set(0, 3.85, 0);
    lintel.rotation.z = 0.03;
    lintel.castShadow = castHeroShadows;
    lintel.receiveShadow = true;
    arch.add(lintel);

    // Overgrown TLOU-style hanging ivy vines draping over the ancient stone arch
    for (let v = 0; v < 4; v++) {
      const vine = new THREE.Mesh(vineCylGeo, ruinVineMat);
      vine.position.set(-1.3 + v * 0.86, 3.72, (v % 2 === 0 ? 1 : -1) * 0.46);
      vine.scale.set(1.1, 1.3 + (v % 3) * 0.55, 1.1);
      arch.add(vine);
    }

    freezeStaticHierarchy(arch);
    group.add(arch);

    // Register colliders for the two pillars in world space
    const cosR = Math.cos(rotY);
    const sinR = Math.sin(rotY);
    [-1.55, 1.55].forEach((lx) => {
      colliders.push({
        x: cx + lx * cosR,
        z: cz - lx * sinR,
        radius: 0.72,
        kind: 'ruin',
      });
    });
  };

  buildRuinArch(-31.5, -24.0, 0.58);

  // Starting Clearing Wooden Trail Signpost & Camp Lantern Post
  const buildTrailSignpost = (x: number, z: number) => {
    const gy = groundHeightAt(x, z);
    const postGroup = new THREE.Group();
    postGroup.position.set(x, gy, z);

    const post = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.09, 0.11, 2.2, 8)),
      barkMat,
    );
    post.position.y = 1.1;
    post.castShadow = castHeroShadows;
    postGroup.add(post);

    const boardGeo = trackGeo(new THREE.BoxGeometry(0.95, 0.24, 0.07));
    const boardMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0xa47a4c, roughness: 0.86, metalness: 0.02 }),
    );
    const board1 = new THREE.Mesh(boardGeo, boardMat);
    board1.position.set(0.22, 1.88, 0);
    board1.rotation.y = 0.55;
    postGroup.add(board1);

    const board2 = new THREE.Mesh(boardGeo, boardMat);
    board2.position.set(-0.2, 1.56, 0.05);
    board2.rotation.y = -0.68;
    postGroup.add(board2);

    const rockRing = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.4, 0.48, 0.2, 7)), stoneMat);
    rockRing.position.y = 0.08;
    postGroup.add(rockRing);

    group.add(postGroup);
    colliders.push({ x, z, radius: 0.45, kind: 'ruin' });
  };
  buildTrailSignpost(-4.5, -4.5);

  // 6b. Rustic Furnished Cabins & Shelters scattered across the Jungle
  const cabinTimberMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.bark,
      color: 0x624026,
      roughness: 0.9,
      metalness: 0.02,
    }),
  );
  const cabinPlankMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.cabinPlank,
      color: 0xffffff,
      roughness: 0.85,
      metalness: 0.02,
    }),
  );
  const cabinRoofMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.cabinRoof,
      color: 0xffffff,
      roughness: 0.94,
      metalness: 0.0,
    }),
  );
  const cabinCeramicMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xd9d2c5,
      roughness: 0.45,
      metalness: 0.06,
    }),
  );
  const cabinMetalMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x2c3438,
      roughness: 0.42,
      metalness: 0.72,
    }),
  );
  const cabinBlanketMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x9b4534,
      roughness: 0.9,
      metalness: 0.0,
    }),
  );
  const cabinPillowMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe6dcc8,
      roughness: 0.86,
      metalness: 0.0,
    }),
  );
  const cabinLanternGlowMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: 0xffd578,
    }),
  );
  const cabinBookColors = [0x9b2c2c, 0x2b6cb0, 0x2f855a, 0xb7791f];
  const cabinBookMats = cabinBookColors.map((hex) =>
    trackMat(new THREE.MeshStandardMaterial({ color: hex, roughness: 0.75, metalness: 0.04 })),
  );

  const cabinLights: Array<{ light: THREE.PointLight; x: number; z: number }> = [];
  const bedSpots: BedSpot[] = [];

  const cabinMattressMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xd8cdb7,
      roughness: 0.9,
      metalness: 0.0,
    }),
  );

  // Reusable realistic bed builder (corner posts + finials + slatted headboard + mattress + folded quilt + twin pillows)
  const buildRealisticBed = (bx: number, by: number, bz: number, rotY: number) => {
    const bg = new THREE.Group();
    bg.position.set(bx, by, bz);
    bg.rotation.y = rotY;

    // 4 Corner Posts + Carved Finials
    const postPositions: Array<[number, number, number]> = [
      [-0.56, -0.95, 0.92],
      [0.56, -0.95, 0.92],
      [-0.56, 0.95, 0.64],
      [0.56, 0.95, 0.64],
    ];
    postPositions.forEach(([px, pz, h]) => {
      const post = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.055, 0.062, h, 8)),
        cabinTimberMat,
      );
      post.position.set(px, h * 0.5, pz);
      post.castShadow = castHeroShadows;
      bg.add(post);

      const finial = new THREE.Mesh(
        trackGeo(new THREE.SphereGeometry(0.068, 8, 6)),
        cabinTimberMat,
      );
      finial.position.set(px, h + 0.04, pz);
      bg.add(finial);
    });

    // Side & End Frame Rails + Support Slats
    const baseDeck = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(1.12, 0.14, 1.9)),
      cabinTimberMat,
    );
    baseDeck.position.y = 0.25;
    baseDeck.receiveShadow = true;
    bg.add(baseDeck);

    // Slatted Headboard & Lower Footboard
    const headTopRail = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(1.14, 0.14, 0.08)),
      cabinPlankMat,
    );
    headTopRail.position.set(0, 0.78, -0.95);
    bg.add(headTopRail);
    for (let s = -2; s <= 2; s++) {
      const slat = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.12, 0.44, 0.05)),
        cabinPlankMat,
      );
      slat.position.set(s * 0.2, 0.54, -0.95);
      bg.add(slat);
    }
    const footBoard = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(1.12, 0.26, 0.07)),
      cabinPlankMat,
    );
    footBoard.position.set(0, 0.43, 0.95);
    bg.add(footBoard);

    // Tufted Mattress
    const mattress = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(1.04, 0.18, 1.82)),
      cabinMattressMat,
    );
    mattress.position.set(0, 0.41, 0);
    mattress.receiveShadow = true;
    bg.add(mattress);

    // Folded Heavy Quilted Blanket + Turn-down Cuff
    const blanket = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(1.08, 0.095, 1.32)),
      cabinBlanketMat,
    );
    blanket.position.set(0, 0.505, 0.23);
    blanket.receiveShadow = true;
    bg.add(blanket);

    const blanketFold = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.052, 0.052, 1.07, 8)),
      cabinPillowMat,
    );
    blanketFold.rotation.z = Math.PI / 2;
    blanketFold.position.set(0, 0.515, -0.41);
    bg.add(blanketFold);

    // Twin Plump Pillows
    [-0.25, 0.25].forEach((px) => {
      const pillow = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.44, 0.11, 0.34)),
        cabinPillowMat,
      );
      pillow.scale.set(1, 0.92, 1);
      pillow.position.set(px, 0.545, -0.68);
      pillow.rotation.x = 0.16;
      pillow.rotation.z = px < 0 ? 0.04 : -0.04;
      bg.add(pillow);
    });

    return bg;
  };

  const cabinFloorGeo = trackGeo(
    new THREE.BoxGeometry(CABIN_HALF_W * 2, CABIN_FLOOR_THICKNESS, CABIN_HALF_D * 2),
  );
  const cabinPostGeo = trackGeo(new THREE.BoxGeometry(0.24, 2.7, 0.24));
  const cabinBackWallGeo = trackGeo(new THREE.BoxGeometry(CABIN_HALF_W * 2 - 0.16, 2.55, 0.16));
  const cabinSideWallLowGeo = trackGeo(new THREE.BoxGeometry(0.16, 1.0, CABIN_HALF_D * 2 - 0.16));
  const cabinSideWallTopGeo = trackGeo(new THREE.BoxGeometry(0.16, 0.65, CABIN_HALF_D * 2 - 0.16));
  const cabinSidePillarGeo = trackGeo(new THREE.BoxGeometry(0.16, 0.9, 1.1));
  const cabinFrontWingGeo = trackGeo(new THREE.BoxGeometry(1.9, 2.55, 0.16));
  const cabinDoorLintelGeo = trackGeo(new THREE.BoxGeometry(2.2, 0.45, 0.18));
  const cabinRoofSlopeGeo = trackGeo(new THREE.BoxGeometry(CABIN_HALF_W + 0.9, 0.16, CABIN_HALF_D * 2 + 1.0));
  const cabinCrateGeo = trackGeo(new THREE.BoxGeometry(0.68, 0.58, 0.68));
  const cabinBookGeo = trackGeo(new THREE.BoxGeometry(0.12, 0.24, 0.18));

  const buildCabin = (cab: CabinDef) => {
    const gy = groundHeightAt(cab.x, cab.z);
    const cabin = new THREE.Group();
    cabin.position.set(cab.x, gy, cab.z);
    cabin.rotation.y = cab.rotY;

    const fY = CABIN_FLOOR_THICKNESS;

    // Raised wooden plank floor (y = 0..0.16)
    const floor = new THREE.Mesh(cabinFloorGeo, cabinPlankMat);
    floor.position.y = fY * 0.5;
    floor.receiveShadow = true;
    cabin.add(floor);

    // 4 Corner Timber Posts
    [
      [-CABIN_HALF_W + 0.12, -CABIN_HALF_D + 0.12],
      [CABIN_HALF_W - 0.12, -CABIN_HALF_D + 0.12],
      [-CABIN_HALF_W + 0.12, CABIN_HALF_D - 0.12],
      [CABIN_HALF_W - 0.12, CABIN_HALF_D - 0.12],
    ].forEach(([px, pz]) => {
      const post = new THREE.Mesh(cabinPostGeo, cabinTimberMat);
      post.position.set(px, fY + 1.32, pz);
      post.castShadow = castHeroShadows;
      post.receiveShadow = true;
      cabin.add(post);
    });

    // Back Wall (solid timber planks)
    const backWall = new THREE.Mesh(cabinBackWallGeo, cabinPlankMat);
    backWall.position.set(0, fY + 1.28, -CABIN_HALF_D + 0.08);
    backWall.castShadow = castHeroShadows;
    backWall.receiveShadow = true;
    cabin.add(backWall);

    // Porch threshold wooden step outside front door
    const porchStep = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(2.15, 0.11, 0.62)),
      cabinTimberMat,
    );
    porchStep.position.set(0, 0.055, CABIN_HALF_D + 0.28);
    porchStep.receiveShadow = true;
    cabin.add(porchStep);

    // Left & Right Walls with framed open jungle windows (sill + cross-mullions)
    [-CABIN_HALF_W + 0.08, CABIN_HALF_W - 0.08].forEach((wx) => {
      const low = new THREE.Mesh(cabinSideWallLowGeo, cabinPlankMat);
      low.position.set(wx, fY + 0.5, 0);
      low.receiveShadow = true;
      cabin.add(low);

      const sill = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.24, 0.08, CABIN_HALF_D * 1.15)),
        cabinTimberMat,
      );
      sill.position.set(wx, fY + 1.0, 0);
      cabin.add(sill);

      const top = new THREE.Mesh(cabinSideWallTopGeo, cabinPlankMat);
      top.position.set(wx, fY + 2.22, 0);
      cabin.add(top);

      // Subtle window crossbars
      const winBarV = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.08, 0.92, 0.07)),
        cabinTimberMat,
      );
      winBarV.position.set(wx, fY + 1.46, 0);
      cabin.add(winBarV);

      const winBarH = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.08, 0.06, 2.55)),
        cabinTimberMat,
      );
      winBarH.position.set(wx, fY + 1.46, 0);
      cabin.add(winBarH);

      [-1.85, 1.85].forEach((wz) => {
        const jamb = new THREE.Mesh(cabinSidePillarGeo, cabinPlankMat);
        jamb.position.set(wx, fY + 1.45, wz);
        cabin.add(jamb);
      });
    });

    // Front Doorway Wall (open doorway at center lx: -1.0..+1.0)
    const frontLeft = new THREE.Mesh(cabinFrontWingGeo, cabinPlankMat);
    frontLeft.position.set(-2.0, fY + 1.28, CABIN_HALF_D - 0.08);
    frontLeft.castShadow = castHeroShadows;
    cabin.add(frontLeft);

    const frontRight = new THREE.Mesh(cabinFrontWingGeo, cabinPlankMat);
    frontRight.position.set(2.0, fY + 1.28, CABIN_HALF_D - 0.08);
    frontRight.castShadow = castHeroShadows;
    cabin.add(frontRight);

    const doorLintel = new THREE.Mesh(cabinDoorLintelGeo, cabinTimberMat);
    doorLintel.position.set(0, fY + 2.34, CABIN_HALF_D - 0.08);
    cabin.add(doorLintel);

    // Pitched Rustic Shingle/Thatch Roof + Ridge Beam + Exposed Rafters
    const roofLeft = new THREE.Mesh(cabinRoofSlopeGeo, cabinRoofMat);
    roofLeft.position.set(-1.62, fY + 2.95, 0);
    roofLeft.rotation.z = 0.42;
    roofLeft.castShadow = castHeroShadows;
    roofLeft.receiveShadow = true;
    cabin.add(roofLeft);

    const roofRight = new THREE.Mesh(cabinRoofSlopeGeo, cabinRoofMat);
    roofRight.position.set(1.62, fY + 2.95, 0);
    roofRight.rotation.z = -0.42;
    roofRight.castShadow = castHeroShadows;
    roofRight.receiveShadow = true;
    cabin.add(roofRight);

    const ridgeBeam = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.22, 0.2, CABIN_HALF_D * 2 + 1.08)),
      cabinTimberMat,
    );
    ridgeBeam.position.set(0, fY + 3.68, 0);
    cabin.add(ridgeBeam);

    [-CABIN_HALF_D + 0.15, 0, CABIN_HALF_D - 0.15].forEach((rz) => {
      const tieBeam = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(CABIN_HALF_W * 2 - 0.25, 0.12, 0.14)),
        cabinTimberMat,
      );
      tieBeam.position.set(0, fY + 2.48, rz);
      cabin.add(tieBeam);
    });

    // Interior Furniture 1: Detailed Realistic Wooden Bed with Corner Posts, Mattress, Quilt & Pillows
    const bedGroup = buildRealisticBed(-1.75, fY, -1.45, 0);
    cabin.add(bedGroup);
    const bedWorld = cabinLocalToWorld(cab, -1.75, -1.45);
    bedSpots.push({ id: `bed-${cab.id}`, x: bedWorld.x, z: bedWorld.z });

    // Interior Furniture 2: Wooden Table + Stool + Mug/Plate + Warm Lantern (back-right)
    const tableGroup = new THREE.Group();
    tableGroup.position.set(1.65, fY, -1.35);
    const tableTop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.25, 0.1, 0.95)), cabinPlankMat);
    tableTop.position.y = 0.75;
    tableTop.receiveShadow = true;
    tableGroup.add(tableTop);
    const legGeo = trackGeo(new THREE.BoxGeometry(0.1, 0.72, 0.1));
    [
      [-0.52, -0.38],
      [0.52, -0.38],
      [-0.52, 0.38],
      [0.52, 0.38],
    ].forEach(([tx, tz]) => {
      const leg = new THREE.Mesh(legGeo, cabinTimberMat);
      leg.position.set(tx, 0.36, tz);
      tableGroup.add(leg);
    });
    // Stool tucked beside table
    const stoolTop = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.24, 0.24, 0.08, 10)), cabinPlankMat);
    stoolTop.position.set(-0.2, 0.44, 0.78);
    tableGroup.add(stoolTop);
    const stoolPost = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.08, 0.12, 0.42, 8)), cabinTimberMat);
    stoolPost.position.set(-0.2, 0.21, 0.78);
    tableGroup.add(stoolPost);

    // Ceramic plate & mug
    const plate = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.16, 0.14, 0.025, 12)), cabinCeramicMat);
    plate.position.set(-0.24, 0.81, 0.08);
    tableGroup.add(plate);
    const mug = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.055, 0.05, 0.11, 8)), cabinCeramicMat);
    mug.position.set(0.05, 0.85, 0.18);
    tableGroup.add(mug);

    // Table Lantern Lamp with metal base & chimney cap
    const lampBase = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.09, 0.12, 0.08, 8)), cabinMetalMat);
    lampBase.position.set(0.36, 0.84, -0.22);
    tableGroup.add(lampBase);
    const lampGlobe = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.065, 0.065, 0.15, 8)), cabinLanternGlowMat);
    lampGlobe.position.set(0.36, 0.95, -0.22);
    tableGroup.add(lampGlobe);
    const lampCap = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.095, 0.08, 8)), cabinMetalMat);
    lampCap.position.set(0.36, 1.06, -0.22);
    tableGroup.add(lampCap);
    cabin.add(tableGroup);

    // Interior Furniture 3: Bookshelf (mid-left wall)
    const shelfGroup = new THREE.Group();
    shelfGroup.position.set(-2.48, fY, 0.55);
    const shelfBack = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.46, 1.75, 1.05)), cabinTimberMat);
    shelfBack.position.y = 0.875;
    shelfGroup.add(shelfBack);
    for (let b = 0; b < 4; b++) {
      const book = new THREE.Mesh(cabinBookGeo, cabinBookMats[b % cabinBookMats.length]);
      book.position.set(0.2, 0.72 + (b % 2) * 0.48, -0.25 + b * 0.16);
      shelfGroup.add(book);
    }
    cabin.add(shelfGroup);

    // Interior Furniture 4: Supply Crates (front-right corner)
    const crateA = new THREE.Mesh(cabinCrateGeo, cabinPlankMat);
    crateA.position.set(2.05, fY + 0.29, 1.35);
    crateA.rotation.y = 0.18;
    crateA.receiveShadow = true;
    cabin.add(crateA);
    const crateB = new THREE.Mesh(cabinCrateGeo, cabinTimberMat);
    crateB.position.set(2.05, fY + 0.78, 1.35);
    crateB.scale.setScalar(0.68);
    crateB.rotation.y = -0.25;
    cabin.add(crateB);

    // Interior warm PointLight (toggled by player proximity in update() so FPS stays fast)
    if (!isSoftwareGl && !isPotato && !isUltraLow) {
      const interiorLight = new THREE.PointLight(0xffcb78, 2.2, 11.5, 1.8);
      interiorLight.position.set(0.4, fY + 1.95, -0.2);
      interiorLight.castShadow = false;
      interiorLight.visible = false;
      cabin.add(interiorLight);
      cabinLights.push({ light: interiorLight, x: cab.x, z: cab.z });
    }

    group.add(cabin);

    // Register smooth circle colliders for walls (leaving front doorway lx: -0.95..+0.95 wide open!)
    const wallPoints: Array<[number, number, number]> = [];
    for (let lx = -2.75; lx <= 2.75; lx += 0.72) {
      wallPoints.push([lx, -CABIN_HALF_D + 0.08, 0.42]); // Back wall
    }
    for (let lz = -2.25; lz <= 2.25; lz += 0.72) {
      wallPoints.push([-CABIN_HALF_W + 0.08, lz, 0.42]); // Left wall
      wallPoints.push([CABIN_HALF_W - 0.08, lz, 0.42]); // Right wall
    }
    // Front wings on either side of central 2.0m doorway
    [-2.65, -1.95, -1.42, 1.42, 1.95, 2.65].forEach((fx) => {
      wallPoints.push([fx, CABIN_HALF_D - 0.08, 0.42]);
    });

    wallPoints.forEach(([lx, lz, rad]) => {
      const wp = cabinLocalToWorld(cab, lx, lz);
      colliders.push({ x: wp.x, z: wp.z, radius: rad, kind: 'wall' });
    });

    // Furniture colliders
    const furnitureSpots: Array<[number, number, number]> = [
      [-1.75, -1.6, 0.68],
      [-1.75, -0.95, 0.65],
      [1.65, -1.35, 0.64],
      [-2.42, 0.55, 0.45],
      [2.05, 1.35, 0.52],
    ];
    furnitureSpots.forEach(([lx, lz, rad]) => {
      const fp = cabinLocalToWorld(cab, lx, lz);
      colliders.push({ x: fp.x, z: fp.z, radius: rad, kind: 'furniture' });
    });
  };

  CABINS.forEach(buildCabin);

  // 6b. Scattered Rustic Villages (huts, perimeter fences, torches) + Directional Signposts + NPCs
  const villageTorchFlames: THREE.Mesh[] = [];
  const villageTorchLights: Array<{ light: THREE.PointLight; x: number; z: number }> = [];
  const torchFlameMat = trackMat(
    new THREE.MeshBasicMaterial({ color: 0xfb923c }),
  );
  const torchPoleGeo = trackGeo(new THREE.CylinderGeometry(0.06, 0.08, 1.85, 6));
  const torchHeadGeo = trackGeo(new THREE.CylinderGeometry(0.11, 0.07, 0.22, 6));
  const torchFlameGeo = trackGeo(new THREE.ConeGeometry(0.12, 0.34, 6));

  VILLAGES.forEach((village) => {
    const baseY = groundHeightAt(village.x, village.z);

    // Village huts (smaller rustic thatched dwellings)
    village.huts.forEach((hut) => {
      const hx = village.x + hut.lx;
      const hz = village.z + hut.lz;
      const hy = groundHeightAt(hx, hz);
      const hg = new THREE.Group();
      hg.position.set(hx, hy, hz);
      hg.rotation.y = hut.rotY;
      hg.scale.setScalar(hut.scale);

      const floor = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(3.5, 0.18, 3.3)),
        cabinTimberMat,
      );
      floor.position.y = 0.09;
      floor.receiveShadow = true;
      hg.add(floor);

      const back = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(3.3, 2.05, 0.16)),
        cabinPlankMat,
      );
      back.position.set(0, 1.18, -1.52);
      back.castShadow = castHeroShadows;
      hg.add(back);

      [-1.56, 1.56].forEach((sx) => {
        const sideWall = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(0.16, 2.05, 3.1)),
          cabinPlankMat,
        );
        sideWall.position.set(sx, 1.18, 0);
        sideWall.castShadow = castHeroShadows;
        hg.add(sideWall);
      });

      const roofL = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(2.3, 0.15, 3.8)),
        cabinRoofMat,
      );
      roofL.position.set(-0.98, 2.52, 0);
      roofL.rotation.z = 0.44;
      roofL.castShadow = castHeroShadows;
      hg.add(roofL);

      const roofR = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(2.3, 0.15, 3.8)),
        cabinRoofMat,
      );
      roofR.position.set(0.98, 2.52, 0);
      roofR.rotation.z = -0.44;
      roofR.castShadow = castHeroShadows;
      hg.add(roofR);

      group.add(hg);
      colliders.push({ x: hx, z: hz, radius: 2.05 * hut.scale, kind: 'wall' });
    });

    // Village perimeter rustic fences
    village.fences.forEach((f) => {
      const fx = village.x + f.lx;
      const fz = village.z + f.lz;
      const fy = groundHeightAt(fx, fz);
      const fg = new THREE.Group();
      fg.position.set(fx, fy, fz);
      fg.rotation.y = f.rotY;

      const railGeo = trackGeo(new THREE.BoxGeometry(f.length, 0.1, 0.1));
      const railTop = new THREE.Mesh(railGeo, cabinTimberMat);
      railTop.position.y = 0.85;
      fg.add(railTop);
      const railMid = new THREE.Mesh(railGeo, cabinTimberMat);
      railMid.position.y = 0.45;
      fg.add(railMid);

      const postCount = 3;
      for (let p = 0; p < postCount; p++) {
        const px = -f.length * 0.45 + (p / (postCount - 1)) * (f.length * 0.9);
        const post = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.08, 0.09, 1.15, 6)),
          cabinTimberMat,
        );
        post.position.set(px, 0.56, 0);
        post.castShadow = castDetailShadows;
        fg.add(post);

        const cSin = Math.sin(-f.rotY);
        const cCos = Math.cos(-f.rotY);
        colliders.push({
          x: fx + px * cCos,
          z: fz + px * cSin,
          radius: 0.42,
          kind: 'wall',
        });
      }
      group.add(fg);
    });

    // Lit village torches
    village.torches.forEach((t) => {
      const tx = village.x + t.lx;
      const tz = village.z + t.lz;
      const ty = groundHeightAt(tx, tz);
      const tg = new THREE.Group();
      tg.position.set(tx, ty, tz);

      const pole = new THREE.Mesh(torchPoleGeo, cabinTimberMat);
      pole.position.y = 0.92;
      tg.add(pole);

      const head = new THREE.Mesh(torchHeadGeo, cabinMetalMat);
      head.position.y = 1.88;
      tg.add(head);

      const flame = new THREE.Mesh(torchFlameGeo, torchFlameMat);
      flame.position.y = 2.08;
      tg.add(flame);
      villageTorchFlames.push(flame);

      if (!isSoftwareGl && !isPotato && !isUltraLow) {
        const tLight = new THREE.PointLight(0xff9638, 2.2, 13, 1.8);
        tLight.position.y = 2.25;
        tLight.visible = false;
        tg.add(tLight);
        villageTorchLights.push({ light: tLight, x: tx, z: tz });
      }
      group.add(tg);
      colliders.push({ x: tx, z: tz, radius: 0.25, kind: 'wall' });
    });

    // Subtle stone hearth circle in village center
    const centerRing = new THREE.Mesh(
      trackGeo(new THREE.RingGeometry(1.1, 1.45, 16)),
      stoneMat,
    );
    centerRing.rotation.x = -Math.PI / 2;
    centerRing.position.set(village.x, baseY + 0.04, village.z);
    group.add(centerRing);

    // Sheltered Thatched-Canopy Rustic Rest Bed inside each village
    const bedLocalX = 0.2;
    const bedLocalZ = -5.4;
    const vBedX = village.x + bedLocalX;
    const vBedZ = village.z + bedLocalZ;
    const vBedY = groundHeightAt(vBedX, vBedZ);
    const shelterGroup = new THREE.Group();
    shelterGroup.position.set(vBedX, vBedY, vBedZ);

    const shelterDeck = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(2.15, 0.14, 2.55)),
      cabinPlankMat,
    );
    shelterDeck.position.y = 0.07;
    shelterDeck.receiveShadow = true;
    shelterGroup.add(shelterDeck);

    // 4 Canopy Timber Posts + Pitched Thatch Roof
    [
      [-0.95, -1.15],
      [0.95, -1.15],
      [-0.95, 1.15],
      [0.95, 1.15],
    ].forEach(([px, pz]) => {
      const cPost = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.07, 0.085, 2.15, 6)),
        cabinTimberMat,
      );
      cPost.position.set(px, 1.12, pz);
      cPost.castShadow = castDetailShadows;
      shelterGroup.add(cPost);
    });
    const canopyRoofL = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(1.38, 0.12, 2.75)),
      cabinRoofMat,
    );
    canopyRoofL.position.set(-0.56, 2.34, 0);
    canopyRoofL.rotation.z = 0.36;
    canopyRoofL.castShadow = castDetailShadows;
    shelterGroup.add(canopyRoofL);

    const canopyRoofR = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(1.38, 0.12, 2.75)),
      cabinRoofMat,
    );
    canopyRoofR.position.set(0.56, 2.34, 0);
    canopyRoofR.rotation.z = -0.36;
    canopyRoofR.castShadow = castDetailShadows;
    shelterGroup.add(canopyRoofR);

    const villageBed = buildRealisticBed(0, 0.14, 0, 0);
    shelterGroup.add(villageBed);
    group.add(shelterGroup);

    bedSpots.push({ id: `bed-${village.id}`, x: vBedX, z: vBedZ });
    colliders.push({ x: vBedX, z: vBedZ, radius: 0.72, kind: 'furniture' });
  });

  // 6c. Wooden Trail Signposts
  TRAIL_SIGNPOSTS.forEach((sp) => {
    const sy = groundHeightAt(sp.x, sp.z);
    const sg = new THREE.Group();
    sg.position.set(sp.x, sy, sp.z);
    sg.rotation.y = sp.rotY;

    const post = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.08, 0.1, 2.05, 7)),
      cabinTimberMat,
    );
    post.position.y = 1.02;
    post.castShadow = castDetailShadows;
    sg.add(post);

    const armYaws = [-0.32, 0.42];
    armYaws.forEach((armYaw, idx) => {
      const board = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.86, 0.18, 0.07)),
        cabinPlankMat,
      );
      board.position.set(Math.sin(armYaw) * 0.22, 1.72 - idx * 0.26, Math.cos(armYaw) * 0.22);
      board.rotation.y = armYaw;
      board.castShadow = castDetailShadows;
      sg.add(board);
    });

    group.add(sg);
    colliders.push({ x: sp.x, z: sp.z, radius: 0.3, kind: 'wall' });
  });

  // 6d. NPC System (Mandatory Guide NPC + Scattered Village NPCs)
  const npcSystem = createNpcSystem(textures, isPotato, castHeroShadows);
  group.add(npcSystem.group);
  npcSystem.colliders.forEach((c) => colliders.push(c));

  // 7. Abundant Instanced Undergrowth: Tropical Ferns, Tall Grass (Capim/Mato Alto), Dense Bushes & Surface Roots
  const dummy = new THREE.Object3D();
  const fernShade = new THREE.Color();

  const fernBladeGeo = trackGeo(new THREE.ConeGeometry(0.24, 1.05, 4));
  fernBladeGeo.scale(1, 1, 0.18);
  fernBladeGeo.translate(0, 0.48, 0);
  fernBladeGeo.rotateX(0.65);

  const fernMat = applyWindSway(
    trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.78,
        metalness: 0.0,
        side: THREE.DoubleSide,
      }),
    ),
    'grass',
  );

  const fernCount = 2000;
  if (fernCount > 0) {
    const fernInst = new THREE.InstancedMesh(fernBladeGeo, fernMat, fernCount);
    fernInst.receiveShadow = !isPotato && !isUltraLow;

    let fIdx = 0;
    let fTry = 0;
    while (fIdx < fernCount && fTry < fernCount * 6) {
      fTry++;
      let fx: number;
      let fz: number;
      // 35% of ferns cluster organically near placed tree bases
      if (placedTreeCoords.length > 0 && rand() < 0.35) {
        const tree = placedTreeCoords[Math.floor(rand() * placedTreeCoords.length)];
        const ta = rand() * Math.PI * 2;
        const td = 1.2 + rand() * 3.1;
        fx = tree.x + Math.cos(ta) * td;
        fz = tree.z + Math.sin(ta) * td;
      } else {
        const a = rand() * Math.PI * 2;
        const d = 3 + Math.sqrt(rand()) * (PLAYABLE_RADIUS + 6);
        fx = Math.cos(a) * d;
        fz = Math.sin(a) * d;
      }

      if (trailFactorAt(fx, fz) > 0.42) continue;
      if (cabinExclusionAt(fx, fz) > 0.1) continue;
      if (villageExclusionAt(fx, fz) > 0.05) continue;
      if (riverFactorAt(fx, fz) > 0.12) continue;
      if (mountainFactorAt(fx, fz) > 0.42) continue;
      const pdx = fx - POND_CENTER.x;
      const pdz = fz - POND_CENTER.z;
      if (pdx * pdx + pdz * pdz < (POND_CENTER.radius + 0.35) ** 2) continue;

      const gy = groundHeightAt(fx, fz);
      const clusterBlades = Math.min(5, fernCount - fIdx);
      const clusterScale = 0.7 + rand() * 0.88;
      const baseRot = rand() * Math.PI * 2;
      for (let b = 0; b < clusterBlades; b++) {
        dummy.position.set(fx, gy - 0.04, fz);
        dummy.rotation.set(0, baseRot + (b / clusterBlades) * Math.PI * 2 + rand() * 0.3, 0);
        dummy.scale.setScalar(clusterScale * (0.85 + rand() * 0.3));
        dummy.updateMatrix();
        fernInst.setMatrixAt(fIdx, dummy.matrix);

        fernShade.setHSL(0.27 + rand() * 0.06, 0.44 + rand() * 0.18, 0.17 + rand() * 0.14);
        fernInst.setColorAt(fIdx, fernShade);
        fIdx++;
      }
    }
    fernInst.count = fIdx;
    fernInst.instanceMatrix.needsUpdate = true;
    if (fernInst.instanceColor) fernInst.instanceColor.needsUpdate = true;
    fernInst.computeBoundingSphere();
    group.add(fernInst);
  }

  // 7a. Realistic Multi-Blade Arched Grass Tufts with Root-to-Tip AO Shading
  const makeGrassTuftGeo = () => {
    const blades: THREE.BufferGeometry[] = [];
    const bladeCount = isPotato ? 3 : 6;
    const segsY = isPotato ? 1 : 3;
    const tmpCol = new THREE.Color();
    const rootColor = new THREE.Color(0.38, 0.44, 0.34);
    const tipColor = new THREE.Color(1.0, 1.0, 1.0);

    for (let b = 0; b < bladeCount; b++) {
      const bladeGeo = new THREE.PlaneGeometry(0.095, 0.96, 1, segsY);
      const pos = bladeGeo.attributes.position;
      const colArr = new Float32Array(pos.count * 3);
      const bendCurve = 0.18 + (b % 3) * 0.08;

      for (let v = 0; v < pos.count; v++) {
        // Shift base from [-0.48, +0.48] to [0, 0.96]
        const rawY = pos.getY(v) + 0.48;
        const hNorm = Math.max(0, Math.min(1, rawY / 0.96));
        const taper = 1.0 - hNorm * 0.88;
        pos.setX(v, pos.getX(v) * taper);
        pos.setY(v, rawY * (0.85 + (b % 2) * 0.18));
        pos.setZ(v, hNorm * hNorm * bendCurve);

        tmpCol.lerpColors(rootColor, tipColor, Math.pow(hNorm, 0.72));
        colArr[v * 3] = tmpCol.r;
        colArr[v * 3 + 1] = tmpCol.g;
        colArr[v * 3 + 2] = tmpCol.b;
      }
      bladeGeo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
      bladeGeo.computeVertexNormals();

      const yaw = (b * Math.PI * 2) / bladeCount + (b % 2) * 0.28;
      bladeGeo.rotateY(yaw);
      const offsetRad = b === 0 ? 0.02 : 0.085;
      bladeGeo.translate(Math.cos(yaw) * offsetRad, 0, Math.sin(yaw) * offsetRad);
      blades.push(bladeGeo);
    }
    const merged = BufferGeometryUtils.mergeGeometries(blades);
    blades.forEach((g) => g.dispose());
    return merged;
  };
  const tallGrassGeo = trackGeo(makeGrassTuftGeo());
  const tallGrassMat = applyWindSway(
    trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        vertexColors: true,
        roughness: 0.78,
        metalness: 0.0,
        side: THREE.DoubleSide,
      }),
    ),
    'grass',
  );
  const tallGrassCount = isPotato ? 3200 : 4200;
  if (tallGrassCount > 0) {
    const grassInst = new THREE.InstancedMesh(tallGrassGeo, tallGrassMat, tallGrassCount);
    grassInst.receiveShadow = !isPotato && !isUltraLow;
    let gIdx = 0;
    let gTry = 0;
    while (gIdx < tallGrassCount && gTry < tallGrassCount * 5) {
      gTry++;
      let gx: number;
      let gz: number;
      if (placedTreeCoords.length > 0 && rand() < 0.28) {
        const tree = placedTreeCoords[Math.floor(rand() * placedTreeCoords.length)];
        const ta = rand() * Math.PI * 2;
        const td = 1.1 + rand() * 4.2;
        gx = tree.x + Math.cos(ta) * td;
        gz = tree.z + Math.sin(ta) * td;
      } else {
        const a = rand() * Math.PI * 2;
        const d = 2.5 + Math.sqrt(rand()) * (PLAYABLE_RADIUS + 4);
        gx = Math.cos(a) * d;
        gz = Math.sin(a) * d;
      }

      const trailVal = trailFactorAt(gx, gz);
      if (trailVal > 0.58) continue;
      if (clearingFactorAt(gx, gz) > 0.8) continue;
      if (cabinExclusionAt(gx, gz) > 0.06) continue;
      if (villageExclusionAt(gx, gz) > 0.04) continue;
      if (riverFactorAt(gx, gz) > 0.12) continue;
      if (mountainFactorAt(gx, gz) > 0.42) continue;
      const pdx = gx - POND_CENTER.x;
      const pdz = gz - POND_CENTER.z;
      if (pdx * pdx + pdz * pdz < (POND_CENTER.radius + 0.25) ** 2) continue;

      const isTrailBorder = trailVal > 0.24;
      const tuftBurst = isTrailBorder ? 1 : Math.min(3, tallGrassCount - gIdx);
      for (let tb = 0; tb < tuftBurst && gIdx < tallGrassCount; tb++) {
        const ox = tb === 0 ? 0 : (rand() - 0.5) * 1.15;
        const oz = tb === 0 ? 0 : (rand() - 0.5) * 1.15;
        const px = gx + ox;
        const pz = gz + oz;
        if (
          trailFactorAt(px, pz) > 0.58 ||
          cabinExclusionAt(px, pz) > 0.06 ||
          villageExclusionAt(px, pz) > 0.04 ||
          riverFactorAt(px, pz) > 0.12
        ) {
          continue;
        }
        const gy = groundHeightAt(px, pz);
        const sc = isTrailBorder ? 0.65 + rand() * 0.54 : 0.78 + rand() * 0.95;
        dummy.position.set(px, gy - 0.03, pz);
        dummy.rotation.set((rand() - 0.5) * 0.18, rand() * Math.PI * 2, (rand() - 0.5) * 0.18);
        dummy.scale.set(
          sc * (0.9 + rand() * 0.35),
          sc * (0.9 + rand() * 0.48),
          sc * (0.9 + rand() * 0.35),
        );
        dummy.updateMatrix();
        grassInst.setMatrixAt(gIdx, dummy.matrix);

        fernShade.setHSL(0.24 + rand() * 0.09, 0.45 + rand() * 0.22, 0.20 + rand() * 0.17);
        grassInst.setColorAt(gIdx, fernShade);
        gIdx++;
      }
    }
    grassInst.count = gIdx;
    grassInst.instanceMatrix.needsUpdate = true;
    if (grassInst.instanceColor) grassInst.instanceColor.needsUpdate = true;
    grassInst.computeBoundingSphere();
    group.add(grassInst);
  }

  // 7b. Instanced Dense Mossy Shrubs (Moitas Densas)
  const makeDenseShrubGeo = () => {
    const lobes: THREE.BufferGeometry[] = [];
    const specs: Array<[number, number, number, number, number, number]> = [
      [0, 0.24, 0, 0.62, 0.46, 0.58],
      [-0.36, 0.16, 0.22, 0.44, 0.36, 0.42],
      [0.34, 0.18, -0.18, 0.46, 0.38, 0.44],
      [0.08, 0.42, 0.08, 0.42, 0.34, 0.4],
    ];
    for (let i = 0; i < specs.length; i++) {
      const [ox, oy, oz, sx, sy, sz] = specs[i];
      const g = new THREE.IcosahedronGeometry(1, 1);
      g.scale(sx, sy, sz);
      g.translate(ox, oy, oz);
      lobes.push(g);
    }
    const merged = BufferGeometryUtils.mergeGeometries(lobes);
    lobes.forEach((g) => g.dispose());
    return merged;
  };
  const shrubGeo = trackGeo(makeDenseShrubGeo());
  const shrubMat = applyWindSway(
    trackMat(
      new THREE.MeshStandardMaterial({
        map: isPotato ? null : textures.foliage,
        color: 0xffffff,
        roughness: 0.9,
        metalness: 0.0,
      }),
    ),
    'shrub',
  );
  const shrubCount = 580;
  if (shrubCount > 0) {
    const shrubInst = new THREE.InstancedMesh(shrubGeo, shrubMat, shrubCount);
    shrubInst.receiveShadow = !isPotato && !isUltraLow;
    let shIdx = 0;
    for (let i = 0; i < shrubCount * 5 && shIdx < shrubCount; i++) {
      const a = rand() * Math.PI * 2;
      const d = 5 + Math.sqrt(rand()) * PLAYABLE_RADIUS;
      const sx = Math.cos(a) * d;
      const sz = Math.sin(a) * d;
      if (trailFactorAt(sx, sz) > 0.34) continue;
      if (clearingFactorAt(sx, sz) > 0.65) continue;
      if (cabinExclusionAt(sx, sz) > 0.08) continue;
      if (villageExclusionAt(sx, sz) > 0.04) continue;
      if (riverFactorAt(sx, sz) > 0.12) continue;
      if (mountainFactorAt(sx, sz) > 0.4) continue;
      const pdx = sx - POND_CENTER.x;
      const pdz = sz - POND_CENTER.z;
      if (pdx * pdx + pdz * pdz < (POND_CENTER.radius + 0.8) ** 2) continue;

      const gy = groundHeightAt(sx, sz);
      const sc = 0.72 + rand() * 0.95;
      dummy.position.set(sx, gy - 0.05, sz);
      dummy.rotation.set(rand() * 0.18, rand() * Math.PI * 2, rand() * 0.18);
      dummy.scale.set(sc * 1.15, sc * 0.85, sc * 1.12);
      dummy.updateMatrix();
      shrubInst.setMatrixAt(shIdx, dummy.matrix);

      fernShade.setHSL(0.26 + rand() * 0.07, 0.38 + rand() * 0.18, 0.16 + rand() * 0.12);
      shrubInst.setColorAt(shIdx, fernShade);
      shIdx++;
    }
    shrubInst.count = shIdx;
    shrubInst.instanceMatrix.needsUpdate = true;
    if (shrubInst.instanceColor) shrubInst.instanceColor.needsUpdate = true;
    shrubInst.computeBoundingSphere();
    group.add(shrubInst);
  }

  // 7b2. Instanced Fallen Jungle Leaves Carpet (folhas caídas sob árvores, margens de trilhas e cabanas)
  const fallenLeafGeo = trackGeo(new THREE.PlaneGeometry(0.28, 0.18));
  fallenLeafGeo.rotateX(-Math.PI / 2);
  const fallenLeafMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.92,
      metalness: 0.0,
      side: THREE.DoubleSide,
    }),
  );
  const fallenLeafCount = 1600;
  if (fallenLeafCount > 0) {
    const leafInst = new THREE.InstancedMesh(fallenLeafGeo, fallenLeafMat, fallenLeafCount);
    leafInst.receiveShadow = !isPotato && !isUltraLow;
    let lfIdx = 0;
    for (let i = 0; i < fallenLeafCount * 4 && lfIdx < fallenLeafCount; i++) {
      let lx: number;
      let lz: number;
      if (placedTreeCoords.length > 0 && rand() < 0.45) {
        const tree = placedTreeCoords[Math.floor(rand() * placedTreeCoords.length)];
        const ta = rand() * Math.PI * 2;
        const td = 0.7 + rand() * 3.8;
        lx = tree.x + Math.cos(ta) * td;
        lz = tree.z + Math.sin(ta) * td;
      } else {
        const a = rand() * Math.PI * 2;
        const d = 2.0 + Math.sqrt(rand()) * PLAYABLE_RADIUS;
        lx = Math.cos(a) * d;
        lz = Math.sin(a) * d;
      }
      if (cabinExclusionAt(lx, lz) > 0.04) continue;
      if (villageExclusionAt(lx, lz) > 0.04) continue;
      if (riverFactorAt(lx, lz) > 0.1) continue;
      const pdx = lx - POND_CENTER.x;
      const pdz = lz - POND_CENTER.z;
      if (pdx * pdx + pdz * pdz < (POND_CENTER.radius + 0.15) ** 2) continue;

      const gy = groundHeightAt(lx, lz);
      dummy.position.set(lx, gy + 0.025, lz);
      dummy.rotation.set((rand() - 0.5) * 0.12, rand() * Math.PI * 2, (rand() - 0.5) * 0.12);
      const sc = 0.75 + rand() * 0.95;
      dummy.scale.set(sc, 1, sc * (0.7 + rand() * 0.5));
      dummy.updateMatrix();
      leafInst.setMatrixAt(lfIdx, dummy.matrix);

      const paletteRoll = rand();
      if (paletteRoll < 0.45) {
        fernShade.setHSL(0.08 + rand() * 0.04, 0.42 + rand() * 0.16, 0.2 + rand() * 0.12);
      } else if (paletteRoll < 0.8) {
        fernShade.setHSL(0.12 + rand() * 0.05, 0.36 + rand() * 0.16, 0.24 + rand() * 0.12);
      } else {
        fernShade.setHSL(0.24 + rand() * 0.05, 0.32 + rand() * 0.14, 0.18 + rand() * 0.1);
      }
      leafInst.setColorAt(lfIdx, fernShade);
      lfIdx++;
    }
    leafInst.count = lfIdx;
    leafInst.instanceMatrix.needsUpdate = true;
    if (leafInst.instanceColor) leafInst.instanceColor.needsUpdate = true;
    leafInst.computeBoundingSphere();
    group.add(leafInst);
  }

  // 7c. Winding Surface Jungle Roots (Raízes Espalhadas pelo Chão e Margens de Trilhas)
  const rootCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.1, -0.08, 0.12),
    new THREE.Vector3(-0.35, 0.16, -0.08),
    new THREE.Vector3(0.45, 0.11, 0.14),
    new THREE.Vector3(1.25, -0.1, -0.05),
  ]);
  const surfaceRootGeo = trackGeo(new THREE.TubeGeometry(rootCurve, 10, 0.11, 6, false));
  const surfaceRootMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: isPotato ? null : textures.bark,
      color: 0x52442e,
      roughness: 0.95,
      metalness: 0.0,
    }),
  );
  const rootPropCount = 170;
  if (rootPropCount > 0) {
    const rootInst = new THREE.InstancedMesh(surfaceRootGeo, surfaceRootMat, rootPropCount);
    rootInst.receiveShadow = !isPotato && !isUltraLow;
    let rIdx = 0;
    for (let i = 0; i < rootPropCount * 5 && rIdx < rootPropCount; i++) {
      const a = rand() * Math.PI * 2;
      const d = 7 + Math.sqrt(rand()) * PLAYABLE_RADIUS;
      const rx = Math.cos(a) * d;
      const rz = Math.sin(a) * d;
      if (trailFactorAt(rx, rz) > 0.56) continue;
      if (cabinExclusionAt(rx, rz) > 0.12) continue;
      if (villageExclusionAt(rx, rz) > 0.05) continue;
      if (riverFactorAt(rx, rz) > 0.12) continue;
      const pdx = rx - POND_CENTER.x;
      const pdz = rz - POND_CENTER.z;
      if (pdx * pdx + pdz * pdz < (POND_CENTER.radius + 1.2) ** 2) continue;

      const gy = groundHeightAt(rx, rz);
      const sc = 0.8 + rand() * 1.1;
      dummy.position.set(rx, gy, rz);
      dummy.rotation.set((rand() - 0.5) * 0.12, rand() * Math.PI * 2, (rand() - 0.5) * 0.12);
      dummy.scale.set(sc, sc * (0.75 + rand() * 0.45), sc);
      dummy.updateMatrix();
      rootInst.setMatrixAt(rIdx, dummy.matrix);
      rIdx++;
    }
    rootInst.count = rIdx;
    rootInst.instanceMatrix.needsUpdate = true;
    rootInst.computeBoundingSphere();
    group.add(rootInst);
  }

  const fallenLogGeo = trackGeo(new THREE.CylinderGeometry(0.24, 0.3, 3.8, 7));
  fallenLogGeo.rotateZ(Math.PI / 2);
  const fallenLogMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: isPotato ? null : textures.bark,
      color: 0x4f4733,
      roughness: 0.95,
      metalness: 0.0,
    }),
  );
  const logCount = 30;
  if (logCount > 0) {
    const logInst = new THREE.InstancedMesh(fallenLogGeo, fallenLogMat, logCount);
    logInst.receiveShadow = !isPotato && !isUltraLow;
    let logIdx = 0;
    for (let i = 0; i < 160 && logIdx < logCount; i++) {
      const a = rand() * Math.PI * 2;
      const d = 12 + rand() * (PLAYABLE_RADIUS - 10);
      const lx = Math.cos(a) * d;
      const lz = Math.sin(a) * d;
      if (trailFactorAt(lx, lz) > 0.15) continue;
      if (clearingFactorAt(lx, lz) > 0.35) continue;
      if (cabinExclusionAt(lx, lz) > 0.15) continue;
      if (villageExclusionAt(lx, lz) > 0.05) continue;
      if (riverFactorAt(lx, lz) > 0.12) continue;
      const pdx = lx - POND_CENTER.x;
      const pdz = lz - POND_CENTER.z;
      if (pdx * pdx + pdz * pdz < (POND_CENTER.radius + 2.5) ** 2) continue;

      const gy = groundHeightAt(lx, lz);
      const sc = 0.8 + rand() * 0.65;
      dummy.position.set(lx, gy + 0.16 * sc, lz);
      dummy.rotation.set((rand() - 0.5) * 0.08, rand() * Math.PI * 2, (rand() - 0.5) * 0.08);
      dummy.scale.set(sc, sc, sc);
      dummy.updateMatrix();
      logInst.setMatrixAt(logIdx, dummy.matrix);
      logIdx++;
    }
    logInst.count = logIdx;
    logInst.instanceMatrix.needsUpdate = true;
    logInst.computeBoundingSphere();
    group.add(logInst);
  }

  // Tropical Flowers / Red & Amber Heliconia Accents (Instanced)
  const flowerGeo = trackGeo(new THREE.ConeGeometry(0.14, 0.42, 5));
  flowerGeo.translate(0, 0.45, 0);
  const flowerMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.6,
      metalness: 0.02,
      emissive: 0x260d04,
      emissiveIntensity: 0.2,
    }),
  );
  const flowerCount = 130;
  if (flowerCount > 0) {
    const flowerInst = new THREE.InstancedMesh(flowerGeo, flowerMat, flowerCount);
    let flIdx = 0;
    for (let i = 0; i < 520 && flIdx < flowerCount; i++) {
      const a = rand() * Math.PI * 2;
      const d = 5 + rand() * PLAYABLE_RADIUS;
      const x = Math.cos(a) * d;
      const z = Math.sin(a) * d;
      if (trailFactorAt(x, z) > 0.25) continue;
      if (cabinExclusionAt(x, z) > 0.1) continue;
      if (villageExclusionAt(x, z) > 0.05) continue;
      if (riverFactorAt(x, z) > 0.12) continue;
      const pdx = x - POND_CENTER.x;
      const pdz = z - POND_CENTER.z;
      if (pdx * pdx + pdz * pdz < (POND_CENTER.radius + 1) ** 2) continue;

      dummy.position.set(x, groundHeightAt(x, z), z);
      dummy.rotation.set((rand() - 0.5) * 0.25, rand() * Math.PI * 2, (rand() - 0.5) * 0.25);
      dummy.scale.setScalar(0.8 + rand() * 0.65);
      dummy.updateMatrix();
      flowerInst.setMatrixAt(flIdx, dummy.matrix);

      const paletteChoice = rand();
      if (paletteChoice < 0.45) fernShade.setHex(0xd45532);
      else if (paletteChoice < 0.8) fernShade.setHex(0xde9e2f);
      else fernShade.setHex(0xc45e96);
      flowerInst.setColorAt(flIdx, fernShade);
      flIdx++;
    }
    flowerInst.count = flIdx;
    flowerInst.instanceMatrix.needsUpdate = true;
    if (flowerInst.instanceColor) flowerInst.instanceColor.needsUpdate = true;
    flowerInst.computeBoundingSphere();
    group.add(flowerInst);
  }

  // 8. Atmospheric Canopy Sunbeam Shafts in Clearings (disabled in potato mode)
  const beamGroup = new THREE.Group();
  const beamGeo = trackGeo(new THREE.ConeGeometry(4.4, 22, 14, 1, true));
  const beamMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: 0xffe8b0,
      transparent: true,
      opacity: 0.06,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    }),
  );
  const clearingBeams: THREE.Mesh[] = [];
  if (!isPotato && !isUltraLow) {
    CLEARINGS.forEach((c, idx) => {
      const gy = groundHeightAt(c.x, c.z);
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(c.x + 2.2, gy + 9.2, c.z + 1.2);
      beam.rotation.z = -0.28 + (idx % 2 === 0 ? 0.04 : -0.04);
      beam.rotation.x = 0.14;
      beamGroup.add(beam);
      clearingBeams.push(beam);
    });
    group.add(beamGroup);
  }

  // 9. Local Wrapping Jungle Spores (day) / Glowing Fireflies (night)
  const moteCount =
    quality === 'potato'
      ? 0
      : quality === 'ultra-low'
        ? 24
        : quality === 'low'
          ? 50
          : quality === 'medium'
            ? 100
            : quality === 'high'
              ? 140
              : 185;
  const moteSpan = 28;
  const motePositions = new Float32Array(moteCount * 3);
  const moteOffsets = new Float32Array(moteCount * 3);
  const motePhases = new Float32Array(moteCount);
  for (let i = 0; i < moteCount; i++) {
    moteOffsets[i * 3] = (rand() - 0.5) * moteSpan;
    moteOffsets[i * 3 + 1] = 0.6 + rand() * 4.8;
    moteOffsets[i * 3 + 2] = (rand() - 0.5) * moteSpan;
    motePositions[i * 3] = moteOffsets[i * 3];
    motePositions[i * 3 + 1] = moteOffsets[i * 3 + 1];
    motePositions[i * 3 + 2] = moteOffsets[i * 3 + 2];
    motePhases[i] = rand() * Math.PI * 2;
  }
  const moteGeo = trackGeo(new THREE.BufferGeometry());
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));
  const moteMat = trackMat(
    new THREE.PointsMaterial({
      color: 0xfae98f,
      size: 0.18,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    }),
  );
  const motePoints = new THREE.Points(moteGeo, moteMat);
  motePoints.frustumCulled = false;
  if (moteCount > 0) {
    group.add(motePoints);
  }

  // 10. Interactive Relics & Exploration Landmarks
  const pedestalBaseGeo = trackGeo(new THREE.CylinderGeometry(0.62, 0.78, 0.72, 8));
  const pedestalCapGeo = trackGeo(new THREE.CylinderGeometry(0.7, 0.64, 0.16, 8));
  const relicRingGeo = trackGeo(new THREE.RingGeometry(0.88, 1.08, 28));
  relicRingGeo.rotateX(-Math.PI / 2);

  const landmarkSteleGeo = trackGeo(new THREE.BoxGeometry(0.95, 2.35, 0.55));
  const landmarkPlinthGeo = trackGeo(new THREE.BoxGeometry(1.35, 0.35, 0.95));
  const landmarkCrystalGeo = trackGeo(new THREE.OctahedronGeometry(0.36, 0));

  const goldMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xf4c430,
      emissive: 0x996500,
      emissiveIntensity: 0.55,
      roughness: 0.2,
      metalness: 0.9,
    }),
  );
  const jadeMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x35e0a1,
      emissive: 0x0d7a55,
      emissiveIntensity: 0.6,
      roughness: 0.18,
      metalness: 0.35,
    }),
  );

  const addInteractableVisual = (item: InteractablePoint, isDynamic = false) => {
    if (visualInteractables.has(item.id)) return;
    const gy = groundHeightAt(item.x, item.z);
    const holder = new THREE.Group();
    holder.position.set(item.x, gy + (item.yOffset ?? 0), item.z);
    if (isDynamic) {
      dynamicIds.add(item.id);
    }

    if (item.kind === 'relic') {
      const base = new THREE.Mesh(pedestalBaseGeo, ruinStoneMat);
      base.position.y = 0.36;
      base.castShadow = castHeroShadows;
      base.receiveShadow = !isPotato && !isUltraLow;
      holder.add(base);

      const cap = new THREE.Mesh(pedestalCapGeo, ruinStoneMat);
      cap.position.y = 0.78;
      holder.add(cap);

      // Composite Relic Artifact (3 parts: outer ring + core gem + crown spikes)
      const artifact = new THREE.Group();
      artifact.position.y = 1.48;

      const core = new THREE.Mesh(
        trackGeo(new THREE.OctahedronGeometry(0.32, 0)),
        item.id === 'relic-crystal' ? jadeMat : goldMat,
      );
      core.castShadow = !isSoftwareGl;
      artifact.add(core);

      const halo = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(0.45, 0.055, 8, 20)),
        goldMat,
      );
      artifact.add(halo);

      const finial = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.11, 0.28, 6)), goldMat);
      finial.position.y = 0.44;
      artifact.add(finial);

      holder.add(artifact);

      const ringMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xfacc15,
          transparent: true,
          opacity: 0.55,
          depthWrite: false,
        }),
      );
      const ring = new THREE.Mesh(relicRingGeo, ringMat);
      ring.position.y = 0.04;
      holder.add(ring);

      const light = !isSoftwareGl && !isPotato && !isUltraLow ? new THREE.PointLight(0xffd24d, 1.4, 7.5, 2) : null;
      if (light) {
        light.position.y = 1.65;
        holder.add(light);
      }

      colliders.push({ x: item.x, z: item.z, radius: 0.78, kind: 'pedestal' });
      visualInteractables.set(item.id, {
        id: item.id,
        kind: 'relic',
        group: holder,
        artifact,
        ring,
        light,
        baseY: 1.48,
      });
    } else if (item.kind === 'landmark') {
      // Exploration Landmark Stele
      const plinth = new THREE.Mesh(landmarkPlinthGeo, ruinStoneMat);
      plinth.position.y = 0.17;
      plinth.receiveShadow = true;
      holder.add(plinth);

      const stele = new THREE.Mesh(landmarkSteleGeo, ruinStoneMat);
      stele.position.y = 1.35;
      stele.castShadow = !isSoftwareGl;
      stele.receiveShadow = true;
      holder.add(stele);

      const glyphMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0ea5e9,
          emissiveIntensity: 0.75,
          roughness: 0.22,
          metalness: 0.4,
        }),
      );
      const artifact = new THREE.Group();
      artifact.position.y = 2.88;
      const crystal = new THREE.Mesh(landmarkCrystalGeo, glyphMat);
      artifact.add(crystal);
      holder.add(artifact);

      const ringMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.45,
          depthWrite: false,
        }),
      );
      const ring = new THREE.Mesh(relicRingGeo, ringMat);
      ring.scale.setScalar(1.35);
      ring.position.y = 0.04;
      holder.add(ring);

      const light = !isSoftwareGl && !isPotato && !isUltraLow ? new THREE.PointLight(0x38bdf8, 1.3, 8.5, 2) : null;
      if (light) {
        light.position.y = 2.95;
        holder.add(light);
      }

      colliders.push({ x: item.x, z: item.z, radius: 0.85, kind: 'ruin' });
      visualInteractables.set(item.id, {
        id: item.id,
        kind: 'landmark',
        group: holder,
        artifact,
        ring,
        light,
        baseY: 2.88,
      });
    } else {
      // Gatherable Jungle Resource / Consumable (no dynamic light to keep FPS crisp)
      const artifact = new THREE.Group();
      let ringColor = 0x4ade80;
      let baseY = 0.25;

      if (item.itemId === 'fruit') {
        ringColor = 0xfb923c;
        baseY = 0.34;
        const fruitMat = trackMat(
          new THREE.MeshStandardMaterial({
            color: 0xf97316,
            emissive: 0x9a3412,
            emissiveIntensity: 0.22,
            roughness: 0.38,
            metalness: 0.05,
          }),
        );
        const leafMat = trackMat(
          new THREE.MeshStandardMaterial({
            color: 0x22c55e,
            roughness: 0.65,
            metalness: 0.02,
          }),
        );
        const mainFruit = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.22, 10, 8)), fruitMat);
        mainFruit.scale.set(1, 1.22, 1);
        mainFruit.castShadow = !isSoftwareGl;
        artifact.add(mainFruit);

        const sideFruit = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.15, 8, 6)), fruitMat);
        sideFruit.position.set(0.2, -0.06, 0.14);
        artifact.add(sideFruit);

        const leaf = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.24, 0.03, 0.1)), leafMat);
        leaf.position.set(0.08, 0.24, 0);
        leaf.rotation.z = 0.35;
        artifact.add(leaf);
      } else if (item.itemId === 'herb') {
        ringColor = 0x34d399;
        baseY = 0.18;
        const herbMat = trackMat(
          new THREE.MeshStandardMaterial({
            color: 0x10b981,
            emissive: 0x065f46,
            emissiveIntensity: 0.32,
            roughness: 0.55,
            metalness: 0.05,
          }),
        );
        const blossomMat = trackMat(
          new THREE.MeshStandardMaterial({
            color: 0xa7f3d0,
            emissive: 0x34d399,
            emissiveIntensity: 0.45,
            roughness: 0.35,
          }),
        );
        const bladeGeo = trackGeo(new THREE.ConeGeometry(0.14, 0.44, 5));
        for (let b = 0; b < 4; b++) {
          const blade = new THREE.Mesh(bladeGeo, herbMat);
          const ang = (b * Math.PI) / 2;
          blade.position.set(Math.cos(ang) * 0.12, 0.06, Math.sin(ang) * 0.12);
          blade.rotation.z = Math.cos(ang) * 0.42;
          blade.rotation.x = Math.sin(ang) * 0.42;
          artifact.add(blade);
        }
        const bud = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.11, 0)), blossomMat);
        bud.position.y = 0.22;
        artifact.add(bud);
      } else if (item.itemId === 'wood') {
        ringColor = 0xd97706;
        baseY = 0.12;
        const branchMat = trackMat(
          new THREE.MeshStandardMaterial({
            color: 0x784b2a,
            roughness: 0.88,
            metalness: 0.02,
          }),
        );
        const logA = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.08, 0.1, 0.78, 7)),
          branchMat,
        );
        logA.rotation.z = Math.PI / 2 - 0.12;
        logA.rotation.y = 0.35;
        logA.castShadow = !isSoftwareGl;
        artifact.add(logA);

        const logB = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.07, 0.085, 0.68, 7)),
          branchMat,
        );
        logB.position.set(0.05, 0.07, 0.06);
        logB.rotation.z = Math.PI / 2 + 0.15;
        logB.rotation.y = -0.6;
        artifact.add(logB);
      } else {
        // Flint stone
        ringColor = 0x94a3b8;
        baseY = 0.15;
        const flintMat = trackMat(
          new THREE.MeshStandardMaterial({
            color: 0x64748b,
            roughness: 0.65,
            metalness: 0.18,
          }),
        );
        const stoneA = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(0.24, 0)), flintMat);
        stoneA.scale.set(1.25, 0.72, 1.0);
        stoneA.castShadow = !isSoftwareGl;
        artifact.add(stoneA);

        const stoneB = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(0.15, 0)), flintMat);
        stoneB.position.set(0.2, -0.02, 0.14);
        stoneB.scale.set(1.1, 0.75, 0.9);
        artifact.add(stoneB);
      }

      if (item.itemId === 'medkit') {
        ringColor = 0xf87171;
        baseY = 0.2;
        artifact.clear();
        const boxMat = trackMat(
          new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.42, metalness: 0.08 }),
        );
        const crossMat = trackMat(
          new THREE.MeshStandardMaterial({
            color: 0xef4444,
            emissive: 0x7f1d1d,
            emissiveIntensity: 0.35,
            roughness: 0.35,
          }),
        );
        const caseMesh = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.42, 0.24, 0.32)), boxMat);
        artifact.add(caseMesh);
        const barH = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.18, 0.04, 0.06)), crossMat);
        barH.position.y = 0.125;
        artifact.add(barH);
        const barV = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.06, 0.04, 0.18)), crossMat);
        barV.position.y = 0.125;
        artifact.add(barV);
      } else if (item.itemId === 'rations') {
        ringColor = 0x38bdf8;
        baseY = 0.2;
        artifact.clear();
        const flaskMat = trackMat(
          new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35, metalness: 0.3 }),
        );
        const packMat = trackMat(
          new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.75, metalness: 0.04 }),
        );
        const canteen = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.11, 0.12, 0.28, 10)),
          flaskMat,
        );
        canteen.position.x = -0.1;
        artifact.add(canteen);
        const rationBox = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.24, 0.16, 0.2)), packMat);
        rationBox.position.set(0.11, -0.05, 0.04);
        artifact.add(rationBox);
      } else if (item.itemId === 'axe') {
        ringColor = 0xfbbf24;
        baseY = 0.24;
        artifact.clear();
        const hWoodMat = trackMat(
          new THREE.MeshStandardMaterial({ color: 0x713f12, roughness: 0.82, metalness: 0.04 }),
        );
        const bladeMat = trackMat(
          new THREE.MeshStandardMaterial({ color: 0xdbeafe, roughness: 0.26, metalness: 0.88 }),
        );
        const handle = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.032, 0.036, 0.68, 8)),
          hWoodMat,
        );
        handle.rotation.z = 0.95;
        artifact.add(handle);
        const head = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.18, 0.24, 0.05)), bladeMat);
        head.position.set(-0.22, 0.16, 0);
        head.rotation.z = 0.95;
        artifact.add(head);
      } else if (item.itemId === 'sword') {
        ringColor = 0xe2e8f0;
        baseY = 0.24;
        artifact.clear();
        const bladeMat = trackMat(
          new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.22, metalness: 0.92 }),
        );
        const guardMat = trackMat(
          new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.3, metalness: 0.82 }),
        );
        const blade = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.05, 0.72, 0.025)), bladeMat);
        blade.rotation.z = 1.1;
        artifact.add(blade);
        const guard = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.2, 0.04, 0.05)), guardMat);
        guard.position.set(0.25, -0.14, 0);
        guard.rotation.z = 1.1;
        artifact.add(guard);
      } else if (item.itemId === 'rope') {
        ringColor = 0xd6b57a;
        baseY = 0.16;
        artifact.clear();
        const ropeMat = trackMat(
          new THREE.MeshStandardMaterial({ color: 0xc29b61, roughness: 0.92, metalness: 0.0 }),
        );
        const coilA = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.2, 0.052, 8, 16)), ropeMat);
        coilA.rotation.x = Math.PI / 2;
        artifact.add(coilA);
        const coilB = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.16, 0.045, 8, 14)), ropeMat);
        coilB.rotation.x = Math.PI / 2;
        coilB.position.y = 0.07;
        artifact.add(coilB);
      } else if (item.itemId === 'lantern') {
        ringColor = 0xfef08a;
        baseY = 0.24;
        artifact.clear();
        const metalMat = trackMat(
          new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.38, metalness: 0.72 }),
        );
        const glowMat = trackMat(
          new THREE.MeshStandardMaterial({
            color: 0xfef08a,
            emissive: 0xf59e0b,
            emissiveIntensity: 0.8,
            roughness: 0.2,
          }),
        );
        const body = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.11, 0.12, 0.28, 8)),
          metalMat,
        );
        artifact.add(body);
        const lens = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.08, 8, 8)), glowMat);
        lens.position.y = 0.04;
        artifact.add(lens);
      } else if (item.itemId === 'torch') {
        ringColor = 0xf97316;
        baseY = 0.24;
        artifact.clear();
        const tWoodMat = trackMat(
          new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 }),
        );
        const tipMat = trackMat(
          new THREE.MeshStandardMaterial({
            color: 0xfb923c,
            emissive: 0xea580c,
            emissiveIntensity: 0.75,
          }),
        );
        const stick = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.04, 0.03, 0.56, 7)),
          tWoodMat,
        );
        stick.rotation.z = 0.9;
        artifact.add(stick);
        const flame = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.08, 0.18, 6)), tipMat);
        flame.position.set(-0.24, 0.19, 0);
        flame.rotation.z = 0.9;
        artifact.add(flame);
      } else if (item.itemId === 'raw_meat') {
        ringColor = 0xf87171;
        baseY = 0.22;
        artifact.clear();
        const meatMat = trackMat(
          new THREE.MeshStandardMaterial({
            color: 0xc2272d,
            emissive: 0x5c1115,
            emissiveIntensity: 0.28,
            roughness: 0.55,
            metalness: 0.04,
          }),
        );
        const fatMat = trackMat(
          new THREE.MeshStandardMaterial({
            color: 0xf4d4c8,
            roughness: 0.62,
            metalness: 0.02,
          }),
        );
        const steak = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.36, 0.14, 0.24)), meatMat);
        steak.castShadow = castHeroShadows;
        artifact.add(steak);

        const cap = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.11, 0.12, 0.145, 8)), meatMat);
        cap.position.set(0.15, 0, 0);
        artifact.add(cap);

        const marble = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.24, 0.148, 0.05)), fatMat);
        marble.position.set(-0.02, 0, 0.02);
        marble.rotation.y = 0.22;
        artifact.add(marble);

        const bone = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.036, 0.036, 0.24, 7)), fatMat);
        bone.rotation.z = Math.PI / 2;
        bone.position.set(-0.22, 0, -0.02);
        artifact.add(bone);
      } else if (item.itemId === 'sweet_berry') {
        ringColor = 0xf43f5e;
        baseY = 0.36;
        artifact.clear();

        // Permanent leafy bush base attached directly to holder (stays in world after harvesting berries)
        const bushLeafMat = applyWindSway(
          trackMat(
            new THREE.MeshStandardMaterial({
              map: isPotato ? null : textures.foliage,
              color: 0x2c5e27,
              roughness: 0.88,
              metalness: 0.0,
            }),
          ),
          'shrub',
        );
        const bushMesh = new THREE.Mesh(shrubGeo, bushLeafMat);
        bushMesh.scale.set(0.92, 0.88, 0.92);
        bushMesh.castShadow = castDetailShadows;
        bushMesh.receiveShadow = !isPotato && !isUltraLow;
        holder.add(bushMesh);

        // Bright ruby/crimson sweet berries growing visibly on top/sides of the bush
        const berryMat = trackMat(
          new THREE.MeshStandardMaterial({
            color: 0xe11d48,
            emissive: 0x881337,
            emissiveIntensity: 0.35,
            roughness: 0.28,
            metalness: 0.05,
          }),
        );
        const berryGeo = trackGeo(new THREE.SphereGeometry(0.072, 8, 7));
        const berryCoords: Array<[number, number, number]> = [
          [-0.22, 0.06, 0.28],
          [-0.12, 0.14, 0.32],
          [0.14, 0.16, 0.26],
          [0.28, 0.02, 0.18],
          [0.02, 0.24, 0.04],
          [-0.28, 0.04, -0.14],
          [0.24, 0.08, -0.22],
          [0.05, 0.12, -0.32],
          [-0.08, 0.22, -0.08],
          [0.18, 0.18, 0.08],
        ];
        for (let bi = 0; bi < berryCoords.length; bi++) {
          const [bx, by, bz] = berryCoords[bi];
          const bMesh = new THREE.Mesh(berryGeo, berryMat);
          bMesh.position.set(bx, by, bz);
          bMesh.scale.setScalar(0.85 + (bi % 3) * 0.14);
          artifact.add(bMesh);
        }
      }

      if (item.propStyle === 'crate') {
        ringColor = 0xf59e0b;
        baseY = 0.28;
        artifact.clear();
        const crateBox = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(0.58, 0.5, 0.58)),
          cabinPlankMat,
        );
        crateBox.castShadow = castHeroShadows;
        crateBox.receiveShadow = !isPotato && !isUltraLow;
        artifact.add(crateBox);

        const strap = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(0.61, 0.1, 0.61)),
          cabinMetalMat,
        );
        strap.position.y = 0.14;
        artifact.add(strap);

        const badge = new THREE.Mesh(
          trackGeo(new THREE.OctahedronGeometry(0.11, 0)),
          goldMat,
        );
        badge.position.y = 0.34;
        artifact.add(badge);
      }

      artifact.position.y = baseY;
      holder.add(artifact);

      const ringMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: ringColor,
          transparent: true,
          opacity: 0.42,
          depthWrite: false,
        }),
      );
      const ring = new THREE.Mesh(relicRingGeo, ringMat);
      ring.scale.setScalar(0.68);
      ring.position.y = 0.04;
      holder.add(ring);

      visualInteractables.set(item.id, {
        id: item.id,
        kind: 'gatherable',
        group: holder,
        artifact,
        ring,
        light: null,
        baseY,
        keepBaseOnCollect: item.itemId === 'sweet_berry',
      });
    }

    group.add(holder);
  };

  interactables.forEach((item) => addInteractableVisual(item, false));

  // 11. Zero-GC Pre-Allocated Object Pool for Particle Bursts
  const BURST_POOL_SIZE = 96;
  const burstPool: BurstParticle[] = [];
  const burstGeo = trackGeo(new THREE.OctahedronGeometry(0.11, 0));
  let burstCursor = 0;

  for (let i = 0; i < BURST_POOL_SIZE; i++) {
    const mat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
      }),
    );
    const mesh = new THREE.Mesh(burstGeo, mat);
    mesh.visible = false;
    group.add(mesh);
    burstPool.push({
      mesh,
      mat,
      active: false,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
      maxLife: 0.6,
    });
  }

  const spawnBurst = (x: number, y: number, z: number, colorHex: number, count = 18) => {
    if (isPotato) return;
    const actualCount = isUltraLow ? Math.min(5, count) : quality === 'low' ? Math.min(8, count) : count;
    for (let i = 0; i < actualCount; i++) {
      let slot = burstPool[burstCursor];
      for (let probe = 0; probe < BURST_POOL_SIZE; probe++) {
        const candidate = burstPool[(burstCursor + probe) % BURST_POOL_SIZE];
        if (!candidate.active) {
          slot = candidate;
          burstCursor = (burstCursor + probe + 1) % BURST_POOL_SIZE;
          break;
        }
      }
      if (slot.active) {
        burstCursor = (burstCursor + 1) % BURST_POOL_SIZE;
      }

      const theta = Math.random() * Math.PI * 2;
      const speed = 1.6 + Math.random() * 3.2;
      slot.active = true;
      slot.life = 0;
      slot.maxLife = 0.55 + Math.random() * 0.35;
      slot.vx = Math.cos(theta) * speed;
      slot.vy = 2.2 + Math.random() * 3.2;
      slot.vz = Math.sin(theta) * speed;
      slot.mat.color.setHex(colorHex);
      slot.mat.opacity = 1;
      slot.mesh.position.set(x, y, z);
      slot.mesh.scale.setScalar(1);
      slot.mesh.visible = true;
    }
  };

  const spawnDynamicGatherable = (item: InteractablePoint) => {
    addInteractableVisual(item, true);
  };

  // Craftable 3D Campfires (5 tongues, pulsing ember bed, warm night light + smoke & ember particle pool)
  interface CampfireVisual {
    id: string;
    x: number;
    z: number;
    group: THREE.Group;
    flames: THREE.Mesh[];
    emberBed: THREE.Mesh;
    light: THREE.PointLight | null;
    emberAccum: number;
    smokeAccum: number;
  }
  const campfireVisuals: CampfireVisual[] = [];
  let campfireCounter = 0;

  interface CampfirePuff {
    mesh: THREE.Mesh;
    mat: THREE.MeshBasicMaterial;
    active: boolean;
    isSpark: boolean;
    vx: number;
    vy: number;
    vz: number;
    life: number;
    maxLife: number;
  }
  const CF_PARTICLE_POOL = 48;
  const cfPuffPool: CampfirePuff[] = [];
  const cfSmokeGeo = trackGeo(new THREE.DodecahedronGeometry(0.14, 0));
  const cfSparkGeo = trackGeo(new THREE.OctahedronGeometry(0.042, 0));
  let cfPuffCursor = 0;
  for (let i = 0; i < CF_PARTICLE_POOL; i++) {
    const isSpark = i % 2 === 0;
    const mat = trackMat(
      new THREE.MeshBasicMaterial({
        color: isSpark ? 0xfb923c : 0x9ca3af,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    const mesh = new THREE.Mesh(isSpark ? cfSparkGeo : cfSmokeGeo, mat);
    mesh.visible = false;
    group.add(mesh);
    cfPuffPool.push({
      mesh,
      mat,
      active: false,
      isSpark,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
      maxLife: 1.0,
    });
  }

  const spawnCampfirePuff = (x: number, y: number, z: number, isSpark: boolean) => {
    if (isPotato) return;
    for (let p = 0; p < CF_PARTICLE_POOL; p++) {
      const slot = cfPuffPool[(cfPuffCursor + p) % CF_PARTICLE_POOL];
      if (!slot.active && slot.isSpark === isSpark) {
        cfPuffCursor = (cfPuffCursor + p + 1) % CF_PARTICLE_POOL;
        slot.active = true;
        slot.life = 0;
        slot.maxLife = isSpark ? 0.85 + Math.random() * 0.45 : 1.5 + Math.random() * 0.7;
        slot.vx = (Math.random() - 0.5) * (isSpark ? 0.55 : 0.24);
        slot.vy = isSpark ? 1.25 + Math.random() * 0.95 : 0.68 + Math.random() * 0.38;
        slot.vz = (Math.random() - 0.5) * (isSpark ? 0.55 : 0.24);
        slot.mat.color.setHex(isSpark ? (Math.random() > 0.4 ? 0xfb923c : 0xfef08a) : 0x94a3b8);
        slot.mat.opacity = isSpark ? 0.95 : 0.34;
        slot.mesh.position.set(
          x + (Math.random() - 0.5) * 0.18,
          y,
          z + (Math.random() - 0.5) * 0.18,
        );
        slot.mesh.scale.setScalar(isSpark ? 1.0 : 0.75);
        slot.mesh.visible = true;
        return;
      }
    }
  };

  const campfireStoneGeo = trackGeo(new THREE.DodecahedronGeometry(0.14, 0));
  const campfireLogGeo = trackGeo(new THREE.CylinderGeometry(0.065, 0.08, 0.82, 7));
  campfireLogGeo.rotateZ(Math.PI / 2);
  const campfireFlameOuterGeo = trackGeo(new THREE.ConeGeometry(0.2, 0.62, 7));
  campfireFlameOuterGeo.translate(0, 0.31, 0);
  const campfireFlameInnerGeo = trackGeo(new THREE.ConeGeometry(0.12, 0.42, 6));
  campfireFlameInnerGeo.translate(0, 0.21, 0);
  const campfireCharMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: isPotato ? null : textures.bark,
      color: 0x3b2618,
      roughness: 0.94,
    }),
  );
  const campfireEmberMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xea580c,
      emissiveIntensity: 1.15,
      roughness: 0.65,
    }),
  );
  const campfireFlameOuterMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: !isPotato,
      opacity: isPotato ? 1 : 0.88,
    }),
  );
  const campfireFlameInnerMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: 0xfef08a,
    }),
  );

  const spawnCampfire = (x: number, z: number) => {
    campfireCounter += 1;
    const id = `campfire-${campfireCounter}`;
    const gy = groundHeightAt(x, z);
    const cfGroup = new THREE.Group();
    cfGroup.position.set(x, gy, z);

    // Ring of river stones
    for (let s = 0; s < 8; s++) {
      const ang = (s / 8) * Math.PI * 2;
      const st = new THREE.Mesh(campfireStoneGeo, stoneMat);
      st.position.set(Math.cos(ang) * 0.44, 0.06, Math.sin(ang) * 0.44);
      st.scale.set(1.15, 0.72, 0.95);
      st.rotation.y = ang + 0.4;
      cfGroup.add(st);
    }

    // Glowing ember bed
    const emberBed = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.32, 0.36, 0.06, 8)),
      campfireEmberMat,
    );
    emberBed.position.y = 0.03;
    cfGroup.add(emberBed);

    // Crossed logs
    for (let l = 0; l < 3; l++) {
      const log = new THREE.Mesh(campfireLogGeo, campfireCharMat);
      log.position.y = 0.1;
      log.rotation.y = (l * Math.PI) / 3;
      log.rotation.z = l % 2 === 0 ? 0.14 : -0.14;
      cfGroup.add(log);
    }

    // Layered animated flames (5 lively flame tongues)
    const flames: THREE.Mesh[] = [];
    const outerOffsets: Array<[number, number, number]> = [
      [0, 0, 1.0],
      [0.09, -0.06, 0.76],
      [-0.08, 0.07, 0.72],
    ];
    outerOffsets.forEach(([ox, oz, sc]) => {
      const fm = new THREE.Mesh(campfireFlameOuterGeo, campfireFlameOuterMat);
      fm.position.set(ox, 0.08, oz);
      fm.scale.setScalar(sc);
      cfGroup.add(fm);
      flames.push(fm);
    });
    const coreOffsets: Array<[number, number, number]> = [
      [0, 0, 1.0],
      [0.05, 0.04, 0.74],
    ];
    coreOffsets.forEach(([ox, oz, sc]) => {
      const fm = new THREE.Mesh(campfireFlameInnerGeo, campfireFlameInnerMat);
      fm.position.set(ox, 0.1, oz);
      fm.scale.setScalar(sc);
      cfGroup.add(fm);
      flames.push(fm);
    });

    const light =
      !isSoftwareGl && !isPotato && !isUltraLow
        ? new THREE.PointLight(0xff8c32, 3.2, 16.0, 1.6)
        : null;
    if (light) {
      light.position.y = 0.72;
      cfGroup.add(light);
    }

    group.add(cfGroup);
    campfireVisuals.push({
      id,
      x,
      z,
      group: cfGroup,
      flames,
      emberBed,
      light,
      emberAccum: 0,
      smokeAccum: 0,
    });
    return { id, x, z };
  };

  const clearCampfires = () => {
    for (let i = 0; i < campfireVisuals.length; i++) {
      group.remove(campfireVisuals[i].group);
    }
    campfireVisuals.length = 0;
    for (let i = 0; i < cfPuffPool.length; i++) {
      cfPuffPool[i].active = false;
      cfPuffPool[i].mesh.visible = false;
    }
  };

  const clearDynamicVisuals = () => {
    dynamicIds.forEach((id) => {
      const vis = visualInteractables.get(id);
      if (vis) {
        group.remove(vis.group);
        visualInteractables.delete(id);
      }
    });
    dynamicIds.clear();
    clearCampfires();
  };

  const markInteractableCollected = (
    id: string,
    kind: 'relic' | 'landmark' | 'gatherable',
  ) => {
    const vis = visualInteractables.get(id);
    if (!vis) return;

    if (kind === 'relic') {
      vis.artifact.visible = false;
      vis.ring.visible = false;
      if (vis.light) vis.light.intensity = 0;
    } else if (kind === 'gatherable') {
      if (vis.keepBaseOnCollect) {
        vis.artifact.visible = false;
        vis.ring.visible = false;
      } else {
        vis.group.visible = false;
      }
    } else {
      const mat = vis.ring.material as THREE.MeshBasicMaterial;
      mat.color.setHex(0x4ade80);
      mat.opacity = 0.22;
      if (vis.light) {
        vis.light.color.setHex(0x4ade80);
        vis.light.intensity = 0.8;
      }
    }
  };

  const ensurePropFlashMaterials = (prop: DestructibleProp) => {
    if (prop.origMats) {
      for (let i = 0; i < prop.origMats.length; i++) {
        prop.origMats[i].mesh.material = prop.origMats[i].flashMat;
      }
      return;
    }
    const origMats: Array<{
      mesh: THREE.Mesh;
      mat: THREE.Material | THREE.Material[];
      flashMat: THREE.MeshStandardMaterial;
    }> = [];
    const flashMats: THREE.MeshStandardMaterial[] = [];
    const cloneCache = new Map<THREE.Material, THREE.MeshStandardMaterial>();

    prop.root.traverse((child) => {
      if (child instanceof THREE.Mesh && !Array.isArray(child.material) && child.material instanceof THREE.MeshStandardMaterial) {
        const origMat = child.material;
        let cloned = cloneCache.get(origMat);
        if (!cloned) {
          cloned = origMat.clone();
          cloned.onBeforeCompile = origMat.onBeforeCompile;
          cloned.customProgramCacheKey = origMat.customProgramCacheKey;
          cloneCache.set(origMat, cloned);
          flashMats.push(cloned);
          materials.push(cloned);
        }
        origMats.push({ mesh: child, mat: origMat, flashMat: cloned });
        child.material = cloned;
      }
    });
    prop.origMats = origMats;
    prop.flashMats = flashMats;
  };

  const restorePropOriginalMaterials = (prop: DestructibleProp) => {
    if (!prop.origMats) return;
    for (let i = 0; i < prop.origMats.length; i++) {
      prop.origMats[i].mesh.material = prop.origMats[i].mat;
    }
    if (prop.flashMats) {
      for (let i = 0; i < prop.flashMats.length; i++) {
        prop.flashMats[i].emissive.setHex(0x000000);
        prop.flashMats[i].emissiveIntensity = 0;
      }
    }
  };

  const applyPropFlashMaterials = (prop: DestructibleProp, intensity: number) => {
    ensurePropFlashMaterials(prop);
    if (prop.flashMats) {
      const hex = prop.kind === 'tree' ? 0xd97706 : 0xe2e8f0;
      for (let i = 0; i < prop.flashMats.length; i++) {
        prop.flashMats[i].emissive.setHex(hex);
        prop.flashMats[i].emissiveIntensity = intensity;
      }
    }
  };

  const tryPlayerAttackResource = (
    playerPos: THREE.Vector3,
    playerYaw: number,
    damage: number,
    range: number,
    audio: JungleAudioEngine,
    heavy: boolean,
  ): ResourceAttackResult | null => {
    const faceX = Math.sin(playerYaw);
    const faceZ = Math.cos(playerYaw);

    let best: DestructibleProp | null = null;
    let bestScore = Infinity;

    for (let i = 0; i < destructibles.length; i++) {
      const p = destructibles[i];
      if (p.state !== 'intact') continue;
      if (Math.abs(playerPos.y - p.baseY) > 3.8) continue;

      const dx = p.x - playerPos.x;
      const dz = p.z - playerPos.z;
      const dist = Math.hypot(dx, dz);
      const maxReach = range + p.hitRadius;
      if (dist > maxReach) continue;

      const invDist = dist > 0.001 ? 1 / dist : 1;
      const dot = (dx * invDist) * faceX + (dz * invDist) * faceZ;
      if (dot < 0.28 && dist > p.hitRadius + 0.55) continue;

      const surfaceDist = Math.max(0, dist - p.collider.radius);
      const score = surfaceDist - dot * 0.45;
      if (score < bestScore) {
        bestScore = score;
        best = p;
      }
    }

    if (!best) return null;

    best.hp = Math.max(0, best.hp - damage);
    best.root.matrixAutoUpdate = true;
    best.shakeTimer = 0.26;
    best.flashTimer = 0.14;
    ensurePropFlashMaterials(best);
    applyPropFlashMaterials(best, 0.55);
    activeDestructibles.add(best);

    const awayXRaw = best.x - playerPos.x;
    const awayZRaw = best.z - playerPos.z;
    const awayLen = Math.hypot(awayXRaw, awayZRaw);
    const awayX = awayLen > 0.05 ? awayXRaw / awayLen : faceX;
    const awayZ = awayLen > 0.05 ? awayZRaw / awayLen : faceZ;

    // Cross product up(0,1,0) x away(ax,0,az) = (az, 0, -ax) rotates +Y directly toward away
    best.hitAxis.set(awayZ, 0, -awayX).normalize();

    const hitBurstX = best.x - awayX * Math.min(best.collider.radius, 0.75);
    const hitBurstZ = best.z - awayZ * Math.min(best.collider.radius, 0.75);
    const hitBurstY = best.baseY + (best.kind === 'tree' ? 1.15 : 0.55);
    spawnBurst(
      hitBurstX,
      hitBurstY,
      hitBurstZ,
      best.kind === 'tree' ? 0xd97706 : 0xcbd5e1,
      12,
    );

    if (best.kind === 'tree') {
      audio.playWoodChop(heavy);
    } else {
      audio.playRockHit(heavy);
    }

    const destroyed = best.hp <= 0;
    const dropPoints: Array<{ x: number; z: number }> = [];

    if (destroyed) {
      best.collider.disabled = true;
      best.impactBurstFired = false;
      best.animTimer = 0;

      if (best.kind === 'tree') {
        best.state = 'falling';
        best.fallAxis.copy(best.hitAxis);
        audio.playTreeFall();

        // 3 wood logs dropped along the felled trunk path
        const sideX = -awayZ;
        const sideZ = awayX;
        const offsets = [
          { fwd: 0.9, lat: -0.42 },
          { fwd: 1.95, lat: 0.36 },
          { fwd: 2.95, lat: -0.18 },
        ];
        for (let k = 0; k < offsets.length; k++) {
          const rx = best.x + awayX * offsets[k].fwd + sideX * offsets[k].lat;
          const rz = best.z + awayZ * offsets[k].fwd + sideZ * offsets[k].lat;
          const rDist = Math.hypot(rx, rz);
          const clampR = WORLD_RADIUS - 14;
          const fx = rDist > clampR ? (rx / rDist) * clampR : rx;
          const fz = rDist > clampR ? (rz / rDist) * clampR : rz;
          dropPoints.push({ x: fx, z: fz });
        }
      } else {
        best.state = 'shattering';
        if (best.rockParts) {
          for (let rp = 0; rp < best.rockParts.length; rp++) {
            best.rockParts[rp].mesh.matrixAutoUpdate = true;
          }
        }
        audio.playRockShatter();
        spawnBurst(best.x, best.baseY + 0.55, best.z, 0x94a3b8, 22);

        // 3 stone drops fanned around shattered rock
        for (let k = 0; k < 3; k++) {
          const ang = (k / 3) * Math.PI * 2 + 0.4;
          const rad = 0.85;
          const rx = best.x + Math.cos(ang) * rad;
          const rz = best.z + Math.sin(ang) * rad;
          const rDist = Math.hypot(rx, rz);
          const clampR = WORLD_RADIUS - 14;
          dropPoints.push({
            x: rDist > clampR ? (rx / rDist) * clampR : rx,
            z: rDist > clampR ? (rz / rDist) * clampR : rz,
          });
        }
      }
    }

    return {
      hit: true,
      kind: best.kind,
      destroyed,
      hp: best.hp,
      maxHp: best.maxHp,
      dropX: dropPoints[0]?.x ?? best.x,
      dropZ: dropPoints[0]?.z ?? best.z,
      dropPoints,
    };
  };

  const resetVisuals = (items: InteractablePoint[]) => {
    activeDestructibles.clear();
    for (let i = 0; i < destructibles.length; i++) {
      const p = destructibles[i];
      p.hp = p.maxHp;
      p.state = 'intact';
      p.collider.disabled = false;
      p.shakeTimer = 0;
      p.flashTimer = 0;
      p.animTimer = 0;
      p.impactBurstFired = false;
      p.root.visible = true;
      p.root.position.set(p.x, p.baseY, p.z);
      p.root.quaternion.copy(p.baseQuat);
      p.root.scale.set(1, 1, 1);
      if (p.rockParts) {
        for (let rp = 0; rp < p.rockParts.length; rp++) {
          const part = p.rockParts[rp];
          part.mesh.position.copy(part.basePos);
          part.mesh.rotation.copy(part.baseRot);
          part.mesh.scale.copy(part.baseScale);
          part.mesh.visible = true;
        }
      }
      restorePropOriginalMaterials(p);
      freezeStaticHierarchy(p.root);
    }

    items.forEach((item) => {
      const vis = visualInteractables.get(item.id);
      if (!vis) return;
      if (item.kind === 'relic') {
        vis.artifact.visible = !item.collected;
        vis.ring.visible = !item.collected;
        if (vis.light) vis.light.intensity = item.collected ? 0 : 1.4;
      } else if (item.kind === 'gatherable') {
        if (vis.keepBaseOnCollect) {
          vis.group.visible = true;
          vis.artifact.visible = !item.collected;
          vis.ring.visible = !item.collected;
        } else {
          vis.group.visible = !item.collected;
        }
      } else {
        const mat = vis.ring.material as THREE.MeshBasicMaterial;
        mat.color.setHex(item.collected ? 0x4ade80 : 0x38bdf8);
        mat.opacity = item.collected ? 0.22 : 0.45;
        if (vis.light) {
          vis.light.color.setHex(item.collected ? 0x4ade80 : 0x38bdf8);
          vis.light.intensity = item.collected ? 0.8 : 1.3;
        }
      }
    });
  };

  // 12. Dynamic Light Rain Particle System (disabled in potato mode)
  const rainCount =
    quality === 'potato'
      ? 0
      : quality === 'ultra-low'
        ? 95
        : quality === 'low'
          ? 190
          : quality === 'medium'
            ? 380
            : quality === 'high'
              ? 540
              : 680;
  const rainSpan = 32;
  const rainHeight = 16;
  const rainPositions = new Float32Array(rainCount * 6);
  const rainOffsets = new Float32Array(rainCount * 3);
  const rainSpeeds = new Float32Array(rainCount);
  for (let i = 0; i < rainCount; i++) {
    rainOffsets[i * 3] = (rand() - 0.5) * rainSpan;
    rainOffsets[i * 3 + 1] = rand() * rainHeight;
    rainOffsets[i * 3 + 2] = (rand() - 0.5) * rainSpan;
    rainSpeeds[i] = 14 + rand() * 6;
  }
  const rainGeo = trackGeo(new THREE.BufferGeometry());
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
  const rainMat = trackMat(
    new THREE.LineBasicMaterial({
      color: 0xd4eceb,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  );
  const rainLines = new THREE.LineSegments(rainGeo, rainMat);
  rainLines.frustumCulled = false;
  rainLines.visible = false;
  if (rainCount > 0) {
    group.add(rainLines);
  }

  const setTimeAndWeather = (
    sunAngle: number,
    nightFactor: number,
    twilightFactor: number,
    skyTintHex: number,
    sunbeamOpacity: number,
    mistIntensity: number,
    rainIntensity: number,
    cameraFar: number,
  ) => {
    skyMat.color.setHex(skyTintHex);
    beamMat.opacity = sunbeamOpacity;
    beamGroup.visible = !isPotato && !isUltraLow && sunbeamOpacity > 0.008;
    if (beamGroup.visible) {
      const sunTilt = THREE.MathUtils.clamp(-Math.cos(sunAngle) * 0.38, -0.45, 0.45);
      for (let i = 0; i < clearingBeams.length; i++) {
        clearingBeams[i].rotation.z = sunTilt;
      }
    }

    const skyScale = Math.max(0.5, Math.min(1.9, (cameraFar * 0.85) / 100));
    skyDome.scale.setScalar(skyScale);

    // Sync dynamic 3D clouds altitude, span, density & color to weather and time of day
    currentRainState = rainIntensity;
    currentMistState = mistIntensity;
    currentNightState = nightFactor;
    currentTwilightState = twilightFactor;
    currentCloudCover = THREE.MathUtils.clamp(
      0.18 + mistIntensity * 0.46 + rainIntensity * 0.72,
      0.16,
      1.0,
    );
    cloudSpanHalf = Math.max(42, Math.min(130, cameraFar * 0.66));
    cloudBaseY = Math.max(20, Math.min(46, cameraFar * 0.32));

    _cloudWorkTop.copy(_cloudTopDay).lerp(_cloudTopDawn, currentTwilightState * 0.86);
    _cloudWorkTop.lerp(_cloudTopNight, currentNightState);
    _cloudWorkTop.lerp(
      _cloudTopStorm,
      THREE.MathUtils.clamp(currentRainState * 0.9 + currentMistState * 0.3, 0, 0.95) *
        (1 - currentNightState * 0.55),
    );
    if (currentNightState > 0.25 && currentRainState > 0.2) {
      _cloudWorkTop.lerp(_cloudBotNight, currentRainState * 0.55);
    }

    _cloudWorkBot.copy(_cloudBotDay).lerp(_cloudBotDawn, currentTwilightState * 0.82);
    _cloudWorkBot.lerp(_cloudBotNight, currentNightState);
    _cloudWorkBot.lerp(
      _cloudBotStorm,
      THREE.MathUtils.clamp(currentRainState * 0.95 + currentMistState * 0.38, 0, 0.96),
    );

    cloudTopMat.color.copy(_cloudWorkTop);
    cloudBottomMat.color.copy(_cloudWorkBot);
    cloudTopMat.emissive.copy(_cloudWorkTop).multiplyScalar(currentNightState > 0.5 ? 0.24 : 0.38);
    cloudBottomMat.emissive.copy(_cloudWorkBot).multiplyScalar(0.24);
    if (!isPotato) {
      cloudTopMat.opacity = THREE.MathUtils.lerp(0.54, 0.95, currentCloudCover);
      cloudBottomMat.opacity = THREE.MathUtils.lerp(0.48, 0.97, currentCloudCover);
    }

    // Update water sky/sun reflection colors
    waterSkyUniform.value.setHex(skyTintHex).lerp(_cloudWorkBot, currentRainState * 0.45);
    waterSunUniform.value
      .setHex(0xfff0c8)
      .lerp(_cloudTopDawn, twilightFactor * 0.85)
      .lerp(_cloudTopNight, nightFactor);
    waterNightUniform.value = nightFactor;

    celestialGroup.rotation.z = sunAngle - Math.PI / 2;
    const sunElev = Math.sin(sunAngle);
    sunGroup.visible = sunElev > -0.18;
    sunDiscMat.color
      .setHex(0xffffff)
      .lerp(_cloudTopDawn, twilightFactor * 0.45);
    sunHaloMat.opacity = isPotato
      ? 0
      : THREE.MathUtils.clamp((sunElev + 0.14) * 0.85, 0.08, 0.78) * (1 - rainIntensity * 0.76);
    const haloScale = 1 + twilightFactor * 0.28;
    sunHalo.scale.set(haloScale, haloScale, 1);

    moonGroup.visible = -sunElev > -0.18;
    moonHaloMat.opacity = isPotato
      ? 0
      : THREE.MathUtils.clamp((-sunElev + 0.14) * 0.65, 0.06, 0.52) * (1 - rainIntensity * 0.72);

    if (starCount > 0) {
      const starVis =
        THREE.MathUtils.clamp((nightFactor - 0.28) / 0.6, 0, 1) * (1 - rainIntensity * 0.65);
      starPoints.visible = starVis > 0.03;
      starMat.opacity = starVis * 0.92;
    }

    if (rainCount > 0) {
      rainMat.opacity = Math.max(0, Math.min(0.42, rainIntensity * 0.42));
      rainLines.visible = rainIntensity > 0.03;
    } else {
      rainLines.visible = false;
    }
  };

  let moteFrameSkip = 0;
  let windPhase = 0;

  const update = (
    dt: number,
    elapsed: number,
    focusX: number,
    focusZ: number,
    rainIntensity: number,
    nightFactor: number,
  ) => {
    windPhase += dt * (1.0 + rainIntensity * 0.42);
    windTimeUniform.value = windPhase;
    windStrengthUniform.value = 1.0 + rainIntensity * 0.52;
    waterTimeUniform.value = elapsed;
    waterMesh.position.y = isPotato ? WATER_LEVEL : WATER_LEVEL + Math.sin(elapsed * 1.4) * 0.014;
    if (!isPotato) {
      textures.riverWater.offset.y -= dt * 0.34;
      textures.riverWater.offset.x = Math.sin(elapsed * 0.45) * 0.04;
      textures.waterNormal.offset.x += dt * 0.045;
      textures.waterNormal.offset.y -= dt * 0.065;
    }

    // Update NPCs (Guide NPC + Villagers)
    npcSystem.update(dt, elapsed, focusX, focusZ);

    // Animate Village Torches
    for (let i = 0; i < villageTorchFlames.length; i++) {
      const f = villageTorchFlames[i];
      const flk = 0.85 + Math.sin(elapsed * 15 + i * 1.7) * 0.16;
      f.scale.set(1, flk, 1);
      f.rotation.y = elapsed * 2.1 + i;
    }
    for (let i = 0; i < villageTorchLights.length; i++) {
      const tl = villageTorchLights[i];
      const dx = tl.x - focusX;
      const dz = tl.z - focusZ;
      const dSq = dx * dx + dz * dz;
      const active = dSq < 625 && (nightFactor > 0.12 || dSq < 144);
      tl.light.visible = active;
      if (active) {
        tl.light.intensity = THREE.MathUtils.lerp(1.4, 3.0, nightFactor) * (0.9 + Math.sin(elapsed * 13 + i) * 0.1);
      }
    }

    // Update dynamic 3D clouds: wind drift, weather-driven puff volume/shape, and altitude
    const cloudWindSpeed = 1.0 + currentMistState * 1.5 + rainIntensity * 4.5;
    const altDrop = (currentCloudCover - 0.18) * 7.8;
    const scaleBase = THREE.MathUtils.clamp(cloudSpanHalf / 85, 0.58, 1.32);
    const visThreshold = 0.24 + currentCloudCover * 0.78;
    for (let i = 0; i < cloudClusters.length; i++) {
      const cl = cloudClusters[i];
      cl.nx += (cloudWindSpeed * cl.speedMult * dt) / Math.max(40, cloudSpanHalf);
      if (cl.nx > 1.05) cl.nx -= 2.1;

      // Sparse high wispy clouds in clear weather, full heavy low storm deck during rain/storm
      const isVisible = cl.clearWeight <= visThreshold;
      cl.group.visible = isVisible;
      if (!isVisible) continue;

      const wx = focusX + cl.nx * cloudSpanHalf;
      const wz = focusZ + cl.nz * cloudSpanHalf;
      const wy =
        cloudBaseY +
        3.2 +
        cl.altNorm * (9.5 - currentCloudCover * 4.2) -
        altDrop +
        Math.sin(elapsed * 0.25 + cl.phase) * 0.45;
      cl.group.position.set(wx, wy, wz);

      // Clear weather = flatter, wispy stretched clouds; Rain/Storm = tall billowing dark cumulonimbus
      const stretchX = THREE.MathUtils.lerp(1.18, 1.65, currentCloudCover) * scaleBase;
      const puffTallness = THREE.MathUtils.lerp(0.55, 1.88, currentCloudCover) * scaleBase;
      const puffDepth = THREE.MathUtils.lerp(0.86, 1.58, currentCloudCover) * scaleBase;
      const morph = 1 + Math.sin(elapsed * 0.45 + cl.phase) * 0.045;

      for (let p = 0; p < cl.puffs.length; p++) {
        const pf = cl.puffs[p];
        pf.mesh.position.set(pf.ox * scaleBase, pf.oy * puffTallness, pf.oz * scaleBase);
        pf.mesh.scale.set(
          pf.sx * stretchX * morph,
          pf.sy * puffTallness * (pf.isTop ? 1.12 : 0.9),
          pf.sz * puffDepth,
        );
      }
    }

    for (let i = 0; i < cabinLights.length; i++) {
      const cl = cabinLights[i];
      const dx = cl.x - focusX;
      const dz = cl.z - focusZ;
      const dSq = dx * dx + dz * dz;
      const active = dSq < 225 && (nightFactor > 0.14 || dSq < 64);
      cl.light.visible = active;
      if (active) {
        cl.light.intensity = THREE.MathUtils.lerp(1.3, 2.8, nightFactor);
      }
    }

    visualInteractables.forEach((vis) => {
      if (!vis.group.visible) return;
      const dx = vis.group.position.x - focusX;
      const dz = vis.group.position.z - focusZ;
      if (dx * dx + dz * dz > 2800) return;

      if (vis.artifact.visible && vis.kind !== 'gatherable') {
        vis.artifact.rotation.y = elapsed * (vis.kind === 'relic' ? 1.5 : 0.9);
        vis.artifact.position.y = vis.baseY + Math.sin(elapsed * 2.2) * 0.1;
      } else if (vis.kind === 'gatherable') {
        if (vis.keepBaseOnCollect) {
          // Berries stay anchored in the bush with subtle wind shimmer
          vis.artifact.position.y = vis.baseY + Math.sin(elapsed * 2.4 + vis.group.position.x) * 0.012;
        } else {
          vis.artifact.rotation.y = elapsed * 0.55;
          vis.artifact.position.y = vis.baseY + Math.sin(elapsed * 2.0) * 0.035;
        }
      }
      if (vis.ring.visible) {
        const pulse = 1 + Math.sin(elapsed * 3.1) * 0.06;
        const baseScale = vis.kind === 'landmark' ? 1.35 : vis.kind === 'gatherable' ? 0.68 : 1.0;
        vis.ring.scale.setScalar(baseScale * pulse);
      }
    });

    if (moteCount > 0) {
      const twinkle = 0.85 + Math.sin(elapsed * 3.2) * 0.15;
      const baseMoteOpacity = THREE.MathUtils.lerp(0.62, 0.98, nightFactor) * twinkle;
      moteMat.opacity = Math.max(0.16, baseMoteOpacity * (1 - rainIntensity * 0.72));
      moteMat.size = THREE.MathUtils.lerp(0.16, 0.3, nightFactor);
      moteMat.color.setHex(nightFactor > 0.38 ? 0xfef08a : 0xf4df8c);

      moteFrameSkip = (moteFrameSkip + 1) % 2;
      if (isHighTier || moteFrameSkip === 0) {
        const attr = moteGeo.attributes.position as THREE.BufferAttribute;
        const focusGround = groundHeightAt(focusX, focusZ);
        for (let i = 0; i < moteCount; i++) {
          const phase = motePhases[i];
          const ox = moteOffsets[i * 3] + Math.sin(elapsed * 0.45 + phase) * 0.85;
          const oy = moteOffsets[i * 3 + 1] + Math.cos(elapsed * 0.7 + phase * 1.3) * 0.45;
          const oz = moteOffsets[i * 3 + 2] + Math.cos(elapsed * 0.4 + phase) * 0.85;
          attr.setXYZ(i, focusX + ox, focusGround + oy, focusZ + oz);
        }
        attr.needsUpdate = true;
      }
    }

    if (rainCount > 0 && rainLines.visible) {
      const rAttr = rainGeo.attributes.position as THREE.BufferAttribute;
      const baseFloor = groundHeightAt(focusX, focusZ) - 1.5;
      const windSkewX = 0.14;
      const streakLen = 0.55 + rainIntensity * 0.35;

      for (let i = 0; i < rainCount; i++) {
        let oy = rainOffsets[i * 3 + 1] - rainSpeeds[i] * dt;
        if (oy < 0) {
          oy = (oy % rainHeight) + rainHeight;
        }
        rainOffsets[i * 3 + 1] = oy;

        const wx = focusX + rainOffsets[i * 3];
        const wy = baseFloor + oy;
        const wz = focusZ + rainOffsets[i * 3 + 2];

        const idx = i * 2;
        rAttr.setXYZ(idx, wx, wy, wz);
        rAttr.setXYZ(idx + 1, wx - windSkewX * streakLen, wy + streakLen, wz - 0.06);
      }
      rAttr.needsUpdate = true;
    }

    if (campfireVisuals.length > 0) {
      campfireEmberMat.emissiveIntensity = 0.95 + Math.sin(elapsed * 7.5) * 0.25;
      for (let i = 0; i < campfireVisuals.length; i++) {
        const cf = campfireVisuals[i];
        const flicker = 0.88 + Math.sin(elapsed * 13 + i * 2.1) * 0.14 + Math.cos(elapsed * 21 + i) * 0.08;
        for (let f = 0; f < cf.flames.length; f++) {
          const fm = cf.flames[f];
          const baseSc = f === 0 || f === 3 ? 1.0 : 0.74;
          const waveX = Math.sin(elapsed * 11 + f * 1.9 + i) * 0.08;
          fm.scale.set(baseSc * (0.92 + waveX), baseSc * (flicker + (f % 2) * 0.07), baseSc);
          fm.rotation.y = elapsed * (2.0 + f * 0.8);
          fm.rotation.z = waveX * 0.65;
        }
        if (cf.light) {
          const dx = cf.x - focusX;
          const dz = cf.z - focusZ;
          const near = dx * dx + dz * dz < 625;
          cf.light.visible = near;
          if (near) {
            cf.light.intensity = THREE.MathUtils.lerp(2.2, 4.2, nightFactor) * flicker;
          }
        }
        if (!isPotato && !isUltraLow) {
          const dx = cf.x - focusX;
          const dz = cf.z - focusZ;
          const near = dx * dx + dz * dz < 484;
          if (near) {
            cf.emberAccum += dt;
            cf.smokeAccum += dt;
            if (cf.emberAccum >= 0.22) {
              cf.emberAccum = 0;
              spawnCampfirePuff(cf.x, cf.group.position.y + 0.35, cf.z, true);
            }
            if (cf.smokeAccum >= 0.34) {
              cf.smokeAccum = 0;
              spawnCampfirePuff(cf.x, cf.group.position.y + 0.65, cf.z, false);
            }
          }
        }
      }
    }

    if (!isPotato) {
      for (let i = 0; i < CF_PARTICLE_POOL; i++) {
        const p = cfPuffPool[i];
        if (!p.active) continue;
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
          p.mesh.visible = false;
          continue;
        }
        const prog = p.life / p.maxLife;
        p.mesh.position.x += (p.vx + Math.sin(elapsed * 2.5 + i) * 0.12) * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        if (p.isSpark) {
          p.mat.opacity = 1 - prog;
          p.mesh.scale.setScalar(Math.max(0.15, 1 - prog * 0.85));
        } else {
          p.mat.opacity = 0.34 * (1 - prog);
          p.mesh.scale.setScalar(0.75 + prog * 1.45);
        }
      }
    }

    if (activeDestructibles.size > 0) {
      activeDestructibles.forEach((p) => {
        if (p.flashTimer > 0) {
          p.flashTimer = Math.max(0, p.flashTimer - dt);
          if (p.flashMats) {
            const k = p.flashTimer / 0.14;
            for (let m = 0; m < p.flashMats.length; m++) {
              p.flashMats[m].emissiveIntensity = k * 0.55;
            }
          }
          if (p.flashTimer <= 0 && p.state === 'intact') {
            restorePropOriginalMaterials(p);
          }
        }

        if (p.state === 'intact') {
          if (p.shakeTimer > 0) {
            p.shakeTimer = Math.max(0, p.shakeTimer - dt);
            const decay = p.shakeTimer / 0.26;
            const wobble = Math.sin(p.shakeTimer * 52) * (p.kind === 'tree' ? 0.048 : 0.055) * decay;
            _animQuat.setFromAxisAngle(p.hitAxis, wobble);
            p.root.quaternion.copy(_animQuat).multiply(p.baseQuat);
            if (p.kind === 'rock') {
              p.root.scale.setScalar(1 - Math.sin(decay * Math.PI) * 0.05);
            }
          }
          if (p.shakeTimer <= 0 && p.flashTimer <= 0) {
            p.root.quaternion.copy(p.baseQuat);
            p.root.scale.set(1, 1, 1);
            restorePropOriginalMaterials(p);
            freezeStaticHierarchy(p.root);
            activeDestructibles.delete(p);
          }
        } else if (p.state === 'falling') {
          p.animTimer += dt;
          const fallDur = 0.82;
          const settleStart = 1.04;
          const endTime = 1.45;

          if (p.animTimer < fallDur) {
            const u = p.animTimer / fallDur;
            // Accelerating gravity fall with tiny impact bounce
            const eased = u < 0.88 ? Math.pow(u / 0.88, 2.2) : 1 - Math.sin(((u - 0.88) / 0.12) * Math.PI) * 0.04;
            const angle = eased * (Math.PI * 0.475);
            _animQuat.setFromAxisAngle(p.fallAxis, angle);
            p.root.quaternion.copy(_animQuat).multiply(p.baseQuat);
          } else {
            _animQuat.setFromAxisAngle(p.fallAxis, Math.PI * 0.475);
            p.root.quaternion.copy(_animQuat).multiply(p.baseQuat);

            if (!p.impactBurstFired) {
              p.impactBurstFired = true;
              const awayX = -p.fallAxis.z;
              const awayZ = p.fallAxis.x;
              spawnBurst(p.x + awayX * 2.1, p.baseY + 0.55, p.z + awayZ * 2.1, 0x5c4732, 18);
              spawnBurst(p.x + awayX * 3.1, p.baseY + 0.7, p.z + awayZ * 3.1, 0x3f6b30, 14);
            }

            if (p.animTimer >= settleStart) {
              const s = Math.min(1, (p.animTimer - settleStart) / (endTime - settleStart));
              const scale = Math.max(0.02, 1 - s);
              p.root.scale.setScalar(scale);
              p.root.position.y = p.baseY - s * 0.45;
            }
          }

          if (p.animTimer >= endTime) {
            p.state = 'destroyed';
            p.root.visible = false;
            restorePropOriginalMaterials(p);
            activeDestructibles.delete(p);
          }
        } else if (p.state === 'shattering') {
          p.animTimer += dt;
          const dur = 0.52;
          const u = Math.min(1, p.animTimer / dur);

          if (p.rockParts) {
            for (let rp = 0; rp < p.rockParts.length; rp++) {
              const part = p.rockParts[rp];
              const spread = u * 1.45;
              const arcY = u * 1.35 * part.dirY - u * u * 1.95;
              part.mesh.position.set(
                part.basePos.x + part.dirX * spread,
                part.basePos.y + arcY,
                part.basePos.z + part.dirZ * spread,
              );
              part.mesh.rotation.set(
                part.baseRot.x + u * 4.5,
                part.baseRot.y + u * 3.8,
                part.baseRot.z + u * 2.9,
              );
              const sc = Math.max(0.02, 1 - u * 0.92);
              part.mesh.scale.set(
                part.baseScale.x * sc,
                part.baseScale.y * sc,
                part.baseScale.z * sc,
              );
            }
          }

          if (p.animTimer >= dur) {
            p.state = 'destroyed';
            p.root.visible = false;
            restorePropOriginalMaterials(p);
            activeDestructibles.delete(p);
          }
        }
      });
    }

    if (!isPotato) {
      for (let i = 0; i < BURST_POOL_SIZE; i++) {
        const p = burstPool[i];
        if (!p.active) continue;
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
          p.mesh.visible = false;
          continue;
        }
        p.vy -= 7.5 * dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.mesh.rotation.x += dt * 6;
        p.mesh.rotation.y += dt * 5;
        const t = 1 - p.life / p.maxLife;
        p.mat.opacity = t;
        p.mesh.scale.setScalar(t);
      }
    }
  };

  const dispose = () => {
    treeLibrary.dispose();
    npcSystem.dispose();
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  };

  resetVisuals(interactables);

  return {
    group,
    colliders,
    bedSpots,
    visualInteractables,
    spawnBurst,
    spawnDynamicGatherable,
    spawnCampfire,
    setGuideCompleted: npcSystem.setGuideCompleted,
    tryPlayerAttackResource,
    clearCampfires,
    clearDynamicVisuals,
    markInteractableCollected,
    resetVisuals,
    setTimeAndWeather,
    update,
    dispose,
  };
}

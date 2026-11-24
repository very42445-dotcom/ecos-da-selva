import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

export type TreeArchetype = 'sumauma' | 'broadleaf' | 'slender' | 'gnarled' | 'palm';

export interface TreeVariantTemplate {
  archetype: TreeArchetype;
  barkGeo: THREE.BufferGeometry;
  foliageGeo: THREE.BufferGeometry;
  vineGeo: THREE.BufferGeometry | null;
  trunkRadiusAtBase: number;
}

export interface TreeTemplateLibrary {
  variants: Record<TreeArchetype, TreeVariantTemplate[]>;
  dispose: () => void;
}

function makeTreeSeededRand(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Builds an indexed tapered organic limb/trunk tube along a CatmullRomCurve3
 * using parallel transport (gimbal-free vertical handling), optional flared buttress roots,
 * and baked vertex colors (mossy base tint + crevice AO).
 */
function buildCurvedLimbGeometry(
  points: THREE.Vector3[],
  rStart: number,
  rEnd: number,
  radialSegs: number,
  lengthSegs: number,
  options: {
    flareStrength?: number;
    flareFreq?: number;
    flareSeed?: number;
    uRepeat?: number;
    vRepeat?: number;
    ringModAmp?: number;
    ringModFreq?: number;
    bottomTint?: THREE.Color;
    topTint?: THREE.Color;
    aoStart?: number;
    aoEnd?: number;
  } = {},
): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);
  const flareStrength = options.flareStrength ?? 0;
  const flareFreq = options.flareFreq ?? 5;
  const flareSeed = options.flareSeed ?? 0;
  const uRepeat = options.uRepeat ?? 1;
  const vRepeat = options.vRepeat ?? 1;
  const ringModAmp = options.ringModAmp ?? 0;
  const ringModFreq = options.ringModFreq ?? 18;
  const bottomTint = options.bottomTint ?? new THREE.Color(0x8fa37c); // subtle damp mossy base
  const topTint = options.topTint ?? new THREE.Color(0xffffff);
  const aoStart = options.aoStart ?? 0.72;
  const aoEnd = options.aoEnd ?? 1.0;

  const ringCount = lengthSegs + 1;
  const vertsPerRing = radialSegs + 1;
  const vertCount = ringCount * vertsPerRing;

  const positions = new Float32Array(vertCount * 3);
  const normals = new Float32Array(vertCount * 3);
  const uvs = new Float32Array(vertCount * 2);
  const colors = new Float32Array(vertCount * 3);
  const indices: number[] = [];

  const tangent = new THREE.Vector3();
  const prevTangent = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const binormal = new THREE.Vector3();
  const rotAxis = new THREE.Vector3();
  const rotQuat = new THREE.Quaternion();
  const vertCol = new THREE.Color();

  for (let i = 0; i < ringCount; i++) {
    const t = i / lengthSegs;
    const center = curve.getPointAt(t);
    curve.getTangentAt(t, tangent).normalize();

    if (i === 0) {
      // Pick stable perpendicular start normal
      const ref =
        Math.abs(tangent.y) < 0.92
          ? new THREE.Vector3(0, 1, 0)
          : new THREE.Vector3(1, 0, 0);
      binormal.crossVectors(tangent, ref).normalize();
      normal.crossVectors(binormal, tangent).normalize();
      prevTangent.copy(tangent);
    } else {
      rotAxis.crossVectors(prevTangent, tangent);
      const axisLen = rotAxis.length();
      if (axisLen > 1e-5) {
        rotAxis.divideScalar(axisLen);
        const angle = Math.acos(THREE.MathUtils.clamp(prevTangent.dot(tangent), -1, 1));
        rotQuat.setFromAxisAngle(rotAxis, angle);
        normal.applyQuaternion(rotQuat).normalize();
      }
      binormal.crossVectors(tangent, normal).normalize();
      prevTangent.copy(tangent);
    }

    const baseR = lerp(rStart, rEnd, Math.pow(t, 0.92));
    const ringWave = ringModAmp > 0 ? 1 + Math.sin(t * ringModFreq * Math.PI * 2) * ringModAmp : 1;
    const flareZone = flareStrength > 0 && t < 0.28 ? Math.pow(1 - t / 0.28, 2.1) : 0;
    const ao = lerp(aoStart, aoEnd, Math.min(1, t * 1.4));
    vertCol.lerpColors(bottomTint, topTint, Math.min(1, t * 1.65)).multiplyScalar(ao);

    for (let j = 0; j < vertsPerRing; j++) {
      const u = j / radialSegs;
      const theta = u * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      const flute =
        flareZone > 0
          ? 1 + flareZone * flareStrength * (0.65 + 0.55 * Math.cos(theta * flareFreq + flareSeed))
          : 1;
      const r = Math.max(0.018, baseR * ringWave * flute);

      const nx = normal.x * cosT + binormal.x * sinT;
      const ny = normal.y * cosT + binormal.y * sinT;
      const nz = normal.z * cosT + binormal.z * sinT;

      const idx = i * vertsPerRing + j;
      positions[idx * 3] = center.x + nx * r;
      positions[idx * 3 + 1] = center.y + ny * r;
      positions[idx * 3 + 2] = center.z + nz * r;

      normals[idx * 3] = nx;
      normals[idx * 3 + 1] = ny;
      normals[idx * 3 + 2] = nz;

      uvs[idx * 2] = u * uRepeat;
      uvs[idx * 2 + 1] = t * vRepeat;

      // Darken concave root flutes subtly for organic grounding
      const fluteShade = flareZone > 0 ? 1 - flareZone * 0.16 * (0.5 - 0.5 * Math.cos(theta * flareFreq + flareSeed)) : 1;
      colors[idx * 3] = vertCol.r * fluteShade;
      colors[idx * 3 + 1] = vertCol.g * fluteShade;
      colors[idx * 3 + 2] = vertCol.b * fluteShade;
    }
  }

  for (let i = 0; i < lengthSegs; i++) {
    for (let j = 0; j < radialSegs; j++) {
      const a = i * vertsPerRing + j;
      const b = (i + 1) * vertsPerRing + j;
      const c = (i + 1) * vertsPerRing + (j + 1);
      const d = i * vertsPerRing + (j + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates one bowed, organic 2x2 grid foliage spray card (8 tris) oriented in 3D,
 * with radial ambient occlusion baked into vertex colors (darker inside, sunlit outer tips).
 */
function buildCurvedLeafCard(
  size: number,
  rotEuler: THREE.Euler,
  offset: THREE.Vector3,
  innerColor: THREE.Color,
  outerColor: THREE.Color,
  cupDepth = 0.24,
): THREE.BufferGeometry {
  const segs = 2;
  const geo = new THREE.PlaneGeometry(size, size, segs, segs);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const distNorm = Math.min(1, Math.hypot(x, y) / (size * 0.707));
    // Gentle organic dome / droop across the leaf spray card
    const z = (0.35 - distNorm * distNorm) * size * cupDepth;
    pos.setZ(i, z);

    const shadeMix = THREE.MathUtils.clamp(distNorm * 0.85 + (y / size + 0.5) * 0.25, 0, 1);
    c.lerpColors(innerColor, outerColor, shadeMix);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.rotateX(rotEuler.x);
  geo.rotateY(rotEuler.y);
  geo.rotateZ(rotEuler.z);
  geo.translate(offset.x, offset.y, offset.z);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates a realistic 3D leaf-spray cluster around a branch hub (crossed bowed cards)
 * OR sculpted clay lobes when isPotato=true.
 */
function appendFoliageCluster(
  targetParts: THREE.BufferGeometry[],
  center: THREE.Vector3,
  radius: number,
  rand: () => number,
  isPotato: boolean,
  paletteHueBias = 0,
): void {
  const hue = 0.265 + paletteHueBias + (rand() - 0.5) * 0.048;
  const sat = 0.38 + rand() * 0.16;
  const innerLight = 0.34 + rand() * 0.08;
  const outerLight = 0.58 + rand() * 0.14;

  const innerColor = new THREE.Color().setHSL(hue + 0.015, sat * 0.9, innerLight);
  const outerColor = new THREE.Color().setHSL(hue - 0.02, sat * 1.05, outerLight);

  if (isPotato) {
    const lobeCount = 2;
    for (let i = 0; i < lobeCount; i++) {
      const lobe = new THREE.SphereGeometry(1, 7, 5);
      const pos = lobe.attributes.position;
      const colors = new Float32Array(pos.count * 3);
      const vc = new THREE.Color();
      for (let v = 0; v < pos.count; v++) {
        const ny = pos.getY(v);
        vc.lerpColors(innerColor, outerColor, THREE.MathUtils.clamp(ny * 0.5 + 0.5, 0, 1));
        colors[v * 3] = vc.r;
        colors[v * 3 + 1] = vc.g;
        colors[v * 3 + 2] = vc.b;
      }
      lobe.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const sx = radius * (0.76 + rand() * 0.26);
      const sy = radius * (0.48 + rand() * 0.18);
      const sz = radius * (0.74 + rand() * 0.26);
      lobe.scale(sx, sy, sz);
      lobe.rotateY(rand() * Math.PI * 2);
      lobe.translate(
        center.x + (rand() - 0.5) * radius * 0.48,
        center.y + (rand() - 0.4) * radius * 0.28,
        center.z + (rand() - 0.5) * radius * 0.48,
      );
      targetParts.push(lobe);
    }
    return;
  }

  // Realistic 3D crossed, tilted organic leaf-spray cards (4–5 cards per branch cluster)
  const cardCount = 5;
  const baseYaw = rand() * Math.PI * 2;
  for (let c = 0; c < cardCount; c++) {
    const cardSize = radius * (1.35 + rand() * 0.42);
    const yaw = baseYaw + (c / cardCount) * Math.PI * 2 + (rand() - 0.5) * 0.35;
    // Mix shallow canopy-top cards and steeper side-facing cards so silhouette looks rich from every angle
    const pitch = c === 0 ? -Math.PI * 0.42 + (rand() - 0.5) * 0.2 : (rand() - 0.5) * 0.85 - 0.28;
    const roll = (rand() - 0.5) * 0.65;
    const off = new THREE.Vector3(
      center.x + (rand() - 0.5) * radius * 0.52,
      center.y + (c === 0 ? radius * 0.22 : (rand() - 0.45) * radius * 0.42),
      center.z + (rand() - 0.5) * radius * 0.52,
    );
    targetParts.push(
      buildCurvedLeafCard(
        cardSize,
        new THREE.Euler(pitch, yaw, roll),
        off,
        innerColor,
        outerColor,
        0.26,
      ),
    );
  }
}

/**
 * Builds an arched, V-folded drooping palm frond strip mapped cleanly to textures.palmFrond
 * (or tapered solid green silhouette in Potato mode).
 */
function buildArchedPalmFrond(
  length: number,
  width: number,
  yaw: number,
  droopAngle: number,
  origin: THREE.Vector3,
  isPotato: boolean,
): THREE.BufferGeometry {
  const lenSegs = 6;
  const widSegs = 2; // left, spine, right for V-fold cross section
  const rowVerts = widSegs + 1;
  const vertCount = (lenSegs + 1) * rowVerts;

  const positions = new Float32Array(vertCount * 3);
  const normals = new Float32Array(vertCount * 3);
  const uvs = new Float32Array(vertCount * 2);
  const colors = new Float32Array(vertCount * 3);
  const indices: number[] = [];

  const innerCol = new THREE.Color(0x476b27);
  const tipCol = new THREE.Color(0x7ca63d);
  const c = new THREE.Color();

  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);

  for (let i = 0; i <= lenSegs; i++) {
    const t = i / lenSegs;
    // Graceful upward launch then gravity droop
    const reach = t * length;
    const archY = Math.sin(t * Math.PI * 0.85) * length * 0.34 - Math.pow(t, 1.85) * length * droopAngle;
    const widthScale = isPotato ? Math.sin(Math.pow(t, 0.72) * Math.PI * 0.96) : 1.0;
    const halfW = width * 0.5 * widthScale;

    c.lerpColors(innerCol, tipCol, t);

    for (let j = 0; j < rowVerts; j++) {
      const s = j - 1; // -1, 0, +1
      const lx = s * halfW;
      const ly = archY - Math.abs(s) * 0.14 * widthScale;
      const lz = reach;

      // Rotate around Y by yaw and translate to crown hub
      const wx = origin.x + lx * cosY + lz * sinY;
      const wy = origin.y + ly;
      const wz = origin.z - lx * sinY + lz * cosY;

      const idx = i * rowVerts + j;
      positions[idx * 3] = wx;
      positions[idx * 3 + 1] = wy;
      positions[idx * 3 + 2] = wz;

      normals[idx * 3] = 0;
      normals[idx * 3 + 1] = 1;
      normals[idx * 3 + 2] = 0;

      uvs[idx * 2] = j / widSegs;
      uvs[idx * 2 + 1] = t;

      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;
    }
  }

  for (let i = 0; i < lenSegs; i++) {
    for (let j = 0; j < widSegs; j++) {
      const a = i * rowVerts + j;
      const b = (i + 1) * rowVerts + j;
      const cIdx = (i + 1) * rowVerts + (j + 1);
      const d = i * rowVerts + (j + 1);
      indices.push(a, b, d);
      indices.push(b, cIdx, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function buildHangingVineGeo(
  start: THREE.Vector3,
  length: number,
  rand: () => number,
): THREE.BufferGeometry {
  const mid1 = new THREE.Vector3(
    start.x + (rand() - 0.5) * 0.25,
    start.y - length * 0.35,
    start.z + (rand() - 0.5) * 0.25,
  );
  const mid2 = new THREE.Vector3(
    start.x + (rand() - 0.5) * 0.35,
    start.y - length * 0.7,
    start.z + (rand() - 0.5) * 0.35,
  );
  const end = new THREE.Vector3(
    start.x + (rand() - 0.5) * 0.28,
    start.y - length,
    start.z + (rand() - 0.5) * 0.28,
  );
  return buildCurvedLimbGeometry([start, mid1, mid2, end], 0.032, 0.016, 4, 6, {
    bottomTint: new THREE.Color(0xffffff),
    topTint: new THREE.Color(0x95b87a),
    aoStart: 0.9,
    aoEnd: 0.8,
  });
}

function mergeSafe(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (parts.length === 1) return parts[0];
  const merged = BufferGeometryUtils.mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  return merged;
}

function buildSumaumaVariant(rand: () => number, isPotato: boolean): TreeVariantTemplate {
  const barkParts: THREE.BufferGeometry[] = [];
  const foliageParts: THREE.BufferGeometry[] = [];
  const vineParts: THREE.BufferGeometry[] = [];

  const totalH = 12.2 + rand() * 3.2;
  const rBase = 0.72 + rand() * 0.16;
  const rTop = 0.26 + rand() * 0.06;

  // Organic curved main trunk with deep root flare
  const leanX = (rand() - 0.5) * 0.75;
  const leanZ = (rand() - 0.5) * 0.75;
  const p0 = new THREE.Vector3(0, -0.25, 0);
  const p1 = new THREE.Vector3(leanX * 0.3, totalH * 0.28, leanZ * 0.3);
  const p2 = new THREE.Vector3(leanX * 0.72, totalH * 0.58, leanZ * 0.72);
  const p3 = new THREE.Vector3(leanX, totalH * 0.84, leanZ);
  const trunkCurve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);

  barkParts.push(
    buildCurvedLimbGeometry([p0, p1, p2, p3], rBase, rTop, 9, 8, {
      flareStrength: 0.42,
      flareFreq: 5,
      flareSeed: rand() * Math.PI * 2,
      uRepeat: 2,
      vRepeat: 4,
    }),
  );

  // 5 spreading buttress roots gripping the soil
  const rootCount = 5;
  for (let r = 0; r < rootCount; r++) {
    const ra = (r / rootCount) * Math.PI * 2 + (rand() - 0.5) * 0.35;
    const reach = 1.45 + rand() * 0.65;
    const hAttach = 1.4 + rand() * 0.7;
    const rp0 = new THREE.Vector3(Math.cos(ra) * rBase * 0.52, hAttach, Math.sin(ra) * rBase * 0.52);
    const rp1 = new THREE.Vector3(Math.cos(ra) * reach * 0.62, hAttach * 0.42, Math.sin(ra) * reach * 0.62);
    const rp2 = new THREE.Vector3(Math.cos(ra) * reach, -0.28, Math.sin(ra) * reach);
    barkParts.push(
      buildCurvedLimbGeometry([rp0, rp1, rp2], rBase * 0.38, 0.11, 5, 4, {
        uRepeat: 1,
        vRepeat: 2,
      }),
    );
  }

  // 5-6 sweeping primary boughs + 2 secondary sub-branches each
  const boughCount = 5 + (rand() > 0.5 ? 1 : 0);
  for (let b = 0; b < boughCount; b++) {
    const tAttach = 0.64 + (b / boughCount) * 0.28;
    const anchor = trunkCurve.getPointAt(Math.min(0.98, tAttach));
    const bYaw = (b / boughCount) * Math.PI * 2 + (rand() - 0.5) * 0.42;
    const bLen = 3.5 + rand() * 1.65;
    const elev = 0.36 + rand() * 0.34;
    const dir = new THREE.Vector3(Math.cos(bYaw), elev, Math.sin(bYaw)).normalize();

    const mid = anchor.clone().addScaledVector(dir, bLen * 0.52);
    mid.y += 0.38;
    const tip = anchor.clone().addScaledVector(dir, bLen);
    tip.y += (rand() - 0.35) * 0.55;

    barkParts.push(
      buildCurvedLimbGeometry([anchor, mid, tip], rTop * 0.84, 0.1, 6, 4, {
        uRepeat: 1,
        vRepeat: 2,
      }),
    );

    appendFoliageCluster(foliageParts, tip, 2.35 + rand() * 0.65, rand, isPotato, 0.01);

    // Secondary forks radiating off each bough
    const subCount = 2;
    for (let sb = 0; sb < subCount; sb++) {
      const subStart = sb === 0 ? mid : tip.clone().lerp(mid, 0.35);
      const subYaw = bYaw + (sb === 0 ? 0.68 : -0.72) + (rand() - 0.5) * 0.3;
      const subLen = 1.9 + rand() * 0.95;
      const subDir = new THREE.Vector3(Math.cos(subYaw), 0.25 + rand() * 0.35, Math.sin(subYaw)).normalize();
      const subTip = subStart.clone().addScaledVector(subDir, subLen);
      const subMid = subStart.clone().lerp(subTip, 0.5);
      subMid.y += 0.22;

      barkParts.push(
        buildCurvedLimbGeometry([subStart, subMid, subTip], 0.14, 0.055, 5, 3),
      );
      appendFoliageCluster(foliageParts, subTip, 1.95 + rand() * 0.55, rand, isPotato, -0.01);

      if (rand() < 0.45) {
        vineParts.push(buildHangingVineGeo(subMid, 2.4 + rand() * 2.6, rand));
      }
    }
  }

  // Crown apex branch + dense upper umbrella clusters
  const crownPeak = p3.clone().add(new THREE.Vector3((rand() - 0.5) * 0.5, 1.55, (rand() - 0.5) * 0.5));
  barkParts.push(buildCurvedLimbGeometry([p3, p3.clone().lerp(crownPeak, 0.5), crownPeak], rTop * 0.72, 0.08, 5, 3));
  appendFoliageCluster(foliageParts, crownPeak, 2.8 + rand() * 0.55, rand, isPotato, 0.0);

  return {
    archetype: 'sumauma',
    barkGeo: mergeSafe(barkParts),
    foliageGeo: mergeSafe(foliageParts),
    vineGeo: vineParts.length > 0 ? mergeSafe(vineParts) : null,
    trunkRadiusAtBase: rBase,
  };
}

function buildBroadleafVariant(rand: () => number, isPotato: boolean): TreeVariantTemplate {
  const barkParts: THREE.BufferGeometry[] = [];
  const foliageParts: THREE.BufferGeometry[] = [];

  const totalH = 7.4 + rand() * 2.5;
  const rBase = 0.48 + rand() * 0.14;
  const rFork = 0.24 + rand() * 0.05;

  const swayX = (rand() - 0.5) * 0.65;
  const swayZ = (rand() - 0.5) * 0.65;
  const p0 = new THREE.Vector3(0, -0.22, 0);
  const p1 = new THREE.Vector3(swayX * 0.35, totalH * 0.26, swayZ * 0.35);
  const p2 = new THREE.Vector3(swayX * 0.8, totalH * 0.52, swayZ * 0.8);
  const trunkCurve = new THREE.CatmullRomCurve3([p0, p1, p2]);

  barkParts.push(
    buildCurvedLimbGeometry([p0, p1, p2], rBase, rFork, 8, 6, {
      flareStrength: 0.34,
      flareFreq: 4,
      flareSeed: rand() * Math.PI * 2,
      uRepeat: 2,
      vRepeat: 3,
    }),
  );

  // Ground-gripping roots
  for (let r = 0; r < 4; r++) {
    const ra = (r / 4) * Math.PI * 2 + rand() * 0.5;
    const reach = 0.95 + rand() * 0.45;
    barkParts.push(
      buildCurvedLimbGeometry(
        [
          new THREE.Vector3(Math.cos(ra) * rBase * 0.5, 0.72, Math.sin(ra) * rBase * 0.5),
          new THREE.Vector3(Math.cos(ra) * reach * 0.6, 0.22, Math.sin(ra) * reach * 0.6),
          new THREE.Vector3(Math.cos(ra) * reach, -0.24, Math.sin(ra) * reach),
        ],
        rBase * 0.35,
        0.08,
        5,
        3,
      ),
    );
  }

  // 4-5 main limbs splitting into crooked woodland twigs (iconic TLOU broadleaf silhouette)
  const limbCount = 4 + (rand() > 0.45 ? 1 : 0);
  for (let b = 0; b < limbCount; b++) {
    const tAttach = 0.72 + (b / limbCount) * 0.26;
    const start = trunkCurve.getPointAt(Math.min(0.98, tAttach));
    const yaw = (b / limbCount) * Math.PI * 2 + (rand() - 0.5) * 0.48;
    const len = 2.65 + rand() * 1.3;
    const dir = new THREE.Vector3(Math.cos(yaw), 0.58 + rand() * 0.35, Math.sin(yaw)).normalize();
    const mid = start.clone().addScaledVector(dir, len * 0.52);
    mid.x += (rand() - 0.5) * 0.45;
    mid.z += (rand() - 0.5) * 0.45;
    const tip = start.clone().addScaledVector(dir, len);

    barkParts.push(buildCurvedLimbGeometry([start, mid, tip], rFork * 0.78, 0.08, 6, 4));
    appendFoliageCluster(foliageParts, tip, 1.95 + rand() * 0.55, rand, isPotato, (rand() - 0.5) * 0.03);

    // 2 secondary twigs per limb
    for (let s = 0; s < 2; s++) {
      const sStart = s === 0 ? mid : mid.clone().lerp(tip, 0.45);
      const sYaw = yaw + (s === 0 ? 0.75 : -0.78) + (rand() - 0.5) * 0.3;
      const sLen = 1.55 + rand() * 0.85;
      const sDir = new THREE.Vector3(Math.cos(sYaw), 0.38 + rand() * 0.42, Math.sin(sYaw)).normalize();
      const sTip = sStart.clone().addScaledVector(sDir, sLen);
      const sMid = sStart.clone().lerp(sTip, 0.5);
      sMid.y += 0.2;
      barkParts.push(buildCurvedLimbGeometry([sStart, sMid, sTip], 0.11, 0.045, 5, 3));
      appendFoliageCluster(foliageParts, sTip, 1.65 + rand() * 0.45, rand, isPotato, 0.015);
    }
  }

  // Central upper crown leader
  const apexMid = p2.clone().add(new THREE.Vector3((rand() - 0.5) * 0.5, totalH * 0.25, (rand() - 0.5) * 0.5));
  const apexTop = apexMid.clone().add(new THREE.Vector3((rand() - 0.5) * 0.6, totalH * 0.24, (rand() - 0.5) * 0.6));
  barkParts.push(buildCurvedLimbGeometry([p2, apexMid, apexTop], rFork * 0.72, 0.06, 5, 4));
  appendFoliageCluster(foliageParts, apexTop, 2.2 + rand() * 0.5, rand, isPotato, -0.015);

  return {
    archetype: 'broadleaf',
    barkGeo: mergeSafe(barkParts),
    foliageGeo: mergeSafe(foliageParts),
    vineGeo: null,
    trunkRadiusAtBase: rBase,
  };
}

function buildSlenderVariant(rand: () => number, isPotato: boolean): TreeVariantTemplate {
  const barkParts: THREE.BufferGeometry[] = [];
  const foliageParts: THREE.BufferGeometry[] = [];

  const totalH = 9.4 + rand() * 3.0;
  const rBase = 0.32 + rand() * 0.08;
  const rTop = 0.11 + rand() * 0.03;

  const leanX = (rand() - 0.5) * 0.95;
  const leanZ = (rand() - 0.5) * 0.95;
  const p0 = new THREE.Vector3(0, -0.2, 0);
  const p1 = new THREE.Vector3(leanX * 0.28, totalH * 0.33, leanZ * 0.28);
  const p2 = new THREE.Vector3(leanX * 0.66, totalH * 0.66, leanZ * 0.66);
  const p3 = new THREE.Vector3(leanX, totalH * 0.94, leanZ);
  const trunkCurve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);

  barkParts.push(
    buildCurvedLimbGeometry([p0, p1, p2, p3], rBase, rTop, 7, 7, {
      flareStrength: 0.25,
      flareFreq: 4,
      uRepeat: 1.5,
      vRepeat: 4,
      bottomTint: new THREE.Color(0x9fb08e),
    }),
  );

  // High airy candelabrum branches
  const branchCount = 4;
  for (let b = 0; b < branchCount; b++) {
    const tAttach = 0.62 + (b / branchCount) * 0.32;
    const start = trunkCurve.getPointAt(Math.min(0.98, tAttach));
    const yaw = (b / branchCount) * Math.PI * 2 + rand() * 0.65;
    const len = 1.9 + rand() * 0.85;
    const dir = new THREE.Vector3(Math.cos(yaw), 0.72 + rand() * 0.35, Math.sin(yaw)).normalize();
    const mid = start.clone().addScaledVector(dir, len * 0.52);
    const tip = start.clone().addScaledVector(dir, len);

    barkParts.push(buildCurvedLimbGeometry([start, mid, tip], rTop * 0.85, 0.045, 5, 3));
    appendFoliageCluster(foliageParts, tip, 1.55 + rand() * 0.45, rand, isPotato, 0.02);

    if (rand() > 0.35) {
      const sYaw = yaw + (rand() > 0.5 ? 0.65 : -0.65);
      const sTip = mid.clone().add(new THREE.Vector3(Math.cos(sYaw) * 1.15, 0.65, Math.sin(sYaw) * 1.15));
      barkParts.push(buildCurvedLimbGeometry([mid, mid.clone().lerp(sTip, 0.5), sTip], 0.06, 0.032, 4, 3));
      appendFoliageCluster(foliageParts, sTip, 1.35 + rand() * 0.35, rand, isPotato, -0.01);
    }
  }

  const apex = p3.clone().add(new THREE.Vector3((rand() - 0.5) * 0.3, 1.25, (rand() - 0.5) * 0.3));
  barkParts.push(buildCurvedLimbGeometry([p3, p3.clone().lerp(apex, 0.5), apex], rTop * 0.75, 0.04, 5, 3));
  appendFoliageCluster(foliageParts, apex, 1.75 + rand() * 0.4, rand, isPotato, 0.01);

  return {
    archetype: 'slender',
    barkGeo: mergeSafe(barkParts),
    foliageGeo: mergeSafe(foliageParts),
    vineGeo: null,
    trunkRadiusAtBase: rBase,
  };
}

function buildGnarledVariant(rand: () => number, isPotato: boolean): TreeVariantTemplate {
  const barkParts: THREE.BufferGeometry[] = [];
  const foliageParts: THREE.BufferGeometry[] = [];
  const vineParts: THREE.BufferGeometry[] = [];

  const baseH = 3.2 + rand() * 0.8;
  const rBase = 0.54 + rand() * 0.14;
  const p0 = new THREE.Vector3(0, -0.24, 0);
  const p1 = new THREE.Vector3(0.32, baseH * 0.52, -0.18);
  const p2 = new THREE.Vector3(-0.18, baseH, 0.22);

  barkParts.push(
    buildCurvedLimbGeometry([p0, p1, p2], rBase, rBase * 0.62, 8, 5, {
      flareStrength: 0.38,
      flareFreq: 5,
      uRepeat: 2,
      vRepeat: 2.5,
      bottomTint: new THREE.Color(0x748f5a),
    }),
  );

  // 3 winding surface roots
  for (let r = 0; r < 3; r++) {
    const ra = (r / 3) * Math.PI * 2 + rand() * 0.6;
    const reach = 1.45 + rand() * 0.55;
    barkParts.push(
      buildCurvedLimbGeometry(
        [
          new THREE.Vector3(Math.cos(ra) * rBase * 0.45, 0.78, Math.sin(ra) * rBase * 0.45),
          new THREE.Vector3(Math.cos(ra + 0.25) * reach * 0.6, 0.24, Math.sin(ra + 0.25) * reach * 0.6),
          new THREE.Vector3(Math.cos(ra + 0.15) * reach, -0.25, Math.sin(ra + 0.15) * reach),
        ],
        rBase * 0.32,
        0.075,
        5,
        4,
      ),
    );
  }

  // Split crooked forks reaching outward with asymmetric mossy foliage
  const forkCount = 3;
  for (let f = 0; f < forkCount; f++) {
    const fYaw = (f / forkCount) * Math.PI * 2 + rand() * 0.55;
    const fLen = 3.4 + rand() * 1.1;
    const fMid = p2.clone().add(new THREE.Vector3(Math.cos(fYaw) * fLen * 0.55, fLen * 0.48, Math.sin(fYaw) * fLen * 0.55));
    const fTip = p2.clone().add(new THREE.Vector3(Math.cos(fYaw + 0.18) * fLen, fLen * 0.82, Math.sin(fYaw + 0.18) * fLen));

    barkParts.push(buildCurvedLimbGeometry([p2, fMid, fTip], rBase * 0.42, 0.08, 6, 4));
    appendFoliageCluster(foliageParts, fTip, 1.95 + rand() * 0.55, rand, isPotato, -0.02);

    // Crooked side branch
    const sideYaw = fYaw + (f % 2 === 0 ? 0.85 : -0.85);
    const sideTip = fMid.clone().add(new THREE.Vector3(Math.cos(sideYaw) * 1.85, 0.85, Math.sin(sideYaw) * 1.85));
    barkParts.push(buildCurvedLimbGeometry([fMid, fMid.clone().lerp(sideTip, 0.5), sideTip], 0.14, 0.055, 5, 3));
    appendFoliageCluster(foliageParts, sideTip, 1.65 + rand() * 0.45, rand, isPotato, 0.02);

    vineParts.push(buildHangingVineGeo(fMid, 2.0 + rand() * 1.8, rand));
  }

  return {
    archetype: 'gnarled',
    barkGeo: mergeSafe(barkParts),
    foliageGeo: mergeSafe(foliageParts),
    vineGeo: mergeSafe(vineParts),
    trunkRadiusAtBase: rBase,
  };
}

function buildPalmVariant(rand: () => number, isPotato: boolean): TreeVariantTemplate {
  const height = 6.2 + rand() * 2.2;
  const rBase = 0.25 + rand() * 0.05;
  const leanYaw = rand() * Math.PI * 2;
  const leanMag = 0.9 + rand() * 0.95;

  const p0 = new THREE.Vector3(0, -0.18, 0);
  const p1 = new THREE.Vector3(Math.cos(leanYaw) * leanMag * 0.22, height * 0.34, Math.sin(leanYaw) * leanMag * 0.22);
  const p2 = new THREE.Vector3(Math.cos(leanYaw) * leanMag * 0.62, height * 0.68, Math.sin(leanYaw) * leanMag * 0.62);
  const crownCenter = new THREE.Vector3(Math.cos(leanYaw) * leanMag, height, Math.sin(leanYaw) * leanMag);

  const barkParts: THREE.BufferGeometry[] = [
    buildCurvedLimbGeometry([p0, p1, p2, crownCenter], rBase, 0.125, 7, 10, {
      flareStrength: 0.22,
      flareFreq: 6,
      ringModAmp: 0.08,
      ringModFreq: 16,
      uRepeat: 1.5,
      vRepeat: 5,
      bottomTint: new THREE.Color(0x8c8773),
      topTint: new THREE.Color(0xffffff),
    }),
  ];

  const frondParts: THREE.BufferGeometry[] = [];
  const frondCount = 10;
  for (let f = 0; f < frondCount; f++) {
    const isUpper = f >= 6;
    const fYaw = (f / (isUpper ? 4 : 6)) * Math.PI * 2 + (isUpper ? 0.38 : 0) + (rand() - 0.5) * 0.25;
    const fLen = (isUpper ? 2.55 : 3.25) + rand() * 0.55;
    const fWidth = isUpper ? 1.02 : 1.18;
    const droop = isUpper ? 0.36 + rand() * 0.14 : 0.62 + rand() * 0.18;
    const origin = crownCenter.clone().add(new THREE.Vector3(0, isUpper ? 0.18 : 0.04, 0));
    frondParts.push(buildArchedPalmFrond(fLen, fWidth, fYaw, droop, origin, isPotato));
  }

  // Cluster of coconuts tucked right beneath the fronds (merged into opaque barkGeo)
  for (let c = 0; c < 3; c++) {
    const ca = (c / 3) * Math.PI * 2 + rand() * 0.4;
    const nut = new THREE.SphereGeometry(0.15, 7, 5);
    const pos = nut.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const nutCol = new THREE.Color(0x5a4626);
    for (let v = 0; v < pos.count; v++) {
      colors[v * 3] = nutCol.r;
      colors[v * 3 + 1] = nutCol.g;
      colors[v * 3 + 2] = nutCol.b;
    }
    nut.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    nut.translate(
      crownCenter.x + Math.cos(ca) * 0.22,
      crownCenter.y - 0.14,
      crownCenter.z + Math.sin(ca) * 0.22,
    );
    barkParts.push(nut);
  }

  return {
    archetype: 'palm',
    barkGeo: mergeSafe(barkParts),
    foliageGeo: mergeSafe(frondParts),
    vineGeo: null,
    trunkRadiusAtBase: rBase,
  };
}

export function createTreeTemplateLibrary(isPotato: boolean): TreeTemplateLibrary {
  const rand = makeTreeSeededRand(90421);

  const variants: Record<TreeArchetype, TreeVariantTemplate[]> = {
    sumauma: Array.from({ length: 4 }, () => buildSumaumaVariant(rand, isPotato)),
    broadleaf: Array.from({ length: 4 }, () => buildBroadleafVariant(rand, isPotato)),
    slender: Array.from({ length: 3 }, () => buildSlenderVariant(rand, isPotato)),
    gnarled: Array.from({ length: 3 }, () => buildGnarledVariant(rand, isPotato)),
    palm: Array.from({ length: 3 }, () => buildPalmVariant(rand, isPotato)),
  };

  return {
    variants,
    dispose: () => {
      (Object.keys(variants) as TreeArchetype[]).forEach((key) => {
        variants[key].forEach((tpl) => {
          tpl.barkGeo.dispose();
          tpl.foliageGeo.dispose();
          tpl.vineGeo?.dispose();
        });
      });
    },
  };
}

import * as THREE from 'three';

export interface ProceduralTextures {
  groundDetail: THREE.CanvasTexture;
  bark: THREE.CanvasTexture;
  barkNormal: THREE.DataTexture;
  stone: THREE.CanvasTexture;
  foliage: THREE.CanvasTexture;
  leafCluster: THREE.DataTexture;
  palmFrond: THREE.DataTexture;
  contactShadow: THREE.CanvasTexture;
  survivorJacket: THREE.CanvasTexture;
  survivorShirt: THREE.CanvasTexture;
  survivorPants: THREE.CanvasTexture;
  survivorPack: THREE.CanvasTexture;
  survivorSkin: THREE.CanvasTexture;
  animalDeerFur: THREE.CanvasTexture;
  animalCapybaraFur: THREE.CanvasTexture;
  animalJaguarFur: THREE.CanvasTexture;
  animalPantherFur: THREE.CanvasTexture;
  animalMacawPlumage: THREE.CanvasTexture;
  cabinPlank: THREE.CanvasTexture;
  cabinRoof: THREE.CanvasTexture;
  riverWater: THREE.CanvasTexture;
  waterNormal: THREE.DataTexture;
  sunDisc: THREE.CanvasTexture;
  sunHalo: THREE.CanvasTexture;
  moonDisc: THREE.CanvasTexture;
  moonHalo: THREE.CanvasTexture;
  dispose: () => void;
}

// Dilate opaque RGB values into transparent (alpha=0) texels so mipmaps never bleed black halos
function canvasToDilatedAlphaTexture(
  canvas: HTMLCanvasElement,
  anisotropy: number,
  wrapS: THREE.Wrapping = THREE.ClampToEdgeWrapping,
  wrapT: THREE.Wrapping = THREE.ClampToEdgeWrapping,
): THREE.DataTexture {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.getImageData(0, 0, w, h);
  const src = img.data;
  const out = new Uint8Array(src.length);
  out.set(src);

  // 3-pass neighborhood RGB dilation into fully/mostly transparent border texels
  let cur = new Uint8Array(out);
  for (let pass = 0; pass < 4; pass++) {
    const next = new Uint8Array(cur);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        if (cur[idx + 3] > 28) continue;
        let rSum = 0;
        let gSum = 0;
        let bSum = 0;
        let hits = 0;
        for (let oy = -1; oy <= 1; oy++) {
          const ny = y + oy;
          if (ny < 0 || ny >= h) continue;
          for (let ox = -1; ox <= 1; ox++) {
            if (ox === 0 && oy === 0) continue;
            const nx = x + ox;
            if (nx < 0 || nx >= w) continue;
            const nIdx = (ny * w + nx) * 4;
            if (cur[nIdx + 3] > 28) {
              rSum += cur[nIdx];
              gSum += cur[nIdx + 1];
              bSum += cur[nIdx + 2];
              hits++;
            }
          }
        }
        if (hits > 0) {
          next[idx] = Math.round(rSum / hits);
          next[idx + 1] = Math.round(gSum / hits);
          next[idx + 2] = Math.round(bSum / hits);
        }
      }
    }
    cur = next;
  }

  // Fallback fill for remaining far empty pixels so distant mip levels stay mossy forest green
  for (let i = 0; i < cur.length; i += 4) {
    if (cur[i + 3] === 0 && cur[i] === 0 && cur[i + 1] === 0 && cur[i + 2] === 0) {
      cur[i] = 44;
      cur[i + 1] = 74;
      cur[i + 2] = 34;
    }
  }

  const tex = new THREE.DataTexture(cur, w, h, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = true;
  tex.wrapS = wrapS;
  tex.wrapT = wrapT;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

function makeCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

// Deterministic pseudo-random helper so procedural textures look consistent
function seededRand(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTextures {
  const anisotropy = Math.min(8, Math.max(1, maxAnisotropy));

  // 1. Ground micro-detail texture (damp humus, decaying leaf litter & organic moss veins)
  const [gCanvas, gCtx] = makeCanvas(512, 512);
  const gRand = seededRand(101);
  gCtx.fillStyle = '#c9cfbf';
  gCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 5200; i++) {
    const x = gRand() * 512;
    const y = gRand() * 512;
    const r = 1.1 + gRand() * 4.2;
    const shade = Math.floor(158 + gRand() * 68);
    gCtx.fillStyle = `rgb(${shade - 10}, ${shade - 4}, ${shade - 18})`;
    gCtx.beginPath();
    gCtx.arc(x, y, r, 0, Math.PI * 2);
    gCtx.fill();
  }
  // Damp moss & humus blotches
  for (let i = 0; i < 160; i++) {
    const x = gRand() * 512;
    const y = gRand() * 512;
    const r = 8 + gRand() * 20;
    gCtx.fillStyle =
      gRand() > 0.45 ? 'rgba(66, 94, 48, 0.19)' : 'rgba(92, 74, 52, 0.22)';
    gCtx.beginPath();
    gCtx.arc(x, y, r, 0, Math.PI * 2);
    gCtx.fill();
  }
  // Fine decaying leaf litter flecks & twigs
  for (let i = 0; i < 950; i++) {
    const x = gRand() * 512;
    const y = gRand() * 512;
    const angle = gRand() * Math.PI * 2;
    gCtx.save();
    gCtx.translate(x, y);
    gCtx.rotate(angle);
    const roll = gRand();
    gCtx.fillStyle =
      roll > 0.62
        ? 'rgba(112, 86, 54, 0.34)'
        : roll > 0.25
          ? 'rgba(62, 92, 46, 0.28)'
          : 'rgba(42, 34, 24, 0.26)';
    gCtx.fillRect(-3.5, -1.1, 7, 2.2);
    gCtx.restore();
  }
  const groundDetail = new THREE.CanvasTexture(gCanvas);
  groundDetail.colorSpace = THREE.SRGBColorSpace;
  groundDetail.wrapS = THREE.RepeatWrapping;
  groundDetail.wrapT = THREE.RepeatWrapping;
  groundDetail.repeat.set(30, 30);
  groundDetail.anisotropy = anisotropy;

  // 2. Realistic Deep-Furrowed Bark Texture (512x512 wavy fissures, plates, lichen & moss) + Matching Normal Map
  const [bCanvas, bCtx] = makeCanvas(512, 512);
  const bRand = seededRand(202);
  const nSize = 256;
  const barkHeight = new Float32Array(nSize * nSize);
  for (let y = 0; y < nSize; y++) {
    const ny = (y / nSize) * Math.PI * 2;
    for (let x = 0; x < nSize; x++) {
      const nx = (x / nSize) * Math.PI * 2;
      const ridgeA = Math.sin(nx * 9 + Math.sin(ny * 3) * 1.4) * 0.45;
      const ridgeB = Math.sin(nx * 21 - Math.cos(ny * 5) * 1.1) * 0.28;
      const ridgeC = Math.cos(nx * 37 + ny * 7) * 0.14;
      const knot = Math.sin(nx * 5 + ny * 4) * Math.cos(nx * 3 - ny * 6) * 0.22;
      barkHeight[y * nSize + x] = 0.5 + ridgeA + ridgeB + ridgeC + knot;
    }
  }
  const barkNormalBytes = new Uint8Array(nSize * nSize * 4);
  const normalStrength = 2.45;
  for (let y = 0; y < nSize; y++) {
    const ym = (y - 1 + nSize) % nSize;
    const yp = (y + 1) % nSize;
    for (let x = 0; x < nSize; x++) {
      const xm = (x - 1 + nSize) % nSize;
      const xp = (x + 1) % nSize;
      const dx = (barkHeight[y * nSize + xp] - barkHeight[y * nSize + xm]) * normalStrength;
      const dy = (barkHeight[yp * nSize + x] - barkHeight[ym * nSize + x]) * normalStrength;
      const invLen = 1 / Math.hypot(-dx, -dy, 1);
      const idx = (y * nSize + x) * 4;
      barkNormalBytes[idx] = Math.round(((-dx * invLen) * 0.5 + 0.5) * 255);
      barkNormalBytes[idx + 1] = Math.round(((-dy * invLen) * 0.5 + 0.5) * 255);
      barkNormalBytes[idx + 2] = Math.round(((1 * invLen) * 0.5 + 0.5) * 255);
      barkNormalBytes[idx + 3] = 255;
    }
  }
  const barkNormal = new THREE.DataTexture(barkNormalBytes, nSize, nSize, THREE.RGBAFormat);
  barkNormal.wrapS = THREE.RepeatWrapping;
  barkNormal.wrapT = THREE.RepeatWrapping;
  barkNormal.repeat.set(2, 3);
  barkNormal.generateMipmaps = true;
  barkNormal.minFilter = THREE.LinearMipmapLinearFilter;
  barkNormal.magFilter = THREE.LinearFilter;
  barkNormal.anisotropy = anisotropy;
  barkNormal.needsUpdate = true;

  bCtx.fillStyle = '#4c3c2d';
  bCtx.fillRect(0, 0, 512, 512);
  // Subtle wavy vertical bark plates
  for (let s = 0; s < 165; s++) {
    const sx = bRand() * 512;
    const w = 3 + bRand() * 7;
    const tone = Math.floor(54 + bRand() * 44);
    bCtx.strokeStyle = `rgb(${tone + 14}, ${tone + 2}, ${Math.max(20, tone - 12)})`;
    bCtx.lineWidth = w;
    bCtx.beginPath();
    bCtx.moveTo(sx, 0);
    for (let y = 32; y <= 512; y += 32) {
      bCtx.lineTo(sx + Math.sin(y * 0.025 + s) * 6, y);
    }
    bCtx.stroke();
  }
  // Deep bark fissures
  for (let i = 0; i < 420; i++) {
    const fx = bRand() * 512;
    const fy = bRand() * 512;
    const h = 24 + bRand() * 96;
    bCtx.strokeStyle =
      bRand() > 0.25 ? 'rgba(22, 16, 11, 0.68)' : 'rgba(116, 98, 78, 0.34)';
    bCtx.lineWidth = 1.4 + bRand() * 3.2;
    bCtx.beginPath();
    bCtx.moveTo(fx, fy);
    bCtx.bezierCurveTo(
      fx + (bRand() - 0.5) * 14,
      fy + h * 0.33,
      fx + (bRand() - 0.5) * 14,
      fy + h * 0.66,
      fx + (bRand() - 0.5) * 10,
      fy + h,
    );
    bCtx.stroke();
  }
  // TLOU-style creeping moss & pale forest lichen patches
  for (let i = 0; i < 145; i++) {
    const mx = bRand() * 512;
    const my = bRand() * 512;
    const mr = 4 + bRand() * 14;
    const isLichen = bRand() > 0.68;
    bCtx.fillStyle = isLichen
      ? `rgba(128, 134, 108, ${0.14 + bRand() * 0.16})`
      : `rgba(54, 84, 38, ${0.18 + bRand() * 0.22})`;
    bCtx.beginPath();
    bCtx.ellipse(mx, my, mr * 0.72, mr * 1.45, (bRand() - 0.5) * 0.4, 0, Math.PI * 2);
    bCtx.fill();
  }
  const bark = new THREE.CanvasTexture(bCanvas);
  bark.colorSpace = THREE.SRGBColorSpace;
  bark.wrapS = THREE.RepeatWrapping;
  bark.wrapT = THREE.RepeatWrapping;
  bark.repeat.set(2, 3);
  bark.anisotropy = anisotropy;

  // 3. Damp mossy granite / ancient ruin stone texture
  const [sCanvas, sCtx] = makeCanvas(256, 256);
  const sRand = seededRand(303);
  sCtx.fillStyle = '#5c635b';
  sCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2000; i++) {
    const x = sRand() * 256;
    const y = sRand() * 256;
    const r = 1.4 + sRand() * 5.2;
    const isMoss = sRand() > 0.72;
    if (isMoss) {
      sCtx.fillStyle = `rgba(${46 + Math.floor(sRand() * 24)}, ${82 + Math.floor(sRand() * 32)}, ${38 + Math.floor(sRand() * 18)}, 0.52)`;
    } else {
      const v = 72 + Math.floor(sRand() * 54);
      sCtx.fillStyle = `rgba(${v}, ${v + 2}, ${v - 2}, 0.46)`;
    }
    sCtx.beginPath();
    sCtx.arc(x, y, r, 0, Math.PI * 2);
    sCtx.fill();
  }
  const stone = new THREE.CanvasTexture(sCanvas);
  stone.colorSpace = THREE.SRGBColorSpace;
  stone.wrapS = THREE.RepeatWrapping;
  stone.wrapT = THREE.RepeatWrapping;
  stone.anisotropy = anisotropy;

  // 4. Dense weathered forest canopy foliage texture (for shrubs/moss)
  const [fCanvas, fCtx] = makeCanvas(256, 256);
  const fRand = seededRand(404);
  fCtx.fillStyle = '#2d572a';
  fCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 820; i++) {
    const x = fRand() * 256;
    const y = fRand() * 256;
    const rx = 4 + fRand() * 10;
    const ry = 2.5 + fRand() * 5.5;
    const rot = fRand() * Math.PI;
    const g = 74 + Math.floor(fRand() * 68);
    const r = 28 + Math.floor(fRand() * 38);
    const b = 26 + Math.floor(fRand() * 26);
    fCtx.save();
    fCtx.translate(x, y);
    fCtx.rotate(rot);
    fCtx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.72)`;
    fCtx.beginPath();
    fCtx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    fCtx.fill();
    fCtx.restore();
  }
  const foliage = new THREE.CanvasTexture(fCanvas);
  foliage.colorSpace = THREE.SRGBColorSpace;
  foliage.wrapS = THREE.RepeatWrapping;
  foliage.wrapT = THREE.RepeatWrapping;
  foliage.anisotropy = anisotropy;

  // 4b. High-Fidelity Organic Alpha-Cutout Leaf Spray Texture (512x512 RGBA, dilated for crisp mipmaps)
  const [lcCanvas, lcCtx] = makeCanvas(512, 512);
  const lcRand = seededRand(4409);
  lcCtx.clearRect(0, 0, 512, 512);

  // Subtle dark woody branching twigs inside the leaf cluster
  const twigLines: Array<[number, number, number, number, number]> = [
    [256, 470, 256, 175, 7],
    [256, 360, 145, 225, 5],
    [256, 345, 368, 215, 5],
    [256, 260, 178, 125, 4],
    [256, 250, 340, 118, 4],
    [195, 285, 110, 258, 3.2],
    [320, 275, 408, 250, 3.2],
  ];
  lcCtx.lineCap = 'round';
  for (let i = 0; i < twigLines.length; i++) {
    const [x1, y1, x2, y2, lw] = twigLines[i];
    lcCtx.strokeStyle = '#3b2d1f';
    lcCtx.lineWidth = lw;
    lcCtx.beginPath();
    lcCtx.moveTo(x1, y1);
    lcCtx.quadraticCurveTo((x1 + x2) * 0.5 + (lcRand() - 0.5) * 26, (y1 + y2) * 0.5, x2, y2);
    lcCtx.stroke();
  }

  const drawOrganicLeaf = (
    cx: number,
    cy: number,
    len: number,
    wid: number,
    ang: number,
    r: number,
    g: number,
    b: number,
  ) => {
    lcCtx.save();
    lcCtx.translate(cx, cy);
    lcCtx.rotate(ang);

    const grad = lcCtx.createLinearGradient(0, 0, len, 0);
    grad.addColorStop(0, `rgb(${Math.max(12, r - 18)}, ${Math.max(24, g - 22)}, ${Math.max(10, b - 12)})`);
    grad.addColorStop(0.55, `rgb(${r}, ${g}, ${b})`);
    grad.addColorStop(1, `rgb(${Math.min(255, r + 26)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 14)})`);

    lcCtx.fillStyle = grad;
    lcCtx.beginPath();
    lcCtx.moveTo(0, 0);
    lcCtx.bezierCurveTo(len * 0.26, -wid, len * 0.72, -wid * 0.78, len, 0);
    lcCtx.bezierCurveTo(len * 0.72, wid * 0.78, len * 0.26, wid, 0, 0);
    lcCtx.closePath();
    lcCtx.fill();

    // Fine central midrib vein
    lcCtx.strokeStyle = `rgba(${Math.min(255, r + 42)}, ${Math.min(255, g + 46)}, ${Math.min(255, b + 20)}, 0.42)`;
    lcCtx.lineWidth = 1.4;
    lcCtx.beginPath();
    lcCtx.moveTo(len * 0.08, 0);
    lcCtx.lineTo(len * 0.88, 0);
    lcCtx.stroke();
    lcCtx.restore();
  };

  // Layer 1 (deeper interior leaves for natural volumetric shadow) -> Layer 3 (sunlit outer tips)
  for (let layer = 0; layer < 3; layer++) {
    const count = layer === 0 ? 44 : layer === 1 ? 46 : 36;
    for (let i = 0; i < count; i++) {
      // Cluster tightly near center/twigs with organic ragged outer silhouette
      const radial = (0.14 + Math.pow(lcRand(), 0.72) * 0.82) * 198;
      const theta = lcRand() * Math.PI * 2;
      const lx = 256 + Math.cos(theta) * radial * 0.96;
      const ly = 252 + Math.sin(theta) * radial * 0.92;
      const outAngle = Math.atan2(ly - 295, lx - 256) + (lcRand() - 0.5) * 1.15;
      const leafLen = (34 + lcRand() * 34) * (layer === 2 ? 0.92 : 1.05);
      const leafWid = leafLen * (0.34 + lcRand() * 0.14);

      const shade = layer === 0 ? -24 : layer === 1 ? 0 : 18;
      const r = Math.max(24, Math.min(185, 62 + shade + Math.floor(lcRand() * 36)));
      const g = Math.max(48, Math.min(220, 108 + shade + Math.floor(lcRand() * 44)));
      const b = Math.max(20, Math.min(130, 40 + Math.floor(shade * 0.45) + Math.floor(lcRand() * 24)));

      drawOrganicLeaf(lx, ly, leafLen, leafWid, outAngle, r, g, b);
    }
  }
  const leafCluster = canvasToDilatedAlphaTexture(lcCanvas, anisotropy);

  // 4c. Realistic Pinnate Tropical Palm Frond Alpha-Cutout Texture (256x512 RGBA, dilated)
  const [pfCanvas, pfCtx] = makeCanvas(256, 512);
  const pfRand = seededRand(4512);
  pfCtx.clearRect(0, 0, 256, 512);

  // Central arched palm stem (rachis)
  const rachisGrad = pfCtx.createLinearGradient(0, 512, 0, 12);
  rachisGrad.addColorStop(0, '#4f6327');
  rachisGrad.addColorStop(1, '#79993c');
  pfCtx.strokeStyle = rachisGrad;
  pfCtx.lineWidth = 7;
  pfCtx.lineCap = 'round';
  pfCtx.beginPath();
  pfCtx.moveTo(128, 504);
  pfCtx.lineTo(128, 22);
  pfCtx.stroke();

  const leafletPairs = 26;
  for (let p = 0; p < leafletPairs; p++) {
    const t = p / (leafletPairs - 1);
    const y = 478 - t * 446;
    const spanProfile = Math.sin(Math.pow(t, 0.72) * Math.PI * 0.94);
    const len = 32 + spanProfile * 84;
    for (const side of [-1, 1]) {
      const tipX = 128 + side * len * (0.94 + pfRand() * 0.08);
      const tipY = y - 22 - t * 24 + (pfRand() - 0.5) * 8;
      const g = Math.floor(94 + t * 38 + pfRand() * 26);
      const r = Math.floor(46 + t * 26 + pfRand() * 18);
      const b = Math.floor(28 + pfRand() * 14);
      pfCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      pfCtx.beginPath();
      pfCtx.moveTo(128, y + 4);
      pfCtx.quadraticCurveTo(128 + side * len * 0.48, y - 16 - t * 10, tipX, tipY);
      pfCtx.quadraticCurveTo(128 + side * len * 0.45, y - 2, 128, y - 4);
      pfCtx.closePath();
      pfCtx.fill();
    }
  }
  const palmFrond = canvasToDilatedAlphaTexture(pfCanvas, anisotropy);

  // 5. Soft radial contact shadow
  const [cCanvas, cCtx] = makeCanvas(128, 128);
  const grad = cCtx.createRadialGradient(64, 64, 6, 64, 64, 60);
  grad.addColorStop(0, 'rgba(8, 16, 10, 0.76)');
  grad.addColorStop(0.55, 'rgba(8, 16, 10, 0.38)');
  grad.addColorStop(1, 'rgba(8, 16, 10, 0)');
  cCtx.fillStyle = grad;
  cCtx.fillRect(0, 0, 128, 128);
  const contactShadow = new THREE.CanvasTexture(cCanvas);
  contactShadow.colorSpace = THREE.SRGBColorSpace;

  // 6. TLOU Survivor Weathered Canvas Jacket Texture
  const [jCanvas, jCtx] = makeCanvas(256, 256);
  const jRand = seededRand(505);
  jCtx.fillStyle = '#3d4736';
  jCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 2) {
    jCtx.fillStyle = y % 4 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.06)';
    jCtx.fillRect(0, y, 256, 1);
  }
  for (let x = 0; x < 256; x += 2) {
    jCtx.fillStyle = 'rgba(20, 24, 18, 0.06)';
    jCtx.fillRect(x, 0, 1, 256);
  }
  for (let i = 0; i < 180; i++) {
    const x = jRand() * 256;
    const y = jRand() * 256;
    const r = 4 + jRand() * 16;
    jCtx.fillStyle = jRand() > 0.5 ? 'rgba(54, 42, 30, 0.18)' : 'rgba(24, 28, 22, 0.16)';
    jCtx.beginPath();
    jCtx.arc(x, y, r, 0, Math.PI * 2);
    jCtx.fill();
  }
  jCtx.strokeStyle = 'rgba(180, 168, 140, 0.22)';
  jCtx.setLineDash([4, 3]);
  jCtx.strokeRect(10, 10, 236, 236);
  const survivorJacket = new THREE.CanvasTexture(jCanvas);
  survivorJacket.colorSpace = THREE.SRGBColorSpace;
  survivorJacket.wrapS = THREE.RepeatWrapping;
  survivorJacket.wrapT = THREE.RepeatWrapping;
  survivorJacket.anisotropy = anisotropy;

  // 7. Weathered Flannel / Henley Shirt Texture
  const [shCanvas, shCtx] = makeCanvas(256, 256);
  const shRand = seededRand(606);
  shCtx.fillStyle = '#625648';
  shCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 256; i += 32) {
    shCtx.fillStyle = 'rgba(38, 32, 26, 0.25)';
    shCtx.fillRect(i, 0, 6, 256);
    shCtx.fillRect(0, i, 256, 6);
  }
  for (let i = 0; i < 220; i++) {
    shCtx.fillStyle = shRand() > 0.5 ? 'rgba(42, 34, 26, 0.14)' : 'rgba(140, 126, 108, 0.08)';
    shCtx.beginPath();
    shCtx.arc(shRand() * 256, shRand() * 256, 3 + shRand() * 10, 0, Math.PI * 2);
    shCtx.fill();
  }
  const survivorShirt = new THREE.CanvasTexture(shCanvas);
  survivorShirt.colorSpace = THREE.SRGBColorSpace;
  survivorShirt.wrapS = THREE.RepeatWrapping;
  survivorShirt.wrapT = THREE.RepeatWrapping;
  survivorShirt.anisotropy = anisotropy;

  // 8. Rugged Worn Denim / Cargo Pants Texture
  const [pCanvas, pCtx] = makeCanvas(256, 256);
  const pRand = seededRand(707);
  pCtx.fillStyle = '#3c3e3a';
  pCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 2) {
    pCtx.fillStyle = 'rgba(0,0,0,0.06)';
    pCtx.fillRect(0, y, 256, 1);
  }
  for (let i = 0; i < 160; i++) {
    pCtx.fillStyle = pRand() > 0.45 ? 'rgba(72, 60, 44, 0.22)' : 'rgba(96, 98, 92, 0.12)';
    pCtx.beginPath();
    pCtx.arc(pRand() * 256, pRand() * 256, 4 + pRand() * 14, 0, Math.PI * 2);
    pCtx.fill();
  }
  const survivorPants = new THREE.CanvasTexture(pCanvas);
  survivorPants.colorSpace = THREE.SRGBColorSpace;
  survivorPants.wrapS = THREE.RepeatWrapping;
  survivorPants.wrapT = THREE.RepeatWrapping;
  survivorPants.anisotropy = anisotropy;

  // 9. Survival Backpack Canvas Texture
  const [pkCanvas, pkCtx] = makeCanvas(256, 256);
  const pkRand = seededRand(808);
  pkCtx.fillStyle = '#4a4332';
  pkCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 300; i++) {
    pkCtx.fillStyle = pkRand() > 0.5 ? 'rgba(26, 24, 18, 0.18)' : 'rgba(110, 98, 72, 0.14)';
    pkCtx.fillRect(pkRand() * 256, pkRand() * 256, 4 + pkRand() * 12, 2 + pkRand() * 6);
  }
  const survivorPack = new THREE.CanvasTexture(pkCanvas);
  survivorPack.colorSpace = THREE.SRGBColorSpace;
  survivorPack.anisotropy = anisotropy;

  // 10. Natural Weathered Skin Texture
  const [skCanvas, skCtx] = makeCanvas(128, 128);
  const skRand = seededRand(909);
  skCtx.fillStyle = '#be8866';
  skCtx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 180; i++) {
    skCtx.fillStyle = skRand() > 0.5 ? 'rgba(130, 82, 58, 0.12)' : 'rgba(210, 160, 126, 0.1)';
    skCtx.beginPath();
    skCtx.arc(skRand() * 128, skRand() * 128, 2 + skRand() * 7, 0, Math.PI * 2);
    skCtx.fill();
  }
  const survivorSkin = new THREE.CanvasTexture(skCanvas);
  survivorSkin.colorSpace = THREE.SRGBColorSpace;
  survivorSkin.anisotropy = anisotropy;

  // 11. GTA 6-Style Realistic Deer Pelt Texture (layered fur strands, dorsal shading & dappled spots)
  const [dCanvas, dCtx] = makeCanvas(256, 256);
  const dRand = seededRand(1101);
  const dGrad = dCtx.createLinearGradient(0, 0, 0, 256);
  dGrad.addColorStop(0, '#784826');
  dGrad.addColorStop(0.5, '#a86938');
  dGrad.addColorStop(1, '#c89460');
  dCtx.fillStyle = dGrad;
  dCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3200; i++) {
    const x = dRand() * 256;
    const y = dRand() * 256;
    const len = 3 + dRand() * 6;
    const isLight = dRand() > 0.48;
    dCtx.strokeStyle = isLight ? 'rgba(215, 162, 108, 0.28)' : 'rgba(72, 40, 18, 0.30)';
    dCtx.lineWidth = 1;
    dCtx.beginPath();
    dCtx.moveTo(x, y);
    dCtx.lineTo(x + (dRand() - 0.5) * 2.2, y + len);
    dCtx.stroke();
  }
  // Natural muscular tonal variation + subtle dappled fawn markings
  for (let i = 0; i < 38; i++) {
    const x = 18 + dRand() * 220;
    const y = 30 + dRand() * 165;
    dCtx.fillStyle = 'rgba(242, 224, 192, 0.32)';
    dCtx.beginPath();
    dCtx.ellipse(x, y, 2.5 + dRand() * 3.5, 2 + dRand() * 2.5, dRand() * Math.PI, 0, Math.PI * 2);
    dCtx.fill();
  }
  const animalDeerFur = new THREE.CanvasTexture(dCanvas);
  animalDeerFur.colorSpace = THREE.SRGBColorSpace;
  animalDeerFur.wrapS = THREE.RepeatWrapping;
  animalDeerFur.wrapT = THREE.RepeatWrapping;
  animalDeerFur.anisotropy = anisotropy;

  // 12. GTA 6-Style Realistic Capybara Coarse Coat Texture
  const [cpCanvas, cpCtx] = makeCanvas(256, 256);
  const cpRand = seededRand(1202);
  cpCtx.fillStyle = '#6f5136';
  cpCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 40; i++) {
    cpCtx.fillStyle = cpRand() > 0.5 ? 'rgba(54, 38, 24, 0.25)' : 'rgba(132, 98, 62, 0.2)';
    cpCtx.beginPath();
    cpCtx.arc(cpRand() * 256, cpRand() * 256, 12 + cpRand() * 24, 0, Math.PI * 2);
    cpCtx.fill();
  }
  for (let i = 0; i < 3800; i++) {
    const x = cpRand() * 256;
    const y = cpRand() * 256;
    const len = 4 + cpRand() * 7;
    const roll = cpRand();
    cpCtx.strokeStyle =
      roll > 0.65
        ? 'rgba(156, 122, 82, 0.34)'
        : roll > 0.25
          ? 'rgba(56, 38, 24, 0.38)'
          : 'rgba(32, 22, 14, 0.4)';
    cpCtx.lineWidth = 1.2;
    cpCtx.beginPath();
    cpCtx.moveTo(x, y);
    cpCtx.lineTo(x + (cpRand() - 0.5) * 1.8, y + len);
    cpCtx.stroke();
  }
  const animalCapybaraFur = new THREE.CanvasTexture(cpCanvas);
  animalCapybaraFur.colorSpace = THREE.SRGBColorSpace;
  animalCapybaraFur.wrapS = THREE.RepeatWrapping;
  animalCapybaraFur.wrapT = THREE.RepeatWrapping;
  animalCapybaraFur.anisotropy = anisotropy;

  // 13. GTA 6-Style Realistic Jaguar Pelt Texture (golden-ochre fur + organic multi-petal rosettes)
  const [jgCanvas, jgCtx] = makeCanvas(512, 512);
  const jgRand = seededRand(1303);
  const jgGrad = jgCtx.createLinearGradient(0, 0, 0, 512);
  jgGrad.addColorStop(0, '#be7f26');
  jgGrad.addColorStop(0.55, '#d89b3c');
  jgGrad.addColorStop(1, '#e8c484');
  jgCtx.fillStyle = jgGrad;
  jgCtx.fillRect(0, 0, 512, 512);
  // Under-fur hair strands
  for (let i = 0; i < 5500; i++) {
    const x = jgRand() * 512;
    const y = jgRand() * 512;
    jgCtx.strokeStyle =
      jgRand() > 0.5 ? 'rgba(246, 210, 140, 0.24)' : 'rgba(110, 68, 18, 0.22)';
    jgCtx.lineWidth = 1;
    jgCtx.beginPath();
    jgCtx.moveTo(x, y);
    jgCtx.lineTo(x + (jgRand() - 0.5) * 2, y + 4 + jgRand() * 6);
    jgCtx.stroke();
  }
  // Organic Jaguar Rosettes (broken black rings around darker tawny center + central spots)
  const rosettePoints: Array<{ x: number; y: number; r: number }> = [];
  for (let i = 0; i < 165; i++) {
    const rx = 18 + jgRand() * 476;
    const ry = 18 + jgRand() * 476;
    const rr = 12 + jgRand() * 11;
    let overlap = false;
    for (let k = 0; k < rosettePoints.length; k++) {
      const dx = rosettePoints[k].x - rx;
      const dy = rosettePoints[k].y - ry;
      if (dx * dx + dy * dy < (rosettePoints[k].r + rr + 4) ** 2) {
        overlap = true;
        break;
      }
    }
    if (overlap) continue;
    rosettePoints.push({ x: rx, y: ry, r: rr });

    // Darker tawny interior core
    jgCtx.fillStyle = 'rgba(138, 82, 20, 0.55)';
    jgCtx.beginPath();
    jgCtx.arc(rx, ry, rr * 0.72, 0, Math.PI * 2);
    jgCtx.fill();

    // Central jaguar dot
    if (jgRand() > 0.32) {
      jgCtx.fillStyle = 'rgba(28, 18, 10, 0.88)';
      jgCtx.beginPath();
      jgCtx.arc(rx + (jgRand() - 0.5) * 4, ry + (jgRand() - 0.5) * 4, 2.6 + jgRand() * 1.8, 0, Math.PI * 2);
      jgCtx.fill();
    }

    // Ring of irregular dark petals
    const petals = 4 + Math.floor(jgRand() * 3);
    const baseA = jgRand() * Math.PI * 2;
    for (let p = 0; p < petals; p++) {
      const pa = baseA + (p / petals) * Math.PI * 2 + (jgRand() - 0.5) * 0.35;
      const px = rx + Math.cos(pa) * rr * 0.82;
      const py = ry + Math.sin(pa) * rr * 0.82;
      jgCtx.fillStyle = 'rgba(24, 15, 9, 0.9)';
      jgCtx.beginPath();
      jgCtx.ellipse(px, py, 3.2 + jgRand() * 2.4, 2.2 + jgRand() * 1.8, pa + Math.PI / 2, 0, Math.PI * 2);
      jgCtx.fill();
    }
  }
  const animalJaguarFur = new THREE.CanvasTexture(jgCanvas);
  animalJaguarFur.colorSpace = THREE.SRGBColorSpace;
  animalJaguarFur.wrapS = THREE.RepeatWrapping;
  animalJaguarFur.wrapT = THREE.RepeatWrapping;
  animalJaguarFur.anisotropy = anisotropy;

  // 14. GTA 6-Style Realistic Black Panther Coat (sleek charcoal fur + subtle ghost rosettes)
  const [pnCanvas, pnCtx] = makeCanvas(256, 256);
  const pnRand = seededRand(1404);
  pnCtx.fillStyle = '#1b1d22';
  pnCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 65; i++) {
    const rx = 12 + pnRand() * 232;
    const ry = 12 + pnRand() * 232;
    pnCtx.strokeStyle = 'rgba(8, 9, 12, 0.72)';
    pnCtx.lineWidth = 3.2;
    pnCtx.beginPath();
    pnCtx.arc(rx, ry, 7 + pnRand() * 6, 0, Math.PI * 1.75);
    pnCtx.stroke();
  }
  for (let i = 0; i < 3200; i++) {
    const x = pnRand() * 256;
    const y = pnRand() * 256;
    pnCtx.strokeStyle =
      pnRand() > 0.52 ? 'rgba(56, 62, 74, 0.24)' : 'rgba(6, 7, 10, 0.34)';
    pnCtx.lineWidth = 1;
    pnCtx.beginPath();
    pnCtx.moveTo(x, y);
    pnCtx.lineTo(x + (pnRand() - 0.5) * 1.5, y + 3 + pnRand() * 5);
    pnCtx.stroke();
  }
  const animalPantherFur = new THREE.CanvasTexture(pnCanvas);
  animalPantherFur.colorSpace = THREE.SRGBColorSpace;
  animalPantherFur.wrapS = THREE.RepeatWrapping;
  animalPantherFur.wrapT = THREE.RepeatWrapping;
  animalPantherFur.anisotropy = anisotropy;

  // 15. Tropical Scarlet Macaw Layered Plumage Texture
  const [mcCanvas, mcCtx] = makeCanvas(256, 256);
  const mcRand = seededRand(1505);
  mcCtx.fillStyle = '#b91c1c';
  mcCtx.fillRect(0, 0, 256, 256);
  for (let row = 0; row < 256; row += 12) {
    for (let col = 0; col < 256; col += 14) {
      const x = col + (row % 24 === 0 ? 0 : 7);
      mcCtx.fillStyle =
        mcRand() > 0.45 ? 'rgba(225, 29, 72, 0.85)' : 'rgba(153, 27, 27, 0.85)';
      mcCtx.beginPath();
      mcCtx.ellipse(x, row, 8, 6, 0, 0, Math.PI * 2);
      mcCtx.fill();
      mcCtx.strokeStyle = 'rgba(253, 186, 116, 0.22)';
      mcCtx.lineWidth = 0.8;
      mcCtx.stroke();
    }
  }
  const animalMacawPlumage = new THREE.CanvasTexture(mcCanvas);
  animalMacawPlumage.colorSpace = THREE.SRGBColorSpace;
  animalMacawPlumage.wrapS = THREE.RepeatWrapping;
  animalMacawPlumage.wrapT = THREE.RepeatWrapping;
  animalMacawPlumage.anisotropy = anisotropy;

  // 16. Weathered Rustic Cabin Timber Planks
  const [cbCanvas, cbCtx] = makeCanvas(256, 256);
  const cbRand = seededRand(1606);
  cbCtx.fillStyle = '#6f4c2f';
  cbCtx.fillRect(0, 0, 256, 256);
  const plankRows = 6;
  const plankH = 256 / plankRows;
  for (let row = 0; row < plankRows; row++) {
    const py = row * plankH;
    const toneShift = (cbRand() - 0.5) * 18;
    cbCtx.fillStyle = `rgb(${Math.round(112 + toneShift)}, ${Math.round(77 + toneShift * 0.7)}, ${Math.round(47 + toneShift * 0.45)})`;
    cbCtx.fillRect(0, py + 1.5, 256, plankH - 3);
    // Fine wood grain fibers
    for (let g = 0; g < 42; g++) {
      const gy = py + 3 + cbRand() * (plankH - 6);
      cbCtx.strokeStyle = cbRand() > 0.5 ? 'rgba(42, 26, 14, 0.28)' : 'rgba(155, 112, 74, 0.16)';
      cbCtx.lineWidth = 0.8 + cbRand() * 1.4;
      cbCtx.beginPath();
      cbCtx.moveTo(0, gy);
      cbCtx.bezierCurveTo(85, gy + (cbRand() - 0.5) * 4, 170, gy + (cbRand() - 0.5) * 4, 256, gy);
      cbCtx.stroke();
    }
    // Plank seam & subtle damp moss smudge
    cbCtx.fillStyle = 'rgba(22, 14, 8, 0.72)';
    cbCtx.fillRect(0, py, 256, 2.5);
    if (cbRand() > 0.45) {
      cbCtx.fillStyle = 'rgba(48, 66, 30, 0.18)';
      cbCtx.beginPath();
      cbCtx.arc(cbRand() * 256, py + plankH * 0.5, 12 + cbRand() * 18, 0, Math.PI * 2);
      cbCtx.fill();
    }
    // Iron nail dots
    cbCtx.fillStyle = 'rgba(28, 26, 24, 0.75)';
    cbCtx.beginPath();
    cbCtx.arc(14, py + plankH * 0.35, 1.8, 0, Math.PI * 2);
    cbCtx.arc(14, py + plankH * 0.7, 1.8, 0, Math.PI * 2);
    cbCtx.arc(242, py + plankH * 0.35, 1.8, 0, Math.PI * 2);
    cbCtx.arc(242, py + plankH * 0.7, 1.8, 0, Math.PI * 2);
    cbCtx.fill();
  }
  const cabinPlank = new THREE.CanvasTexture(cbCanvas);
  cabinPlank.colorSpace = THREE.SRGBColorSpace;
  cabinPlank.wrapS = THREE.RepeatWrapping;
  cabinPlank.wrapT = THREE.RepeatWrapping;
  cabinPlank.repeat.set(2, 2);
  cabinPlank.anisotropy = anisotropy;

  // 17. Rustic Cabin Thatch / Mossy Wood Shingle Roof
  const [crCanvas, crCtx] = makeCanvas(256, 256);
  const crRand = seededRand(1707);
  crCtx.fillStyle = '#4a432b';
  crCtx.fillRect(0, 0, 256, 256);
  for (let row = 0; row < 10; row++) {
    const ry = row * 25.6;
    for (let col = 0; col < 10; col++) {
      const rx = col * 25.6 + (row % 2 === 0 ? 0 : 12.8);
      const shade = crRand();
      crCtx.fillStyle =
        shade < 0.33 ? '#5a5033' : shade < 0.66 ? '#494129' : '#3d4528';
      crCtx.fillRect(rx - 12, ry + 1, 24, 23);
      crCtx.strokeStyle = 'rgba(18, 16, 10, 0.55)';
      crCtx.lineWidth = 1.5;
      crCtx.strokeRect(rx - 12, ry + 1, 24, 23);
    }
    crCtx.fillStyle = 'rgba(20, 18, 11, 0.5)';
    crCtx.fillRect(0, ry, 256, 2);
  }
  const cabinRoof = new THREE.CanvasTexture(crCanvas);
  cabinRoof.colorSpace = THREE.SRGBColorSpace;
  cabinRoof.wrapS = THREE.RepeatWrapping;
  cabinRoof.wrapT = THREE.RepeatWrapping;
  cabinRoof.repeat.set(2.5, 2.5);
  cabinRoof.anisotropy = anisotropy;

  // 18. Flowing Tropical River Water (emerald-cerulean ripples + natural caustics)
  const [rwCanvas, rwCtx] = makeCanvas(512, 512);
  const rwRand = seededRand(1808);
  const rwGrad = rwCtx.createLinearGradient(0, 0, 512, 512);
  rwGrad.addColorStop(0, '#0f5c64');
  rwGrad.addColorStop(0.5, '#177e84');
  rwGrad.addColorStop(1, '#0e525c');
  rwCtx.fillStyle = rwGrad;
  rwCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 240; i++) {
    const x = rwRand() * 512;
    const y = rwRand() * 512;
    const len = 28 + rwRand() * 64;
    rwCtx.strokeStyle =
      rwRand() > 0.38 ? 'rgba(116, 224, 226, 0.22)' : 'rgba(222, 250, 252, 0.28)';
    rwCtx.lineWidth = 1.4 + rwRand() * 2.6;
    rwCtx.beginPath();
    rwCtx.moveTo(x, y);
    rwCtx.bezierCurveTo(
      x + (rwRand() - 0.5) * 18,
      y + len * 0.35,
      x + (rwRand() - 0.5) * 18,
      y + len * 0.7,
      x + (rwRand() - 0.5) * 10,
      y + len,
    );
    rwCtx.stroke();
  }
  for (let i = 0; i < 82; i++) {
    const x = rwRand() * 512;
    const y = rwRand() * 512;
    rwCtx.fillStyle = 'rgba(176, 244, 240, 0.13)';
    rwCtx.beginPath();
    rwCtx.ellipse(x, y, 6 + rwRand() * 14, 14 + rwRand() * 26, (rwRand() - 0.5) * 0.4, 0, Math.PI * 2);
    rwCtx.fill();
  }
  const riverWater = new THREE.CanvasTexture(rwCanvas);
  riverWater.colorSpace = THREE.SRGBColorSpace;
  riverWater.wrapS = THREE.RepeatWrapping;
  riverWater.wrapT = THREE.RepeatWrapping;
  riverWater.repeat.set(2, 16);
  riverWater.anisotropy = anisotropy;

  // 19. Seamless Water Surface Ripple Normal Map (256x256 periodic waves)
  const wnSize = 256;
  const wnData = new Uint8Array(wnSize * wnSize * 4);
  const wnHeights = new Float32Array(wnSize * wnSize);
  for (let y = 0; y < wnSize; y++) {
    const v = (y / wnSize) * Math.PI * 2;
    for (let x = 0; x < wnSize; x++) {
      const u = (x / wnSize) * Math.PI * 2;
      const h =
        Math.sin(u * 2 + v * 1) * 0.34 +
        Math.cos(u * 3 - v * 2) * 0.28 +
        Math.sin(u * 5 + v * 4 + 1.1) * 0.18 +
        Math.cos(u * 7 - v * 6 + 0.5) * 0.11 +
        Math.sin(u * 11 + v * 9) * 0.06;
      wnHeights[y * wnSize + x] = h;
    }
  }
  const wnStrength = 2.6;
  for (let y = 0; y < wnSize; y++) {
    const yUp = (y - 1 + wnSize) % wnSize;
    const yDn = (y + 1) % wnSize;
    for (let x = 0; x < wnSize; x++) {
      const xLt = (x - 1 + wnSize) % wnSize;
      const xRt = (x + 1) % wnSize;
      const dx = (wnHeights[y * wnSize + xRt] - wnHeights[y * wnSize + xLt]) * wnStrength;
      const dy = (wnHeights[yDn * wnSize + x] - wnHeights[yUp * wnSize + x]) * wnStrength;
      const nz = 1.0;
      const len = Math.sqrt(dx * dx + dy * dy + nz * nz);
      const idx = (y * wnSize + x) * 4;
      wnData[idx] = Math.round(((-dx / len) * 0.5 + 0.5) * 255);
      wnData[idx + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255);
      wnData[idx + 2] = Math.round(((nz / len) * 0.5 + 0.5) * 255);
      wnData[idx + 3] = 255;
    }
  }
  const waterNormal = new THREE.DataTexture(wnData, wnSize, wnSize, THREE.RGBAFormat);
  waterNormal.wrapS = THREE.RepeatWrapping;
  waterNormal.wrapT = THREE.RepeatWrapping;
  waterNormal.repeat.set(5, 5);
  waterNormal.anisotropy = anisotropy;
  waterNormal.needsUpdate = true;

  // 20. Realistic Sun Disc + Soft Atmospheric Halo
  const [sdCanvas, sdCtx] = makeCanvas(256, 256);
  const sdGrad = sdCtx.createRadialGradient(128, 128, 6, 128, 128, 124);
  sdGrad.addColorStop(0.0, 'rgba(255, 255, 245, 1)');
  sdGrad.addColorStop(0.56, 'rgba(255, 244, 198, 1)');
  sdGrad.addColorStop(0.76, 'rgba(255, 206, 122, 0.98)');
  sdGrad.addColorStop(0.84, 'rgba(255, 168, 76, 0.35)');
  sdGrad.addColorStop(1.0, 'rgba(255, 150, 60, 0)');
  sdCtx.fillStyle = sdGrad;
  sdCtx.fillRect(0, 0, 256, 256);
  const sunDisc = new THREE.CanvasTexture(sdCanvas);
  sunDisc.colorSpace = THREE.SRGBColorSpace;

  const [sunHaloCanvas, sunHaloCtx] = makeCanvas(256, 256);
  const shGrad = sunHaloCtx.createRadialGradient(128, 128, 4, 128, 128, 128);
  shGrad.addColorStop(0.0, 'rgba(255, 246, 205, 0.95)');
  shGrad.addColorStop(0.28, 'rgba(255, 214, 132, 0.52)');
  shGrad.addColorStop(0.62, 'rgba(255, 178, 92, 0.16)');
  shGrad.addColorStop(1.0, 'rgba(255, 145, 65, 0)');
  sunHaloCtx.fillStyle = shGrad;
  sunHaloCtx.fillRect(0, 0, 256, 256);
  const sunHalo = new THREE.CanvasTexture(sunHaloCanvas);
  sunHalo.colorSpace = THREE.SRGBColorSpace;

  // 21. Realistic Cratered Full Moon Disc + Cool Silvery-Blue Halo
  const [mdCanvas, mdCtx] = makeCanvas(256, 256);
  const mdRand = seededRand(2121);
  const mdGrad = mdCtx.createRadialGradient(118, 118, 12, 128, 128, 114);
  mdGrad.addColorStop(0.0, '#fbfdff');
  mdGrad.addColorStop(0.62, '#e6eefb');
  mdGrad.addColorStop(0.83, '#c8d6ec');
  mdGrad.addColorStop(0.91, 'rgba(182, 204, 236, 0.35)');
  mdGrad.addColorStop(1.0, 'rgba(165, 190, 228, 0)');
  mdCtx.fillStyle = mdGrad;
  mdCtx.fillRect(0, 0, 256, 256);

  mdCtx.save();
  mdCtx.beginPath();
  mdCtx.arc(128, 128, 96, 0, Math.PI * 2);
  mdCtx.clip();
  // Lunar maria (soft dark basaltic patches)
  const maria = [
    { x: 102, y: 98, rx: 32, ry: 22, a: -0.3 },
    { x: 146, y: 112, rx: 28, ry: 26, a: 0.4 },
    { x: 112, y: 146, rx: 24, ry: 18, a: 0.2 },
    { x: 158, y: 148, rx: 20, ry: 15, a: -0.5 },
    { x: 88, y: 132, rx: 18, ry: 22, a: 0.1 },
  ];
  for (let i = 0; i < maria.length; i++) {
    const m = maria[i];
    mdCtx.fillStyle = 'rgba(128, 144, 170, 0.28)';
    mdCtx.beginPath();
    mdCtx.ellipse(m.x, m.y, m.rx, m.ry, m.a, 0, Math.PI * 2);
    mdCtx.fill();
  }
  // Subtle surface craters
  for (let i = 0; i < 36; i++) {
    const cx = 42 + mdRand() * 172;
    const cy = 42 + mdRand() * 172;
    const cr = 3 + mdRand() * 10;
    mdCtx.fillStyle = 'rgba(130, 145, 168, 0.22)';
    mdCtx.beginPath();
    mdCtx.arc(cx, cy, cr, 0, Math.PI * 2);
    mdCtx.fill();
    mdCtx.strokeStyle = 'rgba(248, 252, 255, 0.28)';
    mdCtx.lineWidth = 1;
    mdCtx.beginPath();
    mdCtx.arc(cx - 1, cy - 1, cr, Math.PI * 0.9, Math.PI * 1.9);
    mdCtx.stroke();
  }
  mdCtx.restore();
  const moonDisc = new THREE.CanvasTexture(mdCanvas);
  moonDisc.colorSpace = THREE.SRGBColorSpace;

  const [mhCanvas, mhCtx] = makeCanvas(256, 256);
  const mhGrad = mhCtx.createRadialGradient(128, 128, 8, 128, 128, 128);
  mhGrad.addColorStop(0.0, 'rgba(222, 236, 255, 0.72)');
  mhGrad.addColorStop(0.32, 'rgba(164, 196, 245, 0.34)');
  mhGrad.addColorStop(0.68, 'rgba(116, 156, 224, 0.11)');
  mhGrad.addColorStop(1.0, 'rgba(92, 134, 210, 0)');
  mhCtx.fillStyle = mhGrad;
  mhCtx.fillRect(0, 0, 256, 256);
  const moonHalo = new THREE.CanvasTexture(mhCanvas);
  moonHalo.colorSpace = THREE.SRGBColorSpace;

  return {
    groundDetail,
    bark,
    barkNormal,
    stone,
    foliage,
    leafCluster,
    palmFrond,
    contactShadow,
    survivorJacket,
    survivorShirt,
    survivorPants,
    survivorPack,
    survivorSkin,
    animalDeerFur,
    animalCapybaraFur,
    animalJaguarFur,
    animalPantherFur,
    animalMacawPlumage,
    cabinPlank,
    cabinRoof,
    riverWater,
    waterNormal,
    sunDisc,
    sunHalo,
    moonDisc,
    moonHalo,
    dispose: () => {
      groundDetail.dispose();
      bark.dispose();
      barkNormal.dispose();
      stone.dispose();
      foliage.dispose();
      leafCluster.dispose();
      palmFrond.dispose();
      contactShadow.dispose();
      survivorJacket.dispose();
      survivorShirt.dispose();
      survivorPants.dispose();
      survivorPack.dispose();
      survivorSkin.dispose();
      animalDeerFur.dispose();
      animalCapybaraFur.dispose();
      animalJaguarFur.dispose();
      animalPantherFur.dispose();
      animalMacawPlumage.dispose();
      cabinPlank.dispose();
      cabinRoof.dispose();
      riverWater.dispose();
      waterNormal.dispose();
      sunDisc.dispose();
      sunHalo.dispose();
      moonDisc.dispose();
      moonHalo.dispose();
    },
  };
}

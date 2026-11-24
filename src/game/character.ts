import * as THREE from 'three';

import { ProceduralTextures } from './textures';
import { EquippedWeapon, LightMode } from './types';

export interface ExplorerRig {
  root: THREE.Group;
  pelvis: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftForearm: THREE.Group;
  rightForearm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftShin: THREE.Group;
  rightShin: THREE.Group;
  contactShadow: THREE.Mesh;
  setLightState: (enabled: boolean, mode: LightMode, isLowQuality: boolean) => void;
  setWeaponState: (weapon: EquippedWeapon) => void;
  setFirstPersonMode: (enabled: boolean) => void;
  setLightAimPitch: (pitchRad: number, isFirstPerson: boolean) => void;
  setPotatoMode: (enabled: boolean) => void;
  updateAnimation: (
    dt: number,
    horizontalSpeed: number,
    maxSpeed: number,
    isGrounded: boolean,
    verticalVel: number,
    interactPulse: number,
    lightHeld: boolean,
    attackPulse: number,
    strafeNorm?: number,
    forwardNorm?: number,
    isSprinting?: boolean,
    isSwimming?: boolean,
  ) => void;
  dispose: () => void;
}

interface MaterialPreset {
  mat: THREE.MeshStandardMaterial;
  map: THREE.Texture | null;
  color: number;
  roughness: number;
  metalness: number;
  envMapIntensity: number;
  potatoColor: number;
}

export function createExplorerCharacter(textures: ProceduralTextures): ExplorerRig {
  const root = new THREE.Group();
  root.name = 'SurvivorMale';

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const texturesToDispose: THREE.Texture[] = [];
  const presets: MaterialPreset[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };
  const trackTex = <T extends THREE.Texture>(t: T): T => {
    texturesToDispose.push(t);
    return t;
  };

  const makeSurvivorMat = (
    opts: {
      color: number;
      potatoColor: number;
      map?: THREE.Texture | null;
      roughness: number;
      metalness?: number;
      envMapIntensity?: number;
    },
  ): THREE.MeshStandardMaterial => {
    const mat = trackMat(
      new THREE.MeshStandardMaterial({
        color: opts.color,
        map: opts.map ?? null,
        roughness: opts.roughness,
        metalness: opts.metalness ?? 0.02,
        envMapIntensity: opts.envMapIntensity ?? 1.0,
      }),
    );
    presets.push({
      mat,
      map: opts.map ?? null,
      color: opts.color,
      roughness: opts.roughness,
      metalness: opts.metalness ?? 0.02,
      envMapIntensity: opts.envMapIntensity ?? 1.0,
      potatoColor: opts.potatoColor,
    });
    return mat;
  };

  // Realistic TLOU weathered survival palette
  const skinMat = makeSurvivorMat({
    color: 0xd6a586,
    potatoColor: 0xd8a382,
    map: textures.survivorSkin,
    roughness: 0.62,
    metalness: 0.02,
  });
  const hairMat = makeSurvivorMat({
    color: 0x261d17,
    potatoColor: 0x2c221b,
    roughness: 0.9,
    metalness: 0.01,
  });
  const beardMat = makeSurvivorMat({
    color: 0x2b211a,
    potatoColor: 0x33271f,
    roughness: 0.94,
    metalness: 0.0,
  });
  const shirtMat = makeSurvivorMat({
    color: 0xb7a796,
    potatoColor: 0x8c7b69,
    map: textures.survivorShirt,
    roughness: 0.88,
    metalness: 0.02,
  });
  const jacketMat = makeSurvivorMat({
    color: 0xb8c0ae,
    potatoColor: 0x4b5842,
    map: textures.survivorJacket,
    roughness: 0.92,
    metalness: 0.02,
  });
  const pantsMat = makeSurvivorMat({
    color: 0xaab0a8,
    potatoColor: 0x454944,
    map: textures.survivorPants,
    roughness: 0.9,
    metalness: 0.02,
  });
  const leatherMat = makeSurvivorMat({
    color: 0x3b2619,
    potatoColor: 0x4a3122,
    roughness: 0.56,
    metalness: 0.08,
  });
  const bootMat = makeSurvivorMat({
    color: 0x35251a,
    potatoColor: 0x443022,
    roughness: 0.72,
    metalness: 0.04,
  });
  const bootSoleMat = makeSurvivorMat({
    color: 0x181817,
    potatoColor: 0x222220,
    roughness: 0.95,
    metalness: 0.02,
  });
  const packMat = makeSurvivorMat({
    color: 0xb0a690,
    potatoColor: 0x5c5340,
    map: textures.survivorPack,
    roughness: 0.9,
    metalness: 0.03,
  });
  const tarpMat = makeSurvivorMat({
    color: 0x4d4330,
    potatoColor: 0x62563f,
    roughness: 0.88,
    metalness: 0.02,
  });
  const brassMat = makeSurvivorMat({
    color: 0xb7903d,
    potatoColor: 0xc29c46,
    roughness: 0.34,
    metalness: 0.78,
  });
  const steelMat = makeSurvivorMat({
    color: 0xbecad2,
    potatoColor: 0xaab6be,
    roughness: 0.28,
    metalness: 0.86,
  });
  const handleWoodMat = makeSurvivorMat({
    color: 0x5e3b1f,
    potatoColor: 0x6b4527,
    roughness: 0.84,
    metalness: 0.03,
  });

  const eyeWhiteMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xe8e8e2, roughness: 0.28, metalness: 0.0 }),
  );
  const irisMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x4d3826, roughness: 0.2, metalness: 0.04 }),
  );
  const pupilMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x12100e, roughness: 0.16, metalness: 0.04 }),
  );

  // Soft grounded contact shadow
  const shadowGeo = trackGeo(new THREE.PlaneGeometry(1.1, 1.1));
  const shadowMat = trackMat(
    new THREE.MeshBasicMaterial({
      map: textures.contactShadow,
      transparent: true,
      depthWrite: false,
      opacity: 0.52,
    }),
  );
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.025;
  root.add(contactShadow);

  // Pelvis (anatomical hip pivot at 0.91m)
  const pelvis = new THREE.Group();
  pelvis.position.y = 0.91;
  root.add(pelvis);

  const hipGeo = trackGeo(new THREE.CylinderGeometry(0.185, 0.195, 0.2, 12));
  hipGeo.scale(1.18, 1, 0.72);
  const hipMesh = new THREE.Mesh(hipGeo, pantsMat);
  hipMesh.castShadow = true;
  hipMesh.receiveShadow = true;
  pelvis.add(hipMesh);

  // Utility Belt + Brass Buckle + Side Pouch
  const beltGeo = trackGeo(new THREE.CylinderGeometry(0.198, 0.198, 0.055, 14));
  beltGeo.scale(1.19, 1, 0.74);
  const beltMesh = new THREE.Mesh(beltGeo, leatherMat);
  beltMesh.position.y = 0.075;
  beltMesh.castShadow = true;
  pelvis.add(beltMesh);

  const buckleMesh = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.068, 0.06, 0.026)), brassMat);
  buckleMesh.position.set(0, 0.075, 0.145);
  pelvis.add(buckleMesh);

  const hipPouch = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.08, 0.12, 0.12)),
    leatherMat,
  );
  hipPouch.position.set(-0.225, 0.03, 0.01);
  hipPouch.rotation.z = 0.1;
  pelvis.add(hipPouch);

  // Survival Knife Sheath & Brass Carabiner on Right Hip
  const knifeSheath = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.042, 0.17, 0.056)),
    leatherMat,
  );
  knifeSheath.position.set(0.224, -0.01, -0.01);
  knifeSheath.rotation.z = -0.14;
  knifeSheath.castShadow = true;
  pelvis.add(knifeSheath);

  const knifePommel = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.016, 0.018, 0.068, 8)),
    handleWoodMat,
  );
  knifePommel.position.set(0.236, 0.095, -0.01);
  knifePommel.rotation.z = -0.14;
  pelvis.add(knifePommel);

  // Torso (Anatomical Tapered Chest + Layered Survival Jacket over Henley Shirt)
  const torso = new THREE.Group();
  torso.position.y = 0.1;
  pelvis.add(torso);

  // Sculpted Lathe anatomical torso profile (waist -> ribcage -> chest -> shoulders)
  const torsoProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.17, 0.02),
    new THREE.Vector2(0.165, 0.12),
    new THREE.Vector2(0.195, 0.28),
    new THREE.Vector2(0.215, 0.42),
    new THREE.Vector2(0.185, 0.52),
    new THREE.Vector2(0.075, 0.56),
    new THREE.Vector2(0.0, 0.56),
  ];
  const shirtGeo = trackGeo(new THREE.LatheGeometry(torsoProfile, 14));
  shirtGeo.scale(1.12, 1, 0.72);
  const chestMesh = new THREE.Mesh(shirtGeo, shirtMat);
  chestMesh.castShadow = true;
  chestMesh.receiveShadow = true;
  torso.add(chestMesh);

  // Open Weathered Survival Jacket wrapping chest & back
  const jacketBackGeo = trackGeo(new THREE.CylinderGeometry(0.225, 0.19, 0.5, 12, 1, false, Math.PI * 0.48, Math.PI * 1.04));
  jacketBackGeo.scale(1.16, 1, 0.76);
  const jacketBack = new THREE.Mesh(jacketBackGeo, jacketMat);
  jacketBack.position.y = 0.27;
  jacketBack.castShadow = true;
  jacketBack.receiveShadow = true;
  torso.add(jacketBack);

  const jacketPanelGeo = trackGeo(new THREE.CapsuleGeometry(0.095, 0.34, 4, 8));
  jacketPanelGeo.scale(1.18, 1, 0.65);
  const jacketLeft = new THREE.Mesh(jacketPanelGeo, jacketMat);
  jacketLeft.position.set(-0.135, 0.27, 0.065);
  jacketLeft.rotation.z = -0.06;
  jacketLeft.castShadow = true;
  torso.add(jacketLeft);

  const jacketRight = new THREE.Mesh(jacketPanelGeo, jacketMat);
  jacketRight.position.set(0.135, 0.27, 0.065);
  jacketRight.rotation.z = 0.06;
  jacketRight.castShadow = true;
  torso.add(jacketRight);

  // Jacket Collar & Lapels
  const collarGeo = trackGeo(new THREE.TorusGeometry(0.105, 0.028, 6, 12, Math.PI * 1.35));
  const collar = new THREE.Mesh(collarGeo, jacketMat);
  collar.position.set(0, 0.51, -0.01);
  collar.rotation.x = Math.PI / 2 + 0.18;
  collar.rotation.z = -Math.PI * 0.675;
  torso.add(collar);

  // Shoulder Trapezius Bridge + Deltoid Caps
  const trapGeo = trackGeo(new THREE.CapsuleGeometry(0.085, 0.36, 4, 10));
  trapGeo.rotateZ(Math.PI / 2);
  trapGeo.scale(1, 0.72, 0.9);
  const trapMesh = new THREE.Mesh(trapGeo, jacketMat);
  trapMesh.position.set(0, 0.47, -0.01);
  trapMesh.castShadow = true;
  torso.add(trapMesh);

  // Chest Utility Pockets + Brass Snap Buttons along Jacket Placket
  const pocketGeo = trackGeo(new THREE.BoxGeometry(0.095, 0.105, 0.028));
  [-0.145, 0.145].forEach((px) => {
    const pocket = new THREE.Mesh(pocketGeo, jacketMat);
    pocket.position.set(px, 0.34, 0.138);
    pocket.rotation.y = px < 0 ? -0.18 : 0.18;
    torso.add(pocket);

    const flap = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.098, 0.024, 0.032)), jacketMat);
    flap.position.set(px, 0.382, 0.142);
    flap.rotation.y = px < 0 ? -0.18 : 0.18;
    torso.add(flap);

    for (let b = 0; b < 3; b++) {
      const snap = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.008, 0.008, 0.012, 8)), brassMat);
      snap.rotation.x = Math.PI / 2;
      snap.position.set(px < 0 ? -0.072 : 0.072, 0.14 + b * 0.13, 0.136);
      torso.add(snap);
    }
  });

  // Survival Backpack (contoured silhouette + shoulder straps + rolled tarp + coiled rope + canteen)
  const packGroup = new THREE.Group();
  packGroup.position.set(0, 0.28, -0.195);
  torso.add(packGroup);

  const packBodyGeo = trackGeo(new THREE.CapsuleGeometry(0.135, 0.22, 5, 10));
  packBodyGeo.scale(1.18, 1, 0.68);
  const packBody = new THREE.Mesh(packBodyGeo, packMat);
  packBody.castShadow = true;
  packGroup.add(packBody);

  const packTopFlap = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.3, 0.08, 0.16)),
    packMat,
  );
  packTopFlap.position.set(0, 0.16, 0.01);
  packTopFlap.rotation.x = 0.12;
  packGroup.add(packTopFlap);

  const packFrontPocket = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.21, 0.16, 0.055)),
    packMat,
  );
  packFrontPocket.position.set(0, -0.04, -0.098);
  packFrontPocket.castShadow = true;
  packGroup.add(packFrontPocket);

  const bedroll = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.058, 0.058, 0.34, 10)),
    tarpMat,
  );
  bedroll.rotation.z = Math.PI / 2;
  bedroll.position.set(0, 0.24, -0.02);
  bedroll.castShadow = true;
  packGroup.add(bedroll);

  // Coiled Climbing Rope strapped on left side of pack
  const ropeCoil = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.068, 0.018, 7, 14)),
    handleWoodMat,
  );
  ropeCoil.rotation.y = Math.PI / 2;
  ropeCoil.position.set(-0.168, 0.02, -0.01);
  ropeCoil.castShadow = true;
  packGroup.add(ropeCoil);

  // Backpack straps wrapping over shoulders onto front torso
  const strapGeo = trackGeo(new THREE.BoxGeometry(0.048, 0.44, 0.24));
  [-0.125, 0.125].forEach((sx) => {
    const strap = new THREE.Mesh(strapGeo, leatherMat);
    strap.position.set(sx, 0.04, 0.15);
    strap.rotation.x = 0.08;
    packGroup.add(strap);
  });

  const canteen = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.042, 0.042, 0.14, 10)),
    brassMat,
  );
  canteen.position.set(0.18, -0.05, -0.01);
  canteen.castShadow = true;
  packGroup.add(canteen);

  // Anatomical Head + Natural Hair + Beard + Facial Features
  const head = new THREE.Group();
  head.position.set(0, 0.54, 0.01);
  torso.add(head);

  const neck = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.062, 0.076, 0.11, 10)),
    skinMat,
  );
  neck.position.y = 0.04;
  neck.castShadow = true;
  head.add(neck);

  // Cranium (organic ellipsoid)
  const craniumGeo = trackGeo(new THREE.SphereGeometry(0.118, 16, 14));
  craniumGeo.scale(0.88, 1.06, 0.98);
  const cranium = new THREE.Mesh(craniumGeo, skinMat);
  cranium.position.set(0, 0.205, -0.005);
  cranium.castShadow = true;
  head.add(cranium);

  // Jaw & Chin taper
  const jawGeo = trackGeo(new THREE.CylinderGeometry(0.095, 0.062, 0.105, 10));
  jawGeo.scale(0.88, 1, 0.95);
  const jaw = new THREE.Mesh(jawGeo, skinMat);
  jaw.position.set(0, 0.135, 0.016);
  jaw.castShadow = true;
  head.add(jaw);

  // Cheekbone & Brow ridge
  const browRidge = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.145, 0.022, 0.04)),
    skinMat,
  );
  browRidge.position.set(0, 0.23, 0.096);
  head.add(browRidge);

  // Sculpted Nose
  const nose = new THREE.Mesh(
    trackGeo(new THREE.ConeGeometry(0.022, 0.056, 6)),
    skinMat,
  );
  nose.rotation.x = Math.PI * 0.36;
  nose.position.set(0, 0.19, 0.114);
  head.add(nose);

  // Ears
  const earGeo = trackGeo(new THREE.SphereGeometry(0.024, 7, 6));
  earGeo.scale(0.45, 1.15, 0.72);
  [-0.104, 0.104].forEach((ex) => {
    const ear = new THREE.Mesh(earGeo, skinMat);
    ear.position.set(ex, 0.195, -0.01);
    head.add(ear);
  });

  // Recessed Natural Eyes + Brows
  const eyeSocketGeo = trackGeo(new THREE.SphereGeometry(0.017, 8, 6));
  eyeSocketGeo.scale(1.1, 0.78, 0.55);
  const irisGeo = trackGeo(new THREE.SphereGeometry(0.01, 7, 6));
  const pupilGeo = trackGeo(new THREE.SphereGeometry(0.006, 6, 5));
  const browGeo = trackGeo(new THREE.BoxGeometry(0.042, 0.012, 0.016));

  [-0.036, 0.036].forEach((ex) => {
    const eye = new THREE.Mesh(eyeSocketGeo, eyeWhiteMat);
    eye.position.set(ex, 0.21, 0.096);
    head.add(eye);

    const iris = new THREE.Mesh(irisGeo, irisMat);
    iris.position.set(ex, 0.21, 0.102);
    head.add(iris);

    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.set(ex, 0.21, 0.107);
    head.add(pupil);

    const brow = new THREE.Mesh(browGeo, hairMat);
    brow.position.set(ex, 0.235, 0.104);
    brow.rotation.z = ex < 0 ? 0.08 : -0.08;
    head.add(brow);
  });

  // Rugged Short Tousled Hair (layered organic cap + back nape + temple sides + forehead tuft)
  const hairCapGeo = trackGeo(new THREE.SphereGeometry(0.124, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.56));
  hairCapGeo.scale(0.91, 1.05, 1.02);
  const hairCap = new THREE.Mesh(hairCapGeo, hairMat);
  hairCap.position.set(0, 0.218, -0.01);
  hairCap.rotation.x = -0.18;
  hairCap.castShadow = true;
  head.add(hairCap);

  const hairNape = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.102, 0.088, 0.09, 10, 1, false, Math.PI * 0.55, Math.PI * 0.9)),
    hairMat,
  );
  hairNape.position.set(0, 0.165, -0.025);
  head.add(hairNape);

  for (let h = -2; h <= 2; h++) {
    const tuft = new THREE.Mesh(
      trackGeo(new THREE.ConeGeometry(0.026, 0.055, 5)),
      hairMat,
    );
    tuft.position.set(h * 0.026, 0.285 - Math.abs(h) * 0.008, 0.075);
    tuft.rotation.x = 1.15;
    tuft.rotation.z = -h * 0.18;
    head.add(tuft);
  }

  // Rugged Trimmed Beard & Mustache (TLOU weathered survivor look)
  const beardJawGeo = trackGeo(new THREE.CylinderGeometry(0.098, 0.064, 0.082, 10, 1, false, -Math.PI * 0.42, Math.PI * 0.84));
  beardJawGeo.scale(0.9, 1, 0.98);
  const beardJaw = new THREE.Mesh(beardJawGeo, beardMat);
  beardJaw.position.set(0, 0.128, 0.022);
  head.add(beardJaw);

  const chinBeard = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.056, 8, 7)),
    beardMat,
  );
  chinBeard.scale.set(0.95, 0.72, 0.95);
  chinBeard.position.set(0, 0.104, 0.044);
  head.add(chinBeard);

  const mustache = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.062, 0.016, 0.024)),
    beardMat,
  );
  mustache.position.set(0, 0.156, 0.098);
  head.add(mustache);

  // Articulated Anatomical Arms (Deltoid cap + Jacket Upper Sleeve + Muscular Forearm + Hand)
  const buildArm = (side: -1 | 1) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.265, 0.455, 0);
    torso.add(shoulder);

    const deltoid = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.068, 10, 8)),
      jacketMat,
    );
    deltoid.scale.set(1.0, 1.15, 1.0);
    deltoid.castShadow = true;
    shoulder.add(deltoid);

    const upperSleeve = new THREE.Mesh(
      trackGeo(new THREE.CapsuleGeometry(0.055, 0.15, 4, 10)),
      jacketMat,
    );
    upperSleeve.position.y = -0.115;
    upperSleeve.castShadow = true;
    shoulder.add(upperSleeve);

    const rolledCuff = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(0.054, 0.015, 6, 10)),
      jacketMat,
    );
    rolledCuff.rotation.x = Math.PI / 2;
    rolledCuff.position.y = -0.19;
    shoulder.add(rolledCuff);

    const forearmPivot = new THREE.Group();
    forearmPivot.position.y = -0.22;
    shoulder.add(forearmPivot);

    const forearm = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.048, 0.036, 0.23, 10)),
      skinMat,
    );
    forearm.position.y = -0.115;
    forearm.castShadow = true;
    forearmPivot.add(forearm);

    const hand = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.042, 8, 7)),
      skinMat,
    );
    hand.scale.set(0.85, 1.25, 0.65);
    hand.position.y = -0.245;
    hand.castShadow = true;
    forearmPivot.add(hand);

    const thumb = new THREE.Mesh(
      trackGeo(new THREE.CapsuleGeometry(0.012, 0.03, 3, 6)),
      skinMat,
    );
    thumb.position.set(-side * 0.028, -0.232, 0.02);
    thumb.rotation.z = side * 0.5;
    forearmPivot.add(thumb);

    if (side === -1) {
      const watchStrap = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.042, 0.042, 0.025, 10)),
        leatherMat,
      );
      watchStrap.position.y = -0.195;
      forearmPivot.add(watchStrap);

      const watchFace = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.02, 0.02, 0.01, 10)),
        brassMat,
      );
      watchFace.rotation.x = Math.PI / 2;
      watchFace.position.set(0, -0.195, 0.042);
      forearmPivot.add(watchFace);
    }

    return { shoulder, forearmPivot };
  };

  const leftArmRig = buildArm(-1);
  const rightArmRig = buildArm(1);

  // Handheld Explorer Flashlight & Craftable Torch on LEFT hand
  const handItemMount = new THREE.Group();
  handItemMount.position.set(0, -0.255, 0.05);
  leftArmRig.forearmPivot.add(handItemMount);

  // Flashlight (Lanterna)
  const flashlightGroup = new THREE.Group();
  const flashBodyMat = makeSurvivorMat({
    color: 0x26322b,
    potatoColor: 0x2f3b34,
    roughness: 0.38,
    metalness: 0.65,
  });
  const flashLensMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xfff8dc,
      emissive: 0xffe49e,
      emissiveIntensity: 1.4,
      roughness: 0.15,
      metalness: 0.1,
    }),
  );
  const flashBarrel = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.028, 0.024, 0.19, 10)),
    flashBodyMat,
  );
  flashBarrel.rotation.x = Math.PI / 2;
  flashBarrel.castShadow = false;
  flashBarrel.receiveShadow = false;
  flashlightGroup.add(flashBarrel);

  const flashHead = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.044, 0.03, 0.055, 10)),
    brassMat,
  );
  flashHead.rotation.x = Math.PI / 2;
  flashHead.position.z = 0.105;
  flashHead.castShadow = false;
  flashHead.receiveShadow = false;
  flashlightGroup.add(flashHead);

  const flashLens = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(0.038, 10)), flashLensMat);
  flashLens.position.z = 0.134;
  flashLens.castShadow = false;
  flashLens.receiveShadow = false;
  flashlightGroup.add(flashLens);

  // Procedural soft axial gradient texture for seamless volumetric flashlight shaft
  const beamCanvas = document.createElement('canvas');
  beamCanvas.width = 32;
  beamCanvas.height = 128;
  const beamCtx = beamCanvas.getContext('2d');
  if (beamCtx) {
    const grad = beamCtx.createLinearGradient(0, 0, 0, 128);
    // Top of canvas (v=1, apex at lens) -> bottom (v=0, far end fades smoothly to zero)
    grad.addColorStop(0.0, 'rgba(255, 248, 222, 0.95)');
    grad.addColorStop(0.12, 'rgba(255, 244, 206, 0.72)');
    grad.addColorStop(0.38, 'rgba(255, 238, 188, 0.32)');
    grad.addColorStop(0.72, 'rgba(255, 234, 175, 0.08)');
    grad.addColorStop(1.0, 'rgba(255, 230, 165, 0.0)');
    beamCtx.fillStyle = grad;
    beamCtx.fillRect(0, 0, 32, 128);
  }
  const beamTex = trackTex(new THREE.CanvasTexture(beamCanvas));
  beamTex.colorSpace = THREE.SRGBColorSpace;
  beamTex.wrapS = THREE.RepeatWrapping;
  beamTex.wrapT = THREE.ClampToEdgeWrapping;

  const beamConeMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: 0xfff5d1,
      map: beamTex,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    }),
  );
  const beamConeGeo = trackGeo(new THREE.ConeGeometry(2.35, 13.5, 16, 1, true));
  beamConeGeo.translate(0, -6.75, 0);
  beamConeGeo.rotateX(-Math.PI / 2);
  const beamCone = new THREE.Mesh(beamConeGeo, beamConeMat);
  beamCone.position.z = 0.14;
  beamCone.castShadow = false;
  beamCone.receiveShadow = false;
  flashlightGroup.add(beamCone);

  const beamCoreMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: 0xfffbe6,
      map: beamTex,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    }),
  );
  const beamCoreGeo = trackGeo(new THREE.ConeGeometry(0.95, 9.5, 14, 1, true));
  beamCoreGeo.translate(0, -4.75, 0);
  beamCoreGeo.rotateX(-Math.PI / 2);
  const beamCoreCone = new THREE.Mesh(beamCoreGeo, beamCoreMat);
  beamCoreCone.position.z = 0.14;
  beamCoreCone.castShadow = false;
  beamCoreCone.receiveShadow = false;
  flashlightGroup.add(beamCoreCone);

  handItemMount.add(flashlightGroup);

  // Torch (Tocha da Selva)
  const torchGroup = new THREE.Group();
  const torchWood = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.025, 0.019, 0.34, 8)),
    leatherMat,
  );
  torchWood.position.y = 0.06;
  torchGroup.add(torchWood);

  const flameMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: 0xff8c24,
      transparent: true,
      opacity: 0.92,
    }),
  );
  const torchFlame = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.065, 0.18, 7)), flameMat);
  torchFlame.position.y = 0.28;
  torchGroup.add(torchFlame);
  torchGroup.visible = false;
  handItemMount.add(torchGroup);

  // Handheld Weapons on RIGHT hand (Axe & Sword)
  const weaponMount = new THREE.Group();
  weaponMount.position.set(0, -0.25, 0.05);
  rightArmRig.forearmPivot.add(weaponMount);

  // Axe (Machado)
  const axeGroup = new THREE.Group();
  const axeHandle = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.021, 0.025, 0.56, 8)),
    handleWoodMat,
  );
  axeHandle.rotation.x = Math.PI / 2;
  axeHandle.position.z = 0.18;
  axeGroup.add(axeHandle);

  const axeBlade = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.036, 0.17, 0.14)), steelMat);
  axeBlade.position.set(0, 0.05, 0.4);
  axeGroup.add(axeBlade);

  const axeEdge = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.02, 0.2, 0.05)), steelMat);
  axeEdge.position.set(0, 0.055, 0.47);
  axeGroup.add(axeEdge);
  axeGroup.visible = false;
  weaponMount.add(axeGroup);

  // Sword / Machete (Espada da Selva)
  const swordGroup = new THREE.Group();
  const swordGrip = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.019, 0.021, 0.18, 8)),
    leatherMat,
  );
  swordGrip.rotation.x = Math.PI / 2;
  swordGrip.position.z = 0.03;
  swordGroup.add(swordGrip);

  const swordGuard = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.15, 0.032, 0.032)), brassMat);
  swordGuard.position.z = 0.12;
  swordGroup.add(swordGuard);

  const swordBlade = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.022, 0.062, 0.62)), steelMat);
  swordBlade.position.z = 0.44;
  swordGroup.add(swordBlade);

  const swordTip = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.032, 0.14, 4)), steelMat);
  swordTip.rotation.x = Math.PI / 2;
  swordTip.position.z = 0.81;
  swordGroup.add(swordTip);
  swordGroup.visible = false;
  weaponMount.add(swordGroup);

  // 1st-Person Viewmodel Rig (Right forearm + bare hand / axe / sword)
  const fpRig = new THREE.Group();
  fpRig.position.set(0, 1.62, 0);
  fpRig.visible = false;
  root.add(fpRig);

  const fpPitchPivot = new THREE.Group();
  fpRig.add(fpPitchPivot);

  const fpArmMount = new THREE.Group();
  fpArmMount.position.set(-0.24, -0.22, 0.34);
  fpPitchPivot.add(fpArmMount);

  const fpSleeveCuff = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.056, 0.052, 0.16, 10)),
    jacketMat,
  );
  fpSleeveCuff.rotation.x = Math.PI / 2 - 0.18;
  fpSleeveCuff.position.set(0.02, -0.04, -0.14);
  fpArmMount.add(fpSleeveCuff);

  const fpForearm = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.045, 0.036, 0.24, 10)),
    skinMat,
  );
  fpForearm.rotation.x = Math.PI / 2 - 0.16;
  fpForearm.position.set(0, 0, 0.02);
  fpArmMount.add(fpForearm);

  const fpHand = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.044, 8, 7)),
    skinMat,
  );
  fpHand.scale.set(0.9, 0.8, 1.2);
  fpHand.position.set(0, 0.025, 0.155);
  fpArmMount.add(fpHand);

  const fpWeaponMount = new THREE.Group();
  fpWeaponMount.position.set(0, 0.035, 0.17);
  fpArmMount.add(fpWeaponMount);

  const fpAxeGroup = new THREE.Group();
  const fpAxeHandle = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.018, 0.022, 0.46, 8)),
    handleWoodMat,
  );
  fpAxeHandle.rotation.x = 0.32;
  fpAxeHandle.position.set(0, 0.14, 0.08);
  fpAxeGroup.add(fpAxeHandle);
  const fpAxeBlade = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.03, 0.15, 0.12)), steelMat);
  fpAxeBlade.position.set(0, 0.31, 0.17);
  fpAxeBlade.rotation.x = 0.32;
  fpAxeGroup.add(fpAxeBlade);
  const fpAxeEdge = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.018, 0.17, 0.045)), steelMat);
  fpAxeEdge.position.set(0, 0.32, 0.23);
  fpAxeEdge.rotation.x = 0.32;
  fpAxeGroup.add(fpAxeEdge);
  fpAxeGroup.visible = false;
  fpWeaponMount.add(fpAxeGroup);

  const fpSwordGroup = new THREE.Group();
  const fpSwordGrip = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.016, 0.019, 0.15, 8)),
    leatherMat,
  );
  fpSwordGrip.rotation.x = 0.45;
  fpSwordGrip.position.set(0, 0.02, 0.02);
  fpSwordGroup.add(fpSwordGrip);
  const fpSwordGuard = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.13, 0.026, 0.026)), brassMat);
  fpSwordGuard.rotation.x = 0.45;
  fpSwordGuard.position.set(0, 0.09, 0.055);
  fpSwordGroup.add(fpSwordGuard);
  const fpSwordBlade = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.018, 0.56, 0.054)), steelMat);
  fpSwordBlade.rotation.x = 0.45;
  fpSwordBlade.position.set(0, 0.34, 0.17);
  fpSwordGroup.add(fpSwordBlade);
  const fpSwordTip = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.027, 0.12, 4)), steelMat);
  fpSwordTip.rotation.x = 0.45;
  fpSwordTip.position.set(0, 0.63, 0.3);
  fpSwordGroup.add(fpSwordTip);
  fpSwordGroup.visible = false;
  fpWeaponMount.add(fpSwordGroup);

  // 1st-Person Left-Hand Flashlight Viewmodel + Volumetric Beam
  const fpFlashlightGroup = new THREE.Group();
  fpFlashlightGroup.position.set(0.24, -0.21, 0.25);
  fpFlashlightGroup.rotation.set(0.02, -0.024, 0);
  fpFlashlightGroup.visible = false;
  fpPitchPivot.add(fpFlashlightGroup);

  const fpFlashBarrel = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.024, 0.021, 0.16, 10)),
    flashBodyMat,
  );
  fpFlashBarrel.rotation.x = Math.PI / 2;
  fpFlashBarrel.castShadow = false;
  fpFlashBarrel.receiveShadow = false;
  fpFlashlightGroup.add(fpFlashBarrel);

  const fpFlashHead = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.038, 0.026, 0.048, 10)),
    brassMat,
  );
  fpFlashHead.rotation.x = Math.PI / 2;
  fpFlashHead.position.z = 0.095;
  fpFlashHead.castShadow = false;
  fpFlashHead.receiveShadow = false;
  fpFlashlightGroup.add(fpFlashHead);

  const fpFlashLens = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(0.032, 10)), flashLensMat);
  fpFlashLens.position.z = 0.12;
  fpFlashLens.castShadow = false;
  fpFlashLens.receiveShadow = false;
  fpFlashlightGroup.add(fpFlashLens);

  const fpBeamConeMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: 0xfff5d1,
      map: beamTex,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    }),
  );
  const fpBeamCone = new THREE.Mesh(beamConeGeo, fpBeamConeMat);
  fpBeamCone.position.z = 0.125;
  fpBeamCone.scale.set(0.82, 0.82, 0.95);
  fpBeamCone.castShadow = false;
  fpBeamCone.receiveShadow = false;
  fpFlashlightGroup.add(fpBeamCone);

  const fpBeamCoreMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: 0xfffbe6,
      map: beamTex,
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    }),
  );
  const fpBeamCoreCone = new THREE.Mesh(beamCoreGeo, fpBeamCoreMat);
  fpBeamCoreCone.position.z = 0.125;
  fpBeamCoreCone.scale.set(0.82, 0.82, 0.95);
  fpBeamCoreCone.castShadow = false;
  fpBeamCoreCone.receiveShadow = false;
  fpFlashlightGroup.add(fpBeamCoreCone);

  const setWeaponState = (weapon: EquippedWeapon) => {
    axeGroup.visible = weapon === 'axe';
    swordGroup.visible = weapon === 'sword';
    fpAxeGroup.visible = weapon === 'axe';
    fpSwordGroup.visible = weapon === 'sword';
  };

  // Real-time SpotLight + Local Glow (calibrated for Three.js physical light units)
  const spotLight = new THREE.SpotLight(0xfff2cc, 0, 52, Math.PI / 4.8, 0.56, 0.85);
  spotLight.position.set(-0.24, 1.32, 0.5);
  spotLight.target.position.set(-0.08, 0.18, 14.5);
  spotLight.castShadow = false;
  root.add(spotLight);
  root.add(spotLight.target);

  const nearGlow = new THREE.PointLight(0xffe8b0, 0, 12, 1.15);
  nearGlow.position.set(-0.22, 1.34, 0.62);
  nearGlow.castShadow = false;
  root.add(nearGlow);

  let firstPersonMode = false;
  let potatoMode = false;
  let lastPitchRad = 0.28;
  let currentLightEnabled = false;
  let currentLightMode: LightMode = 'flashlight';
  let isLowQualityMode = false;

  const setLightAimPitch = (pitchRad: number, isFirstPerson: boolean) => {
    lastPitchRad = pitchRad;
    if (isFirstPerson) {
      fpPitchPivot.rotation.x = pitchRad;
      spotLight.position.set(0.0, 1.58, 0.34);
      const cosP = Math.cos(pitchRad);
      const sinP = Math.sin(pitchRad);
      spotLight.target.position.set(0.0, 1.58 - sinP * 14.0, 0.34 + cosP * 14.0);
      nearGlow.position.set(0.0, 1.54, 0.54);
    } else {
      fpPitchPivot.rotation.x = 0;
      const aimPitch = THREE.MathUtils.clamp((pitchRad - 0.25) * 0.52 + 0.08, -0.28, 0.42);
      const cosP = Math.cos(aimPitch);
      const sinP = Math.sin(aimPitch);
      spotLight.position.set(-0.24, 1.32, 0.5);
      spotLight.target.position.set(-0.08, 1.32 - sinP * 14.0, 0.5 + cosP * 14.0);
      nearGlow.position.set(-0.22, 1.34, 0.62);
    }
    spotLight.target.updateMatrixWorld();
  };

  const setFirstPersonMode = (enabled: boolean) => {
    if (firstPersonMode === enabled) return;
    firstPersonMode = enabled;
    pelvis.visible = !enabled;
    fpRig.visible = enabled;
    contactShadow.visible = !enabled && !potatoMode;
    setLightAimPitch(lastPitchRad, enabled);
  };

  const setPotatoMode = (enabled: boolean) => {
    potatoMode = enabled;
    contactShadow.visible = !firstPersonMode && !enabled;
    for (let i = 0; i < presets.length; i++) {
      const p = presets[i];
      if (enabled) {
        p.mat.map = null;
        p.mat.color.setHex(p.potatoColor);
        p.mat.roughness = 0.94;
        p.mat.metalness = 0.0;
        p.mat.envMapIntensity = 0;
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

  const setLightState = (enabled: boolean, mode: LightMode, isLowQuality: boolean) => {
    currentLightEnabled = enabled;
    currentLightMode = mode;
    isLowQualityMode = isLowQuality;

    const showFlashlight = enabled && mode === 'flashlight';
    flashlightGroup.visible = showFlashlight;
    fpFlashlightGroup.visible = showFlashlight;
    torchGroup.visible = enabled && mode === 'torch';
    beamCone.visible = showFlashlight;
    beamCoreCone.visible = showFlashlight;
    fpBeamCone.visible = showFlashlight;
    fpBeamCoreCone.visible = showFlashlight;

    beamConeMat.opacity = isLowQuality ? 0.14 : 0.22;
    beamCoreMat.opacity = isLowQuality ? 0.11 : 0.18;
    fpBeamConeMat.opacity = isLowQuality ? 0.09 : 0.13;
    fpBeamCoreMat.opacity = isLowQuality ? 0.07 : 0.1;

    if (!enabled) {
      spotLight.intensity = 0;
      nearGlow.intensity = 0;
      flashLensMat.emissiveIntensity = 0;
      return;
    }

    if (mode === 'flashlight') {
      spotLight.color.setHex(0xfff2cc);
      spotLight.distance = 52;
      spotLight.decay = 0.85;
      spotLight.angle = Math.PI / 4.8;
      spotLight.penumbra = 0.56;
      spotLight.intensity = isLowQuality ? 42 : 56;
      nearGlow.color.setHex(0xffe8b0);
      nearGlow.distance = 12;
      nearGlow.decay = 1.15;
      nearGlow.intensity = isLowQuality ? 2.8 : 3.6;
      flashLensMat.emissiveIntensity = 2.4;
    } else {
      spotLight.color.setHex(0xff9a3c);
      spotLight.distance = 36;
      spotLight.decay = 0.95;
      spotLight.angle = Math.PI / 3.0;
      spotLight.penumbra = 0.7;
      spotLight.intensity = isLowQuality ? 24 : 34;
      nearGlow.color.setHex(0xff8c2a);
      nearGlow.distance = 14;
      nearGlow.decay = 1.15;
      nearGlow.intensity = 7.2;
    }
  };

  // Articulated Anatomical Legs + Laced Survival Boots + Articulated Ankles
  // Total leg chain: pelvis (0.91) + hipPivot (-0.04) + shinPivot (-0.41) + footPivot (-0.39) + sole (-0.07) = 0.00m flush!
  const buildLeg = (side: -1 | 1) => {
    const hipPivot = new THREE.Group();
    hipPivot.position.set(side * 0.118, -0.04, 0);
    pelvis.add(hipPivot);

    const thigh = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.088, 0.072, 0.41, 10)),
      pantsMat,
    );
    thigh.position.y = -0.205;
    thigh.castShadow = true;
    thigh.receiveShadow = true;
    hipPivot.add(thigh);

    // Cargo pocket on outer thigh
    const cargoPocket = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.032, 0.14, 0.105)),
      pantsMat,
    );
    cargoPocket.position.set(side * 0.078, -0.22, 0);
    hipPivot.add(cargoPocket);

    const shinPivot = new THREE.Group();
    shinPivot.position.y = -0.41;
    hipPivot.add(shinPivot);

    const knee = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.072, 9, 7)),
      pantsMat,
    );
    shinPivot.add(knee);

    // Reinforced Knee Pad Patch
    const kneePad = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.092, 0.088, 0.028)),
      leatherMat,
    );
    kneePad.position.set(0, -0.01, 0.062);
    kneePad.castShadow = true;
    shinPivot.add(kneePad);

    const calf = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.07, 0.056, 0.28, 10)),
      pantsMat,
    );
    calf.position.y = -0.14;
    calf.castShadow = true;
    shinPivot.add(calf);

    // Laced Leather Boot Shaft
    const bootCuff = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.064, 0.06, 0.13, 10)),
      bootMat,
    );
    bootCuff.position.y = -0.32;
    bootCuff.castShadow = true;
    shinPivot.add(bootCuff);

    const bootLacePatch = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.038, 0.1, 0.022)),
      leatherMat,
    );
    bootLacePatch.position.set(0, -0.32, 0.054);
    shinPivot.add(bootLacePatch);

    // Articulated Ankle Pivot at y = -0.39 inside shinPivot
    const footPivot = new THREE.Group();
    footPivot.position.y = -0.39;
    shinPivot.add(footPivot);

    // Contoured Boot Foot + Toe Box
    const bootFoot = new THREE.Mesh(
      trackGeo(new THREE.CapsuleGeometry(0.056, 0.115, 4, 8)),
      bootMat,
    );
    bootFoot.rotation.x = Math.PI / 2;
    bootFoot.scale.set(1.06, 1.0, 0.84);
    bootFoot.position.set(0, -0.008, 0.048);
    bootFoot.castShadow = true;
    footPivot.add(bootFoot);

    // Reinforced Heel Counter
    const bootHeel = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.115, 0.042, 0.078)),
      bootSoleMat,
    );
    bootHeel.position.set(0, -0.044, -0.028);
    footPivot.add(bootHeel);

    // Thick Treaded Rubber Boot Sole (bottom sits flush at y = -0.07 inside footPivot -> world y = 0.00)
    const bootSole = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.125, 0.034, 0.248)),
      bootSoleMat,
    );
    bootSole.position.set(0, -0.053, 0.046);
    bootSole.castShadow = true;
    footPivot.add(bootSole);

    return { hipPivot, shinPivot, footPivot };
  };

  const leftLegRig = buildLeg(-1);
  const rightLegRig = buildLeg(1);

  // Animation state
  let walkCycle = 0;
  let idleTime = 0;

  const updateAnimation = (
    dt: number,
    horizontalSpeed: number,
    maxSpeed: number,
    isGrounded: boolean,
    verticalVel: number,
    interactPulse: number,
    lightHeld: boolean,
    attackPulse: number,
    strafeNorm = 0,
    forwardNorm = 1,
    isSprinting = false,
    isSwimming = false,
  ) => {
    const speedNorm = Math.min(1.4, horizontalSpeed / Math.max(0.1, maxSpeed));
    const isMoving = speedNorm > 0.05;
    const sprintFactor = isSprinting && isMoving ? THREE.MathUtils.clamp((speedNorm - 0.52) / 0.55, 0, 1) : 0;
    const dirSign = forwardNorm < -0.15 ? -1 : 1;
    const clampedStrafe = THREE.MathUtils.clamp(strafeNorm, -1, 1);

    idleTime += dt;
    if (isSwimming) {
      walkCycle += dt * (isMoving ? 4.8 + speedNorm * 4.4 : 2.3);
    } else if (isMoving && isGrounded) {
      walkCycle += dt * (4.4 + speedNorm * 6.8) * dirSign;
    }

    // Subtle torch flame flicker when torch is active
    if (currentLightEnabled && currentLightMode === 'torch') {
      const flicker = 0.88 + Math.sin(idleTime * 19) * 0.1 + Math.cos(idleTime * 31) * 0.07;
      torchFlame.scale.set(1, flicker, 1);
      nearGlow.intensity = 7.2 * flicker;
      spotLight.intensity = (isLowQualityMode ? 24 : 34) * (0.9 + flicker * 0.1);
    }

    const strideAmp = isGrounded
      ? Math.min(0.92, speedNorm * (0.68 + sprintFactor * 0.18))
      : 0.28;
    const armAmp = isGrounded
      ? Math.min(1.06, speedNorm * (0.72 + sprintFactor * 0.28))
      : 0.48;

    const sinCycle = Math.sin(walkCycle);
    const cosCycle = Math.cos(walkCycle);

    // Legs: smooth hip swing + expressive knee lift during forward swing phase (or flutter kick when swimming)
    const targetLeftHip = isSwimming
      ? 0.22 + sinCycle * (isMoving ? 0.42 : 0.18)
      : isGrounded
        ? sinCycle * strideAmp
        : -0.35;
    const targetRightHip = isSwimming
      ? 0.22 - sinCycle * (isMoving ? 0.42 : 0.18)
      : isGrounded
        ? -sinCycle * strideAmp
        : 0.25;

    const leftKneeLift = Math.max(0, -cosCycle) * strideAmp * (0.95 + sprintFactor * 0.25);
    const rightKneeLift = Math.max(0, cosCycle) * strideAmp * (0.95 + sprintFactor * 0.25);
    const targetLeftKnee = isSwimming
      ? 0.34 + Math.max(0, -sinCycle) * 0.36
      : isGrounded
        ? leftKneeLift
        : 0.58;
    const targetRightKnee = isSwimming
      ? 0.34 + Math.max(0, sinCycle) * 0.36
      : isGrounded
        ? rightKneeLift
        : 0.36;

    const legDamp = isMoving || isSwimming ? 16 : 11;
    leftLegRig.hipPivot.rotation.x = THREE.MathUtils.damp(
      leftLegRig.hipPivot.rotation.x,
      targetLeftHip,
      legDamp,
      dt,
    );
    rightLegRig.hipPivot.rotation.x = THREE.MathUtils.damp(
      rightLegRig.hipPivot.rotation.x,
      targetRightHip,
      legDamp,
      dt,
    );
    leftLegRig.hipPivot.rotation.z = THREE.MathUtils.damp(
      leftLegRig.hipPivot.rotation.z,
      isMoving ? -clampedStrafe * 0.07 : 0,
      10,
      dt,
    );
    rightLegRig.hipPivot.rotation.z = THREE.MathUtils.damp(
      rightLegRig.hipPivot.rotation.z,
      isMoving ? -clampedStrafe * 0.07 : 0,
      10,
      dt,
    );
    leftLegRig.shinPivot.rotation.x = THREE.MathUtils.damp(
      leftLegRig.shinPivot.rotation.x,
      targetLeftKnee,
      18,
      dt,
    );
    rightLegRig.shinPivot.rotation.x = THREE.MathUtils.damp(
      rightLegRig.shinPivot.rotation.x,
      targetRightKnee,
      18,
      dt,
    );

    // Natural heel-strike -> push-off ankle flexion (and pointed toes while swimming)
    const targetLeftFootX = isSwimming
      ? 0.42 + sinCycle * 0.22
      : isMoving && isGrounded
        ? -sinCycle * 0.26 * speedNorm + cosCycle * 0.14 * speedNorm
        : isGrounded
          ? 0
          : 0.28;
    const targetRightFootX = isSwimming
      ? 0.42 - sinCycle * 0.22
      : isMoving && isGrounded
        ? sinCycle * 0.26 * speedNorm - cosCycle * 0.14 * speedNorm
        : isGrounded
          ? 0
          : 0.22;
    leftLegRig.footPivot.rotation.x = THREE.MathUtils.damp(
      leftLegRig.footPivot.rotation.x,
      targetLeftFootX,
      18,
      dt,
    );
    rightLegRig.footPivot.rotation.x = THREE.MathUtils.damp(
      rightLegRig.footPivot.rotation.x,
      targetRightFootX,
      18,
      dt,
    );

    // Arms: Natural opposite-arm pendulum with elbow flexion & expressive strike arc (or breaststroke/freestyle swim)
    const idleArmBreath = Math.sin(idleTime * 2.1) * 0.036;
    const idleArmSway = Math.cos(idleTime * 1.35) * 0.025;

    let targetLeftShoulderX = isSwimming
      ? -1.18 + sinCycle * (isMoving ? 0.72 : 0.24)
      : lightHeld
        ? -0.66 + (isMoving ? sinCycle * (0.14 + sprintFactor * 0.08) : idleArmSway)
        : isGrounded
          ? -sinCycle * armAmp + idleArmSway
          : -0.58 - Math.min(0.32, verticalVel * 0.05);
    let targetLeftShoulderZ = isSwimming
      ? -0.45 - Math.max(0, cosCycle) * 0.42
      : lightHeld
        ? -0.06
        : -0.08 - idleArmBreath - sprintFactor * 0.08;
    let targetLeftForearmX = isSwimming
      ? -0.48 - Math.max(0, sinCycle) * 0.45
      : lightHeld
        ? -0.82 + (isMoving ? Math.sin(walkCycle * 2) * 0.04 : 0)
        : isMoving
          ? -0.34 - speedNorm * 0.36 - Math.max(0, -sinCycle) * (0.28 + sprintFactor * 0.24)
          : -0.22;

    let targetRightShoulderX = isSwimming
      ? -1.18 - sinCycle * (isMoving ? 0.72 : 0.24)
      : isGrounded
        ? sinCycle * armAmp - idleArmSway
        : -0.45 - Math.min(0.32, verticalVel * 0.05);
    let targetRightShoulderY = 0;
    let targetRightRoll = isSwimming
      ? 0.45 + Math.max(0, -cosCycle) * 0.42
      : 0.08 + idleArmBreath + sprintFactor * 0.08;
    let targetRightForearmX = isSwimming
      ? -0.48 - Math.max(0, -sinCycle) * 0.45
      : isMoving
        ? -0.34 - speedNorm * 0.36 - Math.max(0, sinCycle) * (0.28 + sprintFactor * 0.24)
        : -0.22;
    let targetWeaponRotX = 0.72;
    let targetWeaponRotZ = 0;

    let targetTorsoYaw = isSwimming
      ? sinCycle * (isMoving ? 0.16 : 0.06)
      : isMoving && isGrounded
        ? sinCycle * (0.09 + sprintFactor * 0.05) * speedNorm
        : 0;

    if (attackPulse > 0) {
      // 3-phase strike: crisp wind-up (0..0.22) -> rapid diagonal slash (0.22..0.58) -> recoil recovery (0.58..1)
      const p = 1 - attackPulse;
      if (p < 0.22) {
        const w = Math.sin((p / 0.22) * (Math.PI * 0.5));
        targetRightShoulderX = -0.65 * w - 0.35;
        targetRightShoulderY = -0.38 * w;
        targetRightRoll = 0.55 * w + 0.14;
        targetRightForearmX = -1.05 * w - 0.3;
        targetWeaponRotX = 0.45;
        targetWeaponRotZ = -0.28 * w;
        targetTorsoYaw = -0.32 * w;
        if (!lightHeld) {
          targetLeftShoulderX = 0.34 * w;
          targetLeftForearmX = -0.58;
        }
      } else if (p < 0.62) {
        const s = Math.sin(((p - 0.22) / 0.4) * Math.PI);
        const prog = (p - 0.22) / 0.4;
        targetRightShoulderX = THREE.MathUtils.lerp(-1.55, 0.38, prog) - s * 0.42;
        targetRightShoulderY = THREE.MathUtils.lerp(-0.35, 0.48, prog);
        targetRightRoll = 0.72 * s + 0.12;
        targetRightForearmX = THREE.MathUtils.lerp(-1.15, -0.32, prog);
        targetWeaponRotX = 1.48 * s + 0.52;
        targetWeaponRotZ = 0.46 * s;
        targetTorsoYaw = THREE.MathUtils.lerp(-0.28, 0.46, prog);
        if (!lightHeld) {
          targetLeftShoulderX = 0.42 * s;
          targetLeftShoulderZ = -0.24 * s - 0.08;
          targetLeftForearmX = -0.68;
        }
      } else {
        const r = 1 - (p - 0.62) / 0.38;
        targetRightShoulderX = 0.3 * r;
        targetRightShoulderY = 0.35 * r;
        targetRightRoll = 0.18 * r + 0.08;
        targetRightForearmX = -0.32 - 0.15 * r;
        targetWeaponRotX = 0.72 + 0.35 * r;
        targetWeaponRotZ = 0.18 * r;
        targetTorsoYaw = 0.35 * r;
      }
    } else if (interactPulse > 0) {
      const reach = Math.sin(interactPulse * Math.PI);
      targetRightShoulderX = -1.28 * reach;
      targetRightForearmX = -0.35;
      targetTorsoYaw = 0.18 * reach;
    }

    // 1st-person viewmodel arm + weapon animation (expressive bob, strafe tilt, swim stroke & diagonal slash)
    if (firstPersonMode) {
      const fpWalkBobX = isSwimming
        ? cosCycle * 0.032
        : isMoving && isGrounded
          ? cosCycle * (0.015 + sprintFactor * 0.008) * speedNorm
          : 0;
      const fpWalkBobY = isSwimming
        ? Math.sin(walkCycle * 1.5) * 0.024
        : isMoving && isGrounded
          ? Math.abs(sinCycle) * (0.019 + sprintFactor * 0.012) * speedNorm
          : 0;
      const fpBreathY = Math.sin(idleTime * 2.2) * 0.005;

      let targetFpX = -0.24 + fpWalkBobX - clampedStrafe * 0.018;
      let targetFpY = -0.22 - fpWalkBobY + fpBreathY - sprintFactor * 0.018 - (isSwimming ? 0.03 : 0);
      let targetFpZ = 0.34 + sprintFactor * 0.025 + (isSwimming ? sinCycle * 0.045 : 0);
      let targetFpRotX = isSwimming ? 0.18 + sinCycle * 0.16 : isMoving ? sinCycle * 0.045 * speedNorm : 0;
      let targetFpRotY = sprintFactor * 0.12;
      let targetFpRotZ = 0.08 - clampedStrafe * 0.07;

      if (attackPulse > 0) {
        const p = 1 - attackPulse;
        if (p < 0.22) {
          const w = Math.sin((p / 0.22) * (Math.PI * 0.5));
          targetFpX = -0.24 - 0.05 * w;
          targetFpY = -0.22 + 0.1 * w;
          targetFpZ = 0.34 - 0.05 * w;
          targetFpRotX = -0.45 * w;
          targetFpRotY = -0.22 * w;
          targetFpRotZ = 0.08 - 0.28 * w;
        } else {
          const swing = Math.sin(((p - 0.22) / 0.78) * Math.PI);
          targetFpX = -0.24 + swing * 0.21;
          targetFpY = -0.22 - swing * 0.11;
          targetFpZ = 0.34 + swing * 0.26;
          targetFpRotX = 1.04 * swing;
          targetFpRotY = 0.68 * swing;
          targetFpRotZ = 0.08 + 0.72 * swing;
        }
      } else if (interactPulse > 0) {
        const reach = Math.sin(interactPulse * Math.PI);
        targetFpZ = 0.34 + reach * 0.17;
        targetFpRotX = 0.32 * reach;
      }

      fpArmMount.position.x = THREE.MathUtils.damp(fpArmMount.position.x, targetFpX, 22, dt);
      fpArmMount.position.y = THREE.MathUtils.damp(fpArmMount.position.y, targetFpY, 22, dt);
      fpArmMount.position.z = THREE.MathUtils.damp(fpArmMount.position.z, targetFpZ, 22, dt);
      fpArmMount.rotation.x = THREE.MathUtils.damp(fpArmMount.rotation.x, targetFpRotX, 24, dt);
      fpArmMount.rotation.y = THREE.MathUtils.damp(fpArmMount.rotation.y, targetFpRotY, 24, dt);
      fpArmMount.rotation.z = THREE.MathUtils.damp(fpArmMount.rotation.z, targetFpRotZ, 24, dt);

      if (currentLightEnabled && currentLightMode === 'flashlight') {
        fpFlashlightGroup.position.x = THREE.MathUtils.damp(
          fpFlashlightGroup.position.x,
          0.24 - fpWalkBobX * 0.65,
          18,
          dt,
        );
        fpFlashlightGroup.position.y = THREE.MathUtils.damp(
          fpFlashlightGroup.position.y,
          -0.21 - fpWalkBobY * 0.65 + fpBreathY * 0.8,
          18,
          dt,
        );
      }
    }

    leftArmRig.shoulder.rotation.x = THREE.MathUtils.damp(
      leftArmRig.shoulder.rotation.x,
      targetLeftShoulderX,
      15,
      dt,
    );
    leftArmRig.shoulder.rotation.z = THREE.MathUtils.damp(
      leftArmRig.shoulder.rotation.z,
      targetLeftShoulderZ,
      11,
      dt,
    );
    rightArmRig.shoulder.rotation.x = THREE.MathUtils.damp(
      rightArmRig.shoulder.rotation.x,
      targetRightShoulderX,
      24,
      dt,
    );
    rightArmRig.shoulder.rotation.y = THREE.MathUtils.damp(
      rightArmRig.shoulder.rotation.y,
      targetRightShoulderY,
      22,
      dt,
    );
    rightArmRig.shoulder.rotation.z = THREE.MathUtils.damp(
      rightArmRig.shoulder.rotation.z,
      targetRightRoll,
      18,
      dt,
    );

    leftArmRig.forearmPivot.rotation.x = THREE.MathUtils.damp(
      leftArmRig.forearmPivot.rotation.x,
      targetLeftForearmX,
      14,
      dt,
    );
    rightArmRig.forearmPivot.rotation.x = THREE.MathUtils.damp(
      rightArmRig.forearmPivot.rotation.x,
      targetRightForearmX,
      22,
      dt,
    );
    handItemMount.rotation.x = THREE.MathUtils.damp(
      handItemMount.rotation.x,
      lightHeld && currentLightMode === 'flashlight' ? 1.48 : 0,
      14,
      dt,
    );
    weaponMount.rotation.x = THREE.MathUtils.damp(
      weaponMount.rotation.x,
      targetWeaponRotX,
      22,
      dt,
    );
    weaponMount.rotation.z = THREE.MathUtils.damp(
      weaponMount.rotation.z,
      targetWeaponRotZ,
      22,
      dt,
    );

    // Pelvis vertical bob + hip sway + torso lean (forward on sprint/swim, lateral on strafe)
    const bob = isSwimming
      ? Math.sin(walkCycle * 1.4) * 0.045
      : isMoving && isGrounded
        ? Math.abs(sinCycle) * (0.052 + sprintFactor * 0.022) * speedNorm
        : 0;
    const breathBob = Math.sin(idleTime * 2.2) * 0.01;
    pelvis.position.y = THREE.MathUtils.damp(
      pelvis.position.y,
      (isSwimming ? 0.84 : 0.91) + bob + breathBob,
      18,
      dt,
    );
    pelvis.rotation.z = THREE.MathUtils.damp(
      pelvis.rotation.z,
      isMoving && isGrounded ? cosCycle * 0.032 * speedNorm - clampedStrafe * 0.045 : 0,
      12,
      dt,
    );

    const targetLeanX = isSwimming
      ? (isMoving ? 0.52 : 0.24)
      : isGrounded
        ? speedNorm * (0.11 + sprintFactor * 0.13) * dirSign
        : THREE.MathUtils.clamp(-verticalVel * 0.03, -0.2, 0.2);
    const targetLeanZ = isMoving && isGrounded ? -clampedStrafe * 0.09 : 0;
    torso.rotation.x = THREE.MathUtils.damp(torso.rotation.x, targetLeanX, 11, dt);
    torso.rotation.z = THREE.MathUtils.damp(torso.rotation.z, targetLeanZ, 11, dt);
    torso.rotation.y = THREE.MathUtils.damp(torso.rotation.y, targetTorsoYaw, 18, dt);

    head.rotation.x = THREE.MathUtils.damp(head.rotation.x, -targetLeanX * 0.72, 11, dt);
    head.rotation.z = THREE.MathUtils.damp(head.rotation.z, -targetLeanZ * 0.65, 11, dt);
    head.rotation.y = THREE.MathUtils.damp(
      head.rotation.y,
      isMoving ? -targetTorsoYaw * 0.45 : Math.sin(idleTime * 0.9) * 0.08,
      7,
      dt,
    );
  };

  return {
    root,
    pelvis,
    torso,
    head,
    leftArm: leftArmRig.shoulder,
    rightArm: rightArmRig.shoulder,
    leftForearm: leftArmRig.forearmPivot,
    rightForearm: rightArmRig.forearmPivot,
    leftLeg: leftLegRig.hipPivot,
    rightLeg: rightLegRig.hipPivot,
    leftShin: leftLegRig.shinPivot,
    rightShin: rightLegRig.shinPivot,
    contactShadow,
    setLightState,
    setWeaponState,
    setFirstPersonMode,
    setLightAimPitch,
    setPotatoMode,
    updateAnimation,
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      texturesToDispose.forEach((t) => t.dispose());
    },
  };
}

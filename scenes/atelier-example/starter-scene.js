import * as THREE from 'three';
import {createLeafLoop} from './loop-animation.js';

// Compatibility baseline: three@0.171.0. The host owns rendering and animation.
export const sceneMeta = {
  id: 'atelier-example', name: '程序化光影藝廊',
  eye: [5, 3.2, 9], target: [0, 1.4, -2], fov: 50,
  bounds: {min: [-8, 0, -10], max: [8, 6, 6]},
  actorArea: {center: [0, 0, 0], width: 2, depth: 2},
};

function seeded(seed) {
  let state = Number(seed) >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

// textures may contain stoneColor, stoneNormal, stoneRoughness.
// They belong to the caller; this factory owns only the clones it makes.
export function createScene({seed = 42, textures = {}, loopSeconds = 8} = {}) {
  if (!Number.isFinite(loopSeconds) || loopSeconds <= 0) throw new RangeError('loopSeconds must be positive');
  const root = new THREE.Group();
  root.name = sceneMeta.id;
  root.userData.seed = seed;
  const random = seeded(seed), ownedTextures = new Set();
  let disposed = false;

  function cloneMap(source, colorSpace, repeats) {
    if (!source) return null;
    const map = source.clone();
    map.colorSpace = colorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(...repeats);
    ownedTextures.add(map);
    return map;
  }
  const stone = new THREE.MeshStandardMaterial({
    color: 0x969a93, roughness: .8, metalness: .02,
    map: cloneMap(textures.stoneColor, THREE.SRGBColorSpace, [5, 5]),
    normalMap: cloneMap(textures.stoneNormal, THREE.NoColorSpace, [5, 5]),
    roughnessMap: cloneMap(textures.stoneRoughness, THREE.NoColorSpace, [5, 5]),
    normalScale: new THREE.Vector2(.3, .3),
  });
  const wood = new THREE.MeshStandardMaterial({color: 0x664835, roughness: .58});
  const plaster = new THREE.MeshStandardMaterial({color: 0xb7b6a6, roughness: .9});
  const dark = new THREE.MeshStandardMaterial({color: 0x15252c, roughness: .35, metalness: .65});
  const brass = new THREE.MeshStandardMaterial({color: 0xbba36b, roughness: .27, metalness: .9});

  function mesh(geometry, material, position) {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(...position);
    object.castShadow = object.receiveShadow = true;
    root.add(object);
    return object;
  }
  const box = (position, size, material) => mesh(new THREE.BoxGeometry(...size), material, position);
  const cylinder = (position, radius, height, material) =>
    mesh(new THREE.CylinderGeometry(radius, radius, height, 48), material, position);

  box([0, -.13, -2], [16, .25, 16], stone);
  box([0, 2.8, -7], [16, 5.6, .25], plaster);
  box([7.8, 2.8, -1], [.25, 5.6, 12], plaster);
  box([0, .08, -6.78], [15.6, .16, .08], dark);

  // Repeated geometry shares one material and geometry via instancing.
  const slats = new THREE.InstancedMesh(new THREE.BoxGeometry(.065, 4.8, .12), wood, 70);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 70; i++) {
    dummy.position.set(-6.9 + i * .2, 2.65, -6.8);
    dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix();
    slats.setMatrixAt(i, dummy.matrix);
    slats.setColorAt(i, new THREE.Color().setScalar(.85 + random() * .15));
  }
  slats.name = 'wall-slats';
  slats.castShadow = slats.receiveShadow = true;
  root.add(slats);

  for (const z of [-5, -2, 1, 4]) {
    box([-7.6, 2.7, z], [.13, 5.4, .14], dark);
    box([0, 5.5, z], [15.4, .18, .24], wood);
  }
  box([-7.6, 4.1, -.5], [.13, .12, 12], dark);
  box([-7.6, .4, -.5], [.22, .8, 12], plaster);

  cylinder([0, .08, -1], 2.5, .16, plaster);
  cylinder([0, .02, -1], 2.54, .04, brass);
  box([0, 2.6, -6.58], [4.8, 3.5, .16], dark);
  mesh(new THREE.TorusGeometry(1.05, .085, 16, 80), brass, [0, 2.7, -6.3]);

  box([4.4, .42, -4.5], [3.5, .22, 1], wood);
  for (const x of [3, 5.8]) box([x, .2, -4.5], [.14, .4, .8], dark);
  for (const x of [3.3, 4.4, 5.5]) {
    box([x, .63, -4.45], [1.02, .2, .85], plaster);
    box([x, .98, -4.8], [1.02, .55, .15], plaster);
  }

  // Emissive diffuser and an actual point light have different jobs.
  const glow = new THREE.MeshStandardMaterial({color: 0xffd090, emissive: 0xffb865, emissiveIntensity: 3});
  for (const x of [-3, 3]) {
    cylinder([x, 4.35, -3], .018, 2, dark);
    cylinder([x, 3.3, -3], .42, .14, dark);
    cylinder([x, 3.22, -3], .34, .025, glow);
    const practical = new THREE.PointLight(0xffc58b, 20, 6, 2);
    practical.position.set(x, 3.05, -3); practical.name = 'pendant-light';
    root.add(practical);
  }

  const planter = cylinder([-4.5, .4, -4], .42, .8, dark);
  planter.name = 'planter';
  cylinder([-4.5, 1.35, -4], .04, 1.5, wood);
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, -.5); leafShape.quadraticCurveTo(.3, 0, 0, .5);
  leafShape.quadraticCurveTo(-.3, 0, 0, -.5);
  const leaves = new THREE.InstancedMesh(new THREE.ShapeGeometry(leafShape, 3),
    new THREE.MeshStandardMaterial({color: 0x426440, roughness: .85, side: THREE.DoubleSide}), 120);
  leaves.name = 'leaves';
  for (let i = 0; i < 120; i++) {
    const angle = random() * Math.PI * 2, y = random() * 2 - 1;
    const radius = Math.sqrt(1 - y * y) * (.4 + random() * .35);
    dummy.position.set(-4.5 + Math.cos(angle) * radius, 2.1 + y * .7, -4 + Math.sin(angle) * radius);
    dummy.rotation.set(random() * 2, random() * 6, random() * 2);
    dummy.scale.setScalar(.35 + random() * .2); dummy.updateMatrix();
    leaves.setMatrixAt(i, dummy.matrix);
  }
  leaves.castShadow = leaves.receiveShadow = true;
  root.add(leaves);
  const leafLoop = createLeafLoop(leaves, {duration: loopSeconds, seed});
  function update(timeSeconds, options) {
    if (!disposed) leafLoop.update(timeSeconds, options);
  }

  const key = new THREE.DirectionalLight(0xffd8a5, 3.2);
  key.name = 'key-light'; key.position.set(-6, 7, 4); key.castShadow = true;
  key.target.position.set(0, 1, -2);
  Object.assign(key.shadow.camera, {left: -10, right: 10, top: 10, bottom: -10, near: .5, far: 30});
  key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -.0002; key.shadow.normalBias = .025;
  const fill = new THREE.DirectionalLight(0x9ac8ff, .65);
  fill.name = 'fill-light'; fill.position.set(5, 3, 3);
  const rim = new THREE.DirectionalLight(0xffd5a0, 1.1);
  rim.name = 'rim-light'; rim.position.set(2, 5, -5);
  root.add(key, key.target, fill, fill.target, rim, rim.target);

  function dispose() {
    if (disposed) return;
    disposed = true;
    const geometries = new Set(), materials = new Set();
    root.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      for (const m of object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : []) materials.add(m);
      if (object.isInstancedMesh) object.dispose();
      if (object.isLight) {
        if (typeof object.dispose === 'function') object.dispose();
        else object.shadow?.dispose();
      }
    });
    root.removeFromParent();
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
    ownedTextures.forEach(t => t.dispose());
  }
  return {root, meta: {...sceneMeta, loopSeconds}, update, dispose};
}

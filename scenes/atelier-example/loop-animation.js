import * as THREE from 'three';

// Local leaf base is (0, -.5, 0). This is artistic flutter, not cloth physics.
export function createLeafLoop(mesh, {duration = 8, amplitude = .08, seed = 42} = {}) {
  if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(amplitude) || amplitude < 0)
    throw new RangeError('duration must be positive; amplitude must be nonnegative');
  let state = Number(seed) >>> 0;
  const bases = [], phases = [];
  for (let i = 0; i < mesh.count; i++) {
    const base = new THREE.Matrix4(); mesh.getMatrixAt(i, base); bases.push(base);
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    phases.push(state / 4294967296 * Math.PI * 2);
  }
  const toPivot = new THREE.Matrix4().makeTranslation(0, -.5, 0);
  const fromPivot = new THREE.Matrix4().makeTranslation(0, .5, 0);
  const rotation = new THREE.Matrix4(), matrix = new THREE.Matrix4();
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  function update(timeSeconds, {motionScale = 1} = {}) {
    if (!Number.isFinite(timeSeconds) || !Number.isFinite(motionScale))
      throw new RangeError('time and motionScale must be finite');
    const theta = ((timeSeconds % duration + duration) % duration) / duration * Math.PI * 2;
    const strength = amplitude * THREE.MathUtils.clamp(motionScale, 0, 1);
    for (let i = 0; i < mesh.count; i++) {
      const p = phases[i];
      const angle = strength * (Math.sin(theta + p) - Math.sin(p)
        + .25 * (Math.sin(2 * theta + p) - Math.sin(p)));
      rotation.makeRotationZ(angle);
      matrix.copy(bases[i]).multiply(toPivot).multiply(rotation).multiply(fromPivot);
      mesh.setMatrixAt(i, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    // Fine for this small example; large forests should use conservative bounds.
    mesh.computeBoundingSphere();
  }
  return {update, duration};
}

import type * as THREE from 'three';

/**
 * Dispose a three.js material and its textures
 */
export function disposeMaterial(material: THREE.Material): void {
  // Handle array of materials
  if (Array.isArray(material)) {
    material.forEach(disposeMaterial);
    return;
  }

  // Dispose textures
  const mat = material as THREE.MeshStandardMaterial;

  if (mat.map) mat.map.dispose();
  if (mat.lightMap) mat.lightMap.dispose();
  if (mat.bumpMap) mat.bumpMap.dispose();
  if (mat.normalMap) mat.normalMap.dispose();
  if (mat.specularMap) mat.specularMap.dispose();
  if (mat.envMap) mat.envMap.dispose();
  if (mat.alphaMap) mat.alphaMap.dispose();
  if (mat.aoMap) mat.aoMap.dispose();
  if (mat.displacementMap) mat.displacementMap.dispose();
  if (mat.emissiveMap) mat.emissiveMap.dispose();
  if (mat.gradientMap) mat.gradientMap.dispose();
  if (mat.metalnessMap) mat.metalnessMap.dispose();
  if (mat.roughnessMap) mat.roughnessMap.dispose();

  material.dispose();
}

/**
 * Dispose a three.js geometry
 */
export function disposeGeometry(geometry: THREE.BufferGeometry): void {
  geometry.dispose();
}

/**
 * Recursively dispose a three.js object and all its children
 */
export function disposeObject(object: THREE.Object3D): void {
  // Dispose children first
  while (object.children.length > 0) {
    disposeObject(object.children[0]);
    object.remove(object.children[0]);
  }

  // Dispose geometry
  const mesh = object as THREE.Mesh;
  if (mesh.geometry) {
    disposeGeometry(mesh.geometry);
  }

  // Dispose material
  if (mesh.material) {
    disposeMaterial(mesh.material);
  }
}

/**
 * Dispose an entire three.js scene
 */
export function disposeScene(scene: THREE.Scene): void {
  scene.traverse((object) => {
    const mesh = object as THREE.Mesh;

    if (mesh.geometry) {
      disposeGeometry(mesh.geometry);
    }

    if (mesh.material) {
      disposeMaterial(mesh.material);
    }
  });

  scene.clear();
}

/**
 * Dispose a three.js renderer
 */
export function disposeRenderer(renderer: THREE.WebGLRenderer): void {
  renderer.dispose();
  renderer.forceContextLoss();

  // Remove canvas from DOM if attached
  const canvas = renderer.domElement;
  if (canvas.parentNode) {
    canvas.parentNode.removeChild(canvas);
  }
}

/**
 * Full cleanup helper for a complete three.js setup
 */
export function disposeAll(options: {
  scene?: THREE.Scene;
  renderer?: THREE.WebGLRenderer;
  animationFrameId?: number;
}): void {
  const { scene, renderer, animationFrameId } = options;

  // Cancel animation frame
  if (animationFrameId !== undefined) {
    cancelAnimationFrame(animationFrameId);
  }

  // Dispose scene
  if (scene) {
    disposeScene(scene);
  }

  // Dispose renderer
  if (renderer) {
    disposeRenderer(renderer);
  }
}

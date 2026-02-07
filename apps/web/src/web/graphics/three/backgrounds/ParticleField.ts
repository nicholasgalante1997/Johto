import * as THREE from 'three';
import type {
  SceneLayerConfig,
  ParticleFieldOptions,
  PerformanceTier
} from '../../types';
import { getRecommendedParticleCount } from '../../utils';
import {
  particleVertex,
  particleFragment,
  particleVertexSimple,
  particleFragmentSimple
} from '../../shaders';

export interface ParticleFieldConfig extends SceneLayerConfig {
  setMousePosition: (x: number, y: number) => void;
  updateParticleCount: (count: number) => void;
}

/**
 * Create a floating particle field background layer
 */
export function createParticleField(
  options: ParticleFieldOptions = {}
): ParticleFieldConfig {
  const {
    particleCount: initialCount,
    particleSize = 2,
    color = '#2081e2',
    secondaryColor = '#7b61ff',
    speed = 0.3,
    spread = { x: 20, y: 20, z: 10 },
    mouseInfluence = 0.5,
    performanceTier = 'medium'
  } = options;

  // Determine particle count based on tier
  const particleCount =
    initialCount ?? getRecommendedParticleCount(performanceTier);
  const useSimpleShaders = performanceTier === 'low';

  // Create scene and camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  camera.position.z = 15;

  // Parse colors
  const primaryColor = new THREE.Color(color);
  const secondColor = new THREE.Color(secondaryColor);

  // Create geometry with attributes
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const alphas = new Float32Array(particleCount);
  const velocities = new Float32Array(particleCount * 3);
  const phases = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;

    // Random position within spread
    positions[i3] = (Math.random() - 0.5) * spread.x;
    positions[i3 + 1] = (Math.random() - 0.5) * spread.y;
    positions[i3 + 2] = (Math.random() - 0.5) * spread.z;

    // Random velocities for drift
    velocities[i3] = (Math.random() - 0.5) * 0.02;
    velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
    velocities[i3 + 2] = (Math.random() - 0.5) * 0.01;

    // Random size variation
    sizes[i] = particleSize * (0.5 + Math.random() * 0.8);

    // Random alpha for depth effect
    alphas[i] = 0.3 + Math.random() * 0.7;

    // Random phase for animation offset
    phases[i] = Math.random();
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
  geometry.setAttribute('aVelocity', new THREE.BufferAttribute(velocities, 3));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

  // Create shader material
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: primaryColor },
      uSecondaryColor: { value: secondColor },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uMouseInfluence: { value: mouseInfluence },
      uSpeed: { value: speed },
      uSpread: { value: new THREE.Vector3(spread.x, spread.y, spread.z) },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
    },
    vertexShader: useSimpleShaders ? particleVertexSimple : particleVertex,
    fragmentShader: useSimpleShaders
      ? particleFragmentSimple
      : particleFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  // Create points mesh
  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  // Mouse tracking state
  let mouseX = 0;
  let mouseY = 0;
  let targetMouseX = 0;
  let targetMouseY = 0;

  return {
    id: 'particle-field',
    scene,
    camera,
    renderOrder: 0, // Background layer renders first

    /**
     * Update the mouse position (normalized -1 to 1)
     */
    setMousePosition(x: number, y: number) {
      targetMouseX = x;
      targetMouseY = y;
    },

    /**
     * Update particle count (requires geometry rebuild)
     */
    updateParticleCount(count: number) {
      // This would require rebuilding the geometry
      // For now, just log - could be implemented if needed
      console.log(`[ParticleField] Particle count update requested: ${count}`);
    },

    /**
     * Called each frame by SceneManager
     */
    update(deltaTime: number, elapsedTime: number) {
      // Smooth mouse movement
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      // Update uniforms
      material.uniforms.uTime.value = elapsedTime;
      material.uniforms.uMouse.value.set(mouseX, mouseY);

      // Gentle rotation for depth effect
      particles.rotation.y = elapsedTime * 0.02;
      particles.rotation.x = Math.sin(elapsedTime * 0.1) * 0.05;
    },

    /**
     * Clean up resources
     */
    dispose() {
      geometry.dispose();
      material.dispose();
      scene.clear();
    }
  };
}

/**
 * Create mouse event handlers for particle field interaction
 */
export function createMouseHandlers(
  particleField: ParticleFieldConfig,
  container: HTMLElement
): { cleanup: () => void } {
  const handleMouseMove = (event: MouseEvent) => {
    const rect = container.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    particleField.setMousePosition(x, y);
  };

  const handleMouseLeave = () => {
    particleField.setMousePosition(0, 0);
  };

  container.addEventListener('mousemove', handleMouseMove);
  container.addEventListener('mouseleave', handleMouseLeave);

  return {
    cleanup() {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    }
  };
}

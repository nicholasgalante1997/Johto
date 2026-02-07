import type * as THREE from 'three';

export type PerformanceTier = 'high' | 'medium' | 'low';

export interface WebGLCapabilities {
  supported: boolean;
  tier: PerformanceTier;
  maxTextureSize: number;
  maxVertexUniforms: number;
  renderer: string;
  vendor: string;
}

export interface SceneLayerConfig {
  id: string;
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderOrder: number;
  update?: (deltaTime: number, elapsedTime: number) => void;
  dispose?: () => void;
}

export interface ParticleFieldOptions {
  particleCount?: number;
  particleSize?: number;
  color?: string | THREE.Color;
  secondaryColor?: string | THREE.Color;
  speed?: number;
  spread?: { x: number; y: number; z: number };
  mouseInfluence?: number;
  performanceTier?: PerformanceTier;
}

export interface WebGLCanvasOptions {
  background?: 'particles' | 'gradient-mesh' | 'none';
  color?: string;
  secondaryColor?: string;
  intensity?: number;
  fallbackGradient?: string;
}

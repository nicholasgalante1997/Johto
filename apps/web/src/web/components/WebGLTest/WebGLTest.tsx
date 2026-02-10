import { useEffect, useState, useRef, useCallback } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import type { WebGLTestProps } from './types';
import './WebGLTest.css';

// Inline GLSL shaders - Bun bundler doesn't have raw-loader
const particleVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;

  attribute float aSize;
  attribute float aAlpha;

  varying float vAlpha;

  void main() {
    vec3 pos = position;

    // Gentle floating motion
    pos.y += sin(uTime * 0.5 + position.x * 0.5) * 0.3;
    pos.x += cos(uTime * 0.3 + position.y * 0.5) * 0.2;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    // Size attenuation
    gl_PointSize = aSize * uPixelRatio * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    vAlpha = aAlpha;
  }
`;

const particleFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;

  varying float vAlpha;

  void main() {
    // Circular particle with soft edges
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    float alpha = smoothstep(0.5, 0.1, dist);

    // Subtle pulse
    float pulse = 0.8 + sin(uTime * 2.0) * 0.2;

    gl_FragColor = vec4(uColor * pulse, alpha * vAlpha * 0.6);
  }
`;

export function WebGLTest({
  className = '',
  particleCount = 500,
  color = '#2081e2',
  fallbackGradient = 'linear-gradient(135deg, #0a0a0f 0%, #12121a 100%)'
}: WebGLTestProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    particles: THREE.Points;
    material: THREE.ShaderMaterial;
    animationId: number | null;
  } | null>(null);

  // SSR safety: track if we're on client
  const [isClient, setIsClient] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Detect client-side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize three.js on client only
  useEffect(() => {
    if (!isClient || !canvasRef.current) return;

    // Check WebGL support
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      setWebglSupported(false);
      return;
    }

    // Dynamic import three.js
    import('three').then((THREE) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Scene setup
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        75,
        canvas.clientWidth / canvas.clientHeight,
        0.1,
        1000
      );
      camera.position.z = 15;

      // Renderer
      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      renderer.setClearColor(0x000000, 0);

      // Particle geometry
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);
      const alphas = new Float32Array(particleCount);

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 20;
        positions[i3 + 1] = (Math.random() - 0.5) * 20;
        positions[i3 + 2] = (Math.random() - 0.5) * 10;
        sizes[i] = Math.random() * 2 + 1;
        alphas[i] = Math.random() * 0.5 + 0.5;
      }

      geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
      );
      geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
      geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));

      // Parse color
      const threeColor = new THREE.Color(color);

      // Shader material
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: threeColor },
          uPixelRatio: { value: renderer.getPixelRatio() }
        },
        vertexShader: particleVertexShader,
        fragmentShader: particleFragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });

      const particles = new THREE.Points(geometry, material);
      scene.add(particles);

      // Store refs for animation and cleanup
      sceneRef.current = {
        scene,
        camera,
        renderer,
        particles,
        material,
        animationId: null
      };

      // Animation loop
      const clock = new THREE.Clock();
      const animate = () => {
        if (!sceneRef.current) return;

        const elapsed = clock.getElapsedTime();
        material.uniforms.uTime.value = elapsed;

        // Gentle rotation
        particles.rotation.y = elapsed * 0.05;

        renderer.render(scene, camera);
        sceneRef.current.animationId = requestAnimationFrame(animate);
      };

      animate();
      setIsLoaded(true);

      // Resize handler
      const handleResize = () => {
        if (!sceneRef.current || !canvas) return;
        const { camera, renderer } = sceneRef.current;

        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      };

      window.addEventListener('resize', handleResize);

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        if (sceneRef.current) {
          if (sceneRef.current.animationId) {
            cancelAnimationFrame(sceneRef.current.animationId);
          }
          sceneRef.current.geometry?.dispose();
          sceneRef.current.material.dispose();
          sceneRef.current.renderer.dispose();
          sceneRef.current = null;
        }
      };
    });
  }, [isClient, particleCount, color]);

  // GSAP animation for the container (demonstrates @gsap/react working)
  useGSAP(
    () => {
      if (!isClient || !containerRef.current) return;

      gsap.fromTo(
        containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 1, ease: 'power2.out' }
      );
    },
    { dependencies: [isClient], scope: containerRef }
  );

  // SSR: render nothing meaningful
  if (!isClient) {
    return (
      <div
        className={`webgl-test webgl-test--ssr ${className}`}
        style={{ background: fallbackGradient }}
        aria-hidden="true"
      />
    );
  }

  // No WebGL: show fallback
  if (!webglSupported) {
    return (
      <div
        ref={containerRef}
        className={`webgl-test webgl-test--fallback ${className}`}
        style={{ background: fallbackGradient }}
        aria-hidden="true"
      >
        <span className="webgl-test__fallback-text">WebGL not supported</span>
      </div>
    );
  }

  // Client with WebGL: render canvas
  return (
    <div ref={containerRef} className={`webgl-test ${className}`}>
      <canvas
        ref={canvasRef}
        className="webgl-test__canvas"
        aria-hidden="true"
      />
      {isLoaded && (
        <div className="webgl-test__status">
          ✓ three.js loaded, particles animating
        </div>
      )}
    </div>
  );
}

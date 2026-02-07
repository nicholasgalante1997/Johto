/**
 * Particle system shaders for nebula background effect
 */

export const particleVertex = /* glsl */ `
uniform float uTime;
uniform float uSpeed;
uniform float uPixelRatio;
uniform vec2 uMouse;
uniform float uMouseInfluence;
uniform vec3 uSpread;

attribute float aSize;
attribute float aAlpha;
attribute vec3 aVelocity;
attribute float aPhase;

varying float vAlpha;
varying float vDistance;

void main() {
  vec3 pos = position;

  // Apply time-based animation with individual phase offset
  float phase = aPhase * 6.28318;
  float t = uTime * uSpeed;

  // Gentle floating motion
  pos.x += sin(t * 0.5 + phase) * 0.3 + aVelocity.x * t;
  pos.y += cos(t * 0.3 + phase * 0.7) * 0.4 + aVelocity.y * t;
  pos.z += sin(t * 0.2 + phase * 1.3) * 0.2 + aVelocity.z * t;

  // Wrap around boundaries
  pos = mod(pos + uSpread * 0.5, uSpread) - uSpread * 0.5;

  // Mouse influence - particles gently pushed away from cursor
  vec2 toMouse = uMouse * 5.0 - pos.xy;
  float mouseDistance = length(toMouse);
  float mouseForce = smoothstep(4.0, 0.0, mouseDistance) * uMouseInfluence;
  pos.xy -= normalize(toMouse + 0.001) * mouseForce * 0.8;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  // Size attenuation based on distance
  float sizeAttenuation = 300.0 / -mvPosition.z;
  gl_PointSize = aSize * sizeAttenuation * uPixelRatio;

  // Clamp point size
  gl_PointSize = clamp(gl_PointSize, 1.0, 64.0);

  gl_Position = projectionMatrix * mvPosition;

  // Pass to fragment shader
  vAlpha = aAlpha;
  vDistance = -mvPosition.z;
}
`;

export const particleFragment = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uSecondaryColor;
uniform float uTime;

varying float vAlpha;
varying float vDistance;

void main() {
  // Circular particle shape with soft edges
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);

  // Soft circular falloff
  float alpha = smoothstep(0.5, 0.15, dist);

  // Depth-based fading
  float depthFade = smoothstep(25.0, 5.0, vDistance);

  // Color mixing based on depth and time
  float colorMix = sin(vDistance * 0.2 + uTime * 0.5) * 0.5 + 0.5;
  vec3 finalColor = mix(uColor, uSecondaryColor, colorMix * 0.3);

  // Subtle pulse
  float pulse = 0.85 + sin(uTime * 1.5 + vDistance * 0.3) * 0.15;
  finalColor *= pulse;

  // Apply alpha
  float finalAlpha = alpha * vAlpha * depthFade * 0.7;

  gl_FragColor = vec4(finalColor, finalAlpha);
}
`;

/**
 * Simpler particle shader for low-performance mode
 */
export const particleVertexSimple = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;

attribute float aSize;
attribute float aAlpha;

varying float vAlpha;

void main() {
  vec3 pos = position;

  // Simple floating motion
  pos.y += sin(uTime * 0.3 + position.x) * 0.2;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  gl_PointSize = aSize * uPixelRatio * (200.0 / -mvPosition.z);
  gl_PointSize = clamp(gl_PointSize, 1.0, 32.0);

  gl_Position = projectionMatrix * mvPosition;
  vAlpha = aAlpha;
}
`;

export const particleFragmentSimple = /* glsl */ `
uniform vec3 uColor;

varying float vAlpha;

void main() {
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);
  float alpha = smoothstep(0.5, 0.2, dist);

  gl_FragColor = vec4(uColor, alpha * vAlpha * 0.5);
}
`;

/**
 * Holographic card effect shaders
 * Creates rainbow shimmer effect for rare Pokemon cards
 */

export const holographicVertex = /* glsl */ `
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  vUv = uv;
  vPosition = position;
  vNormal = normalize(normalMatrix * normal);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const holographicFragment = /* glsl */ `
uniform float uTime;
uniform vec2 uMouse;
uniform float uIntensity;
uniform vec2 uResolution;
uniform sampler2D uTexture;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

// Simple hash for sparkle effect
vec3 hash33(vec3 p3) {
  p3 = fract(p3 * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yxz + 33.33);
  return fract((p3.xxy + p3.yxx) * p3.zyx);
}

// HSV to RGB conversion
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  vec4 texColor = texture2D(uTexture, vUv);

  // Calculate view-dependent angle for holographic effect
  vec2 center = vUv - 0.5;
  float angle = atan(center.y, center.x);
  float dist = length(center);

  // Mouse-influenced tilt
  vec2 tilt = uMouse * 0.5;
  float tiltAngle = angle + tilt.x * 3.14159 + tilt.y * 3.14159;

  // Rainbow gradient based on angle, time, and distance
  float hue = fract(
    tiltAngle / 6.28318 +
    uTime * 0.1 +
    dist * 0.5 +
    vPosition.x * 0.1
  );

  // Convert to RGB with full saturation
  vec3 rainbow = hsv2rgb(vec3(hue, 0.8, 1.0));

  // Sparkle/glitter effect
  vec3 sparklePos = vec3(vUv * uResolution * 0.1, uTime * 2.0);
  vec3 sparkle = hash33(floor(sparklePos));
  float sparkleIntensity = pow(max(sparkle.x, max(sparkle.y, sparkle.z)), 25.0);

  // Fresnel-like edge glow
  float fresnel = pow(1.0 - abs(dot(vec3(0.0, 0.0, 1.0), vNormal)), 2.0);

  // Scanning line effect
  float scanLine = sin(vUv.y * 100.0 + uTime * 5.0) * 0.5 + 0.5;
  scanLine = pow(scanLine, 8.0) * 0.3;

  // Combine holographic effects
  vec3 holographic = vec3(0.0);
  holographic += rainbow * uIntensity * 0.4;
  holographic += sparkleIntensity * vec3(1.0) * uIntensity * 1.5;
  holographic += fresnel * rainbow * uIntensity * 0.3;
  holographic += scanLine * rainbow * uIntensity * 0.2;

  // Blend with original texture
  vec3 finalColor = texColor.rgb + holographic;

  // Ensure we don't blow out the highlights too much
  finalColor = mix(texColor.rgb, finalColor, 0.7);

  gl_FragColor = vec4(finalColor, texColor.a);
}
`;

/**
 * Simple glow effect shader for card borders
 */
export const glowFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
uniform float uTime;

varying vec2 vUv;

void main() {
  // Distance from edge
  vec2 center = vUv - 0.5;
  float dist = length(center);

  // Glow falloff
  float glow = smoothstep(0.5, 0.3, dist);

  // Pulse animation
  float pulse = 0.8 + sin(uTime * 2.0) * 0.2;

  // Edge highlight
  float edge = smoothstep(0.48, 0.5, dist) * smoothstep(0.52, 0.5, dist);
  edge *= 3.0;

  float alpha = (glow * 0.3 + edge) * uIntensity * pulse;

  gl_FragColor = vec4(uColor, alpha);
}
`;

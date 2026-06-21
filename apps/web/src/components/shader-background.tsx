"use client";

import { useEffect, useRef } from "react";

const VERTEX = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAGMENT = `
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float seg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

float glyph(vec2 uv, float id) {
  float d = 1.0;
  if (id < 0.25) {
    d = length(uv - 0.5) - 0.07;
  } else if (id < 0.5) {
    d = seg(uv, vec2(0.28, 0.72), vec2(0.72, 0.28)) - 0.05;
  } else if (id < 0.75) {
    d = seg(uv, vec2(0.28, 0.28), vec2(0.72, 0.72)) - 0.05;
  } else {
    d = seg(uv, vec2(0.5, 0.22), vec2(0.5, 0.78)) - 0.05;
  }
  return smoothstep(0.045, 0.0, d);
}

void main() {
  vec2 px = gl_FragCoord.xy;
  float cell = 15.0;
  vec2 id = floor(px / cell);
  vec2 cuv = fract(px / cell);

  float h = hash(id);
  float twinkle = 0.5 + 0.5 * sin(u_time * 1.6 + h * 28.0);

  vec2 center = (id + 0.5) * cell;
  float dist = distance(center, u_mouse) / u_resolution.y;
  float reveal = smoothstep(0.26, 0.0, dist);

  float strength = reveal * (0.45 + 0.55 * twinkle) * step(0.3, h);
  strength = max(strength, 0.06 * step(0.88, h) * twinkle);

  float mark = glyph(cuv, hash(id + 3.7));
  vec3 accent = vec3(0.082, 0.722, 0.525);

  gl_FragColor = vec4(accent, mark * strength);
}`;

export function ShaderBackground({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) {
      return;
    }
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
    if (!gl) {
      return;
    }

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) {
        return null;
      }
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };

    const vert = compile(gl.VERTEX_SHADER, VERTEX);
    const frag = compile(gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vert || !frag || !program) {
      return;
    }
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "u_time");
    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uMouse = gl.getUniformLocation(program, "u_mouse");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mouse = { x: -1e4, y: -1e4 };
    const target = { x: -1e4, y: -1e4 };

    const resize = () => {
      canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        target.x = -1e4;
        target.y = -1e4;
        return;
      }
      target.x = x * dpr;
      target.y = (rect.height - y) * dpr;
    };
    window.addEventListener("pointermove", onMove);

    let raf = 0;
    let startTime = 0;
    const render = (now: number) => {
      if (startTime === 0) {
        startTime = now;
      }
      mouse.x += (target.x - mouse.x) * 0.12;
      mouse.y += (target.y - mouse.y) * 0.12;
      gl.uniform1f(uTime, (now - startTime) / 1000);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className={className} />;
}

import * as THREE from 'three'
import { gsap } from '../../../lib/gsap'

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTex;
  uniform vec2 uRes;
  uniform vec2 uView;
  uniform vec2 uMouse;
  uniform float uHover;
  uniform float uTime;
  uniform float uReveal;
  uniform vec2 uFocus;
  uniform float uScroll;
  uniform vec3 uTint;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

  vec2 coverUv(vec2 uv) {
    float va = uView.x / uView.y;
    float ta = uRes.x / uRes.y;
    vec2 s = vec2(1.0);
    if (va > ta) s.y = ta / va; else s.x = va / ta;
    return uv * s + (1.0 - s) * uFocus;
  }

  void main() {
    vec2 uv = vUv;
    vec2 aspect = vec2(uView.x / uView.y, 1.0);

    // ripple from the pointer
    vec2 dir = (uv - uMouse) * aspect;
    float dist = length(dir);
    float ripple = sin(dist * 38.0 - uTime * 4.0) * exp(-dist * 5.0) * 0.007 * uHover;
    vec2 duv = uv + normalize(dir + 1e-4) * ripple;

    // reveal: slides up from below while zooming out, wiped in from the bottom
    float zoom = 1.1 + uHover * 0.07 + (1.0 - uReveal) * 0.3;
    vec2 c = (duv - 0.5) / zoom + 0.5;
    c.y += uScroll * 0.05 - (1.0 - uReveal) * 0.08;
    vec3 col = texture2D(uTex, clamp(coverUv(c), 0.001, 0.999)).rgb;

    // warm whisky grade
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(col, vec3(lum) * vec3(1.1, 0.94, 0.74), 0.25);

    // pointer-following gold light
    float spec = exp(-dist * dist * 9.0) * uHover;
    col += spec * (0.12 + lum * 0.6) * uTint;

    // idle sheen
    float sweep = fract(uTime * 0.07 + hash(uFocus)) * 2.4 - 0.7;
    float band = smoothstep(0.12, 0.0, abs(uv.x * 0.8 + uv.y * 0.4 - sweep));
    col += band * smoothstep(0.25, 0.8, lum) * 0.12 * vec3(1.0, 0.85, 0.55);

    // bottom-up wipe with a soft gold edge
    float edge = uReveal * 1.25 - 0.1;
    float h = uv.y + hash(vec2(floor(uv.x * 40.0), 1.0)) * 0.03;
    float m = 1.0 - smoothstep(edge - 0.12, edge, h);
    col *= m;
    col += (1.0 - smoothstep(0.0, 0.05, abs(h - edge + 0.06))) * vec3(0.6, 0.45, 0.15) * step(uReveal, 0.99);

    col += (hash(uv * uView + fract(uTime) * 50.0) - 0.5) * 0.03;
    gl_FragColor = vec4(col, 1.0);
  }
`

export interface GLImageOptions {
  focus?: [number, number]
  tint?: [number, number, number]
}

/** A WebGL photo with hover ripple, pointer light, scroll parallax and a wipe-in reveal. */
export class GLImage {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private mat: THREE.ShaderMaterial
  private raf = 0
  private clock = new THREE.Clock()
  private visible = false
  private io: IntersectionObserver
  private ro: ResizeObserver
  private mouse = new THREE.Vector2(0.5, 0.5)
  private texture?: THREE.Texture
  private host: HTMLElement

  constructor(canvas: HTMLCanvasElement, host: HTMLElement, src: string, opts: GLImageOptions = {}) {
    this.host = host
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    this.renderer.setClearColor(0x0f0b07)
    this.mat = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: {
        uTex: { value: null },
        uRes: { value: new THREE.Vector2(1, 1) },
        uView: { value: new THREE.Vector2(1, 1) },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uHover: { value: 0 },
        uTime: { value: 0 },
        uReveal: { value: 0 },
        uScroll: { value: 0 },
        uFocus: { value: new THREE.Vector2(...(opts.focus ?? [0.5, 0.5])) },
        uTint: { value: new THREE.Vector3(...(opts.tint ?? [1, 0.84, 0.52])) },
      },
      depthTest: false,
    })
    this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.mat))

    new THREE.TextureLoader().load(src, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace
      tex.minFilter = THREE.LinearFilter
      tex.generateMipmaps = false
      const img = tex.image as HTMLImageElement
      this.mat.uniforms.uRes.value.set(img.width, img.height)
      this.mat.uniforms.uTex.value = tex
      this.texture = tex
    })

    this.io = new IntersectionObserver(
      ([e]) => {
        this.visible = e.isIntersecting
        if (e.isIntersecting && this.mat.uniforms.uReveal.value === 0) {
          gsap.to(this.mat.uniforms.uReveal, { value: 1, duration: 2.4, ease: 'expo.out', delay: 0.15 })
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    this.io.observe(host)
    this.ro = new ResizeObserver(this.resize)
    this.ro.observe(host)

    host.addEventListener('pointerenter', this.onEnter)
    host.addEventListener('pointerleave', this.onLeave)
    host.addEventListener('pointermove', this.onMove)
    this.resize()
    this.tick()
  }

  private onEnter = () => gsap.to(this.mat.uniforms.uHover, { value: 1, duration: 0.9, ease: 'power3.out' })
  private onLeave = () => gsap.to(this.mat.uniforms.uHover, { value: 0, duration: 1.2, ease: 'power3.out' })
  private onMove = (e: PointerEvent) => {
    const r = this.host.getBoundingClientRect()
    this.mouse.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height)
  }

  private resize = () => {
    const w = this.host.clientWidth
    const h = this.host.clientHeight
    if (!w || !h) return
    const view = this.mat.uniforms.uView.value as THREE.Vector2
    if (view.x === w && view.y === h) return
    this.renderer.setSize(w, h, false)
    view.set(w, h)
    // Resizing wipes the canvas, and ResizeObserver fires after this frame's render — draw again
    // now or the photo flashes black on every frame of a size change (e.g. the pillars widening on hover)
    if (this.texture) this.renderer.render(this.scene, this.camera)
  }

  private tick = () => {
    this.raf = requestAnimationFrame(this.tick)
    if (!this.visible || !this.texture) return
    const u = this.mat.uniforms
    u.uTime.value = this.clock.getElapsedTime()
    ;(u.uMouse.value as THREE.Vector2).lerp(this.mouse, 0.08)
    const r = this.host.getBoundingClientRect()
    u.uScroll.value = (r.top + r.height / 2) / window.innerHeight - 0.5
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    cancelAnimationFrame(this.raf)
    this.io.disconnect()
    this.ro.disconnect()
    this.host.removeEventListener('pointerenter', this.onEnter)
    this.host.removeEventListener('pointerleave', this.onLeave)
    this.host.removeEventListener('pointermove', this.onMove)
    this.texture?.dispose()
    this.mat.dispose()
    this.renderer.dispose()
    this.renderer.forceContextLoss()
  }
}

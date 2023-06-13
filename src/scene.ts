import GUI from "lil-gui";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";
import { resizeRendererToDisplaySize } from "./helpers/responsiveness";
import colors from "nice-color-palettes";
import "./style.css";

//Postprocessing imports
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";

import { NoiseEffect } from "./NoiseEffect";

//Shader imports
import fragmentShader from "./shaders/fragment.glsl";
import vertexShader from "./shaders/vertex.glsl";

const CANVAS_ID = "scene";

// Function to randomize the color palette
function randomizePalette() {
  const randomizedPalette = [];
  // Randomize the colors in the palette array
  for (let i = 0; i < 5; i++) {
    const randomColor = new THREE.Color(
      colors[Math.floor(Math.random() * colors.length)][
        Math.floor(Math.random() * 5)
      ]
    );
    randomizedPalette.push(randomColor);
  }
  return randomizedPalette;
}

//Scene
let canvas: HTMLElement;
let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;

//Meshes
let planeMesh: THREE.Mesh;
let palette = randomizePalette();
const uniforms = {
  uTime: { value: 0 },
  uColor: { value: palette },
  uNoiseCoord: { value: new THREE.Vector2(2.0, 2.6) },
  uNoiseElevation: { value: 3.0 },
};

//Camera
let camera: THREE.PerspectiveCamera;
let cameraControls: OrbitControls;

//Postprocessing
let composer: EffectComposer;
let renderPass: RenderPass;
let noiseEffect: ShaderPass;

//Utilities
let loadingManager: THREE.LoadingManager;
let clock: THREE.Clock;

//Debugging
let stats: Stats;
let gui: GUI;
const debugObject = {
  speed: 0.5,
};

init();
animate();

function init() {
  // ===== 🖼️ CANVAS, RENDERER, & SCENE =====
  {
    canvas = document.querySelector(`canvas#${CANVAS_ID}`)!;
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene = new THREE.Scene();
  }

  // ===== 👨🏻‍💼 LOADING MANAGER =====
  {
    loadingManager = new THREE.LoadingManager();

    loadingManager.onStart = () => {
      console.log("loading started");
    };
    loadingManager.onProgress = (url, loaded, total) => {
      console.log("loading in progress:");
      console.log(`${url} -> ${loaded} / ${total}`);
    };
    loadingManager.onLoad = () => {
      console.log("loaded!");
    };
    loadingManager.onError = () => {
      console.log("❌ error while loading");
    };
  }

  // ===== 📦 OBJECTS =====
  {
    const sideLength = 2.5;
    const segments = 300;
    const planeGeometry = new THREE.PlaneGeometry(
      sideLength * 2,
      sideLength,
      segments,
      segments
    );

    const planeMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: uniforms,
      side: THREE.DoubleSide,
    });
    planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    planeMesh.castShadow = true;
    planeMesh.position.y = 0;

    scene.add(planeMesh);
  }

  // ===== 🎥 CAMERA =====
  {
    camera = new THREE.PerspectiveCamera(
      50,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100
    );
    camera.position.set(-0.2, 0, 2);
  }
  // ===== POSTPROCESSING =====
  {
    renderPass = new RenderPass(scene, camera);
    noiseEffect = new ShaderPass(NoiseEffect);
    noiseEffect.enabled = false;
    composer = new EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(noiseEffect);
  }

  // ===== 🕹️ CONTROLS =====
  {
    cameraControls = new OrbitControls(camera, canvas);
    // cameraControls.target = planeMesh.position.clone();
    cameraControls.enableDamping = true;
    cameraControls.autoRotate = false;
    cameraControls.enabled = false;
    cameraControls.update();
  }

  // ===== 📈 STATS & CLOCK =====
  {
    clock = new THREE.Clock();
    stats = new Stats();
    document.body.appendChild(stats.dom);
  }

  // ==== 🐞 DEBUG GUI ====
  {
    gui = new GUI({ title: "🐞 Debug GUI", width: 300 });

    /**
     * Plane
     */
    const planeFolder = gui.addFolder("Plane");
    planeFolder.add(planeMesh.material, "wireframe");

    /**
     * Colors
     */
    const colorFolder = planeFolder.addFolder("Color");
    // Function to recreate the addColor controls
    let colors = colorFolder.addFolder("Colors");
    function refreshAddColors() {
      // Recreate the addColor controls for each color in the palette
      colors.destroy();
      colors = colorFolder.addFolder("Colors");
      for (let i = 0; i < palette.length; i++) {
        //@ts-expect-error
        colors.addColor(palette, [i]).name(`Color ${i + 1}`);
      }
    }
    colorFolder
      .add({ randomizePalette: randomizePalette }, "randomizePalette")
      .name("Randomize Palette")
      .onChange(() => {
        //@ts-expect-error
        planeMesh.material.uniforms.uColor.value = null;
        console.log("planeMesh.material:", planeMesh.material.uniforms);
        palette = randomizePalette();
        //@ts-expect-error
        planeMesh.material.uniforms.uColor.value = palette;
        refreshAddColors(); // Refresh the addColor controls
      });
    refreshAddColors();

    /**
     * Time
     */
    const timeFolder = gui.addFolder("Time");
    timeFolder.add(debugObject, "speed").min(0).max(5).step(0.01);

    /**
     * Noise
     */
    const lavaFolder = gui.addFolder("Lava");
    lavaFolder
      .add(uniforms.uNoiseCoord.value, "x")
      .min(0)
      .max(5)
      .step(0.01)
      .name("Lava size coord x");
    lavaFolder
      .add(uniforms.uNoiseCoord.value, "y")
      .min(0)
      .max(5)
      .step(0.01)
      .name("Lava size coord y");
    lavaFolder
      .add(uniforms.uNoiseElevation, "value")
      .min(0)
      .max(6)
      .step(0.01)
      .name("Lava elevation");

    const NoiseFolder = gui.addFolder("Noise");
    NoiseFolder.add(noiseEffect, "enabled").name("Noise");
    NoiseFolder.add(noiseEffect.uniforms.uNoiseSize, "value")
      .min(0)
      .max(500)
      .step(1.0)
      .name("Noise size");
    NoiseFolder.add(noiseEffect.uniforms.uStrength, "value")
      .min(0)
      .max(0.1)
      .step(0.001)
      .name("Noise strength");
    NoiseFolder.add(noiseEffect.uniforms.uSaturation, "value")
      .min(0)
      .max(10)
      .step(0.01)
      .name("Noise saturation");

    gui.close();
  }
}

function animate() {
  requestAnimationFrame(animate);

  stats.update();

  uniforms.uTime.value = clock.getElapsedTime() * debugObject.speed;
  noiseEffect.uniforms.uTime.value = uniforms.uTime.value;

  if (resizeRendererToDisplaySize(renderer, composer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }
  // Update uniforms

  cameraControls.update();

  composer.render();
}

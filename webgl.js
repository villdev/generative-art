// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require("three");

// Include any additional ThreeJS examples below
require("three/examples/js/controls/OrbitControls");

const canvasSketch = require("canvas-sketch");
const random = require("canvas-sketch-util/random");
const palettes = require("nice-color-palettes");
const eases = require("eases");
const BezierEasing = require("bezier-easing");
const glslify = require("glslify");

const settings = {
  dimensions: [512,512],
  fps: 24,
  // duration: 4,
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: "webgl"
};

const sketch = ({ context }) => {
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: context.canvas
  });

  // WebGL background color
  renderer.setClearColor("hsl(0,0%,95%)", 1);
  //! color,alpha

  // Setup a camera
  const camera = new THREE.OrthographicCamera();
  

  // Setup your scene
  const scene = new THREE.Scene();

  const palette = random.pick(palettes);

  // Setup a geometry
  const geometry = new THREE.SphereGeometry(1, 32, 32);

  const fragmentShader = glslify(`
    varying vec2 vUv;

    #pragma glslify: noise = require("glsl-noise/simplex/3d");

    uniform vec3 color;

    uniform float time;

    void main() {

      float offset = 0.2 * noise(vec3(vUv.xy * 5.0, time));

      gl_FragColor = vec4(vec3(color * vUv.x + offset), 1.0);
    }
  `);

  const vertexShader = glslify(`
    varying vec2 vUv;

    uniform float time;

    #pragma glslify: noise = require("glsl-noise/simplex/4d");

    void main() {
      vUv = uv;
      vec3 pos = position.xyz;

      pos += 0.05 * normal * noise(vec4(pos.xyz * 10.0,time)); //0.05 here could be called amplitude -> make it soft
      pos += 0.25 * normal * noise(vec4(pos.xyz * 1.0, 0.0));  //1.0 here could be called frequency
      pos += 0.25 * normal * noise(vec4(pos.xyz * 100.0, 0.0));  //layering multiple noise offset      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `);

    const meshes = [];

  // Setup a mesh with geometry + material
  for(let i = 0; i < 1; i++) {
    const mesh = new THREE.Mesh(geometry,
      new THREE.ShaderMaterial({
        fragmentShader,
        vertexShader,
        uniforms: {
          color: { value: new THREE.Color(random.pick(palette))},
          time: { value: 0 }
        }
      }) );
    // mesh.position.set(
    //   random.range(-1,1), 
    //   random.range(-1,1), 
    //   random.range(-1,1)
    // );
    // mesh.scale.set(
    //   random.range(-1,1), 
    //   random.range(-1,1), 
    //   random.range(-1,1)
    // );
    // mesh.scale.multiplyScalar(0.5);
    //multiplies x,y,z all by the number you pass in
    scene.add(mesh);
    meshes.push(mesh);
  }

  scene.add(new THREE.AmbientLight("hsl(0,0%,40%)"));

  const light = new THREE.DirectionalLight("white", 1);
  light.position.set(2,2,4);
  //0 0 4
  scene.add(light);
  // draw each frame

  const easefn = BezierEasing(0.67, 0.03, 0.29, 0.99);

  return {
    // Handle resize events here
    resize({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight, false);
      const aspect = viewportWidth / viewportHeight;

      // Ortho zoom
      const zoom = 2;

      // Bounds
      camera.left = -zoom * aspect;
      camera.right = zoom * aspect;
      camera.top = zoom;
      camera.bottom = -zoom;

      // Near/Far
      camera.near = -100;
      camera.far = 100;

      // Set position & look at world center
      camera.position.set(zoom, zoom, zoom);
      camera.lookAt(new THREE.Vector3());

      // Update the camera
      camera.updateProjectionMatrix();
    },
    // Update & render your scene here
    render({ playhead, time }) {
      const t = Math.sin(playhead * Math.PI );
      scene.rotation.z = easefn(t);
      // scene.rotation.y = playhead;

      meshes.forEach(mesh => {
        mesh.material.uniforms.time.value = time;
      });
      renderer.render(scene, camera);
    },
    // Dispose of events & renderer for cleaner hot-reloading
    unload() {
      renderer.dispose();
    }
  };
};

canvasSketch(sketch, settings);

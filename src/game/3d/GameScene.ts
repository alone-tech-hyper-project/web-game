import * as THREE from 'three';
import { TileState, PlacedAnimal, PerformanceSettings, TexturePackPalette, MapLocation } from '../../types/game';
import { ModelFactory } from './BuildingModels';
import { MemoryHeapManager } from '../MemoryHeapManager';
import { ShaderPipelinePreheater } from './ShaderPipelinePreheater';
import { WorldRegistry } from '../WorldRegistry';

import grassTexUrl from '../../assets/images/grass_texture_lush_1790665420951.jpg';
import soilTexUrl from '../../assets/images/soil_texture_custom_1790652534812.jpg';
import pathTexUrl from '../../assets/images/path_texture_custom_1790652547943.jpg';
import sandTexUrl from '../../assets/images/sand_texture_1790643647873.jpg';
import rockTexUrl from '../../assets/images/rock_texture_custom_1790652562214.jpg';

// Global Asset Loading State Manager
export const assetLoadingState = {
  progress: 0,
  isLoaded: false,
  listeners: [] as ((progress: number, isLoaded: boolean) => void)[],
  onUpdate(cb: (progress: number, isLoaded: boolean) => void) {
    this.listeners.push(cb);
    cb(this.progress, this.isLoaded);
  },
  notify() {
    this.listeners.forEach((fn) => fn(this.progress, this.isLoaded));
  },
};

// Texture Loader with Progress Manager
const loadingManager = new THREE.LoadingManager(
  () => {
    assetLoadingState.progress = 100;
    assetLoadingState.isLoaded = true;
    assetLoadingState.notify();
  },
  (_itemUrl, itemsLoaded, itemsTotal) => {
    const pct = Math.round((itemsLoaded / itemsTotal) * 100);
    assetLoadingState.progress = pct;
    assetLoadingState.notify();
  }
);

const textureLoader = new THREE.TextureLoader(loadingManager);

function createTileTexture(url: string, repeatScale = 1.0) {
  const tex = textureLoader.load(url);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatScale, repeatScale);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 16;
  return tex;
}

const grassTex = createTileTexture(grassTexUrl, 1.0);
const soilTex = createTileTexture(soilTexUrl, 1.0);
const pathTex = createTileTexture(pathTexUrl, 1.0);
const sandTex = createTileTexture(sandTexUrl, 1.0);
const rockTex = createTileTexture(rockTexUrl, 1.0);

// Materials with Pure White Multiplier (Prevents texture darkening)
const grassMat = new THREE.MeshLambertMaterial({ map: grassTex, color: 0xffffff });
const soilMat = new THREE.MeshLambertMaterial({ map: soilTex, color: 0xffffff });
const pathMat = new THREE.MeshLambertMaterial({ map: pathTex, color: 0xffffff });
const sandMat = new THREE.MeshLambertMaterial({ map: sandTex, color: 0xffffff });
const rockMat = new THREE.MeshLambertMaterial({ map: rockTex, color: 0xffffff });
const waterMat = new THREE.MeshLambertMaterial({ color: 0x0284c7, transparent: true, opacity: 0.82 });

// Smooth 3D Heightfield Elevation Y(x, z, location, type)
export function calculateTileElevation(
  x: number,
  z: number,
  location: MapLocation,
  tileType: string
): number {
  if (tileType === 'water') {
    return -0.08;
  }
  // Full Flat Ground Level for seamless movement, clean textures, and tilling
  return 0.0;
}

export class GameScene {
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;

  private activePalette: TexturePackPalette;
  private dirLight!: THREE.DirectionalLight;
  private ambLight!: THREE.AmbientLight;

  private meadowMesh!: THREE.Mesh;
  private groundInstancedMesh!: THREE.InstancedMesh;
  private visualGrassMesh!: THREE.InstancedMesh;
  private visualSoilMesh!: THREE.InstancedMesh;
  private visualPathMesh!: THREE.InstancedMesh;
  private visualSandMesh!: THREE.InstancedMesh;
  private visualRockMesh!: THREE.InstancedMesh;
  private visualWaterMesh!: THREE.InstancedMesh;
  private visualTuftsMesh!: THREE.InstancedMesh;
  private visualFlowersMesh!: THREE.InstancedMesh;
  private buildingGroup: THREE.Group;
  private treeTrunkInstanced!: THREE.InstancedMesh;
  private treeLeafInstanced!: THREE.InstancedMesh;
  private cropMeshMap = new Map<string, THREE.Group>();
  private debrisMeshMap = new Map<string, THREE.Group>();
  private animalGroup: THREE.Group;
  private tileCursor: THREE.Mesh;
  private tileCursor3x3: THREE.Group;
  private cursor3x3Mat: THREE.LineBasicMaterial;
  private playerMesh: THREE.Group;

  private settings: PerformanceSettings;
  private inputVector = { x: 0, z: 0 };
  private targetTilePos: THREE.Vector3 | null = null;
  private walkAnimTime = 0;
  private isDestroyed = false;

  // Dynamic Camera Pitch & Distance State for 3D Perspective & Gate Auto-Tilt (30 deg near gates)
  private currentPitch = 0.802; // ~46 degrees default isometric
  private currentCamDist = 19.0;

  // Grid dimensions: Farm = 28x28 (784 tiles), Village = 48x48 (2,304 tiles)
  public gridWidth = 28;
  public gridHeight = 28;
  public tileSize = 1.2;

  // Performance tracking & 24 FPS limiter
  public currentFps = 24;
  private frameCount = 0;
  private lastFpsUpdate = 0;
  private lastFrameTimestamp = 0;

  // Shared ground geometry and material
  private tileGeometry: THREE.BufferGeometry;
  private tileMaterial: THREE.MeshLambertMaterial;

  // Reusable Zero-Allocation Vectors for Render Loop
  private dummyCamPos = new THREE.Vector3();
  private dummyFocus = new THREE.Vector3();

  // Active Location & Boundary Transitions
  public currentLocation: MapLocation = 'farm';
  private onExitReachedCallback?: (target: MapLocation, spawnPos?: { x: number; z: number }) => void;
  private lastExitTriggerTime = 0;

  // Callbacks
  private onTileTapCallback?: (x: number, z: number) => void;

  constructor(container: HTMLDivElement, palette: TexturePackPalette, settings: PerformanceSettings) {
    this.container = container;
    this.activePalette = palette;
    this.settings = settings;
    this.clock = new THREE.Clock();

    // 1. Scene & Atmospheric Fog for Miniature Depth
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(palette.skyNoon);
    this.scene.fog = new THREE.FogExp2(new THREE.Color(palette.skyNoon), 0.010);

    // 2. Camera - Dynamic 3D Perspective Projection
    const width = container.clientWidth || window.innerWidth || 800;
    const height = container.clientHeight || window.innerHeight || 600;
    const aspect = width / height;
    const initialFov = aspect < 1 ? 48 : 42;
    this.camera = new THREE.PerspectiveCamera(initialFov, aspect, 0.5, 500);

    // Calculate initial camera position with 46 deg isometric angle
    const horizDist = this.currentCamDist * Math.cos(this.currentPitch);
    const camY = this.currentCamDist * Math.sin(this.currentPitch);
    const offsetXZ = horizDist * 0.7071;
    this.camera.position.set(offsetXZ, camY, offsetXZ);
    this.camera.lookAt(0, 0.5, 0);

    // 3. Bright, Crisp, Vibrant Sunlit Lighting
    this.ambLight = new THREE.AmbientLight(0xffffff, 1.25);
    this.scene.add(this.ambLight);

    this.dirLight = new THREE.DirectionalLight(0xfffbeb, 1.20);
    this.dirLight.position.set(25, 40, 20);
    this.dirLight.castShadow = false;
    this.scene.add(this.dirLight);

    // 4. WebGL Renderer with Native Double-Buffering & High Performance
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      stencil: false,
      preserveDrawingBuffer: false,
    });
    this.renderer.setSize(width, height);
    const maxPR = Math.min(window.devicePixelRatio || 1, 1.5);
    this.renderer.setPixelRatio(maxPR);
    this.renderer.shadowMap.enabled = false;

    // Clear stale canvas children before attaching
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.touchAction = 'none';
    container.appendChild(this.renderer.domElement);

    // WebGL Context Loss Recovery (Prevents main canvas freezing while minimap moves)
    this.renderer.domElement.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      console.warn('WebGL Context Lost - Restoring...');
    }, false);

    this.renderer.domElement.addEventListener('webglcontextrestored', () => {
      console.info('WebGL Context Restored - Resuming 3D Render');
      if (!this.isDestroyed) {
        this.renderer.render(this.scene, this.camera);
      }
    }, false);

    // 5. Surrounding Meadow (infinite horizon)
    this.setupSurroundingMeadow();

    // 6. Geometry & Material Cache - Flat 2D Plane Geometry for crisp, seamless ground
    this.tileGeometry = new THREE.PlaneGeometry(this.tileSize * 1.01, this.tileSize * 1.01);
    this.tileGeometry.rotateX(-Math.PI / 2);
    this.tileMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      flatShading: true,
    });

    // 7. Dynamic Groups
    this.buildingGroup = new THREE.Group();
    this.scene.add(this.buildingGroup);

    this.animalGroup = new THREE.Group();
    this.scene.add(this.animalGroup);

    // 8. Single Tile Cursor
    const cursorGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(this.tileSize * 0.98, 0.22, this.tileSize * 0.98));
    const cursorMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    this.tileCursor = new THREE.Mesh(cursorGeo, cursorMat);
    this.tileCursor.position.y = 0.12;
    this.scene.add(this.tileCursor);

    // 9. Smart 3x3 Sowing Grid Indicator
    this.tileCursor3x3 = new THREE.Group();
    this.cursor3x3Mat = new THREE.LineBasicMaterial({ color: 0x22c55e, linewidth: 2 });

    const outer3x3Geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(this.tileSize * 3 * 0.98, 0.22, this.tileSize * 3 * 0.98));
    const outer3x3Mesh = new THREE.Mesh(outer3x3Geo, this.cursor3x3Mat);
    this.tileCursor3x3.add(outer3x3Mesh);

    // Add 9 inner sub-cell wireframes
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const subGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(this.tileSize * 0.94, 0.22, this.tileSize * 0.94));
        const subMesh = new THREE.Mesh(subGeo, this.cursor3x3Mat);
        subMesh.position.set(dx * this.tileSize, 0, dz * this.tileSize);
        this.tileCursor3x3.add(subMesh);
      }
    }
    this.tileCursor3x3.position.y = 0.12;
    this.tileCursor3x3.visible = false;
    this.scene.add(this.tileCursor3x3);

    // Player
    this.playerMesh = ModelFactory.createPlayer(this.activePalette);
    const halfW = (this.gridWidth * this.tileSize) / 2;
    const halfH = (this.gridHeight * this.tileSize) / 2;
    const initX = 7 * this.tileSize - halfW + this.tileSize / 2;
    const initZ = 12 * this.tileSize - halfH + this.tileSize / 2;
    this.playerMesh.position.set(initX, 0.2, initZ);
    this.scene.add(this.playerMesh);

    // Setup Environment
    this.setupGroundGrid();
    this.setupStaticBuildings();
    this.setupInstancedTrees();

    // Initialize RAM Lookup Table (LUT) and Preheat WebGL Shader Pipeline
    MemoryHeapManager.initializeLUT(this.activePalette);
    ShaderPipelinePreheater.preheatPipeline(this.renderer, this.camera, this.activePalette);

    // Event Listeners
    window.addEventListener('resize', this.onWindowResize);
    this.setupRaycasting();

    this.lastFpsUpdate = performance.now();
    this.renderer.setAnimationLoop(this.animate);
  }

  // Meadow Base
  private setupSurroundingMeadow() {
    if (this.meadowMesh) {
      this.scene.remove(this.meadowMesh);
      this.meadowMesh.geometry.dispose();
      (this.meadowMesh.material as THREE.Material).dispose();
    }
    const meadowGeo = new THREE.PlaneGeometry(320, 320);
    const meadowMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color(this.activePalette.grassColor),
      flatShading: true,
    });
    this.meadowMesh = new THREE.Mesh(meadowGeo, meadowMat);
    this.meadowMesh.rotation.x = -Math.PI / 2;
    this.meadowMesh.position.y = -0.5;
    this.meadowMesh.frustumCulled = true;
    this.scene.add(this.meadowMesh);
  }

  public setOnTileTap(cb: (x: number, z: number) => void) {
    this.onTileTapCallback = cb;
  }

  public setOnExitReached(cb: (target: MapLocation, spawnPos?: { x: number; z: number }) => void) {
    this.onExitReachedCallback = cb;
  }

  // Handle direct touch tap on 3D tiles
  private setupRaycasting() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointer = (clientX: number, clientY: number) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera);

      if (this.groundInstancedMesh) {
        const intersects = raycaster.intersectObject(this.groundInstancedMesh);
        if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
          const id = intersects[0].instanceId;
          const gx = id % this.gridWidth;
          const gz = Math.floor(id / this.gridWidth);

          if (this.onTileTapCallback) {
            this.onTileTapCallback(gx, gz);
          }
        }
      }
    };

    let touchStartTime = 0;
    let startX = 0;
    let startY = 0;

    this.renderer.domElement.addEventListener('pointerdown', (e) => {
      touchStartTime = performance.now();
      startX = e.clientX;
      startY = e.clientY;
    });

    this.renderer.domElement.addEventListener('pointerup', (e) => {
      const diffTime = performance.now() - touchStartTime;
      const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
      if (diffTime < 400 && dist < 14) {
        handlePointer(e.clientX, e.clientY);
      }
    });
  }

  // Create Ground Grid using Texture-Mapped Instanced Meshes
  public setupGroundGrid() {
    if (this.groundInstancedMesh) {
      this.scene.remove(this.groundInstancedMesh);
      this.groundInstancedMesh.dispose();
    }
    if (this.visualGrassMesh) {
      this.scene.remove(this.visualGrassMesh);
      this.visualGrassMesh.dispose();
      this.scene.remove(this.visualSoilMesh);
      this.visualSoilMesh.dispose();
      this.scene.remove(this.visualPathMesh);
      this.visualPathMesh.dispose();
      this.scene.remove(this.visualSandMesh);
      this.visualSandMesh.dispose();
      this.scene.remove(this.visualRockMesh);
      this.visualRockMesh.dispose();
      this.scene.remove(this.visualWaterMesh);
      this.visualWaterMesh.dispose();
      if (this.visualTuftsMesh) {
        this.scene.remove(this.visualTuftsMesh);
        this.visualTuftsMesh.dispose();
        this.scene.remove(this.visualFlowersMesh);
        this.visualFlowersMesh.dispose();
      }
    }

    const totalTiles = this.gridWidth * this.gridHeight;
    this.groundInstancedMesh = new THREE.InstancedMesh(this.tileGeometry, new THREE.MeshBasicMaterial({ visible: false }), totalTiles);
    this.groundInstancedMesh.frustumCulled = true;

    this.visualGrassMesh = new THREE.InstancedMesh(this.tileGeometry, grassMat, totalTiles);
    this.visualSoilMesh = new THREE.InstancedMesh(this.tileGeometry, soilMat, totalTiles);
    this.visualPathMesh = new THREE.InstancedMesh(this.tileGeometry, pathMat, totalTiles);
    this.visualSandMesh = new THREE.InstancedMesh(this.tileGeometry, sandMat, totalTiles);
    this.visualRockMesh = new THREE.InstancedMesh(this.tileGeometry, rockMat, totalTiles);
    this.visualWaterMesh = new THREE.InstancedMesh(this.tileGeometry, waterMat, totalTiles);

    // Stylized Multi-Blade Organic Grass Tufts
    const tuftGeo = new THREE.CylinderGeometry(0.01, 0.22, 0.35, 5);
    const tuftMat = new THREE.MeshLambertMaterial({ color: 0x16a34a, flatShading: true });
    const flowerGeo = new THREE.DodecahedronGeometry(0.08);
    const flowerMat = new THREE.MeshLambertMaterial({ color: 0xfef08a, flatShading: true });

    this.visualTuftsMesh = new THREE.InstancedMesh(tuftGeo, tuftMat, totalTiles * 2);
    this.visualFlowersMesh = new THREE.InstancedMesh(flowerGeo, flowerMat, totalTiles);

    this.visualGrassMesh.frustumCulled = true;
    this.visualSoilMesh.frustumCulled = true;
    this.visualPathMesh.frustumCulled = true;
    this.visualSandMesh.frustumCulled = true;
    this.visualRockMesh.frustumCulled = true;
    this.visualWaterMesh.frustumCulled = true;
    this.visualTuftsMesh.frustumCulled = true;
    this.visualFlowersMesh.frustumCulled = true;

    this.scene.add(this.groundInstancedMesh);
    this.scene.add(this.visualGrassMesh);
    this.scene.add(this.visualSoilMesh);
    this.scene.add(this.visualPathMesh);
    this.scene.add(this.visualSandMesh);
    this.scene.add(this.visualRockMesh);
    this.scene.add(this.visualWaterMesh);
    this.scene.add(this.visualTuftsMesh);
    this.scene.add(this.visualFlowersMesh);
  }

  // Instanced Trees on Perimeter with Gate Openings
  private setupInstancedTrees() {
    if (this.treeTrunkInstanced) {
      this.scene.remove(this.treeTrunkInstanced);
      this.treeTrunkInstanced.dispose();
    }
    if (this.treeLeafInstanced) {
      this.scene.remove(this.treeLeafInstanced);
      this.treeLeafInstanced.dispose();
    }

    // Inside the house, no perimeter forest trees needed
    if (this.currentLocation === 'house_interior') {
      return;
    }

    const halfW = (this.gridWidth * this.tileSize) / 2;
    const halfH = (this.gridHeight * this.tileSize) / 2;
    const borderDistX = halfW - 1.2;
    const borderDistZ = halfH - 1.2;

    const positions: { x: number; z: number; scale: number }[] = [];

    if (this.currentLocation === 'farm') {
      // North border with opening for North Gate (around x = -9.0, z = -borderDistZ)
      for (let x = -borderDistX; x <= borderDistX; x += 2.2) {
        if (x > -10.5 && x < -7.5) {
          // Leave opening for North Gate to Village
          continue;
        }
        if (Math.abs(x) > 2.5) {
          positions.push({ x, z: -borderDistZ, scale: 0.9 + (Math.abs(x) % 3) * 0.1 });
          positions.push({ x: x + 0.6, z: -borderDistZ + 1.4, scale: 0.85 });
        }
      }

      // South border
      for (let x = -borderDistX; x <= borderDistX; x += 2.2) {
        positions.push({ x, z: borderDistZ, scale: 0.95 });
      }

      // West border
      for (let z = -borderDistZ + 2.0; z <= borderDistZ - 2.0; z += 2.2) {
        positions.push({ x: -borderDistX, z, scale: 0.9 });
      }

      // East border
      for (let z = -borderDistZ + 2.0; z <= borderDistZ - 2.0; z += 2.2) {
        positions.push({ x: borderDistX, z, scale: 0.95 });
      }
    } else {
      // Village 48x48: North, East, West closed, South has opening at x = 0 (around center bottom)
      // North border
      for (let x = -borderDistX; x <= borderDistX; x += 2.4) {
        positions.push({ x, z: -borderDistZ, scale: 1.0 });
        positions.push({ x: x + 0.6, z: -borderDistZ + 1.4, scale: 0.85 });
      }

      // South border with opening for South Gate to Farm (around x = 0)
      for (let x = -borderDistX; x <= borderDistX; x += 2.4) {
        if (x > -2.2 && x < 2.2) {
          // Leave opening for South Village Gate
          continue;
        }
        positions.push({ x, z: borderDistZ, scale: 1.0 });
      }

      // West border
      for (let z = -borderDistZ + 2.2; z <= borderDistZ - 2.2; z += 2.4) {
        positions.push({ x: -borderDistX, z, scale: 0.95 });
      }

      // East border
      for (let z = -borderDistZ + 2.2; z <= borderDistZ - 2.2; z += 2.4) {
        positions.push({ x: borderDistX, z, scale: 0.95 });
      }
    }

    const count = positions.length;

    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 1.2, 5);
    const trunkMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color(this.activePalette.woodColor),
      flatShading: true,
    });
    this.treeTrunkInstanced = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
    this.treeTrunkInstanced.frustumCulled = true;

    const leafGeo = new THREE.ConeGeometry(0.9, 1.8, 5);
    const leafMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color(this.activePalette.leavesColor),
      flatShading: true,
    });
    this.treeLeafInstanced = new THREE.InstancedMesh(leafGeo, leafMat, count);
    this.treeLeafInstanced.frustumCulled = true;

    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const p = positions[i];

      dummy.position.set(p.x, 0.6 * p.scale, p.z);
      dummy.scale.set(p.scale, p.scale, p.scale);
      dummy.updateMatrix();
      this.treeTrunkInstanced.setMatrixAt(i, dummy.matrix);

      dummy.position.set(p.x, (1.2 + 0.9) * p.scale, p.z);
      dummy.scale.set(p.scale, p.scale, p.scale);
      dummy.updateMatrix();
      this.treeLeafInstanced.setMatrixAt(i, dummy.matrix);
    }

    this.treeTrunkInstanced.instanceMatrix.needsUpdate = true;
    this.treeLeafInstanced.instanceMatrix.needsUpdate = true;
    this.treeTrunkInstanced.geometry.computeBoundingSphere();
    this.treeLeafInstanced.geometry.computeBoundingSphere();

    this.scene.add(this.treeTrunkInstanced);
    this.scene.add(this.treeLeafInstanced);
  }

  // Fast Tile update with Texture Pack Visual Instanced Meshes
  public updateTiles(tiles: Map<string, TileState>) {
    if (!this.groundInstancedMesh) return;

    const dummy = new THREE.Object3D();
    const halfW = (this.gridWidth * this.tileSize) / 2;
    const halfH = (this.gridHeight * this.tileSize) / 2;

    const currentCropKeys = new Set<string>();
    const currentDebrisKeys = new Set<string>();

    let gIdx = 0;
    let sIdx = 0;
    let pIdx = 0;
    let sdIdx = 0;
    let rIdx = 0;
    let wIdx = 0;
    let tfIdx = 0;
    let flIdx = 0;

    const isCoast = this.currentLocation === 'coast';
    const isMountain = this.currentLocation === 'mountain';

    tiles.forEach((tile) => {
      const idx = tile.z * this.gridWidth + tile.x;
      if (idx < 0 || idx >= this.gridWidth * this.gridHeight) return;

      dummy.scale.set(1, 1, 1);

      const posX = tile.x * this.tileSize - halfW + this.tileSize / 2;
      const posZ = tile.z * this.tileSize - halfH + this.tileSize / 2;
      const isWater = tile.type === 'water';

      // Deterministic 4-Direction Rotation Index for Organic Variation
      const rotIdx = (tile.x * 37 + tile.z * 17) % 4;
      const rotAngle = rotIdx * (Math.PI / 2);

      const tileElevY = calculateTileElevation(tile.x, tile.z, this.currentLocation, tile.type);

      // Raycasting Collision Mesh
      dummy.position.set(posX, tileElevY, posZ);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      this.groundInstancedMesh.setMatrixAt(idx, dummy.matrix);

      // Visual Textured Meshes
      if (tile.type === 'water') {
        dummy.position.set(posX, -0.01, posZ);
        dummy.rotation.set(0, rotAngle, 0);
        dummy.updateMatrix();
        this.visualWaterMesh.setMatrixAt(wIdx++, dummy.matrix);
      } else if (tile.type === 'path') {
        const northTile = tiles.get(`${tile.x}_${tile.z - 1}`);
        const southTile = tiles.get(`${tile.x}_${tile.z + 1}`);
        const westTile = tiles.get(`${tile.x - 1}_${tile.z}`);
        const eastTile = tiles.get(`${tile.x + 1}_${tile.z}`);

        const isPathType = (t?: TileState) => t && t.type === 'path';
        const hasN = isPathType(northTile);
        const hasS = isPathType(southTile);
        const hasW = isPathType(westTile);
        const hasE = isPathType(eastTile);

        // Smart Path Direction Auto-Rotation:
        let pathAngle = 0;
        if ((hasN || hasS) && !(hasW || hasE)) {
          // Vertical segment (North-South) -> 0 degrees to align cobblestones lengthwise along Z-axis
          pathAngle = 0;
        } else if ((hasW || hasE) && !(hasN || hasS)) {
          // Horizontal segment (East-West) -> 90 degrees to align cobblestones lengthwise along X-axis
          pathAngle = Math.PI / 2;
        } else if (hasN && hasE && !hasS && !hasW) {
          // Corner North-East -> 45 degrees diagonal transition
          pathAngle = Math.PI / 4;
        } else if (hasE && hasS && !hasW && !hasN) {
          // Corner East-South -> 135 degrees diagonal transition
          pathAngle = (3 * Math.PI) / 4;
        } else if (hasS && hasW && !hasN && !hasE) {
          // Corner South-West -> 225 degrees diagonal transition
          pathAngle = (5 * Math.PI) / 4;
        } else if (hasW && hasN && !hasS && !hasE) {
          // Corner West-North -> 315 degrees diagonal transition
          pathAngle = -Math.PI / 4;
        } else {
          pathAngle = 0;
        }

        dummy.position.set(posX, tileElevY + 0.003, posZ);
        dummy.rotation.set(0, pathAngle, 0);
        dummy.updateMatrix();
        this.visualPathMesh.setMatrixAt(pIdx++, dummy.matrix);
      } else if (tile.type === 'soil') {
        // Keep farmland soil rows neatly aligned flush (Y = 0.005)
        dummy.position.set(posX, tileElevY + 0.005, posZ);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        this.visualSoilMesh.setMatrixAt(sIdx++, dummy.matrix);
      } else if (isCoast) {
        dummy.position.set(posX, tileElevY + 0.002, posZ);
        dummy.rotation.set(0, rotAngle, 0);
        dummy.updateMatrix();
        this.visualSandMesh.setMatrixAt(sdIdx++, dummy.matrix);
      } else if (isMountain) {
        dummy.position.set(posX, tileElevY + 0.002, posZ);
        dummy.rotation.set(0, rotAngle, 0);
        dummy.updateMatrix();
        this.visualRockMesh.setMatrixAt(rIdx++, dummy.matrix);
      } else {
        dummy.position.set(posX, tileElevY, posZ);
        dummy.rotation.set(0, rotAngle, 0);
        dummy.updateMatrix();
        this.visualGrassMesh.setMatrixAt(gIdx++, dummy.matrix);

        // Subtle sparse wildflowers for a clean, flat, pristine lawn
        if (!tile.crop && !tile.debris && (tile.x * 13 + tile.z * 7) % 6 === 0) {
          dummy.position.set(posX, tileElevY + 0.1, posZ);
          dummy.scale.set(0.8, 0.8, 0.8);
          dummy.rotation.set(0, 0, 0);
          dummy.updateMatrix();
          this.visualFlowersMesh.setMatrixAt(flIdx++, dummy.matrix);
        }
      }

      const key = `${tile.x}_${tile.z}`;

      // Check crop mesh
      if (tile.crop) {
        currentCropKeys.add(key);
        const existingCrop = this.cropMeshMap.get(key);
        if (!existingCrop || existingCrop.userData.stage !== tile.crop.stage || existingCrop.userData.type !== tile.crop.type) {
          if (existingCrop) {
            this.scene.remove(existingCrop);
          }
          const cropMesh = ModelFactory.createCrop(tile.crop.type, tile.crop.stage, this.activePalette);
          cropMesh.position.set(posX, tileElevY + 0.2, posZ);
          cropMesh.userData = { stage: tile.crop.stage, type: tile.crop.type };
          cropMesh.frustumCulled = true;
          this.scene.add(cropMesh);
          this.cropMeshMap.set(key, cropMesh);
        }
      }

      // Check debris mesh
      if (tile.debris) {
        currentDebrisKeys.add(key);
        const existingDebris = this.debrisMeshMap.get(key);
        if (!existingDebris || existingDebris.userData.type !== tile.debris) {
          if (existingDebris) {
            this.scene.remove(existingDebris);
          }
          const debrisMesh = ModelFactory.createDebris(tile.debris, this.activePalette);
          debrisMesh.position.set(posX, tileElevY + 0.18, posZ);
          debrisMesh.userData = { type: tile.debris };
          debrisMesh.frustumCulled = true;
          this.scene.add(debrisMesh);
          this.debrisMeshMap.set(key, debrisMesh);
        }
      }
    });

    // Update active render counts for each textured mesh
    this.visualGrassMesh.count = gIdx;
    this.visualSoilMesh.count = sIdx;
    this.visualPathMesh.count = pIdx;
    this.visualSandMesh.count = sdIdx;
    this.visualRockMesh.count = rIdx;
    this.visualWaterMesh.count = wIdx;
    this.visualTuftsMesh.count = tfIdx;
    this.visualFlowersMesh.count = flIdx;

    this.visualGrassMesh.instanceMatrix.needsUpdate = true;
    this.visualSoilMesh.instanceMatrix.needsUpdate = true;
    this.visualPathMesh.instanceMatrix.needsUpdate = true;
    this.visualSandMesh.instanceMatrix.needsUpdate = true;
    this.visualRockMesh.instanceMatrix.needsUpdate = true;
    this.visualWaterMesh.instanceMatrix.needsUpdate = true;
    this.visualTuftsMesh.instanceMatrix.needsUpdate = true;
    this.visualFlowersMesh.instanceMatrix.needsUpdate = true;
    this.groundInstancedMesh.instanceMatrix.needsUpdate = true;

    // Remove harvested crops
    this.cropMeshMap.forEach((mesh, key) => {
      if (!currentCropKeys.has(key)) {
        this.scene.remove(mesh);
        this.cropMeshMap.delete(key);
      }
    });

    // Remove cleared debris
    this.debrisMeshMap.forEach((mesh, key) => {
      if (!currentDebrisKeys.has(key)) {
        this.scene.remove(mesh);
        this.debrisMeshMap.delete(key);
      }
    });
  }

  // Static Buildings & Props Setup from WorldRegistry
  private setupStaticBuildings() {
    // Remove all existing buildings cleanly
    while (this.buildingGroup.children.length > 0) {
      const child = this.buildingGroup.children[0];
      this.buildingGroup.remove(child);
    }

    const halfW = (this.gridWidth * this.tileSize) / 2;
    const halfH = (this.gridHeight * this.tileSize) / 2;
    const region = WorldRegistry.getRegion(this.currentLocation);

    region.staticProps.forEach((prop) => {
      const posX = prop.gridX * this.tileSize - halfW + this.tileSize / 2;
      const posZ = prop.gridZ * this.tileSize - halfH + this.tileSize / 2;
      const posY = prop.worldY ?? 0.1;

      let meshGroup: THREE.Group | null = null;

      if (prop.type === 'farmhouse') {
        meshGroup = ModelFactory.createFarmhouse(this.activePalette);
      } else if (prop.type === 'windmill') {
        meshGroup = ModelFactory.createWindmill(this.activePalette);
      } else if (prop.type === 'shipping_bin') {
        meshGroup = ModelFactory.createShippingBin(this.activePalette);
      } else if (prop.type === 'wooden_bridge') {
        meshGroup = ModelFactory.createWoodenBridge();
      } else if (prop.type === 'gate') {
        const isNorth = prop.rotationY === undefined || prop.rotationY === 0;
        meshGroup = ModelFactory.createGateArchway(isNorth);
      } else if (prop.type === 'interior_bed') {
        meshGroup = ModelFactory.createBed();
      } else if (prop.type === 'interior_kitchen') {
        meshGroup = ModelFactory.createKitchenCounter();
      } else if (prop.type === 'interior_chest') {
        meshGroup = ModelFactory.createStorageChest();
      } else if (prop.type === 'interior_dining_table') {
        meshGroup = ModelFactory.createDiningTable();
      } else if (prop.type === 'interior_fireplace') {
        meshGroup = ModelFactory.createFireplace();
      } else if (prop.type === 'interior_rug') {
        meshGroup = ModelFactory.createCozyRug();
      } else if (prop.type === 'interior_walls') {
        meshGroup = ModelFactory.createInteriorWalls(region.width, region.height, this.tileSize);
      } else if (prop.type === 'signpost') {
        meshGroup = ModelFactory.createSignpost();
      } else if (prop.type === 'mine_entrance') {
        meshGroup = ModelFactory.createMineEntrance();
      } else if (prop.type === 'crystal_cluster') {
        meshGroup = ModelFactory.createCrystalCluster();
      } else if (prop.type === 'rest_bench') {
        meshGroup = ModelFactory.createRestBench();
      } else if (prop.type === 'lighthouse') {
        meshGroup = ModelFactory.createLighthouse();
      } else if (prop.type === 'pier_dock') {
        meshGroup = ModelFactory.createPierDock();
      } else if (prop.type === 'fishing_boat') {
        meshGroup = ModelFactory.createFishingBoat();
      } else if (prop.type === 'stone_stairs') {
        meshGroup = ModelFactory.createStoneStairs();
      } else if (prop.type === 'fishing_shack') {
        meshGroup = ModelFactory.createFishingShack();
      }

      if (meshGroup) {
        meshGroup.position.set(posX, posY, posZ);
        if (prop.rotationY) {
          meshGroup.rotation.y = prop.rotationY;
        }
        meshGroup.frustumCulled = true;
        this.buildingGroup.add(meshGroup);
      }
    });
  }

  // Switch between any registered WorldRegion Map
  public switchLocation(
    location: MapLocation,
    tiles: Map<string, TileState>,
    spawnPos?: { x: number; z: number }
  ) {
    this.currentLocation = location;
    const region = WorldRegistry.getRegion(location);
    this.gridWidth = region.width;
    this.gridHeight = region.height;

    // Clear existing crops & debris meshes
    this.cropMeshMap.forEach((mesh) => this.scene.remove(mesh));
    this.cropMeshMap.clear();
    this.debrisMeshMap.forEach((mesh) => this.scene.remove(mesh));
    this.debrisMeshMap.clear();

    // Re-build ground and buildings
    this.setupSurroundingMeadow();
    this.setupGroundGrid();
    this.setupStaticBuildings();
    this.setupInstancedTrees();
    this.updateTiles(tiles);

    // Position player
    const targetSpawn = spawnPos || region.defaultSpawn;
    const halfW = (this.gridWidth * this.tileSize) / 2;
    const halfH = (this.gridHeight * this.tileSize) / 2;
    const posX = targetSpawn.x * this.tileSize - halfW + this.tileSize / 2;
    const posZ = targetSpawn.z * this.tileSize - halfH + this.tileSize / 2;

    this.playerMesh.position.set(posX, 0.2, posZ);
    this.targetTilePos = null;
    this.inputVector = { x: 0, z: 0 };
    this.lastExitTriggerTime = performance.now() + 2500; // 2.5 seconds gate trigger immunity upon spawning

    // Center perspective camera on player
    const maxCamSpan = halfW - 4.5;
    const camFocusX = Math.max(-maxCamSpan, Math.min(maxCamSpan, posX));
    const camFocusZ = Math.max(-maxCamSpan, Math.min(maxCamSpan, posZ));

    const horizDist = this.currentCamDist * Math.cos(this.currentPitch);
    const camY = 0.2 + this.currentCamDist * Math.sin(this.currentPitch);
    const offsetXZ = horizDist * 0.7071;

    this.camera.position.set(camFocusX + offsetXZ, camY, camFocusZ + offsetXZ);
    this.camera.lookAt(camFocusX, 0.5, camFocusZ);

    // Warm up & force immediate pre-render of new map
    this.renderer.render(this.scene, this.camera);
  }

  // Check if player is standing near the Shipping Bin (Farm only)
  public isNearShippingBin(): boolean {
    if (this.currentLocation !== 'farm') return false;
    const dist = Math.hypot(this.playerMesh.position.x - 3.0, this.playerMesh.position.z - (-9.5));
    return dist < 2.5;
  }

  // Animals
  public updateAnimals(animals: PlacedAnimal[]) {
    while (this.animalGroup.children.length > 0) {
      this.animalGroup.remove(this.animalGroup.children[0]);
    }

    if (this.currentLocation !== 'farm') return;

    const halfW = (this.gridWidth * this.tileSize) / 2;
    const halfH = (this.gridHeight * this.tileSize) / 2;

    animals.forEach((a) => {
      let mesh: THREE.Group;
      if (a.type === 'chicken') mesh = ModelFactory.createChicken();
      else if (a.type === 'cow') mesh = ModelFactory.createCow();
      else mesh = ModelFactory.createSheep();

      const posX = a.x * this.tileSize - halfW + this.tileSize / 2;
      const posZ = a.z * this.tileSize - halfH + this.tileSize / 2;

      mesh.position.set(posX, 0.2, posZ);
      mesh.frustumCulled = true;
      this.animalGroup.add(mesh);
    });
  }

  // Set Day/Night Sky & Lights using pre-computed MemoryHeapManager LUT (Zero Allocation)
  public setTimeAndWeather(timeHour: number, weather: 'sunny' | 'rainy' | 'foggy' | 'golden') {
    const lut = MemoryHeapManager.getLightingForHour(timeHour);
    if (lut) {
      this.scene.background = lut.skyColor;
      if (this.scene.fog instanceof THREE.FogExp2) {
        this.scene.fog.color = lut.skyColor;
        this.scene.fog.density = weather === 'foggy' ? 0.025 : 0.009;
      }
      this.ambLight.color = lut.ambColor;
      this.ambLight.intensity = weather === 'rainy' ? lut.ambIntensity * 0.7 : lut.ambIntensity;
      this.dirLight.color = lut.dirColor;
      this.dirLight.intensity = weather === 'rainy' ? lut.dirIntensity * 0.5 : lut.dirIntensity;
      this.dirLight.position.set(lut.dirPosX, lut.dirPosY, lut.dirPosZ);
    }
  }

  // Apply Texture Pack
  public applyTexturePack(palette: TexturePackPalette) {
    this.activePalette = palette;
    this.scene.background = new THREE.Color(palette.skyNoon);
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color = new THREE.Color(palette.skyNoon);
    }
    this.setupSurroundingMeadow();
    this.setupGroundGrid();
    this.setupStaticBuildings();
    this.setupInstancedTrees();
    this.cropMeshMap.forEach((mesh) => this.scene.remove(mesh));
    this.cropMeshMap.clear();
    this.debrisMeshMap.forEach((mesh) => this.scene.remove(mesh));
    this.debrisMeshMap.clear();
  }

  // Apply Performance Settings & Camera Zoom
  public applyPerformanceSettings(settings: PerformanceSettings) {
    this.settings = settings;
    const maxPR = Math.min(window.devicePixelRatio || 1, 1.25);
    this.renderer.setPixelRatio(maxPR);
    this.updateCameraBounds();
  }

  public updateCameraBounds() {
    if (!this.container) return;
    const width = this.container.clientWidth || window.innerWidth || 800;
    const height = this.container.clientHeight || window.innerHeight || 600;
    const aspect = width / height;
    this.camera.aspect = aspect;
    const zoom = this.settings.cameraZoom || 1.4;
    const baseFov = aspect < 1 ? 48 : 42;
    this.camera.fov = baseFov / (zoom * 0.7);
    this.camera.updateProjectionMatrix();
  }

  // Direct Input Vector from Touch Joystick
  public setInputVector(x: number, z: number) {
    this.inputVector.x = x;
    this.inputVector.z = z;
  }

  // Switch between 1x1 cursor and 3x3 planting grid indicator with smart ready-soil color
  public setCursorMode(mode: 'single' | '3x3', hasReadyTiles: boolean = true) {
    if (mode === '3x3') {
      this.tileCursor.visible = false;
      this.tileCursor3x3.visible = true;
      this.cursor3x3Mat.color.setHex(hasReadyTiles ? 0x22c55e : 0xef4444);
    } else {
      this.tileCursor.visible = true;
      this.tileCursor3x3.visible = false;
    }
  }

  // Tap-to-move target
  public movePlayerToGrid(gx: number, gz: number) {
    const halfW = (this.gridWidth * this.tileSize) / 2;
    const halfH = (this.gridHeight * this.tileSize) / 2;

    this.targetTilePos = new THREE.Vector3(
      gx * this.tileSize - halfW + this.tileSize / 2,
      0.2,
      gz * this.tileSize - halfH + this.tileSize / 2
    );
  }

  // Get currently targeted or standing grid position
  public getPlayerGridPos(): { x: number; z: number } {
    const halfW = (this.gridWidth * this.tileSize) / 2;
    const halfH = (this.gridHeight * this.tileSize) / 2;

    const gx = Math.floor((this.playerMesh.position.x + halfW) / this.tileSize);
    const gz = Math.floor((this.playerMesh.position.z + halfH) / this.tileSize);

    return {
      x: Math.max(0, Math.min(this.gridWidth - 1, gx)),
      z: Math.max(0, Math.min(this.gridHeight - 1, gz)),
    };
  }

  private onWindowResize = () => {
    if (!this.container || this.isDestroyed) return;
    const width = this.container.clientWidth || window.innerWidth || 800;
    const height = this.container.clientHeight || window.innerHeight || 600;
    this.renderer.setSize(width, height);
    this.updateCameraBounds();
  };

  // Main Render & Physics Animation Loop
  private animate = () => {
    if (this.isDestroyed) return;

    try {
      const delta = Math.min(this.clock.getDelta(), 0.1);

    // FPS Counter
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsUpdate >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    const inputLen = Math.hypot(this.inputVector.x, this.inputVector.z);
    let isWalking = false;

    const halfW = (this.gridWidth * this.tileSize) / 2;
    const halfH = (this.gridHeight * this.tileSize) / 2;

    // Movement
    if (inputLen > 0.08) {
      this.targetTilePos = null;
      isWalking = true;

      const angle = Math.atan2(this.inputVector.z, this.inputVector.x) - Math.PI / 4;
      const speed = 4.8;
      const moveDist = speed * Math.min(1.0, inputLen) * delta;

      const targetFacing = -angle + Math.PI / 2;
      const facingAlpha = 1 - Math.exp(-18.0 * delta);
      this.playerMesh.rotation.y = THREE.MathUtils.lerp(this.playerMesh.rotation.y, targetFacing, facingAlpha);

      const dx = Math.cos(angle) * moveDist;
      const dz = Math.sin(angle) * moveDist;

      // 1. Try X movement with solid obstacle collision
      const targetX = this.playerMesh.position.x + dx;
      const curZ = this.playerMesh.position.z;
      const gridX_X = (targetX + halfW - this.tileSize / 2) / this.tileSize;
      const gridZ_X = (curZ + halfH - this.tileSize / 2) / this.tileSize;
      if (!WorldRegistry.isPositionSolid(this.currentLocation, gridX_X, gridZ_X)) {
        this.playerMesh.position.x = targetX;
      }

      // 2. Try Z movement with solid obstacle collision (allows smooth sliding along walls)
      const curX = this.playerMesh.position.x;
      const targetZ = this.playerMesh.position.z + dz;
      const gridX_Z = (curX + halfW - this.tileSize / 2) / this.tileSize;
      const gridZ_Z = (targetZ + halfH - this.tileSize / 2) / this.tileSize;
      if (!WorldRegistry.isPositionSolid(this.currentLocation, gridX_Z, gridZ_Z)) {
        this.playerMesh.position.z = targetZ;
      }
    }
    // Tap-to-move
    else if (this.targetTilePos) {
      const dist = this.playerMesh.position.distanceTo(this.targetTilePos);
      if (dist > 0.08) {
        isWalking = true;
        const dirX = this.targetTilePos.x - this.playerMesh.position.x;
        const dirZ = this.targetTilePos.z - this.playerMesh.position.z;
        const facing = Math.atan2(dirX, dirZ);
        this.playerMesh.rotation.y = THREE.MathUtils.lerp(this.playerMesh.rotation.y, facing, 0.3);

        const moveDist = Math.min(1.0, 10.0 * delta);
        const nextX = THREE.MathUtils.lerp(this.playerMesh.position.x, this.targetTilePos.x, moveDist);
        const nextZ = THREE.MathUtils.lerp(this.playerMesh.position.z, this.targetTilePos.z, moveDist);

        const gridX = (nextX + halfW - this.tileSize / 2) / this.tileSize;
        const gridZ = (nextZ + halfH - this.tileSize / 2) / this.tileSize;

        if (!WorldRegistry.isPositionSolid(this.currentLocation, gridX, gridZ)) {
          this.playerMesh.position.x = nextX;
          this.playerMesh.position.z = nextZ;
        } else {
          this.targetTilePos = null;
        }
      } else {
        this.targetTilePos = null;
      }
    }

    // Clamp player movement strictly inside perimeter tree boundary, but ALLOW walking through gate passages!
    const curWorldX = this.playerMesh.position.x;

    const bounds = WorldRegistry.getRegionBoundaries(this.currentLocation, curWorldX, halfW, halfH);
    this.playerMesh.position.x = Math.max(bounds.minBoundX, Math.min(bounds.maxBoundX, this.playerMesh.position.x));
    this.playerMesh.position.z = Math.max(bounds.minBoundZ, Math.min(bounds.maxBoundZ, this.playerMesh.position.z));

    // Check Map Transition Trigger at Gate dynamically via WorldRegistry
    const curGrid = this.getPlayerGridPos();
    if (now >= this.lastExitTriggerTime && this.onExitReachedCallback) {
      const activeGate = WorldRegistry.checkGateTrigger(this.currentLocation, curGrid.x, curGrid.z);
      if (activeGate) {
        this.lastExitTriggerTime = now + 3000;
        this.onExitReachedCallback(activeGate.targetLocation, activeGate.targetSpawn);
      }
    }

    // Calculate player standing tile elevation height
    const pGrid = this.getPlayerGridPos();
    const standElevY = calculateTileElevation(pGrid.x, pGrid.z, this.currentLocation, 'grass');

    // Player walking bobble + Heightfield Elevation
    if (isWalking) {
      this.walkAnimTime += delta * 14;
      this.playerMesh.position.y = standElevY + 0.2 + Math.abs(Math.sin(this.walkAnimTime)) * 0.08;
    } else {
      this.playerMesh.position.y = THREE.MathUtils.lerp(this.playerMesh.position.y, standElevY + 0.2, 0.2);
    }

    // Update Tile Cursor Position (Single & 3x3)
    const curPos = this.getPlayerGridPos();
    const cursorX = curPos.x * this.tileSize - halfW + this.tileSize / 2;
    const cursorZ = curPos.z * this.tileSize - halfH + this.tileSize / 2;
    this.tileCursor.position.x = cursorX;
    this.tileCursor.position.y = standElevY + 0.12;
    this.tileCursor.position.z = cursorZ;
    this.tileCursor3x3.position.x = cursorX;
    this.tileCursor3x3.position.y = standElevY + 0.12;
    this.tileCursor3x3.position.z = cursorZ;

    // Smooth 3D Perspective Camera Tracking & Auto-Tilt near Gates
    const targetPlayerPos = this.playerMesh.position;

    // Check proximity to ANY gate or door trigger area
    let isNearGate = false;
    const regionGates = WorldRegistry.getRegion(this.currentLocation).gates;
    const curGridPos = this.getPlayerGridPos();

    for (const g of regionGates) {
      const gateCenterX = (g.triggerArea.minX + g.triggerArea.maxX) / 2;
      const gateCenterZ = (g.triggerArea.minZ + g.triggerArea.maxZ) / 2;
      const distToGate = Math.hypot(curGridPos.x - gateCenterX, curGridPos.z - gateCenterZ);
      if (distToGate <= 4.2) {
        isNearGate = true;
        break;
      }
    }

    // Target Pitch: 30° (0.523 rad) when approaching gate for cinematic low angle entrance, 46° (0.802 rad) normal
    // Target Dist: 14.2 units in compact maps (crossroads & house_interior) for cozy close zoom, 19.5 units in large maps
    const isCompactMap = this.currentLocation === 'crossroads' || this.currentLocation === 'house_interior';
    const targetPitch = isNearGate ? 0.523 : 0.802;
    const defaultDist = isCompactMap ? 14.2 : 19.5;
    const targetDist = isNearGate ? 13.8 : defaultDist;

    const camPitchAlpha = 1 - Math.exp(-6.0 * delta);
    this.currentPitch = THREE.MathUtils.lerp(this.currentPitch, targetPitch, camPitchAlpha);
    this.currentCamDist = THREE.MathUtils.lerp(this.currentCamDist, targetDist, camPitchAlpha);

    const horizDist = this.currentCamDist * Math.cos(this.currentPitch);
    const camY = targetPlayerPos.y + this.currentCamDist * Math.sin(this.currentPitch);
    const offsetXZ = horizDist * 0.7071;

    const maxCamSpan = halfW - 4.2;
    const camFocusX = Math.max(-maxCamSpan, Math.min(maxCamSpan, targetPlayerPos.x));
    const camFocusZ = Math.max(-maxCamSpan, Math.min(maxCamSpan, targetPlayerPos.z));

    this.dummyCamPos.set(camFocusX + offsetXZ, camY, camFocusZ + offsetXZ);
    const camPosAlpha = 1 - Math.exp(-14.0 * delta);
    this.camera.position.lerp(this.dummyCamPos, camPosAlpha);
    this.camera.lookAt(camFocusX, targetPlayerPos.y + 0.6, camFocusZ);

    // Rotate Windmill blades if in farm
    if (this.currentLocation === 'farm' && Math.hypot(targetPlayerPos.x - 8.5, targetPlayerPos.z - (-10.5)) < 25) {
      const blades = this.buildingGroup.getObjectByName('windmill_blades');
      if (blades) {
        blades.rotation.z += 0.02;
      }
    }

    this.renderer.render(this.scene, this.camera);
    } catch (err) {
      console.error('GameScene 3D animation loop error:', err);
    }
  };

  /**
   * Captures a pristine, 100% clean full HD screenshot of the 3D world
   * without any UI overlays, tile indicators, or touch cursor artifacts.
   */
  public captureCleanScreenshot(): string {
    const wasCursorVisible = this.tileCursor ? this.tileCursor.visible : false;
    const was3x3Visible = this.tileCursor3x3 ? this.tileCursor3x3.visible : false;
    if (this.tileCursor) this.tileCursor.visible = false;
    if (this.tileCursor3x3) this.tileCursor3x3.visible = false;

    // Force an immediate pristine frame render
    this.renderer.render(this.scene, this.camera);

    const dataUrl = this.renderer.domElement.toDataURL('image/png');

    // Restore cursor state
    if (this.tileCursor) this.tileCursor.visible = wasCursorVisible;
    if (this.tileCursor3x3) this.tileCursor3x3.visible = was3x3Visible;
    return dataUrl;
  }

  public destroy() {
    this.isDestroyed = true;
    window.removeEventListener('resize', this.onWindowResize);
    if (this.meadowMesh) {
      this.scene.remove(this.meadowMesh);
      this.meadowMesh.geometry.dispose();
      (this.meadowMesh.material as THREE.Material).dispose();
    }
    this.cropMeshMap.forEach((mesh) => this.scene.remove(mesh));
    this.cropMeshMap.clear();
    this.debrisMeshMap.forEach((mesh) => this.scene.remove(mesh));
    this.debrisMeshMap.clear();
    this.tileGeometry.dispose();
    this.tileMaterial.dispose();
    if (this.renderer) {
      this.renderer.setAnimationLoop(null);
      if (this.renderer.domElement) {
        this.renderer.domElement.remove();
      }
      this.renderer.dispose();
    }
  }
}

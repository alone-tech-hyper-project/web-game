import * as THREE from 'three';
import { ModelFactory, getCachedMaterial } from './BuildingModels';
import { TexturePackPalette, CropType, GrowthStage, DebrisType } from '../../types/game';

/**
 * WebGL Shader Pipeline Preheater.
 * Compiles all materials and model variants into GPU shader programs on startup.
 * Prevents GPU shader compilation jank/stutter during gameplay.
 */
export class ShaderPipelinePreheater {
  public static preheatPipeline(
    renderer: THREE.WebGLRenderer,
    camera: THREE.Camera,
    palette: TexturePackPalette
  ): void {
    const preheatScene = new THREE.Scene();

    // 1. Pre-warm Tile Base Materials
    const testGeo = new THREE.BoxGeometry(1, 1, 1);
    const tileMat = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true });
    preheatScene.add(new THREE.Mesh(testGeo, tileMat));

    // 2. Pre-warm Crop Shader Variations (all types & growth stages)
    const crops: CropType[] = ['rice', 'corn', 'strawberry', 'tomato', 'carrot', 'pumpkin', 'sunflower'];
    const stages: GrowthStage[] = [0, 1, 2, 3];

    crops.forEach((crop) => {
      stages.forEach((stage) => {
        const cropMesh = ModelFactory.createCrop(crop, stage, palette);
        cropMesh.position.set(0, -100, 0);
        preheatScene.add(cropMesh);
      });
    });

    // 3. Pre-warm Debris Shader Variations
    const debrisList: DebrisType[] = ['log', 'wild_tree', 'small_stone', 'big_stone', 'weed'];
    debrisList.forEach((deb) => {
      const debrisMesh = ModelFactory.createDebris(deb, palette);
      debrisMesh.position.set(0, -100, 0);
      preheatScene.add(debrisMesh);
    });

    // 4. Pre-warm Static Buildings & Interior Furniture
    const house = ModelFactory.createFarmhouse(palette);
    const windmill = ModelFactory.createWindmill(palette);
    const bridge = ModelFactory.createWoodenBridge();
    const northGate = ModelFactory.createGateArchway(true);
    const bin = ModelFactory.createShippingBin(palette);
    const bed = ModelFactory.createBed();
    const kitchen = ModelFactory.createKitchenCounter();
    const chest = ModelFactory.createStorageChest();
    const dining = ModelFactory.createDiningTable();
    const fireplace = ModelFactory.createFireplace();
    const rug = ModelFactory.createCozyRug();
    const walls = ModelFactory.createInteriorWalls(10, 10, 1.3);

    preheatScene.add(house);
    preheatScene.add(windmill);
    preheatScene.add(bridge);
    preheatScene.add(northGate);
    preheatScene.add(bin);
    preheatScene.add(bed);
    preheatScene.add(kitchen);
    preheatScene.add(chest);
    preheatScene.add(dining);
    preheatScene.add(fireplace);
    preheatScene.add(rug);
    preheatScene.add(walls);

    // 5. Pre-warm Lighting & Shadows
    const amb = new THREE.AmbientLight(0xffffff, 0.95);
    const dir = new THREE.DirectionalLight(0xfffaed, 0.85);
    preheatScene.add(amb);
    preheatScene.add(dir);

    // Force WebGL pipeline compile all materials & geometries into GPU memory
    try {
      renderer.compile(preheatScene, camera);
    } catch (e) {
      console.warn('WebGL preheat compile warning (non-fatal):', e);
    }

    // Clean up temporary preheat scene
    preheatScene.clear();
    testGeo.dispose();
    tileMat.dispose();
  }
}

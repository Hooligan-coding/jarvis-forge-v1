import { useState, useRef, useEffect, useCallback } from "react";
import { useGetProject } from "@workspace/api-client-react";
import { Loader2, Zap, Layout, Info, Layers, RotateCcw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";

type PartName = "battery" | "pole" | "arm" | "led" | "panel" | null;

const PART_INFO: Record<string, { label: string; spec: string; color: string }> = {
  battery: {
    label: "LiFePO4 Battery Module",
    spec: "100Ah · 48V · 4.8kWh — Integrated BMS, 6000+ cycles, 10-year design life",
    color: "#38bdf8",
  },
  pole: {
    label: "Galvanized Steel Pole",
    spec: "6m height · 76mm OD · 3mm wall — Hot-dip galvanized, 200kg wind load",
    color: "#94a3b8",
  },
  arm: {
    label: "Adjustable Mounting Arm",
    spec: "300mm reach · 5mm structural steel — Adjustable tilt 0–30°, rated 15kg",
    color: "#64748b",
  },
  led: {
    label: "High-Power LED Module",
    spec: "50W · 5000K · 6500lm · CRI >80 · IP66 — 50,000hr lifespan, 120°×60° beam",
    color: "#fef08a",
  },
  panel: {
    label: "Monocrystalline Solar Panel",
    spec: "200W · 21.5% efficiency · 1640×992mm — VOC 45.2V, IP67 junction box",
    color: "#0ea5e9",
  },
};

function ThreeViewer({
  selected,
  onSelect,
}: {
  selected: PartName;
  onSelect: (p: PartName) => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    meshes: Record<string, THREE.Mesh | THREE.Group>;
    rafId: number;
    isDragging: boolean;
    prevPointer: { x: number; y: number };
    spherical: { theta: number; phi: number; radius: number };
    autoRotate: boolean;
    autoRotateTimeout: ReturnType<typeof setTimeout> | null;
    currentSelected: PartName;
    hoveredPart: PartName;
  } | null>(null);

  const selectedRef = useRef<PartName>(selected);

  // Keep selectedRef in sync
  useEffect(() => {
    selectedRef.current = selected;
    if (stateRef.current) {
      stateRef.current.currentSelected = selected;
    }
  }, [selected]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Try creating renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch {
      return; // WebGL not available
    }

    const w = mount.clientWidth || 800;
    const h = mount.clientHeight || 600;
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mount.appendChild(renderer.domElement);

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020913);
    scene.fog = new THREE.FogExp2(0x020913, 0.04);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 200);

    // Lighting
    const ambient = new THREE.AmbientLight(0x223355, 1.5);
    scene.add(ambient);

    const sunLight = new THREE.DirectionalLight(0x88ccff, 2.5);
    sunLight.position.set(8, 14, 6);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.camera.left = -10;
    sunLight.shadow.camera.right = 10;
    sunLight.shadow.camera.top = 10;
    sunLight.shadow.camera.bottom = -10;
    scene.add(sunLight);

    const fillLight = new THREE.PointLight(0x0055ff, 1.0, 30);
    fillLight.position.set(-6, 4, -6);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x003366, 0.8);
    rimLight.position.set(-8, 6, -8);
    scene.add(rimLight);

    // Ground grid
    const gridHelper = new THREE.GridHelper(24, 24, 0x003344, 0x001122);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // Ground plane (shadow receiver)
    const groundGeo = new THREE.CircleGeometry(12, 64);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x030d1a, side: THREE.DoubleSide });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Build solar streetlight
    const root = new THREE.Group();
    scene.add(root);

    const meshes: Record<string, THREE.Mesh | THREE.Group> = {};

    // --- Materials ---
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x4a5568,
      metalness: 0.85,
      roughness: 0.25,
    });
    const darkSteelMat = new THREE.MeshStandardMaterial({
      color: 0x2d3748,
      metalness: 0.9,
      roughness: 0.2,
    });
    const batteryMat = new THREE.MeshStandardMaterial({
      color: 0x1a2a3a,
      metalness: 0.5,
      roughness: 0.4,
    });
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x0a1628,
      metalness: 0.2,
      roughness: 0.6,
    });
    const ledHousingMat = new THREE.MeshStandardMaterial({
      color: 0xd0d8e0,
      metalness: 0.6,
      roughness: 0.3,
    });
    const ledGlassMat = new THREE.MeshStandardMaterial({
      color: 0xfffde0,
      emissive: new THREE.Color(0xfef08a),
      emissiveIntensity: 1.8,
      transparent: true,
      opacity: 0.92,
    });

    // Base / Battery box
    const batteryGroup = new THREE.Group();
    const baseGeo = new THREE.BoxGeometry(1.0, 0.65, 1.0);
    const baseMesh = new THREE.Mesh(baseGeo, batteryMat.clone());
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    batteryGroup.add(baseMesh);

    // Battery detail stripes
    const stripeGeo = new THREE.BoxGeometry(1.02, 0.08, 0.35);
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0x0a3a5a, metalness: 0.4, roughness: 0.6 });
    [-0.15, 0.0, 0.15].forEach((z) => {
      const stripe = new THREE.Mesh(stripeGeo, stripeMat.clone());
      stripe.position.set(0, 0, z);
      batteryGroup.add(stripe);
    });

    // Battery terminals
    const termGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.12, 8);
    const termMat = new THREE.MeshStandardMaterial({ color: 0xb87333, metalness: 0.9, roughness: 0.1 });
    [-0.2, 0.2].forEach((x) => {
      const term = new THREE.Mesh(termGeo, termMat.clone());
      term.position.set(x, 0.385, 0);
      batteryGroup.add(term);
    });

    batteryGroup.position.set(0, 0.325, 0);
    batteryGroup.userData.part = "battery";
    root.add(batteryGroup);
    meshes.battery = batteryGroup;

    // Pole — tapered cylinder
    const poleGeo = new THREE.CylinderGeometry(0.07, 0.13, 8.0, 20, 4, false);
    const poleMesh = new THREE.Mesh(poleGeo, steelMat.clone());
    poleMesh.position.set(0, 4.65, 0);
    poleMesh.castShadow = true;
    poleMesh.userData.part = "pole";
    root.add(poleMesh);
    meshes.pole = poleMesh;

    // Pole base flange
    const flangeGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.12, 16);
    const flangeMesh = new THREE.Mesh(flangeGeo, darkSteelMat.clone());
    flangeMesh.position.set(0, 0.71, 0);
    flangeMesh.castShadow = true;
    root.add(flangeMesh);

    // Arm assembly
    const armGroup = new THREE.Group();
    const armLength = 1.8;

    // Main arm tube
    const armGeo = new THREE.CylinderGeometry(0.045, 0.055, armLength, 12);
    const armMesh = new THREE.Mesh(armGeo, steelMat.clone());
    armMesh.rotation.z = Math.PI / 2;
    armMesh.position.set(armLength / 2, 0, 0);
    armGroup.add(armMesh);

    // Arm brace
    const braceGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.1, 8);
    const braceMesh = new THREE.Mesh(braceGeo, darkSteelMat.clone());
    braceMesh.rotation.z = -Math.PI / 5;
    braceMesh.position.set(0.52, -0.42, 0);
    armGroup.add(braceMesh);

    armGroup.position.set(0, 8.6, 0);
    armGroup.userData.part = "arm";
    root.add(armGroup);
    meshes.arm = armGroup;

    // LED luminaire housing
    const ledGroup = new THREE.Group();

    // Housing box
    const housingGeo = new THREE.BoxGeometry(0.75, 0.14, 0.52);
    const housingMesh = new THREE.Mesh(housingGeo, ledHousingMat.clone());
    housingMesh.castShadow = true;
    ledGroup.add(housingMesh);

    // LED lens / glass panel
    const lensGeo = new THREE.BoxGeometry(0.68, 0.04, 0.46);
    const lensMesh = new THREE.Mesh(lensGeo, ledGlassMat.clone());
    lensMesh.position.y = -0.09;
    ledGroup.add(lensMesh);

    // LED heat fins
    for (let i = -2; i <= 2; i++) {
      const finGeo = new THREE.BoxGeometry(0.04, 0.12, 0.52);
      const finMesh = new THREE.Mesh(finGeo, darkSteelMat.clone());
      finMesh.position.set(i * 0.12, 0.13, 0);
      ledGroup.add(finMesh);
    }

    ledGroup.position.set(1.85, 8.49, 0);
    ledGroup.userData.part = "led";
    root.add(ledGroup);
    meshes.led = ledGroup;

    // LED point light (warm glow)
    const ledGlow = new THREE.PointLight(0xffe8a0, 3.0, 8, 1.5);
    ledGlow.position.set(1.85, 8.3, 0);
    scene.add(ledGlow);

    // Solar panel
    const panelGroup = new THREE.Group();

    // Main panel body
    const panelBodyGeo = new THREE.BoxGeometry(1.8, 0.06, 2.0);
    const panelBody = new THREE.Mesh(panelBodyGeo, panelMat.clone());
    panelBody.castShadow = true;
    panelGroup.add(panelBody);

    // Panel frame
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x607080, metalness: 0.7, roughness: 0.3 });
    const frameThickness = 0.04;
    [
      { pos: [0, 0, 1.0], size: [1.8, 0.06, frameThickness] },
      { pos: [0, 0, -1.0], size: [1.8, 0.06, frameThickness] },
      { pos: [0.9, 0, 0], size: [frameThickness, 0.06, 2.0] },
      { pos: [-0.9, 0, 0], size: [frameThickness, 0.06, 2.0] },
    ].forEach(({ pos, size }) => {
      const fGeo = new THREE.BoxGeometry(...(size as [number, number, number]));
      const fMesh = new THREE.Mesh(fGeo, frameMat.clone());
      fMesh.position.set(...(pos as [number, number, number]));
      panelGroup.add(fMesh);
    });

    // Cell grid lines
    const cellMat = new THREE.LineBasicMaterial({ color: 0x1a4060, transparent: true, opacity: 0.8 });
    for (let i = -3; i <= 3; i++) {
      const pts = [new THREE.Vector3(i * 0.28, 0.04, -0.95), new THREE.Vector3(i * 0.28, 0.04, 0.95)];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      panelGroup.add(new THREE.Line(lineGeo, cellMat.clone()));
    }
    for (let j = -4; j <= 4; j++) {
      const pts = [new THREE.Vector3(-0.85, 0.04, j * 0.22), new THREE.Vector3(0.85, 0.04, j * 0.22)];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      panelGroup.add(new THREE.Line(lineGeo, cellMat.clone()));
    }

    // Panel cell sheen
    const cellSheenMat = new THREE.MeshStandardMaterial({
      color: 0x0d2244,
      metalness: 0.1,
      roughness: 0.8,
      transparent: true,
      opacity: 0.9,
    });
    const cellGeo = new THREE.PlaneGeometry(1.68, 1.88);
    const cellMesh = new THREE.Mesh(cellGeo, cellSheenMat.clone());
    cellMesh.rotation.x = -Math.PI / 2;
    cellMesh.position.y = 0.04;
    panelGroup.add(cellMesh);

    // Panel mount bracket
    const mountGeo = new THREE.BoxGeometry(0.08, 0.32, 0.08);
    const mountMesh = new THREE.Mesh(mountGeo, darkSteelMat.clone());
    mountMesh.position.set(-0.5, -0.19, 0);
    panelGroup.add(mountMesh);

    // Tilt solar panel south-facing
    panelGroup.rotation.x = Math.PI / 5;
    panelGroup.position.set(-0.4, 9.3, 0.1);
    panelGroup.userData.part = "panel";
    root.add(panelGroup);
    meshes.panel = panelGroup;

    // ---- Spherical camera orbit ----
    const spherical = { theta: 0.6, phi: 1.15, radius: 16 };
    const updateCamera = () => {
      camera.position.set(
        spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta),
        spherical.radius * Math.cos(spherical.phi) + 4,
        spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta),
      );
      camera.lookAt(0, 4, 0);
    };
    updateCamera();

    // ---- Raycasting for part selection ----
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const getAllMeshes = (group: THREE.Object3D): THREE.Mesh[] => {
      const meshList: THREE.Mesh[] = [];
      group.traverse((obj) => {
        if (obj instanceof THREE.Mesh) meshList.push(obj);
      });
      return meshList;
    };

    const partGroups = [meshes.battery, meshes.pole, meshes.arm, meshes.led, meshes.panel] as THREE.Object3D[];
    const clickableMeshes: THREE.Mesh[] = partGroups.flatMap((g) =>
      g instanceof THREE.Group ? getAllMeshes(g) : [g as THREE.Mesh],
    );
    // Tag each mesh with its part name from parent group
    partGroups.forEach((g) => {
      const part = g.userData.part as string;
      getAllMeshes(g).forEach((m) => {
        m.userData.part = part;
      });
    });

    // ---- Highlight system ----
    const HIGHLIGHT_COLOR = new THREE.Color(0x00ffff);
    const HOVER_COLOR = new THREE.Color(0x00aaaa);
    const SELECTED_COLORS: Record<string, THREE.Color> = {
      battery: new THREE.Color(0x38bdf8),
      pole: new THREE.Color(0x94a3b8),
      arm: new THREE.Color(0x64748b),
      led: new THREE.Color(0xfef08a),
      panel: new THREE.Color(0x0ea5e9),
    };

    let hoveredPart: PartName = null;
    const originalEmissives = new Map<THREE.Mesh, { color: THREE.Color; intensity: number }>();
    clickableMeshes.forEach((m) => {
      const mat = m.material as THREE.MeshStandardMaterial;
      if (mat.emissive) {
        originalEmissives.set(m, { color: mat.emissive.clone(), intensity: mat.emissiveIntensity });
      }
    });

    const setHighlight = (partName: PartName, type: "hover" | "select" | "none") => {
      clickableMeshes.forEach((m) => {
        if (m.userData.part !== partName) return;
        const mat = m.material as THREE.MeshStandardMaterial;
        const orig = originalEmissives.get(m);
        if (type === "none") {
          if (orig) {
            mat.emissive.copy(orig.color);
            mat.emissiveIntensity = orig.intensity;
          } else {
            mat.emissive.set(0x000000);
            mat.emissiveIntensity = 0;
          }
        } else {
          const col = type === "select" ? (SELECTED_COLORS[partName!] ?? HIGHLIGHT_COLOR) : HOVER_COLOR;
          mat.emissive.copy(col);
          mat.emissiveIntensity = type === "select" ? 0.5 : 0.25;
        }
      });
    };

    // Mouse handlers
    const handleMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(clickableMeshes);
      const newHover = hits.length > 0 ? (hits[0].object.userData.part as PartName) : null;

      if (newHover !== hoveredPart) {
        if (hoveredPart && hoveredPart !== stateRef.current?.currentSelected) {
          setHighlight(hoveredPart, "none");
        }
        hoveredPart = newHover;
        if (hoveredPart && hoveredPart !== stateRef.current?.currentSelected) {
          setHighlight(hoveredPart, "hover");
        }
        renderer.domElement.style.cursor = hoveredPart ? "pointer" : "grab";
      }
    };

    const handleClick = (e: MouseEvent) => {
      // Ignore drag clicks
      if (Math.abs(e.movementX) > 4 || Math.abs(e.movementY) > 4) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(clickableMeshes);
      if (hits.length > 0) {
        const part = hits[0].object.userData.part as PartName;
        const cur = selectedRef.current;
        onSelect(cur === part ? null : part);
      }
    };

    // Drag orbit
    let isDragging = false;
    let prevPointer = { x: 0, y: 0 };
    let autoRotate = true;
    let autoRotateTimeout: ReturnType<typeof setTimeout> | null = null;

    const resumeAutoRotate = () => {
      autoRotateTimeout = setTimeout(() => { autoRotate = true; }, 3000);
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      autoRotate = false;
      if (autoRotateTimeout) clearTimeout(autoRotateTimeout);
      prevPointer = { x: e.clientX, y: e.clientY };
      renderer.domElement.style.cursor = "grabbing";
    };

    const handleMouseUp = () => {
      isDragging = false;
      renderer.domElement.style.cursor = hoveredPart ? "pointer" : "grab";
      resumeAutoRotate();
    };

    const handleDragMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevPointer.x;
      const dy = e.clientY - prevPointer.y;
      spherical.theta -= dx * 0.008;
      spherical.phi = Math.max(0.15, Math.min(Math.PI / 2, spherical.phi + dy * 0.008));
      prevPointer = { x: e.clientX, y: e.clientY };
      updateCamera();
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      spherical.radius = Math.max(6, Math.min(28, spherical.radius + e.deltaY * 0.015));
      updateCamera();
    };

    // Touch support
    let lastTouchDist = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        autoRotate = false;
        if (autoRotateTimeout) clearTimeout(autoRotateTimeout);
        prevPointer = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      if (e.touches.length === 2) {
        lastTouchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1 && isDragging) {
        const dx = e.touches[0].clientX - prevPointer.x;
        const dy = e.touches[0].clientY - prevPointer.y;
        spherical.theta -= dx * 0.008;
        spherical.phi = Math.max(0.15, Math.min(Math.PI / 2, spherical.phi + dy * 0.008));
        prevPointer = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        updateCamera();
      }
      if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
        spherical.radius = Math.max(6, Math.min(28, spherical.radius - (dist - lastTouchDist) * 0.05));
        lastTouchDist = dist;
        updateCamera();
      }
    };
    const handleTouchEnd = () => {
      isDragging = false;
      resumeAutoRotate();
    };

    renderer.domElement.addEventListener("mousemove", handleMouseMove);
    renderer.domElement.addEventListener("click", handleClick);
    renderer.domElement.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    renderer.domElement.addEventListener("mousemove", handleDragMove);
    renderer.domElement.addEventListener("wheel", handleWheel, { passive: false });
    renderer.domElement.addEventListener("touchstart", handleTouchStart, { passive: true });
    renderer.domElement.addEventListener("touchmove", handleTouchMove, { passive: false });
    renderer.domElement.addEventListener("touchend", handleTouchEnd);

    // Resize
    const handleResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    stateRef.current = {
      renderer,
      scene,
      camera,
      meshes,
      rafId: 0,
      isDragging,
      prevPointer,
      spherical,
      autoRotate,
      autoRotateTimeout,
      currentSelected: selectedRef.current,
      hoveredPart,
    };

    // Animation loop
    let lastTime = 0;
    const animate = (time: number) => {
      stateRef.current!.rafId = requestAnimationFrame(animate);
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      if (autoRotate) {
        spherical.theta += delta * 0.25;
        updateCamera();
      }

      const sel = stateRef.current!.currentSelected;
      // Apply selection highlight
      partGroups.forEach((g) => {
        const part = g.userData.part as PartName;
        if (part === sel && part !== hoveredPart) {
          setHighlight(part, "select");
        } else if (part !== sel && part !== hoveredPart) {
          setHighlight(part, "none");
        }
      });

      // LED glow pulse
      ledGlow.intensity = 2.5 + 0.6 * Math.sin(time * 0.003);

      renderer.render(scene, camera);
    };
    stateRef.current.rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(stateRef.current!.rafId);
      if (autoRotateTimeout) clearTimeout(autoRotateTimeout);
      renderer.domElement.removeEventListener("mousemove", handleMouseMove);
      renderer.domElement.removeEventListener("click", handleClick);
      renderer.domElement.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      renderer.domElement.removeEventListener("mousemove", handleDragMove);
      renderer.domElement.removeEventListener("wheel", handleWheel);
      renderer.domElement.removeEventListener("touchstart", handleTouchStart);
      renderer.domElement.removeEventListener("touchmove", handleTouchMove);
      renderer.domElement.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      stateRef.current = null;
    };
  }, []); // eslint-disable-line

  return <div ref={mountRef} className="w-full h-full" style={{ cursor: "grab" }} />;
}

// SVG fallback for environments without WebGL
function SolarStreetLightSVG({
  selected,
  onSelect,
}: {
  selected: PartName;
  onSelect: (p: PartName) => void;
}) {
  const [hovered, setHovered] = useState<PartName>(null);

  const hl = (p: string) => selected === p || hovered === p;
  const col = (p: string) => (hl(p) ? PART_INFO[p]?.color ?? "#00ffff" : "#1e3a4a");
  const partProps = (p: PartName) => ({
    onClick: () => onSelect(selected === p ? null : p),
    onMouseEnter: () => setHovered(p),
    onMouseLeave: () => setHovered(null),
    style: { cursor: "pointer" },
  });

  return (
    <div className="relative flex items-center justify-center w-full h-full select-none">
      <svg className="absolute inset-0 w-full h-full opacity-10" style={{ pointerEvents: "none" }}>
        <defs>
          <pattern id="grid-fb" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#00ffff" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-fb)" />
      </svg>
      <svg viewBox="0 0 300 500" className="h-full max-h-[460px]" style={{ maxWidth: "260px" }}>
        <line x1="50" y1="460" x2="250" y2="460" stroke="#1e3a4a" strokeWidth="2" />
        {/* Battery */}
        <g {...partProps("battery")}>
          <rect x="110" y="415" width="80" height="45" rx="3" fill={hl("battery") ? "#0c1f2f" : "#060f1a"} stroke={col("battery")} strokeWidth={hl("battery") ? 1.5 : 1} />
          {hl("battery") && <rect x="110" y="415" width="80" height="45" rx="3" fill="#38bdf8" fillOpacity="0.08" />}
          <text x="150" y="435" textAnchor="middle" fill={col("battery")} fontSize="7" fontFamily="monospace">BATTERY</text>
          <text x="150" y="450" textAnchor="middle" fill={col("battery")} fontSize="6" fontFamily="monospace" fillOpacity="0.7">LiFePO4 48V 100Ah</text>
        </g>
        {/* Pole */}
        <g {...partProps("pole")}>
          <rect x="143" y="85" width="14" height="330" rx="2" fill={hl("pole") ? "#1a2436" : "#0d1520"} stroke={col("pole")} strokeWidth={hl("pole") ? 1.5 : 1} />
          {hl("pole") && <rect x="143" y="85" width="14" height="330" rx="2" fill="#94a3b8" fillOpacity="0.1" />}
        </g>
        {/* Arm */}
        <g {...partProps("arm")}>
          <line x1="157" y1="90" x2="215" y2="68" stroke={col("arm")} strokeWidth={hl("arm") ? 4 : 3} strokeLinecap="round" />
          {hl("arm") && <line x1="157" y1="90" x2="215" y2="68" stroke="#64748b" strokeWidth="10" strokeLinecap="round" strokeOpacity="0.15" />}
          <circle cx="157" cy="90" r="4" fill={col("arm")} />
        </g>
        {/* LED */}
        <g {...partProps("led")}>
          <rect x="198" y="58" width="40" height="16" rx="3" fill={hl("led") ? "#1a1500" : "#0d1008"} stroke={col("led")} strokeWidth={hl("led") ? 1.5 : 1} />
          {[208, 218, 228].map((x) => <circle key={x} cx={x} cy="66" r="2.5" fill="#fef08a" fillOpacity={hl("led") ? 0.9 : 0.4} />)}
          <text x="218" y="82" textAnchor="middle" fill={col("led")} fontSize="6" fontFamily="monospace">LED 50W</text>
          {hl("led") && <path d="M 200 74 L 170 130 L 260 130 L 250 74" fill="#fef08a" fillOpacity="0.05" />}
        </g>
        {/* Panel */}
        <g {...partProps("panel")}>
          <rect x="90" y="18" width="110" height="55" rx="3" fill={hl("panel") ? "#03111d" : "#020b14"} stroke={col("panel")} strokeWidth={hl("panel") ? 1.5 : 1} transform="rotate(-12, 145, 45)" />
          {[107, 124, 141, 158, 175].map((x) => <line key={x} x1={x} y1="16" x2={x - 14} y2="72" stroke={col("panel")} strokeWidth="0.5" transform="rotate(-12, 145, 45)" strokeOpacity="0.5" />)}
          {[28, 43, 58].map((y) => <line key={y} x1="90" y1={y} x2="200" y2={y} stroke={col("panel")} strokeWidth="0.5" transform="rotate(-12, 145, 45)" strokeOpacity="0.5" />)}
          <text x="145" y="52" textAnchor="middle" fill={col("panel")} fontSize="7" fontFamily="monospace" transform="rotate(-12, 145, 45)">SOLAR 200W</text>
        </g>
        <circle cx="270" cy="30" r="3" fill="#00ff88" fillOpacity="0.8"><animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" /></circle>
        <text x="278" y="34" fill="#00ff88" fontSize="6" fontFamily="monospace" fillOpacity="0.6">ONLINE</text>
        <text x="10" y="14" fill="#0c3050" fontSize="6" fontFamily="monospace">JARVIS FORGE — SCHEMATIC v1.0</text>
      </svg>
    </div>
  );
}

function ViewerWithFallback({ selected, onSelect }: { selected: PartName; onSelect: (p: PartName) => void }) {
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    // Quick WebGL availability check
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
      setWebglFailed(true);
    }
  }, []);

  if (webglFailed) {
    return <SolarStreetLightSVG selected={selected} onSelect={onSelect} />;
  }
  return <ThreeViewer selected={selected} onSelect={onSelect} />;
}

export function DesignTab({ projectId }: { projectId: string | null }) {
  const [selectedPart, setSelectedPart] = useState<PartName>(null);

  const { data: project, isLoading } = useGetProject(projectId || "", {
    query: { enabled: !!projectId },
  });

  const handleSelect = useCallback((p: PartName) => setSelectedPart(p), []);

  if (!projectId || isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const jarvisArchMsg = project?.chatHistory?.find(
    (m) => m.role === "jarvis" && m.content.length > 60 && !m.content.toLowerCase().includes("jarvis online"),
  );

  return (
    <div className="h-full flex gap-0">
      {/* 3D Viewer */}
      <div className="flex-1 relative border-r border-border/50 bg-[#020913] overflow-hidden min-h-0">
        {/* HUD overlay */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <div className="glass-panel px-3 py-2 rounded-md">
            <h3 className="font-display font-bold text-xs tracking-wider text-primary flex items-center gap-1.5">
              <Layout className="w-3.5 h-3.5" />
              3D VIEWER — SOLAR STREETLIGHT
            </h3>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
              {selectedPart ? `SELECTED: ${selectedPart.toUpperCase()}` : "DRAG · ROTATE · CLICK TO SELECT"}
            </p>
          </div>
        </div>

        {/* Reset button */}
        {selectedPart && (
          <button
            onClick={() => setSelectedPart(null)}
            className="absolute top-4 right-4 z-10 glass-panel px-2 py-1.5 rounded text-[10px] font-mono text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            DESELECT
          </button>
        )}

        <ViewerWithFallback selected={selectedPart} onSelect={handleSelect} />

        {/* Part info overlay */}
        <AnimatePresence>
          {selectedPart && PART_INFO[selectedPart] && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-4 left-4 right-4 z-10 glass-panel p-3 rounded-md border"
              style={{ borderColor: PART_INFO[selectedPart].color + "55" }}
            >
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: PART_INFO[selectedPart].color }} />
                <div>
                  <div className="font-display font-bold text-sm mb-0.5" style={{ color: PART_INFO[selectedPart].color }}>
                    {PART_INFO[selectedPart].label}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">{PART_INFO[selectedPart].spec}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Side panel */}
      <div className="w-64 bg-background/80 backdrop-blur p-4 flex flex-col gap-4 overflow-hidden">
        <div className="flex items-center gap-2 text-primary">
          <Zap className="w-4 h-4" />
          <h3 className="font-display font-bold text-xs tracking-wider">SYSTEM OVERVIEW</h3>
        </div>

        <div className="grid grid-cols-1 gap-1.5">
          {Object.entries(PART_INFO).map(([key, info]) => (
            <motion.button
              key={key}
              onClick={() => setSelectedPart(selectedPart === key as PartName ? null : key as PartName)}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              className="p-2.5 rounded border text-left transition-all flex items-center gap-2.5"
              style={{
                borderColor: selectedPart === key ? info.color + "55" : "#1e2a3a",
                backgroundColor: selectedPart === key ? info.color + "10" : "transparent",
              }}
            >
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: info.color, boxShadow: selectedPart === key ? `0 0 6px ${info.color}` : "none" }} />
              <div>
                <div className="text-[10px] font-mono font-bold" style={{ color: selectedPart === key ? info.color : "#4a6a7a" }}>
                  {key.toUpperCase()}
                </div>
                <div className="text-[9px] text-muted-foreground font-mono leading-tight opacity-70">
                  {info.label}
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="flex-1 min-h-0">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span className="font-display text-[10px] tracking-wider font-bold">ARCHITECTURE</span>
          </div>
          <ScrollArea className="h-36">
            {jarvisArchMsg ? (
              <div className="text-[10px] text-muted-foreground leading-relaxed font-mono whitespace-pre-wrap pr-2">
                {jarvisArchMsg.content}
              </div>
            ) : (
              <div className="p-3 border border-dashed border-border/50 rounded bg-card/30">
                <p className="text-[10px] text-muted-foreground font-mono text-center">
                  Ask JARVIS to design a system to generate architecture notes.
                </p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Element } from "@/lib/types/element";
import * as THREE from "three";

interface BohrModel3DProps {
  element: Element;
}

interface ElectronShellProps {
  radius: number;
  electrons: number;
  shellIndex: number;
  color: string;
}

function Electron({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.15, 32, 32]} />
      <meshPhysicalMaterial
        color="#60A5FA"
        emissive="#60A5FA"
        emissiveIntensity={0.3}
        metalness={0.5}
        roughness={0.3}
        clearcoat={0.5}
        clearcoatRoughness={0.2}
      />
    </mesh>
  );
}

function ElectronShell({ radius, electrons, shellIndex, color }: ElectronShellProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Smooth rotation with varied speeds per shell
  useFrame((_state, delta) => {
    if (groupRef.current) {
      // Each shell rotates at different speed, creating a more organic feel
      groupRef.current.rotation.y += delta * (0.1 + shellIndex * 0.03);
    }
  });

  // Calculate electron positions around the shell
  const electronPositions: [number, number, number][] = [];
  for (let i = 0; i < electrons; i++) {
    const angle = (i / electrons) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    electronPositions.push([x, 0, z]);
  }

  return (
    <group ref={groupRef}>
      {/* Orbit ring - thinner and more subtle */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.015, 8, 64]} />
        <meshStandardMaterial
          color="#93C5FD"
          opacity={0.25}
          transparent
          emissive="#60A5FA"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Electrons */}
      {electronPositions.map((pos, index) => (
        <Electron key={index} position={pos} color={color} />
      ))}
    </group>
  );
}

function Nucleon({ position, type }: { position: [number, number, number]; type: 'proton' | 'neutron' }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.35, 32, 32]} />
      <meshPhysicalMaterial
        color={type === 'proton' ? '#F87171' : '#A78BFA'}
        emissive={type === 'proton' ? '#F87171' : '#A78BFA'}
        emissiveIntensity={0.2}
        roughness={0.4}
        metalness={0.6}
        clearcoat={0.3}
        clearcoatRoughness={0.3}
      />
    </mesh>
  );
}

function Nucleus({ protons, neutrons, color }: { protons: number; neutrons: number; color: string }) {
  const groupRef = useRef<THREE.Group>(null);

  // Smooth, gentle rotation
  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
      groupRef.current.rotation.x += delta * 0.1;
    }
  });

  // Calculate positions for protons and neutrons in a packed sphere
  const nucleonPositions: { position: [number, number, number]; type: 'proton' | 'neutron' }[] = [];
  const totalNucleons = protons + neutrons;
  const nucleusRadius = Math.max(1, Math.min(0.8 + totalNucleons * 0.015, 2.5));

  // Special case for single nucleon (Hydrogen)
  if (totalNucleons === 1) {
    nucleonPositions.push({
      position: [0, 0, 0],
      type: 'proton'
    });
  } else {
    // Fibonacci sphere distribution for nucleons
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

    for (let i = 0; i < totalNucleons; i++) {
      const y = 1 - (i / (totalNucleons - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * radiusAtY * nucleusRadius * 0.6;
      const yPos = y * nucleusRadius * 0.6;
      const z = Math.sin(theta) * radiusAtY * nucleusRadius * 0.6;

      nucleonPositions.push({
        position: [x, yPos, z],
        type: i < protons ? 'proton' : 'neutron'
      });
    }
  }

  return (
    <group ref={groupRef}>
      {/* Soft glow effect */}
      <mesh>
        <sphereGeometry args={[nucleusRadius, 32, 32]} />
        <meshStandardMaterial
          color="#C4B5FD"
          emissive="#A78BFA"
          emissiveIntensity={0.3}
          opacity={0.15}
          transparent
        />
      </mesh>

      {/* Individual nucleons */}
      {nucleonPositions.map((nucleon, index) => (
        <Nucleon key={index} position={nucleon.position} type={nucleon.type} />
      ))}
    </group>
  );
}

function AtomModel({ element }: { element: Element }) {
  const shellRadii = [3, 4.5, 6, 7.5, 9, 10.5, 12];

  // Calculate neutrons (approximation using atomic mass)
  const neutrons = Math.round(element.atomicMass - element.atomicNumber);

  return (
    <>
      {/* Enhanced Lighting for 3D Depth */}
      <ambientLight intensity={0.4} />
      <hemisphereLight
        args={["#ffffff", "#444444", 0.6]}
      />

      {/* Main Key Light (creates primary highlight and shadows) */}
      <directionalLight
        position={[10, 10, 10]}
        intensity={1.2}
        color="#ffffff"
        castShadow={false}
      />

      {/* Fill Light (softens shadows on dark side) */}
      <pointLight
        position={[-8, 5, -8]}
        intensity={0.6}
        color="#ffffff"
      />

      {/* Rim Light (creates edge highlights for depth) */}
      <pointLight
        position={[0, -10, 10]}
        intensity={0.5}
        color="#b3d9ff"
      />

      {/* Top Light (enhances glossy appearance) */}
      <spotLight
        position={[0, 15, 0]}
        angle={0.6}
        penumbra={0.5}
        intensity={0.8}
        color="#ffffff"
      />

      {/* Nucleus */}
      <Nucleus protons={element.atomicNumber} neutrons={neutrons} color={element.color} />

      {/* Electron Shells */}
      {element.electronsPerShell.map((electronCount, index) => (
        <ElectronShell
          key={index}
          radius={shellRadii[index]}
          electrons={electronCount}
          shellIndex={index}
          color={element.color}
        />
      ))}

      {/* Environment Map for Reflections */}
      <Environment preset="studio" />

      {/* Camera Controls */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={10}
        maxDistance={30}
        autoRotate
        autoRotateSpeed={0.25}
        enableDamping={true}
        dampingFactor={0.05}
        rotateSpeed={0.5}
        makeDefault
      />
    </>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-gray-400 animate-pulse">Loading 3D Model...</div>
    </div>
  );
}

export default function BohrModel3D({ element }: BohrModel3DProps) {
  const neutrons = Math.round(element.atomicMass - element.atomicNumber);

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-3 md:p-4 h-[400px] md:h-[500px] lg:h-[600px] relative overflow-hidden">
      <div className="absolute top-3 md:top-4 left-3 md:left-4 z-10 bg-gray-900/90 backdrop-blur-sm px-3 md:px-4 py-2.5 rounded-lg border border-gray-700 shadow-xl">
        <div className="text-gray-400 text-xs md:text-sm font-medium">3D Bohr Model</div>
        <div className="text-white font-bold text-base md:text-lg mb-2">{element.name}</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-red-400 shadow-sm shadow-red-400/50"></div>
            <span className="text-gray-300">{element.atomicNumber} Protons</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-purple-400 shadow-sm shadow-purple-400/50"></div>
            <span className="text-gray-300">{neutrons} Neutrons</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-blue-400 shadow-sm shadow-blue-400/50"></div>
            <span className="text-gray-300">{element.electronsPerShell.reduce((a, b) => a + b, 0)} Electrons</span>
          </div>
        </div>
      </div>

      <Canvas
        camera={{ position: [18, 12, 18], fov: 45 }}
        className="w-full h-full"
        shadows={false}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: 2, // ACESFilmicToneMapping
          toneMappingExposure: 1.2
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <AtomModel element={element} />
        </Suspense>
      </Canvas>

      <div className="absolute bottom-3 md:bottom-4 right-3 md:right-4 text-gray-500 text-[10px] md:text-xs bg-gray-900/70 px-2 py-1 rounded border border-gray-700/50">
        Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
}

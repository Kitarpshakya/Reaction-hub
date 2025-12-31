"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, Color } from "three";
import { Element } from "@/lib/types/element";
import { getAtomColor, get3DAtomRadius } from "@/lib/utils/organic-helpers";

interface AtomSphereProps {
  position: { x: number; y: number; z: number };
  element: Element;
  count?: number;
  mode?: 'ball-stick' | 'space-filling';
}

export default function AtomSphere({ position, element, count, mode = 'ball-stick' }: AtomSphereProps) {
  const meshRef = useRef<Mesh>(null);

  // Calculate atom radius based on mode
  // Ball-stick: smaller atoms with visible bonds
  // Space-filling: larger van der Waals radii, atoms touch
  const radius = get3DAtomRadius(element.symbol, mode, element.atomicMass);

  // Get CPK color (element-specific: H=white, O=red, C=gray, etc.)
  const color = getAtomColor(element.symbol);

  // Subtle floating animation
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      meshRef.current.position.y = Math.sin(time + position.x) * 0.02;
    }
  });

  return (
    <group position={[position.x, position.y, position.z]}>
      <mesh ref={meshRef}>
        {/* Sphere geometry - high quality */}
        <sphereGeometry args={[radius, 64, 64]} />

        {/* Material with glossy, glazed appearance */}
        <meshPhysicalMaterial
          color={new Color(color)}
          metalness={0.1}
          roughness={0.2}
          clearcoat={1.0}
          clearcoatRoughness={1}
          reflectivity={0.8}
          envMapIntensity={1.5}
          emissive={new Color(color)}
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Labels disabled - use color-coded index in info badge instead */}
    </group>
  );
}

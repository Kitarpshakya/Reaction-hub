"use client";

import React, { useMemo } from "react";
import { Vector3, Quaternion, Color } from "three";
import { BondType } from "@/lib/types/compound";

interface BondCylinderProps {
  from: { x: number; y: number; z: number };
  to: { x: number; y: number; z: number };
  bondType: BondType;
}

export default function BondCylinder({ from, to, bondType }: BondCylinderProps) {
  // Calculate bond geometry
  const { midpoint, length, rotation, radius, color, offset } = useMemo(() => {
    const start = new Vector3(from.x, from.y, from.z);
    const end = new Vector3(to.x, to.y, to.z);

    // Midpoint
    const mid = new Vector3().addVectors(start, end).multiplyScalar(0.5);

    // Length
    const len = start.distanceTo(end);

    // Rotation (align cylinder with bond direction)
    const direction = new Vector3().subVectors(end, start).normalize();
    const quaternion = new Quaternion();
    quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction);

    // Bond radius and color based on type
    // Thinner bonds for cleaner look with larger atoms
    let bondRadius = 0.08;
    let bondColor = "#9CA3AF"; // Default gray
    let bondOffset = 0; // For double/triple bonds

    switch (bondType) {
      case "single":
      case "covalent":
        bondRadius = 0.08;
        bondColor = "#B0B0B0"; // Light gray (neutral, lets atom colors stand out)
        break;
      case "double":
        bondRadius = 0.06;
        bondColor = "#34D399"; // Green
        bondOffset = 0.18; // Spacing between parallel cylinders
        break;
      case "triple":
        bondRadius = 0.05;
        bondColor = "#FBBF24"; // Yellow/Orange
        bondOffset = 0.18;
        break;
      case "ionic":
        bondRadius = 0.06;
        bondColor = "#F87171"; // Red
        break;
      case "metallic":
        bondRadius = 0.10;
        bondColor = "#A78BFA"; // Purple
        break;
    }

    return {
      midpoint: mid,
      length: len,
      rotation: quaternion,
      radius: bondRadius,
      color: bondColor,
      offset: bondOffset,
    };
  }, [from, to, bondType]);

  // Helper to calculate perpendicular offset vector
  const getPerpendicular = useMemo(() => {
    const direction = new Vector3().subVectors(
      new Vector3(to.x, to.y, to.z),
      new Vector3(from.x, from.y, from.z)
    ).normalize();

    // Find perpendicular vector (cross product)
    let perpendicular = new Vector3(1, 0, 0).cross(direction);
    if (perpendicular.length() < 0.1) {
      perpendicular = new Vector3(0, 1, 0).cross(direction);
    }
    return perpendicular.normalize();
  }, [from, to]);

  // Render single bond
  if (bondType === "single" || bondType === "covalent" || bondType === "ionic" || bondType === "metallic") {
    return (
      <mesh position={[midpoint.x, midpoint.y, midpoint.z]} quaternion={rotation}>
        <cylinderGeometry args={[radius, radius, length, 16]} />
        <meshPhysicalMaterial
          color={new Color(color)}
          emissive={new Color(color)}
          emissiveIntensity={0.1}
          metalness={bondType === "metallic" ? 0.6 : 0.2}
          roughness={bondType === "metallic" ? 0.4 : 0.5}
          transparent={bondType === "ionic"}
          opacity={bondType === "ionic" ? 0.7 : 1.0}
        />
      </mesh>
    );
  }

  // Render double bond (two parallel cylinders)
  if (bondType === "double") {
    const perp = getPerpendicular.clone().multiplyScalar(offset);

    return (
      <>
        {/* First cylinder */}
        <mesh
          position={[
            midpoint.x + perp.x,
            midpoint.y + perp.y,
            midpoint.z + perp.z,
          ]}
          quaternion={rotation}
        >
          <cylinderGeometry args={[radius, radius, length, 16]} />
          <meshPhysicalMaterial
            color={new Color(color)}
            emissive={new Color(color)}
            emissiveIntensity={0.1}
            metalness={0.2}
            roughness={0.5}
          />
        </mesh>

        {/* Second cylinder */}
        <mesh
          position={[
            midpoint.x - perp.x,
            midpoint.y - perp.y,
            midpoint.z - perp.z,
          ]}
          quaternion={rotation}
        >
          <cylinderGeometry args={[radius, radius, length, 16]} />
          <meshPhysicalMaterial
            color={new Color(color)}
            emissive={new Color(color)}
            emissiveIntensity={0.1}
            metalness={0.2}
            roughness={0.5}
          />
        </mesh>
      </>
    );
  }

  // Render triple bond (three parallel cylinders)
  if (bondType === "triple") {
    const perp = getPerpendicular.clone().multiplyScalar(offset);

    return (
      <>
        {/* Center cylinder */}
        <mesh position={[midpoint.x, midpoint.y, midpoint.z]} quaternion={rotation}>
          <cylinderGeometry args={[radius, radius, length, 16]} />
          <meshPhysicalMaterial
            color={new Color(color)}
            emissive={new Color(color)}
            emissiveIntensity={0.1}
            metalness={0.2}
            roughness={0.5}
          />
        </mesh>

        {/* Side cylinder 1 */}
        <mesh
          position={[
            midpoint.x + perp.x,
            midpoint.y + perp.y,
            midpoint.z + perp.z,
          ]}
          quaternion={rotation}
        >
          <cylinderGeometry args={[radius, radius, length, 16]} />
          <meshPhysicalMaterial
            color={new Color(color)}
            emissive={new Color(color)}
            emissiveIntensity={0.1}
            metalness={0.2}
            roughness={0.5}
          />
        </mesh>

        {/* Side cylinder 2 */}
        <mesh
          position={[
            midpoint.x - perp.x,
            midpoint.y - perp.y,
            midpoint.z - perp.z,
          ]}
          quaternion={rotation}
        >
          <cylinderGeometry args={[radius, radius, length, 16]} />
          <meshPhysicalMaterial
            color={new Color(color)}
            emissive={new Color(color)}
            emissiveIntensity={0.1}
            metalness={0.2}
            roughness={0.5}
          />
        </mesh>
      </>
    );
  }

  return null;
}

'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function PodiumPillar({ position, height, color, rank, label }: { position: [number, number, number]; height: number; color: string; rank: number; label: string }) {
  const trophyRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (trophyRef.current) {
      trophyRef.current.rotation.y = state.clock.elapsedTime * 0.9 + rank;
      trophyRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5 + rank) * 0.15;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.4;
    }
  });

  return (
    <group position={position}>
      {/* Base Pedestal Pillar (Porcelain White with Soft Metallic Sheen) */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.72, 0.78, height, 36]} />
        <meshStandardMaterial
          color="#f8fafc"
          metalness={0.25}
          roughness={0.15}
        />
      </mesh>

      {/* Top Emerald Accent Ring */}
      <mesh ref={ringRef} position={[0, height + 0.04, 0]}>
        <cylinderGeometry args={[0.74, 0.74, 0.08, 36]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Floating Gem Trophy */}
      <mesh ref={trophyRef} position={[0, height + 0.65, 0]}>
        <octahedronGeometry args={[0.32, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          roughness={0.1}
          metalness={0.85}
        />
      </mesh>
    </group>
  );
}

export default function DefensiblePodiumScene() {
  return (
    <div className="w-full h-72 sm:h-80 relative rounded-2xl overflow-hidden bg-gradient-to-b from-slate-50 via-emerald-50/20 to-white border border-slate-200/90 shadow-inner">
      <div className="absolute top-3.5 left-4 z-10 flex items-center space-x-2 text-xs font-mono px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 shadow-2xs">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-slate-700 font-bold">DEFENSIBLE 3D RESULTS CEREMONY STAGE</span>
        <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">• Drag to rotate 3D view</span>
      </div>

      <div className="absolute bottom-3 right-4 z-10 hidden sm:flex items-center space-x-3 text-[11px] font-mono text-slate-600 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-200">
        <span className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>#1 HyperAgent</span>
        </span>
        <span className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-teal-500" />
          <span>#2 ZeroKernel</span>
        </span>
        <span className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>#3 MeshMesh</span>
        </span>
      </div>

      <Canvas shadows camera={{ position: [0, 2.0, 5.0], fov: 42 }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 8, 4]} intensity={1.8} color="#ffffff" castShadow />
        <pointLight position={[-4, 3, -3]} intensity={0.8} color="#10b981" />
        <pointLight position={[3, 4, 3]} intensity={1.0} color="#059669" />
        
        <Float speed={1.8} rotationIntensity={0.08} floatIntensity={0.25}>
          <group position={[0, -0.85, 0]}>
            {/* Rank 2 (Teal / Silver) */}
            <PodiumPillar position={[-1.75, 0, 0]} height={1.25} color="#0d9488" rank={2} label="Rank 2" />
            {/* Rank 1 (Emerald Gold Champion) */}
            <PodiumPillar position={[0, 0, 0]} height={1.85} color="#059669" rank={1} label="Rank 1" />
            {/* Rank 3 (Bronze Amber) */}
            <PodiumPillar position={[1.75, 0, 0]} height={0.85} color="#d97706" rank={3} label="Rank 3" />
          </group>
        </Float>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.6} maxPolarAngle={Math.PI / 2.1} minPolarAngle={Math.PI / 4} />
      </Canvas>
    </div>
  );
}

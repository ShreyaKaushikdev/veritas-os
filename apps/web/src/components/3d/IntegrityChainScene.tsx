'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';

function ChainNode({ position, isTampered, index }: { position: [number, number, number]; isTampered?: boolean; index: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = isTampered ? '#ef4444' : index === 0 ? '#10b981' : '#00f2fe';

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5 + index;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3 + index;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.45, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isTampered ? 0.8 : 0.5}
          wireframe={false}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      {/* Outer subtle glow wireframe */}
      <mesh>
        <octahedronGeometry args={[0.6, 0]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function ConnectingBeam({ start, end, isTampered }: { start: [number, number, number]; end: [number, number, number]; isTampered?: boolean }) {
  const points = useMemo(() => [new THREE.Vector3(...start), new THREE.Vector3(...end)], [start, end]);
  const color = isTampered ? '#ef4444' : '#4facfe';

  return (
    <Line
      points={points}
      color={color}
      lineWidth={1.5}
      transparent
      opacity={isTampered ? 0.9 : 0.5}
    />
  );
}

function ChainGroup({ isTampered = false }: { isTampered?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  // Generate 6 interconnected node positions
  const nodePositions: [number, number, number][] = useMemo(() => [
    [-3.2, 0.4, 0],
    [-1.9, -0.6, 0.5],
    [-0.6, 0.7, -0.4],
    [0.7, -0.4, 0.3],
    [2.0, 0.6, -0.3],
    [3.3, -0.3, 0],
  ], []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {nodePositions.map((pos, idx) => (
        <React.Fragment key={idx}>
          <ChainNode
            position={pos}
            index={idx}
            isTampered={isTampered && idx === 3}
          />
          {idx < nodePositions.length - 1 && (
            <ConnectingBeam
              start={pos}
              end={nodePositions[idx + 1]}
              isTampered={isTampered && (idx === 2 || idx === 3)}
            />
          )}
        </React.Fragment>
      ))}
    </group>
  );
}

export default function IntegrityChainScene({ isTampered = false }: { isTampered?: boolean }) {
  return (
    <div className="w-full h-64 sm:h-72 relative rounded-xl overflow-hidden glass-card">
      <div className="absolute top-3 left-3 z-10 flex items-center space-x-2 text-xs font-mono px-2.5 py-1 rounded bg-dark-900/80 border border-white/10">
        <span className={`w-2 h-2 rounded-full ${isTampered ? 'bg-brand-crimson animate-ping' : 'bg-brand-emerald animate-pulse'}`} />
        <span className="text-gray-300">{isTampered ? 'CHAIN COMPROMISED (TAMPERED)' : 'CHAIN VERIFIED (MATHEMATICAL SHA-256)'}</span>
      </div>
      <Canvas camera={{ position: [0, 0, 5.5], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={1} color="#00f2fe" />
        <pointLight position={[-5, -5, -5]} intensity={0.8} color="#8b5cf6" />
        <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
          <ChainGroup isTampered={isTampered} />
        </Float>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.8} />
      </Canvas>
    </div>
  );
}

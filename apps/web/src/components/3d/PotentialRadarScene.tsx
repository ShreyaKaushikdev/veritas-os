'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function RadarMesh({ scores = [8.5, 7.5, 8.0, 9.0] }: { scores?: number[] }) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Normalized scores to coordinates
  const vertices = useMemo(() => {
    // 4 points on horizontal plane + top/bottom apex
    const s0 = (scores[0] || 7) / 10 * 1.8;
    const s1 = (scores[1] || 7) / 10 * 1.8;
    const s2 = (scores[2] || 7) / 10 * 1.8;
    const s3 = (scores[3] || 7) / 10 * 1.8;

    return new Float32Array([
      // Top apex
      0, 1.4, 0,
      // 4 perimeter vertices
      s0, 0, 0,
      0, 0, s1,
      -s2, 0, 0,
      0, 0, -s3,
      // Bottom apex
      0, -1.4, 0,
    ]);
  }, [scores]);

  const indices = useMemo(() => {
    return [
      // Top pyramid
      0, 1, 2,
      0, 2, 3,
      0, 3, 4,
      0, 4, 1,
      // Bottom pyramid
      5, 2, 1,
      5, 3, 2,
      5, 4, 3,
      5, 1, 4,
    ];
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.4;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={vertices.length / 3}
            array={vertices}
            itemSize={3}
          />
          <bufferAttribute
            attach="index"
            count={indices.length}
            array={new Uint16Array(indices)}
            itemSize={1}
          />
        </bufferGeometry>
        <meshStandardMaterial
          color="#8b5cf6"
          emissive="#4facfe"
          emissiveIntensity={0.4}
          roughness={0.3}
          metalness={0.7}
          transparent
          opacity={0.75}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Wireframe overlay */}
      <mesh ref={meshRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={vertices.length / 3}
            array={vertices}
            itemSize={3}
          />
          <bufferAttribute
            attach="index"
            count={indices.length}
            array={new Uint16Array(indices)}
            itemSize={1}
          />
        </bufferGeometry>
        <meshBasicMaterial color="#00f2fe" wireframe transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

export default function PotentialRadarScene({ scores }: { scores?: number[] }) {
  return (
    <div className="w-full h-64 sm:h-72 relative rounded-xl overflow-hidden glass-card">
      <div className="absolute top-3 left-3 z-10 flex items-center space-x-2 text-xs font-mono px-2.5 py-1 rounded bg-dark-900/80 border border-white/10">
        <span className="w-2 h-2 rounded-full bg-brand-violet animate-pulse" />
        <span className="text-gray-300">3D RUBRIC ALIGNMENT POTENTIAL MESH</span>
      </div>
      <Canvas camera={{ position: [0, 1.2, 4.2], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[4, 4, 4]} intensity={1.2} color="#00f2fe" />
        <pointLight position={[-4, -4, -4]} intensity={0.8} color="#8b5cf6" />
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
          <RadarMesh scores={scores} />
        </Float>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1.0} />
      </Canvas>
    </div>
  );
}

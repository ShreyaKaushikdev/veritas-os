'use client';

import React, { useRef, useState, useEffect } from 'react';

interface TiltCard3DProps {
  children: React.ReactNode;
  className?: string;
  isSpacebarActive?: boolean;
  maxTilt?: number;
  onClick?: () => void;
}

export default function TiltCard3D({
  children,
  className = '',
  isSpacebarActive = false,
  maxTilt = 10,
  onClick,
}: TiltCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState<{ x: number; y: number; opacity: number }>({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = -((y - centerY) / centerY) * maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    setRotate({ x: rotateX, y: rotateY });
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 1,
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  // Determine dynamic transform
  let transformStyle = '';
  if (isSpacebarActive) {
    if (isHovered) {
      transformStyle = `perspective(1200px) rotateX(${rotate.x * 0.5 + 8}deg) rotateY(${rotate.y * 0.5 - 4}deg) translateZ(60px) scale3d(1.02, 1.02, 1.02)`;
    } else {
      transformStyle = `perspective(1200px) rotateX(15deg) rotateY(-7deg) rotateZ(2deg) translateZ(42px)`;
    }
  } else if (isHovered) {
    transformStyle = `perspective(1000px) rotateX(${rotate.x.toFixed(2)}deg) rotateY(${rotate.y.toFixed(2)}deg) translateZ(25px) scale3d(1.015, 1.015, 1.015)`;
  } else {
    transformStyle = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)`;
  }

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: transformStyle,
        transformStyle: 'preserve-3d',
        transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease',
      }}
      className={`relative select-none ${isSpacebarActive ? 'shadow-2xl shadow-emerald-700/20 border-emerald-400' : ''} ${className}`}
    >
      {/* Specular lighting glare layer on cursor move */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300 z-30"
        style={{
          opacity: glare.opacity,
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(16, 185, 129, 0.16) 0%, rgba(255, 255, 255, 0.1) 30%, transparent 65%)`,
        }}
      />

      {/* Card Content with preserved 3D child depth */}
      <div className="relative z-10 w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
        {children}
      </div>
    </div>
  );
}

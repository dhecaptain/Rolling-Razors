import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const StitchTexture: React.FC = () => {
  const texture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, size, size);

    const gold = '#D6A62E';
    ctx.strokeStyle = gold;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Diamond quilt stitch grid
    const spacing = 64;
    for (let y = 0; y <= size; y += spacing) {
      for (let x = 0; x <= size; x += spacing) {
        const cx = x,
          cy = y;
        // Broken cross-stitch dashes
        ctx.beginPath();
        ctx.moveTo(cx - 14, cy - 14);
        ctx.lineTo(cx - 14 + 10, cy - 14);
        ctx.moveTo(cx - 14, cy - 14 + 10);
        ctx.lineTo(cx - 14, cy - 14);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 14, cy + 14);
        ctx.lineTo(cx + 14 - 10, cy + 14);
        ctx.moveTo(cx + 14, cy + 14 - 10);
        ctx.lineTo(cx + 14, cy + 14);
        ctx.stroke();
      }
    }

    // Panel edge hem stitching
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 8]);
    ctx.strokeRect(14, 14, size - 28, size - 28);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 2);
    tex.anisotropy = 4;
    return tex;
  }, []);

  if (!texture) return null;

  return (
    <mesh position={[0, 0, 0.015]}>
      <planeGeometry args={[4, 2.8]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.35}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
};

const LeatherPanel: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const leatherRef = useRef<THREE.Mesh>(null);

  const bump = useMemo(() => {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#2a2a2a';
    for (let y = 0; y < size; y += 4) {
      for (let x = 0; x < size; x += 4) {
        if ((x + y) % 13 === 0) ctx.fillRect(x, y, 3, 3);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    return tex;
  }, []);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const eased = 1 - Math.pow(1 - 0.06, delta * 60);
    group.rotation.y += (state.pointer.x * 0.45 - group.rotation.y) * eased;
    group.rotation.x += (-state.pointer.y * 0.3 - group.rotation.x) * eased;
    group.position.z = 0.4 + Math.sin(state.clock.elapsedTime * 0.6) * 0.08;
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <mesh ref={leatherRef}>
        <planeGeometry args={[4, 2.8, 24, 16]} />
        <meshPhysicalMaterial
          color="#0f4a3e"
          roughness={0.5}
          metalness={0.08}
          side={THREE.DoubleSide}
          bumpMap={bump}
          bumpScale={0.6}
          envMapIntensity={1}
        />
      </mesh>
      <StitchTexture />
    </group>
  );
};

const FloatingSeatBlob: React.FC<{ position: [number, number, number]; scale?: number; delay?: number }> = ({
  position,
  scale = 1,
  delay = 0,
}) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.1 + delay) * 0.12;
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5 + delay) * 0.15;
  });
  return (
    <mesh ref={ref} position={position} scale={scale}>
      <sphereGeometry args={[0.16, 20, 16]} />
      <meshStandardMaterial color="#d8a83c" roughness={0.4} metalness={0.35} />
    </mesh>
  );
};

export const LeatherStitchCanvas: React.FC = () => {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 4.6], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[4, 6, 5]} intensity={1.4} color="#fff7e6" />
        <pointLight position={[-4, -2, 3]} intensity={0.5} color="#D6A62E" />
        <LeatherPanel />
        <FloatingSeatBlob position={[1.6, -1.1, 0.6]} scale={0.7} delay={0} />
        <FloatingSeatBlob position={[-1.7, -0.9, 0.4]} scale={0.5} delay={1.7} />
      </Canvas>
    </div>
  );
};

export default LeatherStitchCanvas;
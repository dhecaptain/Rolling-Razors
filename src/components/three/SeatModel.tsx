import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Float, RoundedBox } from '@react-three/drei';
import type { LeatherTokens } from './textures';

type SeatModelProps = {
  map: THREE.Texture;
  bumpMap: THREE.Texture;
  tokens: LeatherTokens;
  secondary: string;
  reduce: boolean;
};

const GOLD = '#D6A62E';

export const SeatModel: React.FC<SeatModelProps> = ({ map, bumpMap, tokens, secondary, reduce }) => {
  const leather = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        map,
        bumpMap,
        bumpScale: tokens.bumpScale,
        roughness: tokens.roughness,
        metalness: 0,
        clearcoat: tokens.clearcoat,
        clearcoatRoughness: 0.4,
        color: '#ffffff',
      }),
    [map, bumpMap, tokens]
  );

  const accent = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: secondary,
        roughness: 0.5,
        metalness: 0.08,
      }),
    [secondary]
  );

  const gold = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: GOLD,
        roughness: 0.34,
        metalness: 0.95,
      }),
    []
  );

  return (
    <Float speed={1.1} rotationIntensity={0.22} floatIntensity={0.5} floatingRange={[-0.06, 0.1]} enabled={!reduce}>
      <group>
        <RoundedBox args={[2.4, 0.54, 1.72]} radius={0.2} smoothness={6} position={[0, 0.27, -0.05]}>
          <primitive object={leather} attach="material" />
        </RoundedBox>

        <RoundedBox args={[2.5, 1.55, 0.46]} radius={0.2} smoothness={6} position={[0, 1.28, -0.55]} rotation={[-0.16, 0, 0]}>
          <primitive object={leather} attach="material" />
        </RoundedBox>

        <RoundedBox args={[1.0, 0.42, 0.34]} radius={0.16} smoothness={6} position={[0, 2.34, -0.42]} rotation={[-0.16, 0, 0]}>
          <primitive object={leather} attach="material" />
        </RoundedBox>

        <RoundedBox args={[0.34, 1.5, 1.62]} radius={0.15} smoothness={4} position={[-1.28, 1.08, -0.3]} rotation={[-0.06, 0, 0.05]}>
          <primitive object={accent} attach="material" />
        </RoundedBox>
        <RoundedBox args={[0.34, 1.5, 1.62]} radius={0.15} smoothness={4} position={[1.28, 1.08, -0.3]} rotation={[-0.06, 0, -0.05]}>
          <primitive object={accent} attach="material" />
        </RoundedBox>

        <RoundedBox args={[0.32, 0.18, 0.55]} radius={0.07} smoothness={4} position={[-1.08, 0.5, 0.38]} rotation={[0.1, 0, 0.12]}>
          <primitive object={accent} attach="material" />
        </RoundedBox>
        <RoundedBox args={[0.32, 0.18, 0.55]} radius={0.07} smoothness={4} position={[1.08, 0.5, 0.38]} rotation={[0.1, 0, -0.12]}>
          <primitive object={accent} attach="material" />
        </RoundedBox>

        <RoundedBox args={[2.52, 0.09, 0.12]} radius={0.04} smoothness={3} position={[0, 2.05, -0.5]} rotation={[-0.16, 0, 0]}>
          <primitive object={gold} attach="material" />
        </RoundedBox>
        <RoundedBox args={[0.12, 0.09, 1.74]} radius={0.04} smoothness={3} position={[1.2, 0.52, -0.05]} rotation={[0, 0, Math.PI / 2]}>
          <primitive object={gold} attach="material" />
        </RoundedBox>
        <RoundedBox args={[0.12, 0.09, 1.74]} radius={0.04} smoothness={3} position={[-1.2, 0.52, -0.05]} rotation={[0, 0, Math.PI / 2]}>
          <primitive object={gold} attach="material" />
        </RoundedBox>
      </group>
    </Float>
  );
};

export default SeatModel;
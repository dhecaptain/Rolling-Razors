import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { SeatModel } from './SeatModel';
import { LEATHER_TOKENS, StitchPattern, LeatherType, makeQuiltingTexture, makeBumpTexture, makeShadowDisc } from './textures';

export type SeatPreviewProps = {
  primary: string;
  secondary: string;
  pattern: StitchPattern;
  leatherType: LeatherType;
  focusOnSeats: boolean;
  reduce: boolean;
  onReady?: () => void;
  onInteract?: () => void;
};

const WIDE_POSITION = new THREE.Vector3(3.2, 1.5, 3.4);
const WIDE_TARGET = new THREE.Vector3(0, 0.72, 0);
const FOCUS_POSITION = new THREE.Vector3(1.6, 1.55, 1.7);
const FOCUS_TARGET = new THREE.Vector3(0, 1.32, -0.28);

function CameraRig({
  focusOnSeats,
  reduce,
  engaged,
  onStart,
}: {
  focusOnSeats: boolean;
  reduce: boolean;
  engaged: boolean;
  onStart?: () => void;
}) {
  const controls = useRef<React.ElementRef<typeof OrbitControls>>(null);
  const frame = useRef(0);

  useFrame((_, delta) => {
    frame.current += 1;
    if (frame.current === 1) {
      controls.current?.target.copy(focusOnSeats ? FOCUS_TARGET : WIDE_TARGET);
    }
    const target = focusOnSeats ? FOCUS_TARGET : WIDE_TARGET;
    const position = focusOnSeats ? FOCUS_POSITION : WIDE_POSITION;
    const k = Math.min(1, delta * 3.2);
    controls.current?.object.position.lerp(position, k);
    controls.current?.target.lerp(target, k);
    controls.current?.update();
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableZoom={false}
      enablePan={false}
      rotateSpeed={0.6}
      enableDamping
      dampingFactor={0.08}
      autoRotate={!reduce && !engaged}
      autoRotateSpeed={0.7}
      minPolarAngle={Math.PI * 0.28}
      maxPolarAngle={Math.PI * 0.58}
      target={WIDE_TARGET.clone()}
      onStart={onStart}
    />
  );
}

function StudioEnvironment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    let environment: THREE.Texture | null = null;
    let pmrem: THREE.PMREMGenerator | null = null;
    try {
      pmrem = new THREE.PMREMGenerator(gl);
      const envScene = new RoomEnvironment();
      environment = pmrem.fromScene(envScene, 0.04).texture;
      scene.environment = environment;
      envScene.dispose();
    } catch {
      scene.environment = null;
    }
    return () => {
      if (scene.environment === environment) scene.environment = null;
      environment?.dispose();
      pmrem?.dispose();
    };
  }, [gl, scene]);
  return null;
}

function Scene({
  primary,
  secondary,
  pattern,
  leatherType,
  focusOnSeats,
  reduce,
  onInteract,
}: {
  primary: string;
  secondary: string;
  pattern: StitchPattern;
  leatherType: LeatherType;
  focusOnSeats: boolean;
  reduce: boolean;
  onInteract?: () => void;
}) {
  const [engaged, setEngaged] = useState(false);
  const tokens = LEATHER_TOKENS[leatherType];
  const { map, bumpMap, shadowDisc } = useMemo(() => {
    const map = makeQuiltingTexture({ primary, pattern, grain: tokens.grain });
    const bumpMap = makeBumpTexture({ primary, pattern });
    const shadowDisc = makeShadowDisc();
    return { map, bumpMap, shadowDisc };
  }, [primary, pattern, leatherType]);

  useEffect(
    () => () => {
      map.dispose();
      bumpMap.dispose();
      shadowDisc.dispose();
    },
    [map, bumpMap, shadowDisc]
  );

  const handleStart = () => {
    setEngaged(true);
    onInteract?.();
  };

  return (
    <>
      <StudioEnvironment />
      <ambientLight intensity={0.34} color="#fff2dc" />
      <directionalLight position={[4, 6, 4]} intensity={0.85} color="#ffe9c4" />
      <directionalLight position={[-5, 2, -3]} intensity={0.4} color="#5fb3a6" />
      <directionalLight position={[0, 0.4, 5]} intensity={0.28} color="#ffca7a" />

      <CameraRig focusOnSeats={focusOnSeats} reduce={reduce} engaged={engaged} onStart={handleStart} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshBasicMaterial map={shadowDisc} transparent depthWrite={false} />
      </mesh>

      <SeatModel map={map} bumpMap={bumpMap} tokens={tokens} secondary={secondary} reduce={reduce} />
    </>
  );
}

export const SeatPreview: React.FC<SeatPreviewProps> = ({
  primary,
  secondary,
  pattern,
  leatherType,
  focusOnSeats,
  reduce,
  onReady,
  onInteract,
}) => {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true }}
      camera={{ position: WIDE_POSITION.clone(), fov: 40, near: 0.1, far: 30 }}
      onCreated={(state) => {
        state.gl.toneMapping = THREE.ACESFilmicToneMapping;
        state.gl.toneMappingExposure = 1.05;
        onReady?.();
      }}
    >
      <Scene
        primary={primary}
        secondary={secondary}
        pattern={pattern}
        leatherType={leatherType}
        focusOnSeats={focusOnSeats}
        reduce={reduce}
        onInteract={onInteract}
      />
    </Canvas>
  );
};

export default SeatPreview;
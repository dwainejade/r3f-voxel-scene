import { useVoxelStore } from '../store/voxelStore';
import { useRef } from 'react';

export default function LightRenderer() {
  const lights = useVoxelStore((state) => state.lights);
  const selectedLight = useVoxelStore((state) => state.selectedLight);
  const lightRefs = useRef<Map<string, any>>(new Map());

  // Create lights for THREE.js
  return (
    <>
      {lights.map((light) => {
        if (light.type === 'directional') {
          return (
            <directionalLight
              key={light.id}
              position={light.position}
              intensity={light.intensity}
              color={light.color}
              castShadow={light.castShadow}
              ref={(ref) => {
                if (ref) lightRefs.current.set(light.id, ref);
              }}
            />
          );
        } else if (light.type === 'point') {
          return (
            <pointLight
              key={light.id}
              position={light.position}
              intensity={light.intensity}
              color={light.color}
              distance={light.distance || 100}
              decay={2}
              castShadow={light.castShadow}
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
              shadow-camera-near={0.1}
              shadow-camera-far={light.distance || 100}
              ref={(ref) => {
                if (ref) lightRefs.current.set(light.id, ref);
              }}
            />
          );
        } else if (light.type === 'spot') {
          return (
            <spotLight
              key={light.id}
              position={light.position}
              intensity={light.intensity}
              color={light.color}
              distance={light.distance || 100}
              angle={light.angle || Math.PI / 6}
              penumbra={light.penumbra || 0.5}
              decay={2}
              castShadow={light.castShadow}
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
              shadow-camera-near={0.1}
              shadow-camera-far={light.distance || 100}
              ref={(ref) => {
                if (ref) lightRefs.current.set(light.id, ref);
              }}
            />
          );
        }
      })}

      {/* Light helpers - spheres to show light positions */}
      {lights.map((light) => (
        <mesh
          key={`${light.id}-helper`}
          position={light.position}
          onClick={() => useVoxelStore.setState({ selectedLight: light.id })}
        >
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial
            color={selectedLight === light.id ? '#FFFF00' : light.color}
            transparent
            opacity={selectedLight === light.id ? 0.8 : 0.5}
          />
        </mesh>
      ))}
    </>
  );
}

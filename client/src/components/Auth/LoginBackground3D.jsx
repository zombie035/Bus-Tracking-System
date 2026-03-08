import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, Environment } from '@react-three/drei';
import * as THREE from 'three';

const FloatingShape = ({ position, color, speed, rotationIntensity, scale }) => {
    const meshRef = useRef();

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        meshRef.current.rotation.x = t * speed;
        meshRef.current.rotation.y = t * speed * 0.5;
    });

    return (
        <Float
            speed={speed * 2}
            rotationIntensity={rotationIntensity}
            floatIntensity={1.5}
            position={position}
        >
            <mesh ref={meshRef} scale={scale}>
                <icosahedronGeometry args={[1, 0]} />
                <meshStandardMaterial
                    color={color}
                    roughness={0.1}
                    metalness={0.5}
                    emissive={color}
                    emissiveIntensity={0.2}
                />
            </mesh>
        </Float>
    );
};

const LoginBackground3D = () => {
    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
            <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
                <color attach="background" args={['#212121']} />

                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#FBF5E5" />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#A35C7A" />

                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                {/* Main Shapes - Palette Colors */}
                <FloatingShape position={[-4, 2, -5]} color="#A35C7A" speed={0.2} rotationIntensity={1} scale={1.5} />
                <FloatingShape position={[4, -2, -5]} color="#C890A7" speed={0.3} rotationIntensity={1.5} scale={1.8} />

                {/* Background Shapes */}
                <FloatingShape position={[-6, -4, -10]} color="#FBF5E5" speed={0.1} rotationIntensity={0.5} scale={1} />
                <FloatingShape position={[6, 4, -8]} color="#A35C7A" speed={0.15} rotationIntensity={0.8} scale={1.2} />
                <FloatingShape position={[0, 6, -15]} color="#C890A7" speed={0.1} rotationIntensity={0.5} scale={2} />

                <fog attach="fog" args={['#212121', 5, 25]} />
            </Canvas>
        </div>
    );
};

export default LoginBackground3D;

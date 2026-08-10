import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { Play } from "lucide-react";
import { API_BASE } from "@/lib/apiBase";

// AniList's CDN does not send CORS headers, and WebGL textures require them.
// Route remote covers through a CORS-friendly image proxy.
const proxied = (url) => {
  if (!url) return url;
  if (url.startsWith("/") || url.startsWith("data:") || url.startsWith(window.location.origin)) return url;
  return `${API_BASE}/image-proxy?url=${encodeURIComponent(url)}`;
};

const SafeImage = ({ url, isActive, isHovered }) => {
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");

    const apply = (tex) => {
      if (cancelled) return;
      tex.colorSpace = THREE.SRGBColorSpace;
      setTexture(tex);
    };

    loader.load(proxied(url), apply, undefined, () => {
      loader.load(url, apply, undefined, () => {
        console.warn("Error loading texture", url);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <mesh position={[0, 0, 0]}>
      <planeGeometry args={[2, 3]} />
      {texture ? (
        <meshBasicMaterial map={texture} />
      ) : (
        <meshBasicMaterial color="#1a1a2e" />
      )}
    </mesh>
  );
};

export const Carousel3D = ({ items, onSelect, activeId }) => {
  const groupRef = useRef(null);
  const [hovered, setHovered] = useState(null);
  
  const radius = Math.max(5, items.length * 0.4);
  const angleStep = (Math.PI * 2) / items.length;

  useFrame((state, delta) => {
    if (groupRef.current && !hovered) {
      groupRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, -radius + 2]}>
      {items.map((item, i) => {
        const angle = i * angleStep;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        const isHovered = hovered === item.id;
        const isActive = activeId === item.id;
        
        const imageUrl = item.coverImage?.extraLarge || item.coverImage?.large || item.bannerImage;

        return (
          <group 
            key={item.id} 
            position={[x, isActive ? 0.5 : 0, z]} 
            rotation={[0, angle, 0]}
            onPointerOver={(e) => { e.stopPropagation(); setHovered(item.id); document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { setHovered(null); document.body.style.cursor = 'auto'; }}
            onClick={(e) => { e.stopPropagation(); onSelect(item); }}
          >
            <mesh position={[0, 0, -0.05]}>
              <planeGeometry args={[2.2, 3.2]} />
              <meshBasicMaterial color={isActive ? "#fbbf24" : isHovered ? "#38bdf8" : "#ffffff"} transparent opacity={isActive || isHovered ? 0.8 : 0.2} />
            </mesh>

            <SafeImage url={imageUrl} isActive={isActive} isHovered={isHovered} />
            
            {(isHovered || isActive) && (
              <Html position={[0, -1.8, 0.1]} center transform>
                <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl text-center border border-white/20 shadow-xl pointer-events-none w-48">
                   <p className="text-white font-bold text-sm truncate">{item.title?.userPreferred || item.title?.english}</p>
                   {isActive && <div className="text-amber-400 text-xs mt-1 animate-pulse flex justify-center items-center gap-1"><Play className="w-3 h-3"/> En cours</div>}
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
};
"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useUniverse } from "@/stores/useUniverse";
import { planets } from "@/content/skills";
import type { PlanetData, SkillMoon } from "@/content/skills";

/* ─── GLSL ─── */

const planetVert = /* glsl */ `
  uniform float u_time;
  uniform float u_noiseScale;
  uniform float u_noiseAmp;

  varying vec3 v_normal;
  varying vec3 v_pos;
  varying float v_disp;

  vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
  vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
  vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
  vec4 tis(vec4 r){return 1.79284291400159-.85373472095314*r;}

  float snoise(vec3 v){
    const vec2 C=vec2(1./6.,1./3.);
    vec3 i=floor(v+dot(v,C.yyy)),x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz),l=1.-g;
    vec3 i1=min(g,l.zxy),i2=max(g,l.zxy);
    vec3 x1=x0-i1+C.xxx,x2=x0-i2+C.yyy,x3=x0-.5;
    i=mod289(i);
    vec4 p=permute(permute(permute(
      i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
    float n_=.142857142857;vec3 ns=n_*vec3(2.,1.,0.)-vec3(1.,2./7.,1./7.);
    vec4 j=p-49.*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z),y_=floor(j-7.*x_);
    vec4 x=x_*ns.x+ns.yyyy,y=y_*ns.x+ns.yyyy,h=1.-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy),b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.+1.,s1=floor(b1)*2.+1.,sh=-step(h,vec4(0.));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy,a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x),p1=vec3(a0.zw,h.y),p2=vec3(a1.xy,h.z),p3=vec3(a1.zw,h.w);
    vec4 norm=tis(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
    return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  float fbm(vec3 p){
    float v=0.,a=.5;
    for(int i=0;i<4;i++){v+=a*snoise(p);a*=.5;p*=2.;}
    return v;
  }

  void main(){
    vec3 pos=position;
    float n=fbm(pos*u_noiseScale+u_time*0.08);
    v_disp=n;
    pos+=normal*n*u_noiseAmp;
    v_normal=normalize(normalMatrix*normal);
    v_pos=(modelViewMatrix*vec4(pos,1.)).xyz;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.);
  }
`;

const planetFrag = /* glsl */ `
  uniform vec3 u_color;
  uniform vec3 u_color2;
  uniform vec3 u_emissive;

  varying vec3 v_normal;
  varying vec3 v_pos;
  varying float v_disp;

  void main(){
    vec3 viewDir=normalize(-v_pos);
    float fresnel=pow(1.-max(dot(v_normal,viewDir),0.),3.5);

    // Surface: mix base with secondary based on noise (veins/terrain)
    vec3 surface=mix(u_color,u_color2,smoothstep(0.0,0.4,v_disp));
    // Dark valleys
    surface=mix(u_emissive,surface,smoothstep(-0.5,0.1,v_disp));

    // Rim glow
    vec3 rim=u_color2*1.5;
    surface=mix(surface,rim,fresnel*0.6);

    // Atmosphere
    surface+=u_color2*fresnel*0.2;

    gl_FragColor=vec4(surface,1.);
  }
`;

/* ─── Moon Component ─── */

interface MoonProps {
  skill: SkillMoon;
  orbitRadius: number;
  orbitAngleOffset: number;
  planetPos: THREE.Vector3;
  color: string;
  parentTime: React.MutableRefObject<number>;
  isActive: boolean;
}

function SkillMoonMesh({
  skill,
  orbitRadius,
  orbitAngleOffset,
  color,
  parentTime,
  isActive,
}: MoonProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Moon size proportional to proficiency (0.08 – 0.25)
  const moonSize = 0.08 + (skill.proficiency / 10) * 0.17;

  useFrame(() => {
    if (!meshRef.current) return;
    const t = parentTime.current;
    const angle = t * 0.3 + orbitAngleOffset;
    meshRef.current.position.x = Math.cos(angle) * orbitRadius;
    meshRef.current.position.z = Math.sin(angle) * orbitRadius;
    meshRef.current.position.y = Math.sin(angle * 0.7 + orbitAngleOffset) * orbitRadius * 0.3;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[moonSize, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
        roughness={0.6}
        metalness={0.2}
      />
      {/* Label — drei Html */}
      {isActive && (
        <Html
          center
          distanceFactor={15}
          style={{
            pointerEvents: "none",
            whiteSpace: "nowrap",
            userSelect: "none",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "9px",
              letterSpacing: "0.15em",
              color: "rgba(255,255,255,0.75)",
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(6px)",
              padding: "3px 8px",
              borderRadius: "4px",
              border: `1px solid ${color}33`,
              transform: "translateY(-18px)",
              textTransform: "uppercase",
            }}
          >
            {skill.name}
            <span style={{ color, marginLeft: "6px", fontWeight: 600 }}>
              {skill.proficiency}
            </span>
          </div>
        </Html>
      )}
    </mesh>
  );
}

/* ─── Planet Component ─── */

interface PlanetMeshProps {
  data: PlanetData;
  isActive: boolean;
}

function PlanetMesh({ data, isActive }: PlanetMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_noiseScale: { value: data.id === "synthar" ? 2.0 : data.id === "chromara" ? 1.5 : 3.0 },
      u_noiseAmp: { value: data.id === "velocis" ? 0.5 : 0.3 },
      u_color: { value: new THREE.Color(data.color) },
      u_color2: { value: new THREE.Color(data.secondaryColor) },
      u_emissive: { value: new THREE.Color(data.emissive) },
    }),
    [data]
  );

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    timeRef.current = t;

    // Planet orbits central light
    const angle = t * data.orbitSpeed;
    groupRef.current.position.x = Math.cos(angle) * data.orbitRadius;
    groupRef.current.position.z = Math.sin(angle) * data.orbitRadius;
    groupRef.current.position.y = Math.sin(angle * 0.5) * 2;

    // Planet rotation
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003;
    }

    uniforms.u_time.value = t;
  });

  // Distribute moons evenly around the planet
  const moonOrbitBase = data.radius * 1.8;

  return (
    <group ref={groupRef}>
      {/* Planet sphere */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[data.radius, 48]} />
        <shaderMaterial
          vertexShader={planetVert}
          fragmentShader={planetFrag}
          uniforms={uniforms}
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh>
        <sphereGeometry args={[data.radius * 1.15, 32, 32]} />
        <meshBasicMaterial
          color={data.secondaryColor}
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Ring (Chromara only) */}
      {data.id === "chromara" && (
        <mesh rotation={[Math.PI / 2.2, 0.2, 0]}>
          <torusGeometry args={[data.radius * 2, 0.15, 8, 128]} />
          <meshBasicMaterial
            color={data.secondaryColor}
            transparent
            opacity={0.2}
          />
        </mesh>
      )}

      {/* Planet label */}
      {isActive && (
        <Html center distanceFactor={20} position={[0, data.radius + 1.2, 0]}>
          <div
            style={{
              pointerEvents: "none",
              textAlign: "center",
              userSelect: "none",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: "14px",
                color: data.secondaryColor,
                letterSpacing: "-0.02em",
                textShadow: `0 0 20px ${data.secondaryColor}55`,
              }}
            >
              {data.planetName}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "8px",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.4)",
                marginTop: "2px",
              }}
            >
              {data.meaning}
            </div>
          </div>
        </Html>
      )}

      {/* Point light for planet glow */}
      <pointLight
        color={data.secondaryColor}
        intensity={isActive ? 3 : 1}
        distance={15}
        decay={2}
      />

      {/* Skill moons */}
      {data.skills.map((skill, i) => {
        const moonOrbit = moonOrbitBase + i * 0.5;
        const angleOffset = (i / data.skills.length) * Math.PI * 2;
        return (
          <SkillMoonMesh
            key={skill.name}
            skill={skill}
            orbitRadius={moonOrbit}
            orbitAngleOffset={angleOffset}
            planetPos={new THREE.Vector3()}
            color={data.secondaryColor}
            parentTime={timeRef}
            isActive={isActive}
          />
        );
      })}
    </group>
  );
}

/* ─── Solar System ─── */

const _dir = new THREE.Vector3();
const _target = new THREE.Vector3();
let _initialized = false;

export default function PlanetField() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ camera }) => {
    if (!groupRef.current) return;
    const progress = useUniverse.getState().scrollProgress;

    // Visibility: ONLY during skills section
    const visible = progress >= 0.28 && progress <= 0.48;
    groupRef.current.visible = visible;

    if (visible) {
      // Position 120 units ahead of camera — far enough to see as spheres
      _dir.set(0, 0, -1).applyQuaternion(camera.quaternion);
      _target.copy(camera.position).add(_dir.multiplyScalar(120));

      if (!_initialized) {
        // First frame: snap to position, no lerp
        groupRef.current.position.copy(_target);
        _initialized = true;
      } else {
        // After first frame: gentle follow
        groupRef.current.position.lerp(_target, 0.08);
      }
    } else {
      _initialized = false;
    }
  });

  // Determine active planet based on sub-scroll
  const scrollProgress = useUniverse((s) => s.scrollProgress);
  const subProgress =
    scrollProgress >= 0.28 && scrollProgress <= 0.45
      ? (scrollProgress - 0.28) / 0.17
      : -1;

  const activeIdx =
    subProgress < 0 ? -1 : subProgress < 0.33 ? 0 : subProgress < 0.66 ? 1 : 2;

  return (
    <group ref={groupRef}>
      {/* Central star/light */}
      <pointLight color="#FFF5E0" intensity={8} distance={60} decay={2} />
      <mesh>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshBasicMaterial color="#FFF5E0" />
      </mesh>
      {/* Central glow */}
      <mesh>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshBasicMaterial color="#FFE4B0" transparent opacity={0.08} />
      </mesh>

      {/* 3 Planets */}
      {planets.map((p, i) => (
        <PlanetMesh key={p.id} data={p} isActive={activeIdx === i} />
      ))}
    </group>
  );
}

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

interface Cosmos3DViewProps {
  simDate: Date;
}

const CITIES_DB: Record<string, { name: string; lat: number; lon: number }> = {
  damascus: { name: 'دمشق (الجامع الأموي)', lat: 33.5138, lon: 36.2924 },
  mecca: { name: 'مكة المكرمة (الكعبة المشرفة)', lat: 21.4225, lon: 39.8262 },
  medina: { name: 'المدينة المنورة', lat: 24.4672, lon: 39.6111 },
  jerusalem: { name: 'القدس الشريف', lat: 31.7767, lon: 35.2342 },
  cairo: { name: 'القاهرة (مرصد ابن يونس)', lat: 30.0444, lon: 31.2357 },
  alexandria: { name: 'الإسكندرية (مرصد بطلميوس)', lat: 31.2001, lon: 29.9187 },
  baghdad: { name: 'بغداد (مرصد بيت الحكمة)', lat: 33.3152, lon: 44.3661 },
  maragha: { name: 'مراغة (مرصد الطوسي)', lat: 37.3917, lon: 46.2392 },
  samarkand: { name: 'سمرقند (مرصد ألغ بك)', lat: 39.6542, lon: 66.9597 },
  equator: { name: 'خط الاستواء (الفلك المستقيم)', lat: 0.0, lon: 0.0 },
  pole: { name: 'القطب الشمالي (شمس منتصف الليل)', lat: 90.0, lon: 0.0 },
  sydney: { name: 'سيدني (نصف الكرة الجنوبي)', lat: -33.8688, lon: 151.2093 }
};

const ZODIAC_NAMES = [
  'الحمل ♈', 'الثور ♉', 'الجوزاء ♊', 'السرطان ♋',
  'الأسد ♌', 'السنبلة ♍', 'الميزان ♎', 'العقرب ♏',
  'القوس ♐', 'الجدي ♑', 'الدلو ♒', 'الحوت ♓'
];

const PLANETS_CONFIG = [
  { key: 'mercury', name: 'عطارد ☿', r: 55, color: 0xC084FC, size: 3.5, periodDays: 87.97, inc: 0.122 },
  { key: 'venus', name: 'الزهرة ♀', r: 85, color: 0xF472B6, size: 4.8, periodDays: 224.70, inc: 0.059 },
  { key: 'mars', name: 'المريخ ♂', r: 165, color: 0xF87171, size: 4.5, periodDays: 686.97, inc: 0.032 },
  { key: 'jupiter', name: 'المشتري ♃', r: 198, color: 0xFB923C, size: 6.2, periodDays: 4332.6, inc: 0.023 },
  { key: 'saturn', name: 'زحل ♄', r: 236, color: 0xFACC15, size: 5.5, periodDays: 10759, inc: 0.043 }
];

export const Cosmos3DView: React.FC<Cosmos3DViewProps> = ({ simDate }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [cityKey, setCityKey] = useState<string>('damascus');
  const [latDeg, setLatDeg] = useState<number>(33.5138);
  const [lonDeg, setLonDeg] = useState<number>(36.2924);
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [ascendantSign, setAscendantSign] = useState<string>('الحمل ♈');
  const [descendantSign, setDescendantSign] = useState<string>('الميزان ♎');

  const [cameraPreset, setCameraPreset] = useState<'horizon' | 'polaris' | 'moon' | 'sun' | 'orbit' | 'polar'>('horizon');
  const [showPlanets, setShowPlanets] = useState(true);
  const [showOrbitCircles, setShowOrbitCircles] = useState(true);
  const [showMeridian, setShowMeridian] = useState(true);
  const [showZodiac, setShowZodiac] = useState(true);
  const [showAtlas, setShowAtlas] = useState(true);
  const [showMoonArc, setShowMoonArc] = useState(true);

  const [telemetry, setTelemetry] = useState({
    cityName: 'دمشق (الجامع الأموي)',
    polarAlt: '33.51°',
    declination: '+23.44°',
    altSun: '79.5°',
    azSun: '180.0°',
    sunriseAz: '61.5°',
    moonPhaseName: 'بدر تام (100%)',
    moonIllum: '100% مضاء',
    moonElong: '180.0°',
    altMoon: '15.2°',
    moonriseAz: '56.2°',
    moonsetAz: '303.8°',
  });

  const EPSILON = 23.44 * Math.PI / 180;
  const MOON_INC = 5.14 * Math.PI / 180;
  const DOME_R = 140;
  const currentLatRad = latDeg * Math.PI / 180;

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sunMeshRef = useRef<THREE.Mesh | null>(null);
  const moonMeshRef = useRef<THREE.Mesh | null>(null);
  const planetMeshesRef = useRef<Record<string, THREE.Mesh>>({});
  const planetOrbitLinesRef = useRef<Record<string, THREE.Line>>({});
  const meridianLineRef = useRef<THREE.Line | null>(null);
  const primeVerticalLineRef = useRef<THREE.Line | null>(null);
  const planetsGroupRef = useRef<THREE.Group | null>(null);
  const zodiacGroupRef = useRef<THREE.Group | null>(null);
  const zodiacLineRef = useRef<THREE.Line | null>(null);
  const zodiacSpritesRef = useRef<THREE.Sprite[]>([]);
  const atlasGroupRef = useRef<THREE.Group | null>(null);
  const axisLineRef = useRef<THREE.Line | null>(null);
  const equatorLineRef = useRef<THREE.Line | null>(null);
  const polarisMeshRef = useRef<THREE.Mesh | null>(null);
  const sunRayRef = useRef<THREE.Line | null>(null);
  const moonRayRef = useRef<THREE.Line | null>(null);
  const polarisOrbitRef = useRef<THREE.Line | null>(null);
  const seasonalArcsRef = useRef<THREE.Group | null>(null);
  const moonArcRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 900;
    const height = 620;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.5, 3500);
    camera.position.set(0, 16, 65);
    camera.lookAt(0, 15, -45);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // الماوس: تحكم حر بالسحب والتكبير 360°
    let isMouseDown = false;
    let prevMouseX = 0, prevMouseY = 0;
    let sphereRadius = 140;
    let sphericalTheta = 0;
    let sphericalPhi = Math.PI / 3;

    const onMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isMouseDown || !cameraRef.current) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      sphericalTheta -= dx * 0.008;
      sphericalPhi = Math.max(0.05, Math.min(Math.PI - 0.05, sphericalPhi - dy * 0.008));

      const cam = cameraRef.current;
      cam.position.x = sphereRadius * Math.sin(sphericalPhi) * Math.sin(sphericalTheta);
      cam.position.y = sphereRadius * Math.cos(sphericalPhi);
      cam.position.z = sphereRadius * Math.sin(sphericalPhi) * Math.cos(sphericalTheta);
      cam.lookAt(0, 0, 0);
    };
    const onMouseUp = () => { isMouseDown = false; };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault(); // إيقاف صعود ونزول الصفحة عند تدوير الدولاب
      sphereRadius = Math.max(20, Math.min(1000, sphereRadius + e.deltaY * 0.4));
      if (!cameraRef.current) return;
      const cam = cameraRef.current;
      cam.position.x = sphereRadius * Math.sin(sphericalPhi) * Math.sin(sphericalTheta);
      cam.position.y = sphereRadius * Math.cos(sphericalPhi);
      cam.position.z = sphereRadius * Math.sin(sphericalPhi) * Math.cos(sphericalTheta);
      cam.lookAt(0, 0, 0);
    };

    mount.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    mount.addEventListener('wheel', onWheel, { passive: false });

    const ambient = new THREE.AmbientLight(0x334155, 1.2);
    scene.add(ambient);

    // قرص الأفق
    const r = DOME_R;
    const discGeom = new THREE.CircleGeometry(r, 64);
    const discMat = new THREE.MeshStandardMaterial({ color: 0x0A1628, roughness: 0.8, side: THREE.DoubleSide });
    const disc = new THREE.Mesh(discGeom, discMat);
    disc.rotation.x = -Math.PI / 2;
    scene.add(disc);

    const ringGeom = new THREE.RingGeometry(r - 1.5, r + 0.5, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38BDF8, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = -Math.PI / 2;
    scene.add(ring);

    // الشمس في القبة السماوية
    const sunGeom = new THREE.SphereGeometry(7.5, 32, 32);
    const sunMesh = new THREE.Mesh(sunGeom, new THREE.MeshBasicMaterial({ color: 0xFDE047 }));
    scene.add(sunMesh);
    sunMeshRef.current = sunMesh;
    sunMesh.add(new THREE.PointLight(0xFFFBEB, 2.0, 700));

    // القمر: جرم وضاء وواضح في القبة السماوية
    const moonGeom = new THREE.SphereGeometry(5.5, 32, 32);
    const moonMat = new THREE.MeshStandardMaterial({
      color: 0xF1F5F9,
      emissive: 0xCBD5E1,
      emissiveIntensity: 0.45,
      roughness: 0.4
    });
    const moonMesh = new THREE.Mesh(moonGeom, moonMat);
    scene.add(moonMesh);
    moonMeshRef.current = moonMesh;
    moonMesh.add(new THREE.PointLight(0xE0E7FF, 1.2, 500));

    // مجموعة قوس مسار القمر
    const moonArcGroup = new THREE.Group();
    scene.add(moonArcGroup);
    moonArcRef.current = moonArcGroup;

    // دائرة نصف النهار (Meridian Circle)
    const merPts = [];
    for (let i = 0; i <= 64; i++) {
      const th = (i / 64) * Math.PI * 2;
      merPts.push(new THREE.Vector3(0, DOME_R * Math.cos(th), DOME_R * Math.sin(th)));
    }
    const merLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(merPts), new THREE.LineDashedMaterial({ color: 0x10B981, dashSize: 4, gapSize: 3, transparent: true, opacity: 0.45 }));
    merLine.computeLineDistances();
    scene.add(merLine);
    meridianLineRef.current = merLine;

    // دائرة أول السموت (Prime Vertical)
    const pvPts = [];
    for (let i = 0; i <= 64; i++) {
      const th = (i / 64) * Math.PI * 2;
      pvPts.push(new THREE.Vector3(DOME_R * Math.cos(th), DOME_R * Math.sin(th), 0));
    }
    const pvLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pvPts), new THREE.LineDashedMaterial({ color: 0x06B6D4, dashSize: 4, gapSize: 3, transparent: true, opacity: 0.45 }));
    pvLine.computeLineDistances();
    scene.add(pvLine);
    primeVerticalLineRef.current = pvLine;

    // أشعة الرؤية والارتفاع للشمس والقمر
    const sunRay = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: 0xFBBF24, dashSize: 4, gapSize: 3, transparent: true, opacity: 0.5 }));
    scene.add(sunRay);
    sunRayRef.current = sunRay;

    const moonRay = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: 0xC084FC, dashSize: 4, gapSize: 3, transparent: true, opacity: 0.5 }));
    scene.add(moonRay);
    moonRayRef.current = moonRay;

    // محاور القطبين
    const axisGeom = new THREE.BufferGeometry();
    const axisLine = new THREE.Line(axisGeom, new THREE.LineDashedMaterial({ color: 0x38BDF8, dashSize: 6, gapSize: 4, transparent: true, opacity: 0.6 }));
    scene.add(axisLine);
    axisLineRef.current = axisLine;

    const eqGeom = new THREE.BufferGeometry();
    const eqLine = new THREE.Line(eqGeom, new THREE.LineBasicMaterial({ color: 0x60A5FA, transparent: true, opacity: 0.6 }));
    scene.add(eqLine);
    equatorLineRef.current = eqLine;

    // مدار النجم القطبي
    const polOrbitLine = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineDashedMaterial({ color: 0x38BDF8, dashSize: 4, gapSize: 3, transparent: true, opacity: 0.75 })
    );
    scene.add(polOrbitLine);
    polarisOrbitRef.current = polOrbitLine;

    const polMesh = new THREE.Mesh(new THREE.SphereGeometry(4.5, 20, 20), new THREE.MeshBasicMaterial({ color: 0xE0F2FE }));
    scene.add(polMesh);
    polarisMeshRef.current = polMesh;
    polMesh.add(new THREE.Mesh(new THREE.SphereGeometry(8, 16, 16), new THREE.MeshBasicMaterial({ color: 0x38BDF8, transparent: true, opacity: 0.45 })));

    const arcsGroup = new THREE.Group();
    scene.add(arcsGroup);
    seasonalArcsRef.current = arcsGroup;

    // الكواكب
    const planetsGroup = new THREE.Group();
    scene.add(planetsGroup);
    planetsGroupRef.current = planetsGroup;

    PLANETS_CONFIG.forEach(cfg => {
      const pRing = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.45 }));
      planetsGroup.add(pRing);
      planetOrbitLinesRef.current[cfg.key] = pRing;

      const pMesh = new THREE.Mesh(new THREE.SphereGeometry(cfg.size, 16, 16), new THREE.MeshStandardMaterial({ color: cfg.color }));
      planetsGroup.add(pMesh);
      planetMeshesRef.current[cfg.key] = pMesh;
    });

    // البروج (الفلك الثامن الحقيقي الواقعي)
    const zodiacGroup = new THREE.Group();
    scene.add(zodiacGroup);
    zodiacGroupRef.current = zodiacGroup;

    const zLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xC084FC, transparent: true, opacity: 0.75, linewidth: 2 }));
    zodiacGroup.add(zLine);
    zodiacLineRef.current = zLine;

    const zSprites: THREE.Sprite[] = [];
    for (let i = 0; i < 12; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = 240; canvas.height = 65;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = '#A855F7';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect(6, 6, 228, 53, 14); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#E9D5FF'; ctx.font = 'bold 22px "Cairo", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(ZODIAC_NAMES[i], 120, 32);
      }
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true }));
      sprite.scale.set(26, 7, 1);
      zodiacGroup.add(sprite);
      zSprites.push(sprite);
    }
    zodiacSpritesRef.current = zSprites;

    // الأطلس
    const atlasGroup = new THREE.Group();
    scene.add(atlasGroup);
    atlasGroupRef.current = atlasGroup;
    const atlasRing = new THREE.Mesh(
      new THREE.RingGeometry(290, 292, 64),
      new THREE.MeshBasicMaterial({ color: 0xA855F7, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
    );
    atlasRing.rotation.x = -(Math.PI / 2 - currentLatRad);
    atlasGroup.add(atlasRing);

    // النجوم
    const starPts = [];
    for (let i = 0; i < 1000; i++) {
      const u = Math.random(), v = Math.random();
      const th = u * 2 * Math.PI, ph = Math.acos(2 * v - 1);
      starPts.push(600 * Math.sin(ph) * Math.cos(th), 600 * Math.sin(ph) * Math.sin(th), 600 * Math.cos(ph));
    }
    atlasGroup.add(new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(starPts, 3)), new THREE.PointsMaterial({ color: 0xFFFFFF, size: 2.2, transparent: true, opacity: 0.85 })));

    let reqId: number;
    const loop = () => {
      reqId = requestAnimationFrame(loop);
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(reqId);
      mount.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      mount.removeEventListener('wheel', onWheel);
      if (renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // تحديث المحاور عند تغير خط العرض
  useEffect(() => {
    const phi = currentLatRad;
    const sphereR = 260;

    if (axisLineRef.current) {
      const axisPts = [
        new THREE.Vector3(0, -sphereR * Math.sin(phi), sphereR * Math.cos(phi)),
        new THREE.Vector3(0, sphereR * Math.sin(phi), -sphereR * Math.cos(phi))
      ];
      axisLineRef.current.geometry.setFromPoints(axisPts);
      axisLineRef.current.computeLineDistances();
    }

    if (equatorLineRef.current) {
      const eqPts = [];
      for (let i = 0; i <= 64; i++) {
        const th = (i / 64) * Math.PI * 2;
        eqPts.push(new THREE.Vector3(140 * Math.sin(th), 140 * Math.cos(th) * Math.cos(phi), 140 * Math.cos(th) * Math.sin(phi)));
      }
      equatorLineRef.current.geometry.setFromPoints(eqPts);
    }

    if (polarisOrbitRef.current) {
      const polDist = 320;
      const polOrbitR = 24;
      const pts = [];
      for (let i = 0; i <= 64; i++) {
        const th = (i / 64) * Math.PI * 2;
        pts.push(new THREE.Vector3(
          polOrbitR * Math.cos(th),
          polDist * Math.sin(phi) + polOrbitR * Math.sin(th) * Math.cos(phi),
          -polDist * Math.cos(phi) + polOrbitR * Math.sin(th) * Math.sin(phi)
        ));
      }
      polarisOrbitRef.current.geometry.setFromPoints(pts);
      polarisOrbitRef.current.computeLineDistances();
    }

    if (seasonalArcsRef.current) {
      const grp = seasonalArcsRef.current;
      while (grp.children.length > 0) grp.remove(grp.children[0]);

      function buildArc(decl: number, color: number) {
        const pts = [];
        for (let i = 0; i <= 64; i++) {
          const H = -Math.PI + (i / 64) * Math.PI * 2;
          const sinA = Math.sin(phi) * Math.sin(decl) + Math.cos(phi) * Math.cos(decl) * Math.cos(H);
          const a = Math.asin(Math.max(-1, Math.min(1, sinA)));
          let Az = 0;
          const cosAlt = Math.cos(a);
          if (Math.abs(cosAlt) > 0.0001 && Math.abs(Math.cos(phi)) > 0.0001) {
            const cosAz = (Math.sin(decl) - Math.sin(phi) * sinA) / (Math.cos(phi) * cosAlt);
            Az = Math.acos(Math.max(-1, Math.min(1, cosAz)));
            if (Math.sin(H) > 0) Az = 2 * Math.PI - Az;
          }
          pts.push(new THREE.Vector3(140 * Math.cos(a) * Math.sin(Az), 140 * Math.sin(a), -140 * Math.cos(a) * Math.cos(Az)));
        }
        grp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.7 })));
      }

      buildArc(EPSILON, 0xEF4444);  // صيف
      buildArc(0.0, 0x38BDF8);      // اعتدال
      buildArc(-EPSILON, 0x34D399); // شتاء
    }
  }, [latDeg]);

  // تحديث الحسابات اللحظية وموقع القمر والشمس
  useEffect(() => {
    const startOfYear = new Date(Date.UTC(simDate.getUTCFullYear(), 0, 1));
    const dayOfYear = (simDate.getTime() - startOfYear.getTime()) / (86400 * 1000);

    const lambdaSun = ((dayOfYear / 365.25) * 2 * Math.PI - 1.39) % (2 * Math.PI);
    const deltaSun = Math.asin(Math.sin(EPSILON) * Math.sin(lambdaSun));

    const hours = simDate.getUTCHours() + simDate.getUTCMinutes() / 60 + simDate.getUTCSeconds() / 3600;
    const lonHours = lonDeg / 15.0;
    const localSolarHours = (hours + lonHours + 24) % 24;
    const H_sun = ((localSolarHours / 24) * 2 * Math.PI - Math.PI);

    const phi = currentLatRad;

    // الشمس
    const sinAltSun = Math.sin(phi) * Math.sin(deltaSun) + Math.cos(phi) * Math.cos(deltaSun) * Math.cos(H_sun);
    const altSun = Math.asin(Math.max(-1, Math.min(1, sinAltSun)));
    let azSun = 0;
    const cosAltSun = Math.cos(altSun);
    if (Math.abs(cosAltSun) > 0.0001 && Math.abs(Math.cos(phi)) > 0.0001) {
      const cosAzSun = (Math.sin(deltaSun) - Math.sin(phi) * sinAltSun) / (Math.cos(phi) * cosAltSun);
      azSun = Math.acos(Math.max(-1, Math.min(1, cosAzSun)));
      if (Math.sin(H_sun) > 0) azSun = 2 * Math.PI - azSun;
    }

    if (sunMeshRef.current) {
      sunMeshRef.current.position.set(
        DOME_R * Math.cos(altSun) * Math.sin(azSun),
        DOME_R * Math.sin(altSun),
        -DOME_R * Math.cos(altSun) * Math.cos(azSun)
      );
    }

    // القمر في القبة السماوية
    const moonLambda = ((dayOfYear / 27.3216) * 2 * Math.PI) % (2 * Math.PI);
    const moonDelta = Math.asin(Math.sin(EPSILON + MOON_INC) * Math.sin(moonLambda));
    const H_moon = H_sun + (moonLambda - lambdaSun);

    const sinAltMoon = Math.sin(phi) * Math.sin(moonDelta) + Math.cos(phi) * Math.cos(moonDelta) * Math.cos(H_moon);
    const altMoon = Math.asin(Math.max(-1, Math.min(1, sinAltMoon)));
    let azMoon = 0;
    const cosAltMoon = Math.cos(altMoon);
    if (Math.abs(cosAltMoon) > 0.0001 && Math.abs(Math.cos(phi)) > 0.0001) {
      const cosAzMoon = (Math.sin(moonDelta) - Math.sin(phi) * sinAltMoon) / (Math.cos(phi) * cosAltMoon);
      azMoon = Math.acos(Math.max(-1, Math.min(1, cosAzMoon)));
      if (Math.sin(H_moon) > 0) azMoon = 2 * Math.PI - azMoon;
    }

    if (moonMeshRef.current) {
      moonMeshRef.current.position.set(
        (DOME_R - 2) * Math.cos(altMoon) * Math.sin(azMoon),
        (DOME_R - 2) * Math.sin(altMoon),
        -(DOME_R - 2) * Math.cos(altMoon) * Math.cos(azMoon)
      );
    }

    // تحديث قوس مسار القمر
    if (moonArcRef.current && showMoonArc) {
      const grp = moonArcRef.current;
      while (grp.children.length > 0) grp.remove(grp.children[0]);
      const pts = [];
      for (let i = 0; i <= 64; i++) {
        const H = -Math.PI + (i / 64) * Math.PI * 2;
        const sinA = Math.sin(phi) * Math.sin(moonDelta) + Math.cos(phi) * Math.cos(moonDelta) * Math.cos(H);
        const a = Math.asin(Math.max(-1, Math.min(1, sinA)));
        let Az = 0;
        const cosAlt = Math.cos(a);
        if (Math.abs(cosAlt) > 0.0001 && Math.abs(Math.cos(phi)) > 0.0001) {
          const cosAz = (Math.sin(moonDelta) - Math.sin(phi) * sinA) / (Math.cos(phi) * cosAlt);
          Az = Math.acos(Math.max(-1, Math.min(1, cosAz)));
          if (Math.sin(H) > 0) Az = 2 * Math.PI - Az;
        }
        pts.push(new THREE.Vector3(DOME_R * Math.cos(a) * Math.sin(Az), DOME_R * Math.sin(a), -DOME_R * Math.cos(a) * Math.cos(Az)));
      }
      grp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: 0xC084FC, dashSize: 4, gapSize: 2, transparent: true, opacity: 0.8 })));
    }

    // حساب طور القمر
    let elongRad = (moonLambda - lambdaSun);
    elongRad = ((elongRad % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const elongDeg = elongRad * 180 / Math.PI;
    const illumPercent = Math.round((1 - Math.cos(elongRad)) / 2 * 100);

    let phaseName = 'محاق';
    if (elongDeg >= 340 || elongDeg < 20) phaseName = '🌑 محاق';
    else if (elongDeg >= 20 && elongDeg < 70) phaseName = '🌒 هلال متزايد';
    else if (elongDeg >= 70 && elongDeg < 110) phaseName = '🌓 تربيع أول';
    else if (elongDeg >= 110 && elongDeg < 160) phaseName = '🌔 أحدب متزايد';
    else if (elongDeg >= 160 && elongDeg < 200) phaseName = '🌕 بدر تام';
    else if (elongDeg >= 200 && elongDeg < 250) phaseName = '🌖 أحدب متناقص';
    else if (elongDeg >= 250 && elongDeg < 290) phaseName = '🌗 تربيع أخير';
    else phaseName = '🌘 هلال متناقص';

    // سعة مشرق الشمس
    let riseStr = '90°';
    if (Math.abs(Math.cos(phi)) > 0.0001) {
      const cosRiseVal = Math.sin(deltaSun) / Math.cos(phi);
      if (Math.abs(cosRiseVal) <= 1.0) {
        const riseDeg = Math.acos(cosRiseVal) * 180 / Math.PI;
        riseStr = `${riseDeg.toFixed(1)}° (${riseDeg < 90 ? 'شمال الشرق' : 'جنوب الشرق'})`;
      }
    }

    // مطلع القمر
    let moonRiseStr = '56.2°', moonSetStr = '303.8°';
    if (Math.abs(Math.cos(phi)) > 0.0001) {
      const cosMRise = Math.sin(moonDelta) / Math.cos(phi);
      if (Math.abs(cosMRise) <= 1.0) {
        const mRiseDeg = Math.acos(cosMRise) * 180 / Math.PI;
        moonRiseStr = `${mRiseDeg.toFixed(1)}° (${mRiseDeg < 90 ? 'شمال الشرق' : 'جنوب الشرق'})`;
        moonSetStr = `${(360 - mRiseDeg).toFixed(1)}°`;
      }
    }

    // حساب المطلع المستقيم للشمس وتحديث حلقة وشارات البروج الواقعية في السماء
    const alpha_sun = Math.atan2(Math.cos(EPSILON) * Math.sin(lambdaSun), Math.cos(lambdaSun));
    const zR = 260;

    const getEclipticPos = (lamRad: number, r: number) => {
      const sinDelta = Math.sin(EPSILON) * Math.sin(lamRad);
      const delta = Math.asin(Math.max(-1, Math.min(1, sinDelta)));
      const alpha = Math.atan2(Math.cos(EPSILON) * Math.sin(lamRad), Math.cos(lamRad));
      const H = H_sun - (alpha - alpha_sun);
      const sinAlt = Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.cos(H);
      const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
      let az = 0;
      const cosAlt = Math.cos(alt);
      if (Math.abs(cosAlt) > 0.0001 && Math.abs(Math.cos(phi)) > 0.0001) {
        const cosAz = (Math.sin(delta) - Math.sin(phi) * sinAlt) / (Math.cos(phi) * cosAlt);
        az = Math.acos(Math.max(-1, Math.min(1, cosAz)));
        if (Math.sin(H) > 0) az = 2 * Math.PI - az;
      }
      return new THREE.Vector3(r * Math.cos(alt) * Math.sin(az), r * Math.sin(alt), -r * Math.cos(alt) * Math.cos(az));
    };

    if (zodiacLineRef.current) {
      const zPts = [];
      for (let j = 0; j <= 64; j++) {
        const lam = (j / 64) * Math.PI * 2;
        zPts.push(getEclipticPos(lam, zR));
      }
      zodiacLineRef.current.geometry.setFromPoints(zPts);
    }

    let bestAscIdx = 0, minAscDist = 9999;
    let bestDescIdx = 6, minDescDist = 9999;

    if (zodiacSpritesRef.current && zodiacSpritesRef.current.length === 12) {
      for (let i = 0; i < 12; i++) {
        const midLam = (i * 30 + 15) * Math.PI / 180;
        const pos = getEclipticPos(midLam, zR);
        zodiacSpritesRef.current[i].position.copy(pos);

        if (pos.x > 0) {
          const dist = Math.abs(pos.y);
          if (dist < minAscDist) {
            minAscDist = dist;
            bestAscIdx = i;
          }
        }
        if (pos.x < 0) {
          const dist = Math.abs(pos.y);
          if (dist < minDescDist) {
            minDescDist = dist;
            bestDescIdx = i;
          }
        }
      }
      setAscendantSign(ZODIAC_NAMES[bestAscIdx]);
      setDescendantSign(ZODIAC_NAMES[bestDescIdx]);
    }

    if (atlasGroupRef.current) {
      const axisVec = new THREE.Vector3(0, Math.sin(phi), -Math.cos(phi)).normalize();
      atlasGroupRef.current.setRotationFromAxisAngle(axisVec, -H_sun);
    }

    const obsPos = new THREE.Vector3(0, 2, 0);
    if (sunRayRef.current && sunMeshRef.current) {
      sunRayRef.current.geometry.setFromPoints([obsPos, sunMeshRef.current.position]);
      sunRayRef.current.computeLineDistances();
    }
    if (moonRayRef.current && moonMeshRef.current) {
      moonRayRef.current.geometry.setFromPoints([obsPos, moonMeshRef.current.position]);
      moonRayRef.current.computeLineDistances();
    }

    if (polarisMeshRef.current) {
      const polDist = 320;
      const polOrbitR = 24;
      const polAngle = H_sun; // متوافق مع الحركة اليومية من الشرق إلى الغرب
      polarisMeshRef.current.position.set(
        polOrbitR * Math.cos(polAngle),
        polDist * Math.sin(phi) + polOrbitR * Math.sin(polAngle) * Math.cos(phi),
        -polDist * Math.cos(phi) + polOrbitR * Math.sin(polAngle) * Math.sin(phi)
      );
    }

    const currentCityName = isCustom ? `مخصص (${latDeg.toFixed(1)}°)` : (CITIES_DB[cityKey]?.name || 'دمشق');

    setTelemetry({
      cityName: currentCityName,
      polarAlt: `${latDeg.toFixed(2)}°`,
      declination: `${deltaSun >= 0 ? '+' : ''}${(deltaSun * 180 / Math.PI).toFixed(2)}°`,
      altSun: `${(altSun * 180 / Math.PI).toFixed(1)}°`,
      azSun: `${(azSun * 180 / Math.PI).toFixed(1)}°`,
      sunriseAz: riseStr,
      moonPhaseName: phaseName,
      moonIllum: `${illumPercent}% مضاء`,
      moonElong: `${elongDeg.toFixed(1)}°`,
      altMoon: `${(altMoon * 180 / Math.PI).toFixed(1)}°`,
      moonriseAz: moonRiseStr,
      moonsetAz: moonSetStr,
    });
  }, [simDate, latDeg, lonDeg, showMoonArc]);

  const onCitySelectChange = (k: string) => {
    setCityKey(k);
    if (k === 'custom') {
      setIsCustom(true);
    } else {
      setIsCustom(false);
      const c = CITIES_DB[k];
      if (c) {
        setLatDeg(c.lat);
        setLonDeg(c.lon);
      }
    }
  };

  const switchPreset = (preset: 'horizon' | 'polaris' | 'moon' | 'sun' | 'orbit' | 'polar') => {
    setCameraPreset(preset);
    if (!cameraRef.current) return;
    if (preset === 'horizon') {
      cameraRef.current.position.set(0, 16, 65);
      cameraRef.current.lookAt(0, 15, -45);
    } else if (preset === 'polaris') {
      cameraRef.current.position.set(0, 16, 60);
      const phi = currentLatRad;
      cameraRef.current.lookAt(0, 320 * Math.sin(phi), -320 * Math.cos(phi));
    } else if (preset === 'moon' && moonMeshRef.current) {
      cameraRef.current.position.set(0, 18, 50);
      cameraRef.current.lookAt(moonMeshRef.current.position);
    } else if (preset === 'sun' && sunMeshRef.current) {
      cameraRef.current.position.set(0, 18, 50);
      cameraRef.current.lookAt(sunMeshRef.current.position);
    } else if (preset === 'orbit') {
      cameraRef.current.position.set(280, 240, 360);
      cameraRef.current.lookAt(0, 0, 0);
    } else {
      cameraRef.current.position.set(0, 480, 0);
      cameraRef.current.lookAt(0, 0, 0);
    }
  };

  return (
    <div className="view-panel" style={{ width: '100%' }}>
      <div className="canvas-wrap" style={{ flex: '1 1 650px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
          <h4 style={{ color: 'var(--gold)', margin: 0 }}>🪐 الأفلاك ودورة القمر وتغير المشارق والمغارب</h4>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className={`btn-time ${cameraPreset === 'horizon' ? 'active-speed' : ''}`} onClick={() => switchPreset('horizon')}>👁️ الأفق</button>
            <button className={`btn-time ${cameraPreset === 'polaris' ? 'active-speed' : ''}`} onClick={() => switchPreset('polaris')}>★ النجم القطبي</button>
            <button className={`btn-time ${cameraPreset === 'moon' ? 'active-speed' : ''}`} onClick={() => switchPreset('moon')}>🌙 تتبع القمر</button>
            <button className={`btn-time ${cameraPreset === 'sun' ? 'active-speed' : ''}`} onClick={() => switchPreset('sun')}>☀️ تتبع الشمس</button>
            <button className={`btn-time ${cameraPreset === 'orbit' ? 'active-speed' : ''}`} onClick={() => switchPreset('orbit')}>🌌 كوني مائل</button>
          </div>
        </div>

        {/* شريط اختيار المدينة */}
        <div style={{ width: '100%', background: 'rgba(15,23,42,0.75)', padding: '8px 12px', borderRadius: '10px', marginBottom: '8px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <label style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '0.86em' }}>📍 مرصد المدينة:</label>
          <select
            value={cityKey}
            onChange={e => onCitySelectChange(e.target.value)}
            style={{ background: '#0A101D', color: '#FFF', border: '1px solid rgba(99,102,241,0.5)', padding: '5px 10px', borderRadius: '6px', fontSize: '0.88em', outline: 'none' }}
          >
            {Object.keys(CITIES_DB).map(k => (
              <option key={k} value={k}>{CITIES_DB[k].name} ({CITIES_DB[k].lat}°)</option>
            ))}
            <option value="custom">⚙️ إحداثيات مخصصة (Custom)...</option>
          </select>

          {isCustom && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8em', color: 'var(--gold)' }}>العرض:</span>
              <input type="number" value={latDeg} step={0.5} min={-90} max={90} onChange={e => setLatDeg(parseFloat(e.target.value) || 0)} style={{ width: '65px', background: '#0A101D', color: '#FFF', border: '1px solid #6366F1', padding: '3px', borderRadius: '4px', textAlign: 'center' }} />
              <span style={{ fontSize: '0.8em', color: 'var(--blue)' }}>الطول:</span>
              <input type="number" value={lonDeg} step={0.5} min={-180} max={180} onChange={e => setLonDeg(parseFloat(e.target.value) || 0)} style={{ width: '65px', background: '#0A101D', color: '#FFF', border: '1px solid #6366F1', padding: '3px', borderRadius: '4px', textAlign: 'center' }} />
            </div>
          )}
        </div>

        <div style={{ fontSize: '0.8em', color: '#94A3B8', marginBottom: '6px' }}>
          💡 اسحب بالماوس للتدوير 360° | عجلة الماوس للتقريب | انقر «تتبع القمر» لمراقبة طوره وطلوعه
        </div>

        <div ref={mountRef} style={{ width: '100%', height: '540px', borderRadius: '12px', overflow: 'hidden', cursor: 'grab', overscrollBehavior: 'none', touchAction: 'none' }} />

        <div className="legend" style={{ marginTop: '8px' }}>
          <div className="legend-item"><span className="dot" style={{ background: '#F1F5F9' }}></span> جرم القمر (في السماء)</div>
          <div className="legend-item"><span className="dot" style={{ background: '#C084FC' }}></span> مدار وقوس مسار القمر الشهري</div>
          <div className="legend-item"><span className="dot" style={{ background: '#FDE047' }}></span> الشمس</div>
          <div className="legend-item"><span className="dot" style={{ background: '#38BDF8' }}></span> الاعتدالان</div>
          <div className="legend-item"><span className="dot" style={{ background: '#EF4444' }}></span> الانقلاب الصيفي</div>
        </div>
      </div>

      <div className="dashboard" style={{ flex: '1 1 350px' }}>
        <h3>🌙 دورة القمر وقياسات السماء الحية</h3>
        <div className="stat-grid">
          <div className="stat-box" style={{ border: '1.5px solid rgba(192,132,252,0.4)', background: 'rgba(147,51,234,0.1)' }}>
            <div className="label" style={{ color: 'var(--purple)' }}>البرج الطالع الآن (مشرقاً)</div>
            <div className="value" style={{ color: '#F3E8FF', fontSize: '1.05em' }}>{ascendantSign} (يشرق)</div>
          </div>
          <div className="stat-box" style={{ border: '1.5px solid rgba(192,132,252,0.4)', background: 'rgba(147,51,234,0.1)' }}>
            <div className="label" style={{ color: 'var(--purple)' }}>البرج الغارب الآن (مغرباً)</div>
            <div className="value" style={{ color: '#E2E8F0', fontSize: '1.05em' }}>{descendantSign} (يغيب)</div>
          </div>
          <div className="stat-box" style={{ border: '1.5px solid rgba(251,191,36,0.4)', background: 'rgba(245,158,11,0.08)' }}>
            <div className="label" style={{ color: 'var(--gold)' }}>سعة مشارق الأبراج</div>
            <div className="value" style={{ color: '#FEF08A', fontSize: '1.05em' }}>57.0° (61.5° إلى 118.5°)</div>
          </div>
          <div className="stat-box" style={{ border: '1.5px solid rgba(192,132,252,0.4)', background: 'rgba(147,51,234,0.1)' }}>
            <div className="label" style={{ color: 'var(--purple)' }}>طور القمر الحالي</div>
            <div className="value" style={{ color: '#F3E8FF', fontSize: '1.05em' }}>{telemetry.moonPhaseName}</div>
          </div>
          <div className="stat-box" style={{ border: '1.5px solid rgba(192,132,252,0.4)', background: 'rgba(147,51,234,0.1)' }}>
            <div className="label" style={{ color: 'var(--purple)' }}>نسبة إضاءة القمر</div>
            <div className="value" style={{ color: 'var(--purple)' }}>{telemetry.moonIllum}</div>
          </div>
          <div className="stat-box">
            <div className="label">استطالة القمر (D)</div>
            <div className="value">{telemetry.moonElong}</div>
          </div>
          <div className="stat-box">
            <div className="label">ارتفاع القمر (Alt)</div>
            <div className="value" style={{ color: '#E2E8F0' }}>{telemetry.altMoon}</div>
          </div>
          <div className="stat-box">
            <div className="label">مطلع القمر اليوم</div>
            <div className="value" style={{ color: 'var(--purple)' }}>{telemetry.moonriseAz}</div>
          </div>
          <div className="stat-box">
            <div className="label">مغيب القمر اليوم</div>
            <div className="value" style={{ color: 'var(--purple)' }}>{telemetry.moonsetAz}</div>
          </div>
          <div className="stat-box">
            <div className="label">سمت شروق الشمس</div>
            <div className="value ibs">{telemetry.sunriseAz}</div>
          </div>
          <div className="stat-box">
            <div className="label">ميل الشمس (δ)</div>
            <div className="value gold">{telemetry.declination}</div>
          </div>
        </div>

        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.86em', color: '#CBD5E1', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span>🌙 إظهار قوس ومدار مسار القمر</span>
            <input type="checkbox" checked={showMoonArc} onChange={e => { setShowMoonArc(e.target.checked); if(moonArcRef.current) moonArcRef.current.visible = e.target.checked; }} />
          </label>
          <label style={{ fontSize: '0.86em', color: '#CBD5E1', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span>🪐 أجرام الكواكب السيارة (السبعة)</span>
            <input type="checkbox" checked={showPlanets} onChange={e => { setShowPlanets(e.target.checked); Object.values(planetMeshesRef.current).forEach(m => { if(m) m.visible = e.target.checked; }); }} />
          </label>
          <label style={{ fontSize: '0.86em', color: '#FEF08A', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span>⭕ دوائر أفلاك ومدارات الكواكب</span>
            <input type="checkbox" checked={showOrbitCircles} onChange={e => { setShowOrbitCircles(e.target.checked); Object.values(planetOrbitLinesRef.current).forEach(l => { if(l) l.visible = e.target.checked; }); }} />
          </label>
          <label style={{ fontSize: '0.86em', color: '#A7F3D0', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span>🟢 دائرة الزوال وأول السموت (Meridian)</span>
            <input type="checkbox" checked={showMeridian} onChange={e => { setShowMeridian(e.target.checked); if(meridianLineRef.current) meridianLineRef.current.visible = e.target.checked; if(primeVerticalLineRef.current) primeVerticalLineRef.current.visible = e.target.checked; }} />
          </label>
          <label style={{ fontSize: '0.86em', color: '#CBD5E1', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span>✨ إظهار فلك البروج (الثامن)</span>
            <input type="checkbox" checked={showZodiac} onChange={e => { setShowZodiac(e.target.checked); if(zodiacGroupRef.current) zodiacGroupRef.current.visible = e.target.checked; }} />
          </label>
          <label style={{ fontSize: '0.86em', color: '#CBD5E1', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span>🌌 إظهار الفلك الأطلس (التاسع)</span>
            <input type="checkbox" checked={showAtlas} onChange={e => { setShowAtlas(e.target.checked); if(atlasGroupRef.current) atlasGroupRef.current.visible = e.target.checked; }} />
          </label>
        </div>
      </div>
    </div>
  );
};

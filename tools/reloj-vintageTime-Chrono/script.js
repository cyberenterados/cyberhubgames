/**
 * ============================================================
 * CHRONOMÈTRE D'ART — RELOJ DE ESQUELETO 3D DE ALTA CATEGORÍA
 * Modelado paramétrico, simulación mecánica y síntesis Web Audio
 * ============================================================
 */

(function () {
  'use strict';

  /* ============================================================
     1. SISTEMA DE AUDIO (WEB AUDIO API - SÍNTESIS DE ESCAPE)
     ============================================================ */
  class ClockAudio {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      this.isMuted = false;
      this.volume = 0.75;
      this.isInitialized = false;
    }

    init() {
      if (this.isInitialized) return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
        this.isInitialized = true;
      } catch (e) {
        console.warn('Web Audio no disponible:', e);
      }
    }

    resume() {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    setVolume(val) {
      this.volume = Math.max(0, Math.min(1, val));
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      }
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      this.setVolume(this.volume);
      return !this.isMuted;
    }

    playTick(isOdd = false) {
      if (!this.isInitialized || this.isMuted) return;
      this.resume();

      const now = this.ctx.currentTime;

      // 1. Ruido blanco / impulso del diente de escape al desprenderse
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.022);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(isOdd ? 4400 : 3900, now);
      noiseFilter.Q.setValueAtTime(4.8, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.48, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noiseSource.start(now);

      // 2. Resonancia del rubí y la platina de latón
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      const baseFreq = isOdd ? 2240 : 1880;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + 0.052);

      oscGain.gain.setValueAtTime(0.36, now);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.052);

      osc.connect(oscGain);
      oscGain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.055);

      // 3. Resonancia de la peana de madera ebanizada
      const bodyOsc = this.ctx.createOscillator();
      const bodyGain = this.ctx.createGain();
      bodyOsc.type = 'sine';
      bodyOsc.frequency.setValueAtTime(255, now);
      bodyOsc.frequency.exponentialRampToValueAtTime(130, now + 0.075);

      bodyGain.gain.setValueAtTime(0.24, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);

      bodyOsc.connect(bodyGain);
      bodyGain.connect(this.masterGain);
      bodyOsc.start(now);
      bodyOsc.stop(now + 0.08);
    }
  }

  /* ============================================================
     2. ENTORNO DE ILUMINACIÓN DE ESTUDIO (PROCEDURAL HDRI MAP)
     ============================================================ */
  function createStudioEnvironment() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Fondo ambiental degradado cálido
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 512);
    bgGrad.addColorStop(0, '#1a130c');
    bgGrad.addColorStop(0.5, '#0b0806');
    bgGrad.addColorStop(1, '#150f09');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 512);

    // Softbox principal superior frontal (reflejo dorado para el latón)
    const softbox = ctx.createRadialGradient(320, 110, 10, 320, 110, 270);
    softbox.addColorStop(0, 'rgba(255, 248, 225, 0.98)');
    softbox.addColorStop(0.25, 'rgba(255, 230, 175, 0.65)');
    softbox.addColorStop(0.65, 'rgba(215, 160, 85, 0.2)');
    softbox.addColorStop(1, 'transparent');
    ctx.fillStyle = softbox;
    ctx.beginPath();
    ctx.arc(320, 110, 270, 0, Math.PI * 2);
    ctx.fill();

    // Reflector de perfil lateral (luz fría sutil para acentuar el acero azulado)
    const rimLight = ctx.createRadialGradient(840, 150, 10, 840, 150, 230);
    rimLight.addColorStop(0, 'rgba(230, 242, 255, 0.75)');
    rimLight.addColorStop(0.4, 'rgba(175, 205, 245, 0.3)');
    rimLight.addColorStop(1, 'transparent');
    ctx.fillStyle = rimLight;
    ctx.beginPath();
    ctx.arc(840, 150, 230, 0, Math.PI * 2);
    ctx.fill();

    // Rebote cálido desde la base
    const floorBounce = ctx.createLinearGradient(0, 350, 0, 512);
    floorBounce.addColorStop(0, 'transparent');
    floorBounce.addColorStop(1, 'rgba(180, 115, 45, 0.38)');
    ctx.fillStyle = floorBounce;
    ctx.fillRect(0, 350, 1024, 162);

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    return texture;
  }

  /* ============================================================
     3. MATERIALES PBR DE ALTA CATEGORÍA
     ============================================================ */
  function createMaterials() {
    return {
      // Latón pulido espejo (molduras, patas y biseles)
      brassPolished: new THREE.MeshStandardMaterial({
        color: 0xf5cf78,
        metalness: 0.95,
        roughness: 0.14,
      }),
      // Latón satinado de relojero (platinas maestras caladas)
      brassPlates: new THREE.MeshStandardMaterial({
        color: 0xdeb45a,
        metalness: 0.91,
        roughness: 0.24,
      }),
      // Latón de engranajes
      brassGears: new THREE.MeshStandardMaterial({
        color: 0xd2a548,
        metalness: 0.88,
        roughness: 0.28,
      }),
      // Acero azulado al fuego (agujas Breguet y tornillos)
      bluedSteel: new THREE.MeshStandardMaterial({
        color: 0x162846,
        metalness: 0.88,
        roughness: 0.16,
      }),
      // Acero pulido brillante (ejes, piñones y cadena)
      brightSteel: new THREE.MeshStandardMaterial({
        color: 0xdde2e8,
        metalness: 0.96,
        roughness: 0.12,
      }),
      // Rubíes sintéticos de alta relojería (paletas y chatones de pivote)
      rubyJewel: new THREE.MeshPhysicalMaterial({
        color: 0xdb0938,
        metalness: 0.05,
        roughness: 0.04,
        transmission: 0.85,
        ior: 1.76,
        transparent: true,
        opacity: 0.95,
      }),
      // Madera ebanizada negra lacada (peana ovalada)
      ebonisedWood: new THREE.MeshStandardMaterial({
        color: 0x100d0a,
        roughness: 0.30,
        metalness: 0.08,
      }),
      // Moldura biselada
      woodTrim: new THREE.MeshStandardMaterial({
        color: 0x18120e,
        roughness: 0.26,
        metalness: 0.1,
      }),
      // Campana de cristal victoriana (vidrio con refracción y reflejos físicos)
      glassDome: new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.30,
        roughness: 0.04,
        metalness: 0.04,
        transmission: 0.92,
        ior: 1.52,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    };
  }

  /* ============================================================
     4. GENERACIÓN DE TEXTURA DE ALTA DEFINICIÓN PARA LA ESFERA
     ============================================================ */
  function createChapterRingTexture() {
    const size = 2048;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const center = size / 2;

    // Fondo satinado de plata de ley
    const silverGrad = ctx.createRadialGradient(center, center, 400, center, center, 980);
    silverGrad.addColorStop(0, '#fcfdfe');
    silverGrad.addColorStop(0.6, '#e8ecef');
    silverGrad.addColorStop(0.92, '#d7dce2');
    silverGrad.addColorStop(1, '#bcc3cb');
    ctx.fillStyle = silverGrad;
    ctx.fillRect(0, 0, size, size);

    // Líneas circulares de precisión
    ctx.strokeStyle = '#16120e';
    ctx.lineWidth = 6;

    // Anillo exterior de minutos
    ctx.beginPath();
    ctx.arc(center, center, 940, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center, center, 860, 0, Math.PI * 2);
    ctx.stroke();

    // Anillo interior de separación
    ctx.beginPath();
    ctx.arc(center, center, 640, 0, Math.PI * 2);
    ctx.stroke();

    // Marcas de los 60 minutos
    for (let i = 0; i < 60; i++) {
      const angle = (i * Math.PI) / 30 - Math.PI / 2;
      const isMajor = i % 5 === 0;

      const rOuter = 940;
      const rInner = isMajor ? 860 : 892;

      const x1 = center + Math.cos(angle) * rOuter;
      const y1 = center + Math.sin(angle) * rOuter;
      const x2 = center + Math.cos(angle) * rInner;
      const y2 = center + Math.sin(angle) * rInner;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineWidth = isMajor ? 8 : 4;
      ctx.strokeStyle = '#16120e';
      ctx.stroke();

      // Diamantes en marcas de 5 minutos
      if (isMajor) {
        const rDiamond = 910;
        const xd = center + Math.cos(angle) * rDiamond;
        const yd = center + Math.sin(angle) * rDiamond;
        ctx.fillStyle = '#16120e';
        ctx.beginPath();
        ctx.arc(xd, yd, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Numerales Romanos I al XII en serif clásico
    const numerals = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    ctx.font = 'bold 126px "Cinzel", serif';
    ctx.fillStyle = '#110e0b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let h = 0; h < 12; h++) {
      const angle = (h * Math.PI) / 6 - Math.PI / 2;
      const rNum = 750;
      const x = center + Math.cos(angle) * rNum;
      const y = center + Math.sin(angle) * rNum;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + Math.PI / 2);
      ctx.fillText(numerals[h], 0, 0);

      // Flor de lis decorativa de media hora
      ctx.font = '36px "Cinzel", serif';
      ctx.fillText('⚜', 0, 80);
      ctx.restore();
    }

    // Grabado horológico propio de alta manufactura
    ctx.save();
    ctx.font = '600 40px "Cinzel", serif';
    ctx.fillStyle = '#1e1610';
    ctx.letterSpacing = '8px';
    ctx.textAlign = 'center';
    ctx.fillText('CHRONOMÈTRE D\'ART', center, center + 440);

    ctx.font = '500 28px "Cinzel", serif';
    ctx.fillStyle = '#443528';
    ctx.letterSpacing = '6px';
    ctx.fillText('PIÈCE UNIQUE • MMXXVI', center, center + 485);
    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 8;
    return texture;
  }

  /* ============================================================
     5. GENERADOR PARAMÉTRICO DE ENGRANAJES MECÁNICOS CALADOS
     ============================================================ */
  function createSpokedGear(radius, toothCount, spokeCount = 5, materials) {
    const gearGroup = new THREE.Group();
    const toothHeight = radius * 0.12;
    const rimRadius = radius - toothHeight;
    const innerRimRadius = rimRadius * 0.78;
    const hubRadius = radius * 0.25;
    const gearThickness = 0.16;

    // 1. Dientes de perfil preciso
    const shape = new THREE.Shape();
    const totalPoints = toothCount * 4;

    for (let i = 0; i < totalPoints; i++) {
      const angle = (i / totalPoints) * Math.PI * 2;
      const step = i % 4;
      let r = rimRadius;
      if (step === 1 || step === 2) r = radius;

      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;

      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();

    // 2. Calado de radios victorianos
    for (let s = 0; s < spokeCount; s++) {
      const startAngle = (s / spokeCount) * Math.PI * 2 + 0.12;
      const endAngle = ((s + 1) / spokeCount) * Math.PI * 2 - 0.12;
      const spokeHole = new THREE.Path();

      const rIn = hubRadius * 1.15;
      const rOut = innerRimRadius * 0.96;

      spokeHole.absarc(0, 0, rOut, startAngle, endAngle, false);
      spokeHole.absarc(0, 0, rIn, endAngle, startAngle, true);
      spokeHole.closePath();
      shape.holes.push(spokeHole);
    }

    // Agujero central para el eje de acero
    const centerHole = new THREE.Path();
    centerHole.absarc(0, 0, hubRadius * 0.35, 0, Math.PI * 2, true);
    shape.holes.push(centerHole);

    const extrudeSettings = {
      depth: gearThickness,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.02,
      bevelThickness: 0.02,
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();
    const mesh = new THREE.Mesh(geometry, materials.brassGears);
    mesh.castShadow = true;
    gearGroup.add(mesh);

    // Cubo central torneado (hub saliente)
    const hubGeom = new THREE.CylinderGeometry(hubRadius * 0.6, hubRadius * 0.65, gearThickness * 1.8, 24);
    hubGeom.rotateX(Math.PI / 2);
    const hubMesh = new THREE.Mesh(hubGeom, materials.brassPolished);
    hubMesh.castShadow = true;
    gearGroup.add(hubMesh);

    return gearGroup;
  }

  /* ============================================================
     6. MODELADO DEL RELOJ DE ESQUELETO COMPLETO
     ============================================================ */
  function buildSkeletonClock(materials) {
    const clock = new THREE.Group();
    const movingParts = {
      gears: [],
      hourHand: null,
      minuteHand: null,
      secondHand: null,
      anchor: null,
      pendulum: null,
    };

    // ----------------------------------------------------
    // A. PEANA OVALADA DE MADERA EBANIZADA Y SOMBRA DE CONTACTO
    // ----------------------------------------------------
    const baseGroup = new THREE.Group();

    // Sombra de contacto suave sobre la mesa
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 512;
    shadowCanvas.height = 512;
    const sCtx = shadowCanvas.getContext('2d');
    const sGrad = sCtx.createRadialGradient(256, 256, 50, 256, 256, 240);
    sGrad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    sGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
    sGrad.addColorStop(1, 'transparent');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 512, 512);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowPlaneGeom = new THREE.PlaneGeometry(24, 15);
    const shadowPlaneMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.85,
    });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeom, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.01;
    baseGroup.add(shadowPlane);

    // Nivel 1 inferior más ancho
    const baseBottomGeom = new THREE.CylinderGeometry(1, 1, 0.45, 64);
    baseBottomGeom.scale(9.6, 1, 5.8);
    const baseBottom = new THREE.Mesh(baseBottomGeom, materials.ebonisedWood);
    baseBottom.position.y = 0.225;
    baseBottom.receiveShadow = true;
    baseBottom.castShadow = true;
    baseGroup.add(baseBottom);

    // Moldura biselada
    const baseTrimGeom = new THREE.CylinderGeometry(1, 1, 0.18, 64);
    baseTrimGeom.scale(9.1, 1, 5.3);
    const baseTrim = new THREE.Mesh(baseTrimGeom, materials.woodTrim);
    baseTrim.position.y = 0.54;
    baseGroup.add(baseTrim);

    // Nivel 2 superior
    const baseTopGeom = new THREE.CylinderGeometry(1, 1, 0.35, 64);
    baseTopGeom.scale(8.6, 1, 4.8);
    const baseTop = new THREE.Mesh(baseTopGeom, materials.ebonisedWood);
    baseTop.position.y = 0.805;
    baseTop.receiveShadow = true;
    baseTop.castShadow = true;
    baseGroup.add(baseTop);

    // Filete perimetral de latón pulido incrustado
    const brassInlayGeom = new THREE.TorusGeometry(1, 0.04, 16, 64);
    brassInlayGeom.scale(8.55, 4.75, 1);
    brassInlayGeom.rotateX(Math.PI / 2);
    const brassInlay = new THREE.Mesh(brassInlayGeom, materials.brassPolished);
    brassInlay.position.y = 0.98;
    baseGroup.add(brassInlay);

    clock.add(baseGroup);

    // ----------------------------------------------------
    // B. CUATRO PATAS TORNEADAS DE LATÓN (BALUSTER FEET)
    // ----------------------------------------------------
    const footPoints = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.85, 0),
      new THREE.Vector2(0.85, 0.12),
      new THREE.Vector2(0.72, 0.18),
      new THREE.Vector2(0.68, 0.32),
      new THREE.Vector2(0.48, 0.48),
      new THREE.Vector2(0.42, 0.65),
      new THREE.Vector2(0.58, 0.82),
      new THREE.Vector2(0.62, 0.95),
      new THREE.Vector2(0.40, 1.15),
      new THREE.Vector2(0.40, 1.35),
      new THREE.Vector2(0.65, 1.42),
      new THREE.Vector2(0.65, 1.55),
      new THREE.Vector2(0.35, 1.62),
      new THREE.Vector2(0, 1.62),
    ];
    const footGeometry = new THREE.LatheGeometry(footPoints, 32);

    const footCoords = [
      { x: -4.3, z: 1.5 },
      { x:  4.3, z: 1.5 },
      { x: -4.3, z: -1.5 },
      { x:  4.3, z: -1.5 },
    ];

    footCoords.forEach(c => {
      const foot = new THREE.Mesh(footGeometry, materials.brassPolished);
      foot.position.set(c.x, 0.98, c.z);
      foot.castShadow = true;
      clock.add(foot);
    });

    // ----------------------------------------------------
    // C. PLATINAS MAESTRAS CALADAS (SKELETON ARCHITECTURE)
    // ----------------------------------------------------
    function createSkeletonPlateShape() {
      const shape = new THREE.Shape();

      // Contorno exterior simétrico de inspiración gótica/rococó
      shape.moveTo(0, 3.2);
      shape.bezierCurveTo(1.5, 3.2, 2.8, 2.5, 4.3, 2.5);
      shape.bezierCurveTo(4.7, 2.5, 5.0, 2.7, 5.2, 3.1);
      shape.bezierCurveTo(5.6, 3.8, 5.9, 5.0, 5.5, 6.2);
      shape.bezierCurveTo(5.1, 7.3, 4.2, 7.7, 3.4, 8.4);
      shape.bezierCurveTo(3.2, 9.1, 3.5, 9.8, 4.2, 10.4);
      shape.bezierCurveTo(5.0, 11.2, 5.2, 12.6, 4.7, 13.8);
      shape.bezierCurveTo(4.3, 14.8, 3.5, 15.6, 2.6, 16.2);
      shape.bezierCurveTo(2.1, 16.5, 1.8, 17.0, 1.6, 17.6);
      shape.bezierCurveTo(1.2, 18.3, 0.6, 19.1, 0, 19.3);

      // Mitad izquierda (reflejada)
      shape.bezierCurveTo(-0.6, 19.1, -1.2, 18.3, -1.6, 17.6);
      shape.bezierCurveTo(-1.8, 17.0, -2.1, 16.5, -2.6, 16.2);
      shape.bezierCurveTo(-3.5, 15.6, -4.3, 14.8, -4.7, 13.8);
      shape.bezierCurveTo(-5.2, 12.6, -5.0, 11.2, -4.2, 10.4);
      shape.bezierCurveTo(-3.5, 9.8, -3.2, 9.1, -3.4, 8.4);
      shape.bezierCurveTo(-4.2, 7.7, -5.1, 7.3, -5.5, 6.2);
      shape.bezierCurveTo(-5.9, 5.0, -5.6, 3.8, -5.2, 3.1);
      shape.bezierCurveTo(-5.0, 2.7, -4.7, 2.5, -4.3, 2.5);
      shape.bezierCurveTo(-2.8, 2.5, -1.5, 3.2, 0, 3.2);

      // Calados interiores:
      // 1. Abertura central
      const centerAperture = new THREE.Path();
      centerAperture.absarc(0, 11.8, 2.35, 0, Math.PI * 2, true);
      shape.holes.push(centerAperture);

      // 2. Arco inferior para el tambor de cuerda (fusee barrel)
      const fuseeArch = new THREE.Path();
      fuseeArch.absarc(0, 5.2, 1.85, 0, Math.PI, false);
      fuseeArch.lineTo(-1.85, 3.6);
      fuseeArch.lineTo(1.85, 3.6);
      fuseeArch.closePath();
      shape.holes.push(fuseeArch);

      // 3. Calado decorativo en pata derecha
      const rightFootHole = new THREE.Path();
      rightFootHole.moveTo(3.2, 4.0);
      rightFootHole.bezierCurveTo(4.2, 4.2, 4.4, 5.4, 3.8, 6.2);
      rightFootHole.bezierCurveTo(3.2, 5.8, 2.6, 4.8, 3.2, 4.0);
      shape.holes.push(rightFootHole);

      // 4. Calado decorativo en pata izquierda
      const leftFootHole = new THREE.Path();
      leftFootHole.moveTo(-3.2, 4.0);
      leftFootHole.bezierCurveTo(-4.2, 4.2, -4.4, 5.4, -3.8, 6.2);
      leftFootHole.bezierCurveTo(-3.2, 5.8, -2.6, 4.8, -3.2, 4.0);
      shape.holes.push(leftFootHole);

      // 5. Calado del copete superior
      const crestHole = new THREE.Path();
      crestHole.absarc(0, 17.6, 0.45, 0, Math.PI * 2, true);
      shape.holes.push(crestHole);

      return shape;
    }

    const plateShape = createSkeletonPlateShape();
    const plateExtrudeSettings = {
      depth: 0.16,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.03,
      bevelThickness: 0.03,
    };
    const plateGeom = new THREE.ExtrudeGeometry(plateShape, plateExtrudeSettings);

    const frontPlate = new THREE.Mesh(plateGeom, materials.brassPlates);
    frontPlate.position.set(0, 0, 1.25);
    frontPlate.castShadow = true;
    clock.add(frontPlate);

    const backPlate = new THREE.Mesh(plateGeom, materials.brassPlates);
    backPlate.position.set(0, 0, -1.41);
    backPlate.castShadow = true;
    clock.add(backPlate);

    // ----------------------------------------------------
    // CHATONES CON RUBÍES SINTÉTICOS EN PIVOTES DE LAS PLATINAS
    // ----------------------------------------------------
    const jewelChatonGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.06, 20);
    jewelChatonGeom.rotateX(Math.PI / 2);
    const rubyPivotGeom = new THREE.CylinderGeometry(0.09, 0.09, 0.08, 16);
    rubyPivotGeom.rotateX(Math.PI / 2);

    const pivotCoords = [
      { x: 0, y: 5.2 },
      { x: 0, y: 8.8 },
      { x: -1.1, y: 10.3 },
      { x: 0, y: 11.8 },
      { x: 0, y: 12.95 },
    ];

    pivotCoords.forEach(pos => {
      // Chaton de latón en platina frontal
      const chatonFront = new THREE.Mesh(jewelChatonGeom, materials.brassPolished);
      chatonFront.position.set(pos.x, pos.y, 1.43);
      clock.add(chatonFront);

      // Rubí central engastado
      const rubyFront = new THREE.Mesh(rubyPivotGeom, materials.rubyJewel);
      rubyFront.position.set(pos.x, pos.y, 1.44);
      clock.add(rubyFront);
    });

    // ----------------------------------------------------
    // D. PILARES SEPARADORES TORNEADOS (PILLARS & BOLTS)
    // ----------------------------------------------------
    const pillarPoints = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.24, 0),
      new THREE.Vector2(0.28, 0.1),
      new THREE.Vector2(0.18, 0.2),
      new THREE.Vector2(0.16, 1.2),
      new THREE.Vector2(0.24, 1.3),
      new THREE.Vector2(0.16, 1.4),
      new THREE.Vector2(0.18, 2.4),
      new THREE.Vector2(0.28, 2.5),
      new THREE.Vector2(0.24, 2.6),
      new THREE.Vector2(0, 2.6),
    ];
    const pillarGeom = new THREE.LatheGeometry(pillarPoints, 24);
    pillarGeom.rotateX(Math.PI / 2);
    pillarGeom.center();

    const boltGeom = new THREE.CylinderGeometry(0.24, 0.24, 0.08, 20);
    boltGeom.rotateX(Math.PI / 2);

    const pillarPositions = [
      { x: -4.0, y: 3.4 },
      { x:  4.0, y: 3.4 },
      { x: -3.4, y: 8.6 },
      { x:  3.4, y: 8.6 },
      { x:  0.0, y: 16.4 },
    ];

    pillarPositions.forEach(p => {
      const pillar = new THREE.Mesh(pillarGeom, materials.brassPolished);
      pillar.position.set(p.x, p.y, -0.08);
      pillar.scale.set(1, 1, 1.05);
      pillar.castShadow = true;
      clock.add(pillar);

      const boltFront = new THREE.Mesh(boltGeom, materials.bluedSteel);
      boltFront.position.set(p.x, p.y, 1.45);
      clock.add(boltFront);

      const boltBack = new THREE.Mesh(boltGeom, materials.bluedSteel);
      boltBack.position.set(p.x, p.y, -1.45);
      clock.add(boltBack);
    });

    // ----------------------------------------------------
    // E. TAMBOR INFERIOR DE CUERDA CON CADENA MICRO-ESLABÓN (FUSEE & CHAIN)
    // ----------------------------------------------------
    const fuseeGroup = new THREE.Group();
    fuseeGroup.position.set(0, 5.2, -0.08);

    // Tambor ranurado
    const drumGeom = new THREE.CylinderGeometry(1.65, 1.65, 1.9, 48);
    drumGeom.rotateX(Math.PI / 2);
    const drumMesh = new THREE.Mesh(drumGeom, materials.brassGears);
    drumMesh.castShadow = true;
    fuseeGroup.add(drumMesh);

    // Cadena de caracol enrollada en espiral helicoidal
    const chainGroup = new THREE.Group();
    const chainTurns = 7;
    const chainSegments = 120;
    const chainCurvePoints = [];

    for (let c = 0; c <= chainSegments; c++) {
      const t = c / chainSegments;
      const angle = t * chainTurns * Math.PI * 2;
      const z = -0.85 + t * 1.7;
      const r = 1.68;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      chainCurvePoints.push(new THREE.Vector3(x, y, z));
    }

    const chainCurve = new THREE.CatmullRomCurve3(chainCurvePoints);
    const chainGeom = new THREE.TubeGeometry(chainCurve, 120, 0.042, 8, false);
    const chainMesh = new THREE.Mesh(chainGeom, materials.brightSteel);
    chainGroup.add(chainMesh);
    fuseeGroup.add(chainGroup);

    // Rueda de trinquete frontal
    const ratchetShape = new THREE.Shape();
    const ratchetTeeth = 20;
    for (let i = 0; i < ratchetTeeth; i++) {
      const a1 = (i / ratchetTeeth) * Math.PI * 2;
      const a2 = ((i + 0.8) / ratchetTeeth) * Math.PI * 2;
      const x1 = Math.cos(a1) * 1.1;
      const y1 = Math.sin(a1) * 1.1;
      const x2 = Math.cos(a2) * 1.35;
      const y2 = Math.sin(a2) * 1.35;

      if (i === 0) ratchetShape.moveTo(x1, y1);
      else ratchetShape.lineTo(x1, y1);
      ratchetShape.lineTo(x2, y2);
    }
    ratchetShape.closePath();

    const ratchetGeom = new THREE.ExtrudeGeometry(ratchetShape, { depth: 0.1, bevelEnabled: false });
    ratchetGeom.center();
    const ratchetMesh = new THREE.Mesh(ratchetGeom, materials.brassPolished);
    ratchetMesh.position.z = 1.05;
    fuseeGroup.add(ratchetMesh);

    // Uñeta de retención
    const pawlGeom = new THREE.BoxGeometry(0.65, 0.12, 0.08);
    const pawlMesh = new THREE.Mesh(pawlGeom, materials.bluedSteel);
    pawlMesh.position.set(1.15, 0.6, 1.12);
    pawlMesh.rotation.z = -0.4;
    fuseeGroup.add(pawlMesh);

    clock.add(fuseeGroup);
    movingParts.gears.push({ mesh: fuseeGroup, speedRatio: 0.02, axis: 'z' });

    // ----------------------------------------------------
    // F. TREN DE ENGRANAJES MECÁNICOS (GEAR TRAIN)
    // ----------------------------------------------------
    // 1. Gran Rueda (Great Wheel)
    const greatWheel = createSpokedGear(2.1, 72, 5, materials);
    greatWheel.position.set(0, 5.2, -0.65);
    clock.add(greatWheel);
    movingParts.gears.push({ mesh: greatWheel, speedRatio: 0.02, axis: 'z' });

    // 2. Rueda de Centro (Center Wheel)
    const centerWheel = createSpokedGear(1.8, 64, 5, materials);
    centerWheel.position.set(0, 8.8, 0.2);
    clock.add(centerWheel);
    movingParts.gears.push({ mesh: centerWheel, speedRatio: 1 / 3600, axis: 'z' });

    // 3. Rueda Tercera (Third Wheel)
    const thirdWheel = createSpokedGear(1.4, 48, 4, materials);
    thirdWheel.position.set(-1.1, 10.3, -0.35);
    clock.add(thirdWheel);
    movingParts.gears.push({ mesh: thirdWheel, speedRatio: -(1 / 480), axis: 'z' });

    // 4. Rueda Cuarta (Fourth Wheel)
    const fourthWheel = createSpokedGear(1.25, 40, 4, materials);
    fourthWheel.position.set(0, 11.8, 0.4);
    clock.add(fourthWheel);
    movingParts.gears.push({ mesh: fourthWheel, speedRatio: 1 / 60, axis: 'z' });

    // 5. Rueda de Escape (Escape Wheel)
    const escapeShape = new THREE.Shape();
    const escapeTeeth = 30;
    const rEscape = 1.15;
    for (let i = 0; i < escapeTeeth; i++) {
      const a1 = (i / escapeTeeth) * Math.PI * 2;
      const a2 = ((i + 0.3) / escapeTeeth) * Math.PI * 2;
      const a3 = ((i + 0.95) / escapeTeeth) * Math.PI * 2;

      const x1 = Math.cos(a1) * (rEscape * 0.82);
      const y1 = Math.sin(a1) * (rEscape * 0.82);
      const x2 = Math.cos(a2) * rEscape;
      const y2 = Math.sin(a2) * rEscape;
      const x3 = Math.cos(a3) * (rEscape * 0.92);
      const y3 = Math.sin(a3) * (rEscape * 0.92);

      if (i === 0) escapeShape.moveTo(x1, y1);
      else escapeShape.lineTo(x1, y1);
      escapeShape.lineTo(x2, y2);
      escapeShape.lineTo(x3, y3);
    }
    escapeShape.closePath();

    for (let s = 0; s < 4; s++) {
      const sa = (s / 4) * Math.PI * 2 + 0.18;
      const ea = ((s + 1) / 4) * Math.PI * 2 - 0.18;
      const h = new THREE.Path();
      h.absarc(0, 0, rEscape * 0.75, sa, ea, false);
      h.absarc(0, 0, 0.28, ea, sa, true);
      h.closePath();
      escapeShape.holes.push(h);
    }

    const escapeGeom = new THREE.ExtrudeGeometry(escapeShape, { depth: 0.08, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015 });
    escapeGeom.center();
    const escapeWheel = new THREE.Mesh(escapeGeom, materials.brassPolished);
    escapeWheel.position.set(0, 11.8, -0.6);
    clock.add(escapeWheel);
    movingParts.gears.push({ mesh: escapeWheel, speedRatio: -(1 / 60), axis: 'z' });

    // Ejes de acero pulido
    const arborGeom = new THREE.CylinderGeometry(0.06, 0.06, 2.9, 16);
    arborGeom.rotateX(Math.PI / 2);

    const arborPositions = [
      { x: 0, y: 5.2 },
      { x: 0, y: 8.8 },
      { x: -1.1, y: 10.3 },
      { x: 0, y: 11.8 },
    ];

    arborPositions.forEach(pos => {
      const arbor = new THREE.Mesh(arborGeom, materials.brightSteel);
      arbor.position.set(pos.x, pos.y, -0.08);
      clock.add(arbor);
    });

    // ----------------------------------------------------
    // G. ESCAPE DE ÁNCORA CON PALETAS DE RUBÍ Y PÉNDULO
    // ----------------------------------------------------
    const anchorGroup = new THREE.Group();
    anchorGroup.position.set(0, 12.95, -0.6);

    const anchorBodyGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.2, 16);
    anchorBodyGeom.rotateX(Math.PI / 2);
    const anchorBody = new THREE.Mesh(anchorBodyGeom, materials.brassPolished);
    anchorGroup.add(anchorBody);

    const anchorArmGeom = new THREE.TorusGeometry(1.22, 0.06, 12, 32, Math.PI * 0.58);
    anchorArmGeom.rotateZ(Math.PI * 0.71);
    const anchorArm = new THREE.Mesh(anchorArmGeom, materials.brassPolished);
    anchorArm.position.y = -0.4;
    anchorGroup.add(anchorArm);

    // Paleta izquierda en RUBÍ SINTÉTICO translúcido
    const palletEntryGeom = new THREE.BoxGeometry(0.14, 0.32, 0.09);
    const palletEntry = new THREE.Mesh(palletEntryGeom, materials.rubyJewel);
    palletEntry.position.set(-0.85, -0.98, 0);
    palletEntry.rotation.z = 0.45;
    anchorGroup.add(palletEntry);

    // Paleta derecha en RUBÍ SINTÉTICO translúcido
    const palletExitGeom = new THREE.BoxGeometry(0.14, 0.32, 0.09);
    const palletExit = new THREE.Mesh(palletExitGeom, materials.rubyJewel);
    palletExit.position.set(0.85, -0.98, 0);
    palletExit.rotation.z = -0.45;
    anchorGroup.add(palletExit);

    // Horquilla de conexión (crutch)
    const crutchGeom = new THREE.CylinderGeometry(0.04, 0.04, 2.2, 12);
    const crutchMesh = new THREE.Mesh(crutchGeom, materials.bluedSteel);
    crutchMesh.position.set(0, -1.1, -0.85);
    anchorGroup.add(crutchMesh);

    clock.add(anchorGroup);
    movingParts.anchor = anchorGroup;

    // Péndulo oscilante montado en la parte trasera
    const pendulumGroup = new THREE.Group();
    pendulumGroup.position.set(0, 15.6, -1.55);

    const springGeom = new THREE.BoxGeometry(0.16, 0.6, 0.02);
    const springMesh = new THREE.Mesh(springGeom, materials.bluedSteel);
    springMesh.position.y = -0.3;
    pendulumGroup.add(springMesh);

    const rodGeom = new THREE.CylinderGeometry(0.045, 0.045, 13.5, 16);
    const rodMesh = new THREE.Mesh(rodGeom, materials.brassPolished);
    rodMesh.position.y = -7.05;
    rodMesh.castShadow = true;
    pendulumGroup.add(rodMesh);

    const bobPoints = [
      new THREE.Vector2(0, -0.9),
      new THREE.Vector2(1.1, -0.6),
      new THREE.Vector2(1.4, 0),
      new THREE.Vector2(1.1, 0.6),
      new THREE.Vector2(0, 0.9),
    ];
    const bobGeom = new THREE.LatheGeometry(bobPoints, 48);
    const bobMesh = new THREE.Mesh(bobGeom, materials.brassPolished);
    bobMesh.position.y = -12.4;
    bobMesh.castShadow = true;
    pendulumGroup.add(bobMesh);

    // Tuerca moleteada de regulación con graduación micrométrica
    const nutGeom = new THREE.CylinderGeometry(0.32, 0.36, 0.45, 24);
    const nutMesh = new THREE.Mesh(nutGeom, materials.brassPolished);
    nutMesh.position.y = -13.55;
    pendulumGroup.add(nutMesh);

    clock.add(pendulumGroup);
    movingParts.pendulum = pendulumGroup;

    // ----------------------------------------------------
    // H. ANILLO HORARIO PLATEADO (CHAPTER RING)
    // ----------------------------------------------------
    const chapterRingGroup = new THREE.Group();
    chapterRingGroup.position.set(0, 11.8, 1.48);

    const chapterTexture = createChapterRingTexture();
    const dialPlateMaterial = new THREE.MeshStandardMaterial({
      map: chapterTexture,
      metalness: 0.68,
      roughness: 0.26,
      bumpMap: chapterTexture,
      bumpScale: 0.015,
      side: THREE.DoubleSide,
    });

    const ringShape = new THREE.Shape();
    ringShape.absarc(0, 0, 3.65, 0, Math.PI * 2, false);
    const ringHole = new THREE.Path();
    ringHole.absarc(0, 0, 2.45, 0, Math.PI * 2, true);
    ringShape.holes.push(ringHole);

    const ringGeom = new THREE.ExtrudeGeometry(ringShape, {
      depth: 0.1,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.025,
      bevelThickness: 0.025,
    });

    const pos = ringGeom.attributes.position;
    const uvs = [];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const u = (x / (3.65 * 2)) + 0.5;
      const v = (y / (3.65 * 2)) + 0.5;
      uvs.push(u, v);
    }
    ringGeom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

    const chapterMesh = new THREE.Mesh(ringGeom, dialPlateMaterial);
    chapterMesh.castShadow = true;
    chapterRingGroup.add(chapterMesh);

    // Soportes de fijación
    const dialFootGeom = new THREE.CylinderGeometry(0.1, 0.1, 0.25, 12);
    dialFootGeom.rotateX(Math.PI / 2);
    const angles = [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75];
    angles.forEach(a => {
      const foot = new THREE.Mesh(dialFootGeom, materials.brassPolished);
      foot.position.set(Math.cos(a) * 3.1, Math.sin(a) * 3.1, -0.12);
      chapterRingGroup.add(foot);
    });

    clock.add(chapterRingGroup);

    // ----------------------------------------------------
    // I. AGUJAS CALADAS DE ACERO AZULADO BREGUET (HANDS)
    // ----------------------------------------------------
    const handsPivot = new THREE.Group();
    handsPivot.position.set(0, 11.8, 1.62);

    // 1. Aguja de las horas con ojo de luna calado
    const hourHandGroup = new THREE.Group();
    const hourShape = new THREE.Shape();
    hourShape.moveTo(-0.14, -0.5);
    hourShape.lineTo(0.14, -0.5);
    hourShape.lineTo(0.12, 0.9);
    hourShape.absarc(0, 1.45, 0.38, 0, Math.PI * 2, false);
    hourShape.moveTo(0.08, 1.83);
    hourShape.lineTo(0, 2.15);
    hourShape.lineTo(-0.08, 1.83);
    hourShape.closePath();

    const hourHole = new THREE.Path();
    hourHole.absarc(0, 1.45, 0.24, 0, Math.PI * 2, true);
    hourShape.holes.push(hourHole);

    const hourGeom = new THREE.ExtrudeGeometry(hourShape, { depth: 0.04, bevelEnabled: false });
    const hourMesh = new THREE.Mesh(hourGeom, materials.bluedSteel);
    hourHandGroup.add(hourMesh);
    hourHandGroup.position.z = 0.02;
    handsPivot.add(hourHandGroup);
    movingParts.hourHand = hourHandGroup;

    // 2. Aguja de los minutos estilizada Breguet
    const minuteHandGroup = new THREE.Group();
    const minShape = new THREE.Shape();
    minShape.moveTo(-0.11, -0.6);
    minShape.lineTo(0.11, -0.6);
    minShape.lineTo(0.08, 1.9);
    minShape.absarc(0, 2.45, 0.35, 0, Math.PI * 2, false);
    minShape.moveTo(0.06, 2.8);
    minShape.lineTo(0, 3.3);
    minShape.lineTo(-0.06, 2.8);
    minShape.closePath();

    const minHole = new THREE.Path();
    minHole.absarc(0, 2.45, 0.22, 0, Math.PI * 2, true);
    minShape.holes.push(minHole);

    const minGeom = new THREE.ExtrudeGeometry(minShape, { depth: 0.035, bevelEnabled: false });
    const minMesh = new THREE.Mesh(minGeom, materials.bluedSteel);
    minuteHandGroup.add(minMesh);
    minuteHandGroup.position.z = 0.08;
    handsPivot.add(minuteHandGroup);
    movingParts.minuteHand = minuteHandGroup;

    // 3. Segundero fino con contrapeso circular
    const secondHandGroup = new THREE.Group();
    const secShape = new THREE.Shape();
    secShape.moveTo(-0.035, -1.0);
    secShape.lineTo(0.035, -1.0);
    secShape.lineTo(0.02, 3.4);
    secShape.lineTo(-0.02, 3.4);
    secShape.closePath();

    const secCounterGeom = new THREE.CylinderGeometry(0.2, 0.2, 0.04, 20);
    secCounterGeom.rotateX(Math.PI / 2);
    const secCounter = new THREE.Mesh(secCounterGeom, materials.bluedSteel);
    secCounter.position.y = -0.55;
    secondHandGroup.add(secCounter);

    const secGeom = new THREE.ExtrudeGeometry(secShape, { depth: 0.025, bevelEnabled: false });
    const secMesh = new THREE.Mesh(secGeom, materials.bluedSteel);
    secondHandGroup.add(secMesh);
    secondHandGroup.position.z = 0.14;
    handsPivot.add(secondHandGroup);
    movingParts.secondHand = secondHandGroup;

    // Botón central de latón
    const bossGeom = new THREE.CylinderGeometry(0.24, 0.28, 0.2, 24);
    bossGeom.rotateX(Math.PI / 2);
    const bossMesh = new THREE.Mesh(bossGeom, materials.brassPolished);
    bossMesh.position.z = 0.22;
    handsPivot.add(bossMesh);

    clock.add(handsPivot);

    // ----------------------------------------------------
    // J. CAMPANA DE CRISTAL PROTECTORA (GLASS DOME / CLOCHE)
    // ----------------------------------------------------
    const domeGroup = new THREE.Group();
    const domePoints = [];
    const domeRadius = 4.75;
    const domeHeight = 18.8;

    domePoints.push(new THREE.Vector2(4.9, 0));
    domePoints.push(new THREE.Vector2(4.75, 0.3));
    domePoints.push(new THREE.Vector2(domeRadius, 14.5));
    for (let i = 0; i <= 20; i++) {
      const a = (i / 20) * (Math.PI / 2);
      const r = domeRadius * Math.cos(a);
      const y = 14.5 + (domeHeight - 14.5) * Math.sin(a);
      domePoints.push(new THREE.Vector2(r, y));
    }
    domePoints.push(new THREE.Vector2(0, domeHeight));

    const domeGeom = new THREE.LatheGeometry(domePoints, 48);
    domeGeom.scale(1.7, 1, 1.0);

    const domeMesh = new THREE.Mesh(domeGeom, materials.glassDome);
    domeMesh.position.y = 0.98;
    domeMesh.castShadow = true;
    domeGroup.add(domeMesh);

    clock.add(domeGroup);

    return {
      clockGroup: clock,
      movingParts: movingParts,
      domeGroup: domeGroup,
    };
  }

  /* ============================================================
     7. PARTÍCULAS DORADAS DE LUZ ATMOSFÉRICA (ATELIER MOTES)
     ============================================================ */
  function createAtelierParticles() {
    const count = 140;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 28;
      positions[i * 3 + 1] = Math.random() * 22;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 22;

      speeds[i * 3 + 0] = (Math.random() - 0.5) * 0.003;
      speeds[i * 3 + 1] = 0.002 + Math.random() * 0.005;
      speeds[i * 3 + 2] = (Math.random() - 0.5) * 0.003;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Textura circular suave para motas
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 64;
    pCanvas.height = 64;
    const pCtx = pCanvas.getContext('2d');
    const pGrad = pCtx.createRadialGradient(32, 32, 2, 32, 32, 30);
    pGrad.addColorStop(0, 'rgba(255, 230, 160, 0.95)');
    pGrad.addColorStop(0.3, 'rgba(230, 185, 90, 0.5)');
    pGrad.addColorStop(1, 'transparent');
    pCtx.fillStyle = pGrad;
    pCtx.fillRect(0, 0, 64, 64);
    const pTex = new THREE.CanvasTexture(pCanvas);

    const mat = new THREE.PointsMaterial({
      size: 0.45,
      map: pTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.65,
    });

    const particles = new THREE.Points(geom, mat);
    particles.userData = { speeds: speeds, count: count };
    return particles;
  }

  /* ============================================================
     8. CONTROLADOR PRINCIPAL DE LA APLICACIÓN 3D
     ============================================================ */
  class HorologyApp {
    constructor() {
      this.container = document.getElementById('canvas-container');
      this.audio = new ClockAudio();
      this.speedMultiplier = 1;
      this.isDomeVisible = true;
      this.lastTickSecond = -1;

      // Variables de transición suave de cámara
      this.isTransitioningCamera = false;
      this.targetCameraPos = new THREE.Vector3();
      this.targetCameraLookAt = new THREE.Vector3();

      // Animación cinemática de entrada
      this.isIntro = true;
      this.introStart = performance.now();

      this.initScene();
      this.initLights();
      this.buildModel();
      this.initUI();
      this.animate();
    }

    initScene() {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x070504);

      // Entorno de reflexión de estudio
      const envTexture = createStudioEnvironment();
      this.scene.environment = envTexture;

      // Posición inicial de cámara cinemática
      this.camera = new THREE.PerspectiveCamera(
        36,
        window.innerWidth / window.innerHeight,
        0.1,
        150
      );
      this.camera.position.set(16, 15, 28);

      // Renderizador WebGL de alta precisión
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.outputEncoding = THREE.sRGBEncoding;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.15;
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      this.container.appendChild(this.renderer.domElement);

      // Controles orbitales 3D
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.minDistance = 6;
      this.controls.maxDistance = 45;
      this.controls.maxPolarAngle = Math.PI / 2 + 0.02;
      this.controls.target.set(0, 10, 0);

      window.addEventListener('resize', () => this.onWindowResize());
    }

    initLights() {
      const ambientLight = new THREE.AmbientLight(0xffeedd, 0.45);
      this.scene.add(ambientLight);

      // Luz frontal derecha (clave cálida)
      const keyLight = new THREE.DirectionalLight(0xfff3da, 1.45);
      keyLight.position.set(12, 22, 16);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 2048;
      keyLight.shadow.mapSize.height = 2048;
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 50;
      keyLight.shadow.camera.left = -14;
      keyLight.shadow.camera.right = 14;
      keyLight.shadow.camera.top = 22;
      keyLight.shadow.camera.bottom = -2;
      keyLight.shadow.bias = -0.0004;
      this.scene.add(keyLight);

      // Luz de relleno lateral izquierda
      const fillLight = new THREE.DirectionalLight(0xd4e4ff, 0.65);
      fillLight.position.set(-14, 15, 10);
      this.scene.add(fillLight);

      // Halo posterior de contra
      const rimLight = new THREE.DirectionalLight(0xffd599, 0.9);
      rimLight.position.set(0, 18, -16);
      this.scene.add(rimLight);

      // Foco rasante en la base
      const spotLight = new THREE.SpotLight(0xffbf66, 0.85, 32, Math.PI / 4, 0.5, 1);
      spotLight.position.set(0, 1.5, 12);
      spotLight.target.position.set(0, 5, 0);
      this.scene.add(spotLight);
      this.scene.add(spotLight.target);
    }

    buildModel() {
      this.materials = createMaterials();
      const built = buildSkeletonClock(this.materials);

      this.clockGroup = built.clockGroup;
      this.movingParts = built.movingParts;
      this.domeGroup = built.domeGroup;

      this.scene.add(this.clockGroup);

      // Añadir motas de polvo atmosférico
      this.particles = createAtelierParticles();
      this.scene.add(this.particles);
    }

    setCameraPreset(posX, posY, posZ, targetX, targetY, targetZ) {
      this.targetCameraPos.set(posX, posY, posZ);
      this.targetCameraLookAt.set(targetX, targetY, targetZ);
      this.isTransitioningCamera = true;
      this.isIntro = false;
    }

    initUI() {
      // 1. Desbloqueo automático y transparente de audio en el primer gesto de usuario
      const audioNotice = document.getElementById('audio-notice');
      const audioNoticeText = document.getElementById('audio-notice-text');

      const unlockAudio = () => {
        this.audio.init();
        this.audio.resume();
        if (audioNoticeText) {
          audioNoticeText.textContent = 'Mecanismo en marcha • Sonido activado ⏱️';
        }
        setTimeout(() => {
          if (audioNotice) audioNotice.classList.add('fade-out');
        }, 3000);

        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('wheel', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      };

      window.addEventListener('pointerdown', unlockAudio);
      window.addEventListener('wheel', unlockAudio);
      window.addEventListener('keydown', unlockAudio);

      // 2. Selector de vistas de cámara
      const views = [
        { id: 'view-front', pos: [0, 11, 23], look: [0, 10.2, 0] },
        { id: 'view-mechanism', pos: [0, 11.5, 9.2], look: [0, 11.5, 0] },
        { id: 'view-side', pos: [17, 10.5, -4.5], look: [0, 9.5, -0.5] },
        { id: 'view-free', pos: [14, 13.5, 19], look: [0, 10, 0] },
      ];

      views.forEach(v => {
        const btn = document.getElementById(v.id);
        if (!btn) return;
        btn.addEventListener('click', () => {
          document.querySelectorAll('.btn-cluster .ctrl-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.setCameraPreset(v.pos[0], v.pos[1], v.pos[2], v.look[0], v.look[1], v.look[2]);
        });
      });

      // 3. Interruptor de Campana de Cristal
      const btnDome = document.getElementById('btn-dome');
      const domeStatus = document.getElementById('dome-status');
      btnDome.addEventListener('click', () => {
        this.isDomeVisible = !this.isDomeVisible;
        this.domeGroup.visible = this.isDomeVisible;
        domeStatus.textContent = this.isDomeVisible ? 'ON' : 'OFF';
        btnDome.classList.toggle('active', this.isDomeVisible);
      });

      // 4. Selector de Velocidad (Tiempo real / Demo / Pausa)
      const btnSpeed = document.getElementById('btn-speed');
      const speedStatus = document.getElementById('speed-status');
      btnSpeed.addEventListener('click', () => {
        if (this.speedMultiplier === 1) {
          this.speedMultiplier = 15;
          speedStatus.textContent = '15x (Demo)';
          btnSpeed.classList.add('active');
        } else if (this.speedMultiplier === 15) {
          this.speedMultiplier = 0;
          speedStatus.textContent = 'Pausa';
          btnSpeed.classList.remove('active');
        } else {
          this.speedMultiplier = 1;
          speedStatus.textContent = '1x (Real)';
          btnSpeed.classList.remove('active');
        }
      });

      // 5. Controles de Audio
      const btnSound = document.getElementById('btn-sound');
      const soundIcon = document.getElementById('sound-icon');
      const soundLabel = document.getElementById('sound-label');
      const volumeSlider = document.getElementById('volume-slider');

      btnSound.addEventListener('click', () => {
        this.audio.init();
        const unmuted = this.audio.toggleMute();
        soundIcon.textContent = unmuted ? '🔊' : '🔇';
        soundLabel.textContent = unmuted ? 'Sonido ON' : 'Mute';
        btnSound.classList.toggle('active', unmuted);
      });

      volumeSlider.addEventListener('input', (e) => {
        this.audio.setVolume(parseFloat(e.target.value));
      });

      // 6. Modal de Información
      const btnInfo = document.getElementById('btn-info');
      const modal = document.getElementById('info-modal');
      const modalClose = document.getElementById('modal-close');

      btnInfo.addEventListener('click', () => modal.classList.add('open'));
      modalClose.addEventListener('click', () => modal.classList.remove('open'));
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
      });

      // Reloj digital en la cabecera
      this.digitalClockEl = document.getElementById('digital-clock');
    }

    onWindowResize() {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
      requestAnimationFrame(() => this.animate());

      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      const millis = now.getMilliseconds();

      const pad = n => String(n).padStart(2, '0');
      if (this.digitalClockEl) {
        this.digitalClockEl.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
      }

      const simTime = (performance.now() / 1000) * this.speedMultiplier;

      // 1. Sonido de escape rítmico (doble pulso tic-tac cada segundo)
      if (seconds !== this.lastTickSecond && this.speedMultiplier > 0) {
        this.lastTickSecond = seconds;
        this.audio.playTick(seconds % 2 === 1);
      }

      // 2. Movimiento armónico del péndulo y el áncora
      const pendulumFreq = Math.PI * 2;
      const pendulumAngle = Math.sin(simTime * pendulumFreq) * 0.082;

      if (this.movingParts.pendulum) {
        this.movingParts.pendulum.rotation.z = pendulumAngle;
      }
      if (this.movingParts.anchor) {
        this.movingParts.anchor.rotation.z = -pendulumAngle * 0.95;
      }

      // 3. Rotación de las agujas
      if (this.speedMultiplier === 1) {
        const secAngle = -(seconds + millis / 1000) * (Math.PI / 30);
        const minAngle = -(minutes * 60 + seconds) * (Math.PI / 1800);
        const hrAngle = -((hours % 12) * 3600 + minutes * 60 + seconds) * (Math.PI / 21600);

        if (this.movingParts.secondHand) this.movingParts.secondHand.rotation.z = secAngle;
        if (this.movingParts.minuteHand) this.movingParts.minuteHand.rotation.z = minAngle;
        if (this.movingParts.hourHand) this.movingParts.hourHand.rotation.z = hrAngle;
      } else {
        const secAngle = -simTime * (Math.PI / 3);
        const minAngle = -simTime * (Math.PI / 45);
        const hrAngle = -simTime * (Math.PI / 540);

        if (this.movingParts.secondHand) this.movingParts.secondHand.rotation.z = secAngle;
        if (this.movingParts.minuteHand) this.movingParts.minuteHand.rotation.z = minAngle;
        if (this.movingParts.hourHand) this.movingParts.hourHand.rotation.z = hrAngle;
      }

      // 4. Rotación física de cada engranaje
      this.movingParts.gears.forEach(g => {
        if (this.speedMultiplier > 0) {
          g.mesh.rotation.z += g.speedRatio * (this.speedMultiplier === 1 ? 0.05 : 0.4);
        }
      });

      // 5. Animación de motas de polvo atmosférico
      if (this.particles) {
        const posAttr = this.particles.geometry.attributes.position;
        const speeds = this.particles.userData.speeds;
        const count = this.particles.userData.count;

        for (let i = 0; i < count; i++) {
          let y = posAttr.getY(i) + speeds[i * 3 + 1];
          if (y > 22) y = 0.5;
          posAttr.setY(i, y);

          let x = posAttr.getX(i) + speeds[i * 3 + 0];
          let z = posAttr.getZ(i) + speeds[i * 3 + 2];
          posAttr.setX(i, x);
          posAttr.setZ(i, z);
        }
        posAttr.needsUpdate = true;
      }

      // 6. Animación cinemática de entrada (Glide inicial suave a la vista frontal)
      if (this.isIntro) {
        const elapsed = (performance.now() - this.introStart) / 1000;
        const targetPos = new THREE.Vector3(0, 11, 23);
        const targetLook = new THREE.Vector3(0, 10.2, 0);

        this.camera.position.lerp(targetPos, 0.035);
        this.controls.target.lerp(targetLook, 0.035);

        if (elapsed > 4.5 || this.camera.position.distanceTo(targetPos) < 0.1) {
          this.camera.position.copy(targetPos);
          this.controls.target.copy(targetLook);
          this.isIntro = false;
        }
      } else if (this.isTransitioningCamera) {
        this.camera.position.lerp(this.targetCameraPos, 0.06);
        this.controls.target.lerp(this.targetCameraLookAt, 0.06);

        if (this.camera.position.distanceTo(this.targetCameraPos) < 0.05) {
          this.camera.position.copy(this.targetCameraPos);
          this.controls.target.copy(this.targetCameraLookAt);
          this.isTransitioningCamera = false;
        }
      }

      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    new HorologyApp();
  });
})();

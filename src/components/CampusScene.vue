<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useCampusStore } from '../stores/campusStore'

const store = useCampusStore()
const container = ref<HTMLDivElement>()
const isHeatmapEnabled = ref(false)
const isFullscreen = ref(false)
const isNightMode = ref(false)
const isLoading = ref(true)

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let animId: number
const roomMeshes: Map<string, THREE.Mesh> = new Map()
const buildingGroups: Map<string, THREE.Group> = new Map()
const particleSystems: THREE.Points[] = []
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

let ambientLight: THREE.AmbientLight
let dirLight: THREE.DirectionalLight
let groundMesh: THREE.Mesh

let navigationLine: THREE.Line | null = null
let navigationArrows: THREE.Object3D[] = []
let navigationAgent: THREE.Group | null = null
let agentProgress = 0

let lamppostLights: THREE.PointLight[] = []
let lamppostGlows: THREE.Mesh[] = []
let clouds: THREE.Group[] = []
let fireflies: THREE.Mesh[] = []

const freeMaterial = new THREE.MeshStandardMaterial({
  color: 0x34d399,
  roughness: 0.3,
  metalness: 0.3,
  transparent: true,
  opacity: 0.85
})

const busyMaterial = new THREE.MeshStandardMaterial({
  color: 0x6b8fc7,
  roughness: 0.4,
  metalness: 0.3,
  transparent: true,
  opacity: 0.8
})

const repairMaterial = new THREE.MeshStandardMaterial({
  color: 0xf87171,
  roughness: 0.3,
  metalness: 0.2,
  transparent: true,
  opacity: 0.85
})

const highlightedMaterial = new THREE.MeshStandardMaterial({
  color: 0x2596eb,
  roughness: 0.1,
  metalness: 0.6,
  emissive: 0x2596eb,
  emissiveIntensity: 0.4,
  transparent: true,
  opacity: 0.9
})

const myBookingMaterial = new THREE.MeshStandardMaterial({
  color: 0xfbbf24,
  roughness: 0.1,
  metalness: 0.7,
  emissive: 0xf59e0b,
  emissiveIntensity: 0.6,
  transparent: true,
  opacity: 0.95
})

onMounted(() => {
  if (!container.value) return
  initScene()
  buildCampus()
  buildParticles()
  animate()
  container.value.addEventListener('click', onClick)
  window.addEventListener('resize', onResize)
  document.addEventListener('fullscreenchange', onFullscreenChange)
  
  setTimeout(() => {
    isLoading.value = false
  }, 800)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animId)
  renderer?.dispose()
  container.value?.removeEventListener('click', onClick)
  window.removeEventListener('resize', onResize)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})

watch(() => store.highlightedRooms, (hl) => {
  roomMeshes.forEach((mesh, id) => {
    if (store.myBookedRoomIds.includes(id)) {
      mesh.material = myBookingMaterial
    } else {
      const room = store.findRoomById(id)
      if (room) {
        switch (room.status) {
          case 'free': mesh.material = freeMaterial; break
          case 'busy': mesh.material = busyMaterial; break
          case 'repair': mesh.material = repairMaterial; break
          default: mesh.material = busyMaterial
        }
      }
    }
  })
  if (hl.ids.length > 0) {
    hl.ids.forEach(id => {
      if (!store.myBookedRoomIds.includes(id)) {
        const mesh = roomMeshes.get(id)
        if (mesh) mesh.material = highlightedMaterial
      }
    })
  }
}, { deep: true })

watch(() => store.myBookedRoomIds, (ids) => {
  roomMeshes.forEach((mesh, id) => {
    if (ids.includes(id)) {
      mesh.material = myBookingMaterial
      mesh.userData.isMyBooking = true
    } else {
      mesh.userData.isMyBooking = false
      const room = store.findRoomById(id)
      if (room) {
        switch (room.status) {
          case 'free': mesh.material = freeMaterial; break
          case 'busy': mesh.material = busyMaterial; break
          case 'repair': mesh.material = repairMaterial; break
          default: mesh.material = busyMaterial
        }
      }
    }
  })
}, { deep: true })

watch(() => store.navigationRoute, (route) => {
  if (route) {
    drawNavigationRoute(route)
    startNavigationAnimation(route)
  } else {
    clearNavigationRoute()
  }
}, { deep: true })

function initScene() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x87ceeb)
  scene.fog = new THREE.FogExp2(0x87ceeb, 0.008)

  camera = new THREE.PerspectiveCamera(50, container.value!.clientWidth / container.value!.clientHeight, 0.1, 200)
  camera.position.set(20, 22, 28)

  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  renderer.setSize(container.value!.clientWidth, container.value!.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.domElement.style.position = 'absolute'
  renderer.domElement.style.top = '0'
  renderer.domElement.style.left = '0'
  renderer.domElement.style.zIndex = '0'
  container.value!.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.maxPolarAngle = Math.PI / 2.1
  controls.minDistance = 12
  controls.maxDistance = 55
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.3

  ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
  scene.add(ambientLight)

  dirLight = new THREE.DirectionalLight(0xffffff, 1.8)
  dirLight.position.set(15, 25, 15)
  dirLight.castShadow = true
  dirLight.shadow.mapSize.set(1024, 1024)
  dirLight.shadow.camera.left = -30
  dirLight.shadow.camera.right = 30
  dirLight.shadow.camera.top = 30
  dirLight.shadow.camera.bottom = -30
  dirLight.shadow.camera.near = 0.5
  dirLight.shadow.camera.far = 100
  scene.add(dirLight)

  const groundGeo = new THREE.PlaneGeometry(80, 80)
  const groundMat = new THREE.MeshStandardMaterial({ 
    color: 0x4a7c59, 
    roughness: 0.8,
    metalness: 0.1
  })
  groundMesh = new THREE.Mesh(groundGeo, groundMat)
  groundMesh.rotation.x = -Math.PI / 2
  groundMesh.receiveShadow = true
  scene.add(groundMesh)

  const gridHelper = new THREE.GridHelper(80, 40, 0x2a4a6e, 0x1f3654)
  gridHelper.position.y = 0.01
  scene.add(gridHelper)
}

function buildCampus() {
  addLake()
  addMainGate()

  store.buildings.forEach(bld => {
    const group = new THREE.Group()
    group.position.set(bld.position[0], 0, bld.position[1])
    buildingGroups.set(bld.id, group)

    if (bld.name === '图书馆') {
      buildLibrary(group, bld)
    } else if (bld.name === '艺术楼') {
      buildArtBuilding(group, bld)
    } else if (bld.name === '综合楼') {
      buildComplexBuilding(group, bld)
    } else {
      buildModernBuilding(group, bld)
    }

    scene.add(group)
  })

  addRoad(0, 0.02, -12, 50, 2, 0)
  addRoad(-6, 0.02, -8, 2, 20, 0)
  addRoad(8, 0.02, -8, 2, 25, 0)

  addTree(-14, -3)
  addTree(-12, -9)
  addTree(16, -3)
  addTree(14, -11)
  addTree(0, -11)
  addTree(6, 5)
  
  addPineTree(-16, -6)
  addPineTree(-8, -12)
  addPineTree(18, -6)
  addPineTree(10, -12)
  addPineTree(-2, -14)
  
  addBush(-10, -7)
  addBush(-5, -5)
  addBush(5, -5)
  addBush(10, -7)
  addBush(-8, 3)
  addBush(8, 3)

  addLamppost(-10, -5)
  addLamppost(-5, -8)
  addLamppost(5, -8)
  addLamppost(10, -5)
  
  initClouds()
}

function addLake() {
  const lakeGroup = new THREE.Group()
  lakeGroup.position.set(26, 0.1, -5)

  const lakeGeo = new THREE.CircleGeometry(8, 32)
  const lakeMat = new THREE.MeshStandardMaterial({
    color: 0x1e4d6b,
    roughness: 0.1,
    metalness: 0.8,
    transparent: true,
    opacity: 0.9,
    emissive: 0x0a2a4a,
    emissiveIntensity: 0.3,
    side: THREE.DoubleSide
  })
  const lake = new THREE.Mesh(lakeGeo, lakeMat)
  lake.rotation.x = -Math.PI / 2
  lake.receiveShadow = true
  lakeGroup.add(lake)

  const reflectionGeo = new THREE.PlaneGeometry(16, 16)
  const reflectionMat = new THREE.MeshBasicMaterial({
    color: 0x87ceeb,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide
  })
  const reflection = new THREE.Mesh(reflectionGeo, reflectionMat)
  reflection.rotation.x = -Math.PI / 2
  reflection.position.y = 0.05
  lakeGroup.add(reflection)

  const stoneGeo = new THREE.SphereGeometry(0.3, 16, 16)
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x555555,
    roughness: 0.8,
    metalness: 0.2
  })

  const stones = [
    { x: -5, z: -2 },
    { x: -3, z: 2 },
    { x: 4, z: -1 },
    { x: 2, z: 3 },
    { x: -6, z: 1 }
  ]

  stones.forEach(stone => {
    const s = new THREE.Mesh(stoneGeo, stoneMat)
    s.position.set(stone.x, 0.15, stone.z)
    s.scale.setScalar(0.8 + Math.random() * 0.4)
    lakeGroup.add(s)
  })

  const lilyPadGeo = new THREE.CircleGeometry(0.4, 8)
  const lilyPadMat = new THREE.MeshStandardMaterial({
    color: 0x228b22,
    roughness: 0.6,
    metalness: 0.1,
    side: THREE.DoubleSide
  })

  const lilyPads = [
    { x: -2, z: 0 },
    { x: 1, z: -2 },
    { x: 3, z: 1 },
    { x: -4, z: -3 }
  ]

  lilyPads.forEach(pad => {
    const lp = new THREE.Mesh(lilyPadGeo, lilyPadMat)
    lp.rotation.x = -Math.PI / 2
    lp.position.set(pad.x, 0.08, pad.z)
    lakeGroup.add(lp)

    const flowerGeo = new THREE.SphereGeometry(0.15, 8, 8)
    const flowerMat = new THREE.MeshStandardMaterial({
      color: 0xffc0cb,
      roughness: 0.3,
      metalness: 0.1,
      emissive: 0xff69b4,
      emissiveIntensity: 0.2
    })
    const flower = new THREE.Mesh(flowerGeo, flowerMat)
    flower.position.set(pad.x, 0.12, pad.z)
    flower.userData = { flowerPhase: Math.random() * Math.PI * 2 }
    lakeGroup.add(flower)
  })

  function createDuck(x: number, z: number, color: number) {
    const duck = new THREE.Group()
    
    const bodyGeo = new THREE.SphereGeometry(0.25, 16, 12)
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.1 })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.scale.set(1.2, 0.8, 0.9)
    body.position.set(0, 0.15, 0)
    duck.add(body)
    
    const headGeo = new THREE.SphereGeometry(0.15, 16, 16)
    const head = new THREE.Mesh(headGeo, bodyMat)
    head.position.set(0.3, 0.25, 0)
    duck.add(head)
    
    const beakGeo = new THREE.ConeGeometry(0.04, 0.12, 8)
    const beakMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.3, metalness: 0.2 })
    const beak = new THREE.Mesh(beakGeo, beakMat)
    beak.rotation.x = Math.PI / 2
    beak.position.set(0.45, 0.25, 0)
    duck.add(beak)
    
    const wingGeo = new THREE.SphereGeometry(0.12, 8, 8)
    const wing = new THREE.Mesh(wingGeo, bodyMat)
    wing.scale.set(0.8, 0.6, 1)
    wing.position.set(-0.1, 0.12, 0.15)
    duck.add(wing)
    
    duck.position.set(x, 0.2, z)
    duck.userData = { 
      type: 'duck',
      startX: x, 
      startZ: z, 
      speed: 0.008 + Math.random() * 0.006, 
      angle: Math.random() * Math.PI * 2,
      bobPhase: Math.random() * Math.PI * 2
    }
    lakeGroup.add(duck)
  }

  function createSwan(x: number, z: number) {
    const swan = new THREE.Group()
    
    const bodyGeo = new THREE.SphereGeometry(0.35, 16, 12)
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.4, metalness: 0.2 })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.scale.set(1.3, 0.7, 1)
    body.position.set(0, 0.2, 0)
    swan.add(body)
    
    const neckGeo = new THREE.CylinderGeometry(0.03, 0.06, 0.6, 8)
    const neckMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4, metalness: 0.2 })
    const neck = new THREE.Mesh(neckGeo, neckMat)
    neck.rotation.z = Math.PI / 6
    neck.position.set(0.3, 0.45, 0)
    swan.add(neck)
    
    const headGeo = new THREE.SphereGeometry(0.12, 16, 16)
    const head = new THREE.Mesh(headGeo, bodyMat)
    head.position.set(0.55, 0.7, 0)
    swan.add(head)
    
    const beakGeo = new THREE.ConeGeometry(0.03, 0.1, 8)
    const beakMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.3, metalness: 0.3 })
    const beak = new THREE.Mesh(beakGeo, beakMat)
    beak.rotation.x = Math.PI / 2
    beak.position.set(0.68, 0.7, 0)
    swan.add(beak)
    
    const wingGeo = new THREE.SphereGeometry(0.2, 8, 8)
    const wing = new THREE.Mesh(wingGeo, bodyMat)
    wing.scale.set(1, 0.5, 1.2)
    wing.position.set(-0.15, 0.18, 0.2)
    swan.add(wing)
    
    swan.position.set(x, 0.25, z)
    swan.userData = { 
      type: 'swan',
      startX: x, 
      startZ: z, 
      speed: 0.005 + Math.random() * 0.004, 
      angle: Math.random() * Math.PI * 2,
      bobPhase: Math.random() * Math.PI * 2
    }
    lakeGroup.add(swan)
  }

  function createFish(x: number, z: number, color: number) {
    const fish = new THREE.Group()
    
    const bodyGeo = new THREE.SphereGeometry(0.12, 16, 12)
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color, 
      roughness: 0.2, 
      metalness: 0.3,
      transparent: true,
      opacity: 0.85
    })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.scale.set(1.5, 0.7, 0.8)
    body.position.set(0, 0, 0)
    fish.add(body)
    
    const tailGeo = new THREE.ConeGeometry(0.02, 0.15, 8)
    const tail = new THREE.Mesh(tailGeo, bodyMat)
    tail.rotation.x = Math.PI / 2
    tail.position.set(-0.2, 0, 0)
    fish.add(tail)
    
    const finGeo = new THREE.ConeGeometry(0.02, 0.1, 8)
    const fin = new THREE.Mesh(finGeo, bodyMat)
    fin.rotation.z = Math.PI / 2
    fin.position.set(0, 0.08, 0)
    fish.add(fin)
    
    fish.position.set(x, -0.3, z)
    fish.userData = { 
      type: 'fish',
      startX: x, 
      startZ: z, 
      speed: 0.015 + Math.random() * 0.01, 
      angle: Math.random() * Math.PI * 2,
      depth: -0.3 - Math.random() * 0.4,
      depthPhase: Math.random() * Math.PI * 2
    }
    lakeGroup.add(fish)
  }

  createDuck(-3, -3, 0xffc125)
  createDuck(2, 2, 0xffc125)
  createDuck(-1, 3, 0xffc125)
  createDuck(4, -2, 0xff8c00)
  createDuck(-4, 1, 0xff8c00)

  createSwan(3, -4)
  createSwan(-5, -4)

  createFish(-2, -1, 0xff6347)
  createFish(1, 1, 0x40e0d0)
  createFish(-1, 2, 0xffd700)
  createFish(2, -1, 0x9370db)
  createFish(-3, 1, 0x00ced1)
  createFish(0, -3, 0xff69b4)
  createFish(4, 0, 0x32cd32)
  createFish(-4, -2, 0xff7f50)

  for (let i = 0; i < 8; i++) {
    const rippleGeo = new THREE.RingGeometry(0.3 + i * 1.2, 0.4 + i * 1.2, 32)
    const rippleMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      roughness: 0.1,
      metalness: 0.6,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    })
    const ripple = new THREE.Mesh(rippleGeo, rippleMat)
    ripple.rotation.x = -Math.PI / 2
    ripple.position.y = 0.03
    ripple.userData = { ripplePhase: i * 0.4, rippleSpeed: 0.003 + i * 0.0015 }
    lakeGroup.add(ripple)
  }

  scene.add(lakeGroup)
}

function addMainGate() {
  const gateGroup = new THREE.Group()
  gateGroup.position.set(0, 0, 15)

  const stoneMat = new THREE.MeshStandardMaterial({ 
    color: 0x8b7355, 
    roughness: 0.4,
    metalness: 0.3
  })
  const goldMat = new THREE.MeshStandardMaterial({ 
    color: 0xffd700, 
    roughness: 0.2,
    metalness: 0.8
  })
  const whiteMat = new THREE.MeshStandardMaterial({ 
    color: 0xffffff, 
    roughness: 0.2,
    metalness: 0.1
  })

  const leftPillarBase = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 1.5), stoneMat)
  leftPillarBase.position.set(-10, 0.4, 0)
  leftPillarBase.castShadow = true
  gateGroup.add(leftPillarBase)

  const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 8, 1.2), stoneMat)
  leftPillar.position.set(-10, 4, 0)
  leftPillar.castShadow = true
  gateGroup.add(leftPillar)

  const leftPillarMid = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 1.6), goldMat)
  leftPillarMid.position.set(-10, 4, 0)
  leftPillarMid.castShadow = true
  gateGroup.add(leftPillarMid)

  const leftPillarTop = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.5, 1.5, 16), stoneMat)
  leftPillarTop.position.set(-10, 8.75, 0)
  gateGroup.add(leftPillarTop)

  const leftPillarCap = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.8, 16), goldMat)
  leftPillarCap.position.set(-10, 9.8, 0)
  gateGroup.add(leftPillarCap)

  const rightPillarBase = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 1.5), stoneMat)
  rightPillarBase.position.set(10, 0.4, 0)
  rightPillarBase.castShadow = true
  gateGroup.add(rightPillarBase)

  const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 8, 1.2), stoneMat)
  rightPillar.position.set(10, 4, 0)
  rightPillar.castShadow = true
  gateGroup.add(rightPillar)

  const rightPillarMid = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 1.6), goldMat)
  rightPillarMid.position.set(10, 4, 0)
  rightPillarMid.castShadow = true
  gateGroup.add(rightPillarMid)

  const rightPillarTop = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.5, 1.5, 16), stoneMat)
  rightPillarTop.position.set(10, 8.75, 0)
  gateGroup.add(rightPillarTop)

  const rightPillarCap = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.8, 16), goldMat)
  rightPillarCap.position.set(10, 9.8, 0)
  gateGroup.add(rightPillarCap)

  const upperBeam = new THREE.Mesh(new THREE.BoxGeometry(23, 0.8, 0.6), stoneMat)
  upperBeam.position.set(0, 8.5, 0)
  upperBeam.castShadow = true
  gateGroup.add(upperBeam)

  const upperBeamTrim = new THREE.Mesh(new THREE.BoxGeometry(24, 0.4, 0.8), goldMat)
  upperBeamTrim.position.set(0, 9, 0)
  gateGroup.add(upperBeamTrim)

  const lowerBeam = new THREE.Mesh(new THREE.BoxGeometry(23, 0.6, 0.5), stoneMat)
  lowerBeam.position.set(0, 6.2, 0)
  lowerBeam.castShadow = true
  gateGroup.add(lowerBeam)

  const signBackground = new THREE.Mesh(new THREE.BoxGeometry(12, 2, 0.3), whiteMat)
  signBackground.position.set(0, 7.2, 0.4)
  signBackground.castShadow = true
  gateGroup.add(signBackground)

  const signFrame = new THREE.Mesh(new THREE.BoxGeometry(12.4, 2.4, 0.4), goldMat)
  signFrame.position.set(0, 7.2, 0.3)
  gateGroup.add(signFrame)

  const signTextCanvas = document.createElement('canvas')
  signTextCanvas.width = 512
  signTextCanvas.height = 128
  const ctx = signTextCanvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 512, 128)
  ctx.fillStyle = '#1e3a5f'
  ctx.font = 'bold 56px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('浙江工商大学', 256, 64)
  const signTex = new THREE.CanvasTexture(signTextCanvas)
  const signTextMat = new THREE.MeshBasicMaterial({ map: signTex })
  const signText = new THREE.Mesh(new THREE.PlaneGeometry(10, 1.5), signTextMat)
  signText.position.set(0, 7.2, 0.6)
  gateGroup.add(signText)

  const wallGeo = new THREE.BoxGeometry(2, 3, 25)
  const wallMat = new THREE.MeshStandardMaterial({ 
    color: 0x8b7355, 
    roughness: 0.5,
    metalness: 0.2
  })
  
  const leftWall = new THREE.Mesh(wallGeo, wallMat)
  leftWall.position.set(-16, 1.5, 0)
  gateGroup.add(leftWall)

  const rightWall = new THREE.Mesh(wallGeo, wallMat)
  rightWall.position.set(16, 1.5, 0)
  gateGroup.add(rightWall)

  scene.add(gateGroup)
}

function buildModernBuilding(group: THREE.Group, bld: typeof store.buildings[0]) {
  const floorCount = bld.floors.length
  const bWidth = 6
  const bDepth = 5
  const floorH = 4

  const facadeGeo = new THREE.BoxGeometry(bWidth, floorCount * floorH, bDepth)
  const facadeMat = new THREE.MeshStandardMaterial({
    color: 0x3b82f6,
    roughness: 0.5,
    metalness: 0.3,
    transparent: true,
    opacity: 0.95
  })
  const facade = new THREE.Mesh(facadeGeo, facadeMat)
  facade.position.set(0, floorCount * floorH / 2, 0)
  facade.castShadow = true
  facade.receiveShadow = true
  group.add(facade)

  const windowFrameMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a5f,
    roughness: 0.3,
    metalness: 0.5
  })

  for (let f = 0; f < floorCount; f++) {
    const y = f * floorH + floorH / 2
    const floor = bld.floors[f]
    const roomCount = floor.rooms.length
    const rw = bWidth / roomCount

    addFloorLabel(group, f + 1, y, bDepth / 2 + 0.08, 0)
    addFloorLabel(group, f + 1, y, -bDepth / 2 - 0.08, Math.PI)

    floor.rooms.forEach((room, rIdx) => {
      const roomX = -bWidth / 2 + rw * (rIdx + 0.5)
      
      const windowGeo = new THREE.BoxGeometry(rw * 0.7, floorH * 0.4, 0.1)
      const isBusy = room.status === 'busy'
      const windowMat = new THREE.MeshStandardMaterial({
        color: isBusy ? 0xffd700 : room.status === 'repair' ? 0xff6b6b : 0x87ceeb,
        roughness: 0.15,
        metalness: 0.05,
        transparent: true,
        opacity: 0.85,
        emissive: isBusy ? 0xfbbf24 : room.status === 'repair' ? 0xf87171 : 0x22d3ee,
        emissiveIntensity: isBusy ? 0.3 : 0.15
      })
      const windowMesh = new THREE.Mesh(windowGeo, windowMat)
      windowMesh.position.set(roomX, y, bDepth / 2 + 0.06)
      windowMesh.userData = { 
        isWindow: true, 
        isNightWindow: isBusy,
        flickerPhase: Math.random() * Math.PI * 2,
        flickerSpeed: 0.8 + Math.random() * 1.2,
        baseOpacity: 0.85,
        baseEmissiveIntensity: isBusy ? 0.3 : 0.15
      }
      group.add(windowMesh)
      
      if (isBusy) {
        const innerLight = new THREE.PointLight(0xfef3c7, 0, 4)
        innerLight.position.set(roomX, y, 0)
        innerLight.userData = { isRoomLight: true, roomId: room.id }
        group.add(innerLight)
      }

      const frameH = new THREE.Mesh(
        new THREE.BoxGeometry(rw * 0.7, 0.08, 0.12),
        windowFrameMat
      )
      frameH.position.set(roomX, y, bDepth / 2 + 0.05)
      group.add(frameH)

      const frameV = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, floorH * 0.4, 0.12),
        windowFrameMat
      )
      frameV.position.set(roomX, y, bDepth / 2 + 0.05)
      group.add(frameV)

      const roomMesh = new THREE.Mesh(
        new THREE.BoxGeometry(rw - 0.15, floorH - 0.15, bDepth - 0.15),
        getMaterialByStatus(room.status)
      )
      roomMesh.position.set(roomX, y, 0)
      roomMesh.castShadow = true
      roomMesh.receiveShadow = true
      roomMesh.userData = { roomId: room.id, roomName: room.name, buildingName: bld.name, type: room.type }
      roomMeshes.set(room.id, roomMesh)
      group.add(roomMesh)
    })
  }

  const roofGeo = new THREE.ConeGeometry(bWidth / 2 + 0.5, 1.5, 4)
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x1a365d,
    roughness: 0.4,
    metalness: 0.2
  })
  const roof = new THREE.Mesh(roofGeo, roofMat)
  roof.position.set(0, floorCount * floorH + 0.75, 0)
  roof.castShadow = true
  group.add(roof)

  addBuildingLabel(group, bld.name, floorCount * floorH + 1.5)
}

function buildLibrary(group: THREE.Group, bld: typeof store.buildings[0]) {
  const floorCount = bld.floors.length
  const baseW = 7
  const baseD = 6
  const floorH = 4.5

  const mainBodyGeo = new THREE.BoxGeometry(baseW, floorCount * floorH, baseD)
  const mainBodyMat = new THREE.MeshStandardMaterial({
    color: 0x2563eb,
    roughness: 0.5,
    metalness: 0.3,
    transparent: true,
    opacity: 0.95
  })
  const mainBody = new THREE.Mesh(mainBodyGeo, mainBodyMat)
  mainBody.position.set(0, floorCount * floorH / 2, 0)
  mainBody.castShadow = true
  mainBody.receiveShadow = true
  group.add(mainBody)

  const windowFrameMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a5f,
    roughness: 0.3,
    metalness: 0.5
  })

  for (let f = 0; f < floorCount; f++) {
    const y = f * floorH + floorH / 2
    const floor = bld.floors[f]
    const roomCount = floor.rooms.length
    const rw = baseW / roomCount

    addFloorLabel(group, f + 1, y, baseD / 2 + 0.08, 0)
    addFloorLabel(group, f + 1, y, -baseD / 2 - 0.08, Math.PI)

    floor.rooms.forEach((room, rIdx) => {
      const roomX = -baseW / 2 + rw * (rIdx + 0.5)

      const windowGeo = new THREE.BoxGeometry(rw * 0.6, floorH * 0.45, 0.1)
      const windowMat = new THREE.MeshStandardMaterial({
        color: room.status === 'free' ? 0x87ceeb : room.status === 'busy' ? 0xffd700 : 0xff6b6b,
        roughness: 0.2,
        metalness: 0.1,
        transparent: true,
        opacity: 0.85,
        emissive: room.status === 'free' ? 0x22d3ee : room.status === 'busy' ? 0xfbbf24 : 0xf87171,
        emissiveIntensity: 0.2
      })
      const windowMesh = new THREE.Mesh(windowGeo, windowMat)
      windowMesh.position.set(roomX, y, baseD / 2 + 0.06)
      group.add(windowMesh)

      const frameH = new THREE.Mesh(
        new THREE.BoxGeometry(rw * 0.6, 0.08, 0.12),
        windowFrameMat
      )
      frameH.position.set(roomX, y, baseD / 2 + 0.05)
      group.add(frameH)

      const frameV = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, floorH * 0.45, 0.12),
        windowFrameMat
      )
      frameV.position.set(roomX, y, baseD / 2 + 0.05)
      group.add(frameV)

      const roomMesh = new THREE.Mesh(
        new THREE.BoxGeometry(rw * 0.7, floorH * 0.7, baseD * 0.7),
        getMaterialByStatus(room.status)
      )
      roomMesh.position.set(roomX, y, 0)
      roomMesh.castShadow = true
      roomMesh.receiveShadow = true
      roomMesh.userData = { roomId: room.id, roomName: room.name, buildingName: bld.name, type: room.type }
      roomMeshes.set(room.id, roomMesh)
      group.add(roomMesh)
    })
  }

  const domeGeo = new THREE.SphereGeometry(1.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)
  const domeMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a5f,
    roughness: 0.3,
    metalness: 0.4
  })
  const dome = new THREE.Mesh(domeGeo, domeMat)
  dome.position.set(0, floorCount * floorH + 1.5, 0)
  dome.castShadow = true
  group.add(dome)

  const domeBaseGeo = new THREE.CylinderGeometry(1.5, 1.6, 0.8, 32)
  const domeBaseMat = new THREE.MeshStandardMaterial({
    color: 0x1a365d,
    roughness: 0.4,
    metalness: 0.3
  })
  const domeBase = new THREE.Mesh(domeBaseGeo, domeBaseMat)
  domeBase.position.set(0, floorCount * floorH + 0.4, 0)
  group.add(domeBase)

  addBuildingLabel(group, bld.name, floorCount * floorH + 3)
}

function buildArtBuilding(group: THREE.Group, bld: typeof store.buildings[0]) {
  const floorCount = bld.floors.length
  const floorH = 4
  const baseW = 7
  const baseD = 5

  const mainBodyGeo = new THREE.BoxGeometry(baseW, floorCount * floorH, baseD)
  const mainBodyMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    roughness: 0.5,
    metalness: 0.3,
    transparent: true,
    opacity: 0.95
  })
  const mainBody = new THREE.Mesh(mainBodyGeo, mainBodyMat)
  mainBody.position.set(0, floorCount * floorH / 2, 0)
  mainBody.castShadow = true
  mainBody.receiveShadow = true
  group.add(mainBody)

  const windowFrameMat = new THREE.MeshStandardMaterial({
    color: 0x92400e,
    roughness: 0.3,
    metalness: 0.5
  })

  for (let f = 0; f < floorCount; f++) {
    const y = f * floorH + floorH / 2
    const floor = bld.floors[f]
    const roomCount = floor.rooms.length
    const rw = baseW / roomCount

    addFloorLabel(group, f + 1, y, baseD / 2 + 0.08, 0)
    addFloorLabel(group, f + 1, y, -baseD / 2 - 0.08, Math.PI)

    floor.rooms.forEach((room, rIdx) => {
      const roomX = -baseW / 2 + rw * (rIdx + 0.5)

      const windowGeo = new THREE.BoxGeometry(rw * 0.6, floorH * 0.45, 0.1)
      const windowMat = new THREE.MeshStandardMaterial({
        color: room.status === 'free' ? 0x87ceeb : room.status === 'busy' ? 0xffd700 : 0xff6b6b,
        roughness: 0.2,
        metalness: 0.1,
        transparent: true,
        opacity: 0.85,
        emissive: room.status === 'free' ? 0x22d3ee : room.status === 'busy' ? 0xfbbf24 : 0xf87171,
        emissiveIntensity: 0.2
      })
      const windowMesh = new THREE.Mesh(windowGeo, windowMat)
      windowMesh.position.set(roomX, y, baseD / 2 + 0.06)
      group.add(windowMesh)

      const frameH = new THREE.Mesh(
        new THREE.BoxGeometry(rw * 0.6, 0.08, 0.12),
        windowFrameMat
      )
      frameH.position.set(roomX, y, baseD / 2 + 0.05)
      group.add(frameH)

      const frameV = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, floorH * 0.45, 0.12),
        windowFrameMat
      )
      frameV.position.set(roomX, y, baseD / 2 + 0.05)
      group.add(frameV)

      const roomMesh = new THREE.Mesh(
        new THREE.BoxGeometry(rw * 0.7, floorH * 0.7, baseD * 0.7),
        getMaterialByStatus(room.status)
      )
      roomMesh.position.set(roomX, y, 0)
      roomMesh.castShadow = true
      roomMesh.receiveShadow = true
      roomMesh.userData = { roomId: room.id, roomName: room.name, buildingName: bld.name, type: room.type }
      roomMeshes.set(room.id, roomMesh)
      group.add(roomMesh)
    })
  }

  const ringGeo = new THREE.TorusGeometry(2, 0.15, 16, 32)
  const ringMat = new THREE.MeshStandardMaterial({
    color: '#fbbf24',
    roughness: 0.2,
    metalness: 0.7,
    emissive: '#fbbf24',
    emissiveIntensity: 0.3
  })
  
  const ring1 = new THREE.Mesh(ringGeo, ringMat)
  ring1.position.set(0, floorCount * floorH + 2, 0)
  ring1.rotation.x = Math.PI / 2.5
  group.add(ring1)

  const ring2 = new THREE.Mesh(ringGeo, ringMat)
  ring2.position.set(0, floorCount * floorH + 2.8, 0)
  ring2.rotation.x = Math.PI / 2.5
  ring2.scale.set(0.8, 0.8, 0.8)
  group.add(ring2)

  const ring3 = new THREE.Mesh(ringGeo, ringMat)
  ring3.position.set(0, floorCount * floorH + 3.6, 0)
  ring3.rotation.x = Math.PI / 2.5
  ring3.scale.set(0.6, 0.6, 0.6)
  group.add(ring3)

  addBuildingLabel(group, bld.name, floorCount * floorH + 4.5)
}

function buildComplexBuilding(group: THREE.Group, bld: typeof store.buildings[0]) {
  const floorCount = bld.floors.length
  const bWidth = 8
  const bDepth = 5
  const floorH = 4

  const mainBodyGeo = new THREE.BoxGeometry(bWidth, floorCount * floorH, bDepth)
  const mainBodyMat = new THREE.MeshStandardMaterial({
    color: 0xdb2777,
    roughness: 0.5,
    metalness: 0.3,
    transparent: true,
    opacity: 0.95
  })
  const mainBody = new THREE.Mesh(mainBodyGeo, mainBodyMat)
  mainBody.position.set(0, floorCount * floorH / 2, 0)
  mainBody.castShadow = true
  mainBody.receiveShadow = true
  group.add(mainBody)

  const windowFrameMat = new THREE.MeshStandardMaterial({
    color: 0x831843,
    roughness: 0.3,
    metalness: 0.5
  })

  for (let f = 0; f < floorCount; f++) {
    const y = f * floorH + floorH / 2
    const floor = bld.floors[f]
    const roomCount = floor.rooms.length
    const rw = bWidth / roomCount

    addFloorLabel(group, f + 1, y, bDepth / 2 + 0.08, 0)
    addFloorLabel(group, f + 1, y, -bDepth / 2 - 0.08, Math.PI)

    floor.rooms.forEach((room, rIdx) => {
      const roomX = -bWidth / 2 + rw * (rIdx + 0.5)

      const windowGeo = new THREE.BoxGeometry(rw * 0.6, floorH * 0.45, 0.1)
      const windowMat = new THREE.MeshStandardMaterial({
        color: room.status === 'free' ? 0x87ceeb : room.status === 'busy' ? 0xffd700 : 0xff6b6b,
        roughness: 0.2,
        metalness: 0.1,
        transparent: true,
        opacity: 0.85,
        emissive: room.status === 'free' ? 0x22d3ee : room.status === 'busy' ? 0xfbbf24 : 0xf87171,
        emissiveIntensity: 0.2
      })
      const windowMesh = new THREE.Mesh(windowGeo, windowMat)
      windowMesh.position.set(roomX, y, bDepth / 2 + 0.06)
      group.add(windowMesh)

      const frameH = new THREE.Mesh(
        new THREE.BoxGeometry(rw * 0.6, 0.08, 0.12),
        windowFrameMat
      )
      frameH.position.set(roomX, y, bDepth / 2 + 0.05)
      group.add(frameH)

      const frameV = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, floorH * 0.45, 0.12),
        windowFrameMat
      )
      frameV.position.set(roomX, y, bDepth / 2 + 0.05)
      group.add(frameV)

      const roomMesh = new THREE.Mesh(
        new THREE.BoxGeometry(rw * 0.7, floorH * 0.7, bDepth * 0.7),
        getMaterialByStatus(room.status)
      )
      roomMesh.position.set(roomX, y, 0)
      roomMesh.castShadow = true
      roomMesh.receiveShadow = true
      roomMesh.userData = { roomId: room.id, roomName: room.name, buildingName: bld.name, type: room.type }
      roomMeshes.set(room.id, roomMesh)
      group.add(roomMesh)
    })
  }

  const roofGeo = new THREE.ConeGeometry(bWidth / 2 + 0.5, 1.8, 4)
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x831843,
    roughness: 0.4,
    metalness: 0.2
  })
  const roof = new THREE.Mesh(roofGeo, roofMat)
  roof.position.set(0, floorCount * floorH + 0.9, 0)
  roof.castShadow = true
  group.add(roof)

  addBuildingLabel(group, bld.name, floorCount * floorH + 2)
}

function getMaterialByStatus(status: string): THREE.MeshStandardMaterial {
  switch (status) {
    case 'free': return freeMaterial
    case 'busy': return busyMaterial
    case 'repair': return repairMaterial
    default: return busyMaterial
  }
}

function addFloorLabel(group: THREE.Group, floorNum: number, y: number, z: number, rotationY: number) {
  const floorCanvas = document.createElement('canvas')
  floorCanvas.width = 64
  floorCanvas.height = 64
  const ctx = floorCanvas.getContext('2d')!
  ctx.fillStyle = 'rgba(0,0,0,0)'
  ctx.fillRect(0, 0, 64, 64)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 32px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(floorNum.toString(), 32, 32)
  const tex = new THREE.CanvasTexture(floorCanvas)
  const labelMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true })
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), labelMat)
  label.position.set(0, y, z)
  label.rotation.y = rotationY
  group.add(label)
}

function addBuildingLabel(group: THREE.Group, name: string, height: number) {
  const labelCanvas = document.createElement('canvas')
  labelCanvas.width = 512
  labelCanvas.height = 128
  const ctx = labelCanvas.getContext('2d')!
  
  ctx.fillStyle = 'rgba(0,0,0,0)'
  ctx.fillRect(0, 0, 512, 128)
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.beginPath()
  ctx.roundRect(20, 20, 472, 88, 10)
  ctx.fill()
  
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 56px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(name, 256, 64)
  
  const tex = new THREE.CanvasTexture(labelCanvas)
  const labelMat = new THREE.MeshStandardMaterial({ 
    map: tex, 
    transparent: true,
    emissive: 0xffffff,
    emissiveIntensity: 0.1
  })
  const label = new THREE.Mesh(new THREE.PlaneGeometry(8, 2), labelMat)
  label.position.set(0, height + 2, 0)
  label.rotation.x = -Math.PI / 2
  label.castShadow = true
  group.add(label)
}

function addRoad(x: number, y: number, z: number, w: number, d: number, _r: number) {
  const geo = new THREE.PlaneGeometry(w, d)
  const mat = new THREE.MeshStandardMaterial({ 
    color: 0x1f3654, 
    roughness: 0.95,
    metalness: 0.1
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.set(x, y, z)
  mesh.receiveShadow = true
  scene.add(mesh)
}

function addTree(x: number, z: number) {
  const trunkGeo = new THREE.CylinderGeometry(0.12, 0.18, 2, 8)
  const trunkMat = new THREE.MeshStandardMaterial({ 
    color: 0x5c4033, 
    roughness: 0.7,
    metalness: 0.05
  })
  const trunk = new THREE.Mesh(trunkGeo, trunkMat)
  trunk.position.set(x, 1, z)
  trunk.castShadow = true
  scene.add(trunk)

  for (let i = 0; i < 4; i++) {
    const crownGeo = new THREE.SphereGeometry(0.7 - i * 0.12, 12, 10)
    const crownMat = new THREE.MeshStandardMaterial({ 
      color: i === 0 ? 0x1e4d36 : i === 1 ? 0x2d6a4f : i === 2 ? 0x40916c : 0x52b788, 
      roughness: 0.5,
      metalness: 0.02
    })
    const crown = new THREE.Mesh(crownGeo, crownMat)
    crown.position.set(x + (Math.random() - 0.5) * 0.15, 2.5 + i * 0.45, z + (Math.random() - 0.5) * 0.15)
    crown.castShadow = true
    scene.add(crown)
  }
}

function addPineTree(x: number, z: number) {
  const trunkGeo = new THREE.CylinderGeometry(0.08, 0.12, 1.2, 6)
  const trunkMat = new THREE.MeshStandardMaterial({ 
    color: 0x4a3728, 
    roughness: 0.7,
    metalness: 0.05
  })
  const trunk = new THREE.Mesh(trunkGeo, trunkMat)
  trunk.position.set(x, 0.6, z)
  trunk.castShadow = true
  scene.add(trunk)

  for (let i = 0; i < 5; i++) {
    const coneGeo = new THREE.ConeGeometry(0.8 - i * 0.15, 1, 8)
    const coneMat = new THREE.MeshStandardMaterial({ 
      color: i === 0 ? 0x166534 : i === 1 ? 0x15803d : i === 2 ? 0x16a34a : i === 3 ? 0x22c55e : 0x4ade80, 
      roughness: 0.4,
      metalness: 0.02
    })
    const cone = new THREE.Mesh(coneGeo, coneMat)
    cone.position.set(x, 1.2 + i * 0.75, z)
    cone.castShadow = true
    scene.add(cone)
  }
}

function addBush(x: number, z: number) {
  const bushGeo = new THREE.SphereGeometry(0.5, 12, 10)
  const bushMat = new THREE.MeshStandardMaterial({ 
    color: 0x2d6a4f, 
    roughness: 0.6,
    metalness: 0.02
  })
  const bush = new THREE.Mesh(bushGeo, bushMat)
  bush.position.set(x, 0.5, z)
  bush.castShadow = true
  scene.add(bush)

  const bushGeo2 = new THREE.SphereGeometry(0.4, 10, 8)
  const bush2 = new THREE.Mesh(bushGeo2, bushMat)
  bush2.position.set(x + 0.3, 0.4, z + 0.2)
  bush2.castShadow = true
  scene.add(bush2)
}

function addCloud(x: number, y: number, z: number, scale: number) {
  const cloudGroup = new THREE.Group()
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.1,
    metalness: 0,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide
  })

  const blobCount = 5 + Math.floor(Math.random() * 3)
  for (let i = 0; i < blobCount; i++) {
    const blobGeo = new THREE.SphereGeometry(0.8 + Math.random() * 0.6, 16, 12)
    const blob = new THREE.Mesh(blobGeo, cloudMat)
    blob.position.set(
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.3) * 1,
      (Math.random() - 0.5) * 2
    )
    cloudGroup.add(blob)
  }

  cloudGroup.position.set(x, y, z)
  cloudGroup.scale.setScalar(scale)
  cloudGroup.userData = {
    baseX: x,
    speed: 0.0003 + Math.random() * 0.0004
  }
  clouds.push(cloudGroup)
  scene.add(cloudGroup)
}

function initClouds() {
  addCloud(-25, 28, -15, 1.2)
  addCloud(10, 32, -20, 1.5)
  addCloud(-15, 35, 10, 1.0)
  addCloud(25, 30, 5, 1.3)
  addCloud(0, 38, -5, 0.9)
}

function updateClouds() {
  clouds.forEach(cloud => {
    cloud.position.x += cloud.userData.speed
    if (cloud.position.x > 40) {
      cloud.position.x = -40
    }
    cloud.position.y = cloud.userData.baseY || 30 + Math.sin(Date.now() * 0.0005 + cloud.position.x) * 2
  })
}

function addLamppost(x: number, z: number) {
  const poleGeo = new THREE.CylinderGeometry(0.06, 0.08, 4, 8)
  const poleMat = new THREE.MeshStandardMaterial({ 
    color: 0x374151, 
    roughness: 0.4, 
    metalness: 0.7 
  })
  const pole = new THREE.Mesh(poleGeo, poleMat)
  pole.position.set(x, 2, z)
  pole.castShadow = true
  scene.add(pole)

  const armGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.5, 6)
  const arm = new THREE.Mesh(armGeo, poleMat)
  arm.position.set(x + 0.75, 3.5, z)
  arm.rotation.z = -Math.PI / 6
  arm.castShadow = true
  scene.add(arm)

  const lampHeadGeo = new THREE.CylinderGeometry(0.25, 0.15, 0.4, 8)
  const lampHeadMat = new THREE.MeshStandardMaterial({ 
    color: 0x1f2937, 
    roughness: 0.2, 
    metalness: 0.8 
  })
  const lampHead = new THREE.Mesh(lampHeadGeo, lampHeadMat)
  lampHead.position.set(x + 1.5, 3.1, z)
  lampHead.castShadow = true
  scene.add(lampHead)

  const innerLightGeo = new THREE.SphereGeometry(0.18, 16, 12)
  const innerLightMat = new THREE.MeshBasicMaterial({ 
    color: 0xfef3c7, 
    transparent: true, 
    opacity: 0.3 
  })
  const innerLight = new THREE.Mesh(innerLightGeo, innerLightMat)
  innerLight.position.set(x + 1.5, 3.1, z + 0.15)
  innerLight.userData = { isNightLight: true }
  scene.add(innerLight)

  const glowGeo = new THREE.SphereGeometry(0.8, 16, 12)
  const glowMat = new THREE.MeshBasicMaterial({ 
    color: 0xfbbf24, 
    transparent: true, 
    opacity: 0 
  })
  const glow = new THREE.Mesh(glowGeo, glowMat)
  glow.position.set(x + 1.5, 3.1, z)
  lamppostGlows.push(glow)
  scene.add(glow)

  const pointLight = new THREE.PointLight(0xfef3c7, 0, 20)
  pointLight.position.set(x + 1.5, 3.1, z)
  pointLight.castShadow = true
  lamppostLights.push(pointLight)
  scene.add(pointLight)
}

function buildParticles() {
  const starsGeo = new THREE.BufferGeometry()
  const starsVertices: number[] = []
  
  for (let i = 0; i < 100; i++) {
    starsVertices.push(
      (Math.random() - 0.5) * 150,
      Math.random() * 100 + 20,
      (Math.random() - 0.5) * 150
    )
  }
  
  starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3))
  
  const starsMat = new THREE.PointsMaterial({
    size: 0.4,
    color: 0x87ceeb,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: false
  })
  
  const stars = new THREE.Points(starsGeo, starsMat)
  scene.add(stars)
  stars.visible = false
  particleSystems.push(stars)

  const floatingGeo = new THREE.BufferGeometry()
  const floatingVertices: number[] = []
  
  for (let i = 0; i < 20; i++) {
    floatingVertices.push(
      (Math.random() - 0.5) * 60,
      Math.random() * 15 + 2,
      (Math.random() - 0.5) * 60
    )
  }
  
  floatingGeo.setAttribute('position', new THREE.Float32BufferAttribute(floatingVertices, 3))
  
  const floatingMat = new THREE.PointsMaterial({
    size: 0.6,
    color: 0x2596eb,
    transparent: true,
    opacity: 0.5,
    sizeAttenuation: false
  })
  
  const floating = new THREE.Points(floatingGeo, floatingMat)
  scene.add(floating)
  particleSystems.push(floating)

  buildHeatmapParticles()
  initFireflies()
}

function initFireflies() {
  const fireflyGeo = new THREE.SphereGeometry(0.05, 8, 8)
  
  for (let i = 0; i < 25; i++) {
    const fireflyMat = new THREE.MeshBasicMaterial({
      color: 0xa7f3d0,
      transparent: true,
      opacity: 0
    })
    const firefly = new THREE.Mesh(fireflyGeo, fireflyMat)
    firefly.position.set(
      (Math.random() - 0.5) * 50,
      Math.random() * 5 + 0.5,
      (Math.random() - 0.5) * 50
    )
    firefly.userData = {
      baseX: firefly.position.x,
      baseY: firefly.position.y,
      baseZ: firefly.position.z,
      speedX: (Math.random() - 0.5) * 0.02,
      speedY: (Math.random() - 0.5) * 0.015,
      speedZ: (Math.random() - 0.5) * 0.02,
      glowPhase: Math.random() * Math.PI * 2,
      glowSpeed: 1.5 + Math.random() * 1.5
    }
    fireflies.push(firefly)
    scene.add(firefly)
  }
}

function updateFireflies() {
  fireflies.forEach(firefly => {
    firefly.position.x += firefly.userData.speedX
    firefly.position.y += firefly.userData.speedY
    firefly.position.z += firefly.userData.speedZ
    
    if (firefly.position.x < -25) firefly.position.x = 25
    if (firefly.position.x > 25) firefly.position.x = -25
    if (firefly.position.z < -25) firefly.position.z = 25
    if (firefly.position.z > 25) firefly.position.z = -25
    if (firefly.position.y < 0.5) firefly.position.y = 0.5
    if (firefly.position.y > 6) firefly.position.y = 6
    
    const time = Date.now() * 0.001
    const mat = firefly.material as THREE.MeshBasicMaterial
    
    if (isNightMode.value) {
      const glow = 0.3 + 0.7 * Math.sin(time * firefly.userData.glowSpeed + firefly.userData.glowPhase)
      mat.opacity = glow
      firefly.scale.setScalar(0.8 + glow * 0.4)
    } else {
      mat.opacity = 0
      firefly.scale.setScalar(1)
    }
  })
}

function buildHeatmapParticles() {
  const heatmapGeo = new THREE.BufferGeometry()
  const heatmapVertices: number[] = []
  const heatmapColors: number[] = []
  
  store.buildings.forEach(bld => {
    const bx = bld.position[0]
    const bz = bld.position[1]
    
    bld.floors.forEach(floor => {
      floor.rooms.forEach(room => {
        for (let i = 0; i < 3; i++) {
          const offsetX = (Math.random() - 0.5) * 2
          const offsetZ = (Math.random() - 0.5) * 2
          const y = Math.random() * 8 + 0.5
          
          heatmapVertices.push(bx + offsetX, y, bz + offsetZ)
          
          if (room.status === 'busy') {
            heatmapColors.push(0.95, 0.6, 0.3)
          } else if (room.status === 'repair') {
            heatmapColors.push(0.98, 0.4, 0.4)
          } else {
            heatmapColors.push(0.5, 0.8, 0.6)
          }
        }
      })
    })
  })
  
  heatmapGeo.setAttribute('position', new THREE.Float32BufferAttribute(heatmapVertices, 3))
  heatmapGeo.setAttribute('color', new THREE.Float32BufferAttribute(heatmapColors, 3))
  
  const heatmapMat = new THREE.PointsMaterial({
    size: 0.8,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
  
  const heatmap = new THREE.Points(heatmapGeo, heatmapMat)
  scene.add(heatmap)
  heatmap.visible = false
  particleSystems.push(heatmap)
}

function onClick(event: MouseEvent) {
  if (!container.value) return
  const rect = container.value.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)
  const meshes = Array.from(roomMeshes.values())
  const hits = raycaster.intersectObjects(meshes)

  if (hits.length > 0) {
    const hit = hits[0].object as THREE.Mesh
    const { roomId } = hit.userData
    const room = store.findRoomById(roomId)
    if (room) {
      store.selectedRoom = room
      store.setHighlight([roomId], '#2596eb')
    }
  } else {
    store.selectedRoom = null
    store.clearHighlight()
  }
}

function onResize() {
  if (!container.value) return
  camera.aspect = container.value.clientWidth / container.value.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
}

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
  onResize()
}

function toggleHeatmap() {
  isHeatmapEnabled.value = !isHeatmapEnabled.value
  if (particleSystems[2]) {
    particleSystems[2].visible = isHeatmapEnabled.value
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    container.value?.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

function toggleDayNight() {
  isNightMode.value = !isNightMode.value
  
  if (isNightMode.value) {
    scene.background = new THREE.Color(0x0a1628)
    scene.fog = new THREE.FogExp2(0x0a1628, 0.01)
    ambientLight.color.setHex(0x6b8fc7)
    ambientLight.intensity = 0.4
    dirLight.color.setHex(0xa8c5e6)
    dirLight.intensity = 1.2
    ;(groundMesh.material as THREE.MeshStandardMaterial).color.setHex(0x0f1f35)
    
    if (particleSystems[0]) particleSystems[0].visible = true
    
    lamppostLights.forEach(light => light.intensity = 1.5)
    lamppostGlows.forEach(glow => {
      const mat = glow.material as THREE.MeshBasicMaterial
      mat.opacity = 0.25
    })
    
    scene.traverse(obj => {
      if (obj instanceof THREE.PointLight && obj.userData.isRoomLight) {
        obj.intensity = 0.8
      }
      if (obj instanceof THREE.Mesh && obj.userData.isWindow) {
        const mat = obj.material as THREE.MeshStandardMaterial
        mat.emissiveIntensity = obj.userData.baseEmissiveIntensity * 2
      }
    })
  } else {
    scene.background = new THREE.Color(0x87ceeb)
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.008)
    ambientLight.color.setHex(0xffffff)
    ambientLight.intensity = 0.6
    dirLight.color.setHex(0xffffff)
    dirLight.intensity = 1.8
    ;(groundMesh.material as THREE.MeshStandardMaterial).color.setHex(0x4a7c59)
    
    if (particleSystems[0]) particleSystems[0].visible = false
    
    lamppostLights.forEach(light => light.intensity = 0)
    lamppostGlows.forEach(glow => {
      const mat = glow.material as THREE.MeshBasicMaterial
      mat.opacity = 0
    })
    
    scene.traverse(obj => {
      if (obj instanceof THREE.PointLight && obj.userData.isRoomLight) {
        obj.intensity = 0
      }
      if (obj instanceof THREE.Mesh && obj.userData.isWindow) {
        const mat = obj.material as THREE.MeshStandardMaterial
        mat.emissiveIntensity = obj.userData.baseEmissiveIntensity
      }
    })
  }
}

function drawNavigationRoute(route: { start: [number, number], end: [number, number], waypoints: [number, number][] }) {
  clearNavigationRoute()
  
  const allPoints = [route.start, ...route.waypoints.slice(0, -1), route.end]
  
  const linePoints: THREE.Vector3[] = []
  allPoints.forEach((p, i) => {
    linePoints.push(new THREE.Vector3(p[0], 0.03, p[1]))
    if (i < allPoints.length - 1) {
      const next = allPoints[i + 1]
      const steps = 8
      for (let s = 1; s < steps; s++) {
        const t = s / steps
        linePoints.push(new THREE.Vector3(
          p[0] + (next[0] - p[0]) * t,
          0.03,
          p[1] + (next[1] - p[1]) * t
        ))
      }
    }
  })
  
  const baseLineGeo = new THREE.BufferGeometry().setFromPoints(linePoints)
  const baseLineMat = new THREE.LineBasicMaterial({ 
    color: 0xffffff, 
    linewidth: 6,
    transparent: true,
    opacity: 0.6
  })
  const baseLine = new THREE.Line(baseLineGeo, baseLineMat)
  scene.add(baseLine)
  navigationArrows.push(baseLine)
  
  const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints)
  const lineMat = new THREE.LineBasicMaterial({ 
    color: 0x06b6d4, 
    linewidth: 4,
    transparent: true,
    opacity: 1
  })
  navigationLine = new THREE.Line(lineGeo, lineMat)
  scene.add(navigationLine)
  
  const glowLineGeo = new THREE.BufferGeometry().setFromPoints(linePoints)
  const glowLineMat = new THREE.LineBasicMaterial({ 
    color: 0x22d3ee, 
    linewidth: 8,
    transparent: true,
    opacity: 0.3
  })
  const glowLine = new THREE.Line(glowLineGeo, glowLineMat)
  scene.add(glowLine)
  navigationArrows.push(glowLine)
  
  for (let i = 0; i < linePoints.length - 1; i++) {
    const p1 = linePoints[i]
    const p2 = linePoints[i + 1]
    const dist = p1.distanceTo(p2)
    if (dist > 0.8) {
      const particleGeo = new THREE.SphereGeometry(0.15, 8, 8)
      const particleMat = new THREE.MeshStandardMaterial({
        color: 0x67e8f9,
        emissive: 0x22d3ee,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.9
      })
      const particle = new THREE.Mesh(particleGeo, particleMat)
      particle.position.set(p1.x, 0.2, p1.z)
      particle.userData = { 
        type: 'routeParticle',
        start: p1,
        end: p2,
        progress: 0,
        speed: 0.008 + Math.random() * 0.004
      }
      scene.add(particle)
      navigationArrows.push(particle)
    }
  }
  
  for (let i = 0; i < allPoints.length - 1; i++) {
    const p = allPoints[i]
    const next = allPoints[i + 1]
    
    const midX = (p[0] + next[0]) / 2
    const midZ = (p[1] + next[1]) / 2
    
    addArrow(midX, midZ, Math.atan2(next[0] - p[0], next[1] - p[1]))
    
    if (i > 0) {
      addTurnArrow(p[0], p[1], allPoints[i - 1], p, next)
    }
  }
  
  addStartMarker(route.start[0], route.start[1])
  addEndMarker(route.end[0], route.end[1])
}

function addArrow(x: number, z: number, rotationY: number) {
  const arrowGeo = new THREE.ConeGeometry(0.4, 0.8, 16)
  const arrowMat = new THREE.MeshStandardMaterial({ 
    color: 0x06b6d4,
    emissive: 0x22d3ee,
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 1
  })
  const arrow = new THREE.Mesh(arrowGeo, arrowMat)
  arrow.position.set(x, 0.4, z)
  arrow.rotation.x = Math.PI / 2
  arrow.rotation.y = -rotationY
  arrow.castShadow = true
  scene.add(arrow)
  navigationArrows.push(arrow)
  
  const arrowBaseGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.2, 8)
  const arrowBaseMat = new THREE.MeshStandardMaterial({ 
    color: 0x0891b2,
    emissive: 0x06b6d4,
    emissiveIntensity: 0.5
  })
  const arrowBase = new THREE.Mesh(arrowBaseGeo, arrowBaseMat)
  arrowBase.position.set(x, 0.15, z)
  arrowBase.rotation.x = Math.PI / 2
  scene.add(arrowBase)
  navigationArrows.push(arrowBase)
  
  const glowGeo = new THREE.SphereGeometry(0.6, 16, 16)
  const glowMat = new THREE.MeshBasicMaterial({ 
    color: 0x22d3ee, 
    transparent: true, 
    opacity: 0.3 
  })
  const glow = new THREE.Mesh(glowGeo, glowMat)
  glow.position.set(x, 0.4, z)
  glow.userData = { type: 'arrowGlow', baseOpacity: 0.3 }
  scene.add(glow)
  navigationArrows.push(glow)
}

function addTurnArrow(x: number, z: number, prev: [number, number], curr: [number, number], next: [number, number]) {
  const angle1 = Math.atan2(curr[0] - prev[0], curr[1] - prev[1])
  const angle2 = Math.atan2(next[0] - curr[0], next[1] - curr[1])
  let turnAngle = angle2 - angle1
  if (turnAngle > Math.PI) turnAngle -= Math.PI * 2
  if (turnAngle < -Math.PI) turnAngle += Math.PI * 2
  
  if (Math.abs(turnAngle) > 0.3) {
    const turnArrowGeo = new THREE.ConeGeometry(0.25, 0.5, 8)
    const turnArrowMat = new THREE.MeshStandardMaterial({ 
      color: turnAngle > 0 ? 0xfbbf24 : 0xf87171,
      emissive: turnAngle > 0 ? 0xfbbf24 : 0xf87171,
      emissiveIntensity: 0.3
    })
    const turnArrow = new THREE.Mesh(turnArrowGeo, turnArrowMat)
    turnArrow.position.set(x, 0.25, z)
    turnArrow.rotation.x = Math.PI / 2
    turnArrow.rotation.y = -angle2 + (turnAngle > 0 ? -Math.PI / 4 : Math.PI / 4)
    scene.add(turnArrow)
    navigationArrows.push(turnArrow)
  }
}

function addStartMarker(x: number, z: number) {
  const outerRingGeo = new THREE.RingGeometry(0.5, 0.8, 32)
  const outerRingMat = new THREE.MeshBasicMaterial({ 
    color: 0xffffff, 
    transparent: true, 
    opacity: 0.5,
    side: THREE.DoubleSide
  })
  const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat)
  outerRing.rotation.x = -Math.PI / 2
  outerRing.position.set(x, 0.02, z)
  scene.add(outerRing)
  navigationArrows.push(outerRing)
  
  const ringGeo = new THREE.RingGeometry(0.3, 0.5, 32)
  const ringMat = new THREE.MeshStandardMaterial({ 
    color: 0x34d399, 
    transparent: true, 
    opacity: 0.9,
    side: THREE.DoubleSide,
    emissive: 0x10b981,
    emissiveIntensity: 0.5
  })
  const ring = new THREE.Mesh(ringGeo, ringMat)
  ring.rotation.x = -Math.PI / 2
  ring.position.set(x, 0.02, z)
  scene.add(ring)
  navigationArrows.push(ring)
  
  const dotGeo = new THREE.SphereGeometry(0.15, 16, 16)
  const dotMat = new THREE.MeshStandardMaterial({ 
    color: 0x34d399,
    emissive: 0x10b981,
    emissiveIntensity: 1
  })
  const dot = new THREE.Mesh(dotGeo, dotMat)
  dot.position.set(x, 0.1, z)
  scene.add(dot)
  navigationArrows.push(dot)
  
  const glowGeo = new THREE.SphereGeometry(0.7, 16, 16)
  const glowMat = new THREE.MeshBasicMaterial({ 
    color: 0x34d399, 
    transparent: true, 
    opacity: 0.2 
  })
  const glow = new THREE.Mesh(glowGeo, glowMat)
  glow.position.set(x, 0.1, z)
  glow.userData = { type: 'markerGlow', baseOpacity: 0.2 }
  scene.add(glow)
  navigationArrows.push(glow)
  
  const textCanvas = document.createElement('canvas')
  textCanvas.width = 128
  textCanvas.height = 64
  const ctx = textCanvas.getContext('2d')!
  ctx.fillStyle = 'rgba(0,0,0,0)'
  ctx.fillRect(0, 0, 128, 64)
  ctx.fillStyle = '#34d399'
  ctx.font = 'bold 24px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('起点', 64, 32)
  const tex = new THREE.CanvasTexture(textCanvas)
  const textMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true })
  const text = new THREE.Mesh(new THREE.PlaneGeometry(2, 1), textMat)
  text.position.set(x, 1.5, z)
  text.rotation.x = -Math.PI / 4
  scene.add(text)
  navigationArrows.push(text)
}

function addEndMarker(x: number, z: number) {
  const outerRingGeo = new THREE.RingGeometry(0.5, 0.8, 32)
  const outerRingMat = new THREE.MeshBasicMaterial({ 
    color: 0xffffff, 
    transparent: true, 
    opacity: 0.5,
    side: THREE.DoubleSide
  })
  const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat)
  outerRing.rotation.x = -Math.PI / 2
  outerRing.position.set(x, 0.02, z)
  scene.add(outerRing)
  navigationArrows.push(outerRing)
  
  const ringGeo = new THREE.RingGeometry(0.3, 0.5, 32)
  const ringMat = new THREE.MeshStandardMaterial({ 
    color: 0xfbbf24, 
    transparent: true, 
    opacity: 0.9,
    side: THREE.DoubleSide,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.5
  })
  const ring = new THREE.Mesh(ringGeo, ringMat)
  ring.rotation.x = -Math.PI / 2
  ring.position.set(x, 0.02, z)
  scene.add(ring)
  navigationArrows.push(ring)
  
  const pyramidGeo = new THREE.ConeGeometry(0.25, 0.5, 4)
  const pyramidMat = new THREE.MeshStandardMaterial({ 
    color: 0xfbbf24,
    emissive: 0xf59e0b,
    emissiveIntensity: 1
  })
  const pyramid = new THREE.Mesh(pyramidGeo, pyramidMat)
  pyramid.position.set(x, 0.3, z)
  pyramid.rotation.y = Math.PI / 4
  scene.add(pyramid)
  navigationArrows.push(pyramid)
  
  const glowGeo = new THREE.SphereGeometry(0.7, 16, 16)
  const glowMat = new THREE.MeshBasicMaterial({ 
    color: 0xfbbf24, 
    transparent: true, 
    opacity: 0.2 
  })
  const glow = new THREE.Mesh(glowGeo, glowMat)
  glow.position.set(x, 0.3, z)
  glow.userData = { type: 'markerGlow', baseOpacity: 0.2 }
  scene.add(glow)
  navigationArrows.push(glow)
  
  const textCanvas = document.createElement('canvas')
  textCanvas.width = 128
  textCanvas.height = 64
  const ctx = textCanvas.getContext('2d')!
  ctx.fillStyle = 'rgba(0,0,0,0)'
  ctx.fillRect(0, 0, 128, 64)
  ctx.fillStyle = '#fbbf24'
  ctx.font = 'bold 24px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('终点', 64, 32)
  const tex = new THREE.CanvasTexture(textCanvas)
  const textMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true })
  const text = new THREE.Mesh(new THREE.PlaneGeometry(2, 1), textMat)
  text.position.set(x, 1.5, z)
  text.rotation.x = -Math.PI / 4
  scene.add(text)
  navigationArrows.push(text)
}

function clearNavigationRoute() {
  if (navigationLine) {
    scene.remove(navigationLine)
    navigationLine.geometry.dispose()
    ;(navigationLine.material as THREE.Material).dispose()
    navigationLine = null
  }
  
  navigationArrows.forEach(obj => {
    scene.remove(obj)
    if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
      obj.geometry.dispose()
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose())
      } else {
        obj.material.dispose()
      }
    }
  })
  navigationArrows = []
  
  if (navigationAgent) {
    scene.remove(navigationAgent)
    navigationAgent = null
  }
}

function startNavigationAnimation(route: { start: [number, number], end: [number, number], waypoints: [number, number][] }) {
  agentProgress = 0
  
  const bodyGeo = new THREE.BoxGeometry(0.4, 0.6, 0.4)
  const bodyMat = new THREE.MeshStandardMaterial({ 
    color: 0x2596eb,
    emissive: 0x2596eb,
    emissiveIntensity: 0.3
  })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.y = 0.5
  
  const headGeo = new THREE.SphereGeometry(0.18, 8, 8)
  const headMat = new THREE.MeshStandardMaterial({ color: 0xffe4c4 })
  const head = new THREE.Mesh(headGeo, headMat)
  head.position.y = 1.2
  
  navigationAgent = new THREE.Group()
  navigationAgent.position.set(route.start[0], 0, route.start[1])
  navigationAgent.add(body)
  navigationAgent.add(head)
  scene.add(navigationAgent)
}

function updateNavigationAgent(route: { start: [number, number], end: [number, number], waypoints: [number, number][] }, delta: number) {
  if (!navigationAgent) return
  
  const allPoints = [route.start, ...route.waypoints.slice(0, -1), route.end]
  
  let totalLength = 0
  const segments: { start: [number, number], end: [number, number], length: number }[] = []
  
  for (let i = 0; i < allPoints.length - 1; i++) {
    const dx = allPoints[i + 1][0] - allPoints[i][0]
    const dz = allPoints[i + 1][1] - allPoints[i][1]
    const length = Math.sqrt(dx * dx + dz * dz)
    totalLength += length
    segments.push({ start: allPoints[i], end: allPoints[i + 1], length })
  }
  
  agentProgress += delta * 0.003
  if (agentProgress >= 1) agentProgress = 0
  
  const targetDist = agentProgress * totalLength
  
  let currentDist = 0
  for (const seg of segments) {
    if (currentDist + seg.length >= targetDist) {
      const t = (targetDist - currentDist) / seg.length
      const x = seg.start[0] + (seg.end[0] - seg.start[0]) * t
      const z = seg.start[1] + (seg.end[1] - seg.start[1]) * t
      
      navigationAgent.position.set(x, 0.25, z)
      
      const angle = Math.atan2(seg.end[0] - seg.start[0], seg.end[1] - seg.start[1])
      navigationAgent.rotation.y = -angle
      
      const body = navigationAgent.children[0] as THREE.Mesh
      body.position.y = 0.5 + Math.sin(Date.now() * 0.01) * 0.05
      
      break
    }
    currentDist += seg.length
  }
}

function animate() {
  animId = requestAnimationFrame(animate)
  controls.update()
  
  if (store.navigationRoute && navigationAgent) {
    updateNavigationAgent(store.navigationRoute, 1)
  }
  
  updateClouds()
  updateFireflies()

  const time = Date.now() * 0.001
  
  if (isNightMode.value) {
    scene.traverse(obj => {
      if (obj instanceof THREE.Mesh && obj.userData.isWindow && obj.userData.isNightWindow) {
        const mat = obj.material as THREE.MeshStandardMaterial
        const flicker = 0.9 + 0.1 * Math.sin(time * obj.userData.flickerSpeed + obj.userData.flickerPhase)
        mat.opacity = obj.userData.baseOpacity * flicker
        mat.emissiveIntensity = obj.userData.baseEmissiveIntensity * 2 * flicker
      }
    })
  }

  scene.children.forEach(child => {
    if (child instanceof THREE.Group && child.children.length > 0) {
      child.children.forEach(grandchild => {
        if (grandchild instanceof THREE.Mesh && grandchild.userData.ripplePhase !== undefined) {
          const mat = grandchild.material as THREE.MeshStandardMaterial
          mat.opacity = 0.2 + 0.25 * Math.sin(time * 3 + grandchild.userData.ripplePhase)
        }
      })
      
      child.children.forEach(grandchild => {
        if (grandchild instanceof THREE.Group) {
          const ud = grandchild.userData
          
          if (ud.type === 'duck' || ud.type === 'swan') {
            ud.angle += (Math.random() - 0.5) * 0.03
            if (ud.angle < 0) ud.angle += Math.PI * 2
            if (ud.angle > Math.PI * 2) ud.angle -= Math.PI * 2
            
            const dx = Math.cos(ud.angle) * ud.speed
            const dz = Math.sin(ud.angle) * ud.speed
            
            let newX = grandchild.position.x + dx
            let newZ = grandchild.position.z + dz
            
            if (newX < -7 || newX > 7) ud.angle = Math.PI - ud.angle
            if (newZ < -7 || newZ > 7) ud.angle = -ud.angle
            
            grandchild.position.x += Math.cos(ud.angle) * ud.speed
            grandchild.position.z += Math.sin(ud.angle) * ud.speed
            
            grandchild.rotation.y = ud.angle
            grandchild.position.y = 0.2 + Math.sin(time * 2 + ud.bobPhase) * 0.03
          } else if (ud.type === 'fish') {
            ud.angle += (Math.random() - 0.5) * 0.05
            if (ud.angle < 0) ud.angle += Math.PI * 2
            if (ud.angle > Math.PI * 2) ud.angle -= Math.PI * 2
            
            const dx = Math.cos(ud.angle) * ud.speed
            const dz = Math.sin(ud.angle) * ud.speed
            
            let newX = grandchild.position.x + dx
            let newZ = grandchild.position.z + dz
            
            if (newX < -7 || newX > 7) ud.angle = Math.PI - ud.angle
            if (newZ < -7 || newZ > 7) ud.angle = -ud.angle
            
            grandchild.position.x += Math.cos(ud.angle) * ud.speed
            grandchild.position.z += Math.sin(ud.angle) * ud.speed
            grandchild.position.y = ud.depth + Math.sin(time * 1.5 + ud.depthPhase) * 0.15
            
            grandchild.rotation.y = ud.angle + Math.PI / 2
          }
        }
      })
      
      child.children.forEach(grandchild => {
        if (grandchild instanceof THREE.Mesh && grandchild.userData.flowerPhase !== undefined) {
          grandchild.rotation.z = Math.sin(time * 1 + grandchild.userData.flowerPhase) * 0.1
        }
      })
      
      child.children.forEach(grandchild => {
        if (grandchild instanceof THREE.Mesh) {
          const ud = grandchild.userData
          if (ud.type === 'routeParticle') {
            ud.progress += ud.speed
            if (ud.progress >= 1) ud.progress = 0
            
            const start = ud.start as THREE.Vector3
            const end = ud.end as THREE.Vector3
            grandchild.position.x = start.x + (end.x - start.x) * ud.progress
            grandchild.position.z = start.z + (end.z - start.z) * ud.progress
            
            const mat = grandchild.material as THREE.MeshStandardMaterial
            mat.opacity = 0.5 + 0.4 * Math.sin(ud.progress * Math.PI)
          } else if (ud.type === 'arrowGlow') {
            const mat = grandchild.material as THREE.MeshBasicMaterial
            mat.opacity = ud.baseOpacity + 0.15 * Math.sin(time * 3)
            grandchild.scale.setScalar(1 + 0.1 * Math.sin(time * 3))
          } else if (ud.type === 'markerGlow') {
            const mat = grandchild.material as THREE.MeshBasicMaterial
            mat.opacity = ud.baseOpacity + 0.15 * Math.sin(time * 2)
            grandchild.scale.setScalar(1 + 0.15 * Math.sin(time * 2))
          }
        }
      })
    }
  })

  const bookingMat = myBookingMaterial as THREE.MeshStandardMaterial
    bookingMat.emissiveIntensity = 0.4 + 0.25 * Math.sin(time * 2)
    
    roomMeshes.forEach((mesh) => {
      if (mesh.userData.isMyBooking) {
        mesh.scale.setScalar(1 + 0.02 * Math.sin(time * 2))
      }
    })

  renderer.render(scene, camera)
}
</script>

<template>
  <main class="flex-1 relative overflow-hidden">
    <div ref="container" class="w-full h-full relative z-0"></div>
    
    <Transition name="fade">
      <div v-if="isLoading" class="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-500/90 via-blue-600/90 to-blue-700/90 backdrop-blur-sm">
        <div class="text-center">
          <div class="w-20 h-20 mx-auto mb-4 relative">
            <div class="absolute inset-0 border-4 border-white/30 rounded-full"></div>
            <div class="absolute inset-0 border-4 border-t-white rounded-full animate-spin"></div>
          </div>
          <h3 class="text-xl font-bold text-white mb-2">CampusTwin</h3>
          <p class="text-white/70 text-sm">正在加载校园数字孪生...</p>
        </div>
      </div>
    </Transition>
    
    <div class="absolute bottom-24 left-6 flex flex-col gap-3 z-[100]">
      <button
        @click="toggleDayNight"
        :class="[
          'px-6 py-3.5 rounded-xl text-base font-bold transition-all duration-300 border-2 flex items-center gap-3 shadow-xl',
          isNightMode ? 'bg-blue-600 text-white border-blue-400 hover:bg-blue-500' : 'bg-yellow-500 text-gray-900 border-yellow-400 hover:bg-yellow-400'
        ]">
        <span class="text-2xl">{{ isNightMode ? '☀️' : '🌙' }}</span>
        <span>{{ isNightMode ? '切换白天' : '切换黑夜' }}</span>
      </button>
      <button
        @click="toggleHeatmap"
        :class="[
          'px-6 py-3.5 rounded-xl text-base font-bold transition-all duration-300 border-2 flex items-center gap-3 shadow-xl',
          isHeatmapEnabled ? 'bg-red-600 text-white border-red-400 hover:bg-red-500' : 'bg-gray-700 text-white border-gray-500 hover:bg-gray-600'
        ]">
        <span class="text-2xl">🔥</span>
        <span>热力层</span>
      </button>
      <button
        @click="toggleFullscreen"
        class="px-6 py-3.5 rounded-xl text-base font-bold bg-gray-700 text-white border-2 border-gray-500 hover:bg-gray-600 transition-all duration-300 flex items-center gap-3 shadow-xl">
        <span class="text-2xl">⛶</span>
        <span>{{ isFullscreen ? '退出全屏' : '全屏' }}</span>
      </button>
    </div>
    
    <div class="absolute bottom-4 left-4 flex items-center gap-3 bg-dark-surface/80 backdrop-blur-md rounded-xl px-4 py-2.5 text-[11px] border border-dark-border">
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm" style="background:#34d399"></span> 空闲</span>
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm" style="background:#6b8fc7"></span> 占用</span>
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm" style="background:#f87171"></span> 报修</span>
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm" style="background:#2596eb"></span> 命中</span>
      <span class="text-dark-text4 ml-2">点击房间查看详情</span>
    </div>
    
    <div class="absolute top-4 right-4 space-y-3">
      <div class="bg-dark-surface/80 backdrop-blur-md rounded-xl px-4 py-3 text-[11px] text-dark-text2 space-y-1 border border-dark-border">
        <div class="flex items-center justify-between">
          <span class="text-dark-text3">教室/会议室</span>
          <strong class="text-dark-text">{{ store.totalRooms }}</strong>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-dark-text3">空闲</span>
          <strong class="text-dark-success">{{ store.freeRooms }}</strong>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-dark-text3">占用</span>
          <strong class="text-dark-text3">{{ store.busyRooms }}</strong>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-dark-text3">报修</span>
          <strong class="text-dark-error">{{ store.repairRooms }}</strong>
        </div>
      </div>
    </div>
    
    <div v-if="isHeatmapEnabled" class="absolute top-4 left-4 bg-dark-error/80 backdrop-blur-md rounded-xl px-4 py-2 text-[11px] text-white font-medium border border-dark-error/30">
      <svg class="w-3.5 h-3.5 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.364l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
      </svg>
      热力层已开启 - 显示人流密集区域
    </div>
  </main>
</template>

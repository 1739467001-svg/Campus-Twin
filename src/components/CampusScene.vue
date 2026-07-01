<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useCampusStore } from '../stores/campusStore'

const store = useCampusStore()
const container = ref<HTMLDivElement>()

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let animId: number
const roomMeshes: Map<string, THREE.Mesh> = new Map()
const buildingGroups: Map<string, THREE.Group> = new Map()
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

onMounted(() => {
  if (!container.value) return
  initScene()
  buildCampus()
  animate()
  container.value.addEventListener('click', onClick)
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animId)
  renderer?.dispose()
  container.value?.removeEventListener('click', onClick)
  window.removeEventListener('resize', onResize)
})

// 监听高亮变化
watch(() => store.highlightedRooms, (hl) => {
  // 先重置所有颜色
  roomMeshes.forEach((mesh, id) => {
    const room = store.findRoomById(id)
    if (room) {
      const mat = mesh.material as THREE.MeshStandardMaterial
      mat.color.set(getStatusColor(room.status))
      mat.emissive.set(0x000000)
    }
  })
  // 设置高亮
  if (hl.ids.length > 0) {
    hl.ids.forEach(id => {
      const mesh = roomMeshes.get(id)
      if (mesh) {
        const mat = mesh.material as THREE.MeshStandardMaterial
        mat.color.set(hl.color || '#3b82f6')
        mat.emissive.set(hl.color || '#3b82f6')
        mat.emissiveIntensity = 0.3
      }
    })
  }
}, { deep: true })

function initScene() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0f172a)
  scene.fog = new THREE.Fog(0x0f172a, 40, 80)

  camera = new THREE.PerspectiveCamera(50, container.value!.clientWidth / container.value!.clientHeight, 0.1, 200)
  camera.position.set(18, 16, 22)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value!.clientWidth, container.value!.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  container.value!.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.maxPolarAngle = Math.PI / 2.2
  controls.minDistance = 8
  controls.maxDistance = 50

  // 光照
  const ambient = new THREE.AmbientLight(0x94a3b8, 0.6)
  scene.add(ambient)

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2)
  dirLight.position.set(15, 20, 10)
  dirLight.castShadow = true
  dirLight.shadow.mapSize.set(2048, 2048)
  dirLight.shadow.camera.left = -25
  dirLight.shadow.camera.right = 25
  dirLight.shadow.camera.top = 25
  dirLight.shadow.camera.bottom = -25
  scene.add(dirLight)

  const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x362d1e, 0.3)
  scene.add(hemiLight)

  // 地面
  const groundGeo = new THREE.PlaneGeometry(60, 60)
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x1a2332, roughness: 0.9 })
  const ground = new THREE.Mesh(groundGeo, groundMat)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  // 网格
  const grid = new THREE.GridHelper(60, 30, 0x2a3a4a, 0x1e2d3d)
  grid.position.y = 0.01
  scene.add(grid)
}

function buildCampus() {
  store.buildings.forEach(bld => {
    const group = new THREE.Group()
    group.position.set(bld.position[0], 0, bld.position[1])
    buildingGroups.set(bld.id, group)

    const floorCount = bld.floors.length
    const bWidth = 4
    const bDepth = 3
    const floorH = 2

    bld.floors.forEach((floor) => {
      const y = (floor.level - 1) * floorH
      const roomCount = floor.rooms.length

      floor.rooms.forEach((room, rIdx) => {
        const rw = bWidth / roomCount
        const geo = new THREE.BoxGeometry(rw - 0.1, floorH - 0.1, bDepth - 0.1)
        const mat = new THREE.MeshStandardMaterial({
          color: getStatusColor(room.status),
          roughness: 0.6,
          metalness: 0.1,
        })
        const mesh = new THREE.Mesh(geo, mat)
        mesh.position.set(-bWidth / 2 + rw * (rIdx + 0.5), y + floorH / 2, 0)
        mesh.castShadow = true
        mesh.receiveShadow = true
        mesh.userData = { roomId: room.id, roomName: room.name, buildingName: bld.name, type: room.type }
        roomMeshes.set(room.id, mesh)
        group.add(mesh)
      })
    })

    // 楼顶名称标识
    const labelGeo = new THREE.PlaneGeometry(bWidth + 1, 1)
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 64
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = 'rgba(0,0,0,0)'
    ctx.fillRect(0, 0, 256, 64)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 32px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(bld.name, 128, 32)
    const tex = new THREE.CanvasTexture(canvas)
    const labelMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide })
    const label = new THREE.Mesh(labelGeo, labelMat)
    label.position.set(0, floorCount * floorH + 0.8, 0)
    label.rotation.x = -Math.PI / 4
    group.add(label)

    scene.add(group)
  })

  // 道路
  addRoad(0, 0.02, -1, 40, 1.5, 0)
  addRoad(-5, 0.02, -5, 1.5, 15, 0)
  addRoad(7, 0.02, -5, 1.5, 20, 0)

  // 绿化
  addTree(-12, -2)
  addTree(-11, -8)
  addTree(14, -2)
  addTree(13, -10)
  addTree(0, -10)
  addTree(5, 4)
  addTree(-4, 5)
  addTree(8, 5)
  addTree(-10, 3)
}

function addRoad(x: number, y: number, z: number, w: number, d: number, _r: number) {
  const geo = new THREE.PlaneGeometry(w, d)
  const mat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.95 })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.set(x, y, z)
  mesh.receiveShadow = true
  scene.add(mesh)
}

function addTree(x: number, z: number) {
  const trunkGeo = new THREE.CylinderGeometry(0.12, 0.18, 1.2, 6)
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b6914 })
  const trunk = new THREE.Mesh(trunkGeo, trunkMat)
  trunk.position.set(x, 0.6, z)
  trunk.castShadow = true
  scene.add(trunk)

  const crownGeo = new THREE.ConeGeometry(0.8, 2, 6)
  const crownMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.8 })
  const crown = new THREE.Mesh(crownGeo, crownMat)
  crown.position.set(x, 2.2, z)
  crown.castShadow = true
  scene.add(crown)
}

function getStatusColor(status: string): number {
  switch (status) {
    case 'free': return 0x22c55e
    case 'busy': return 0x9ca3af
    case 'repair': return 0xef4444
    default: return 0x64748b
  }
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
      store.setHighlight([roomId], '#3b82f6')
    }
  }
}

function onResize() {
  if (!container.value) return
  camera.aspect = container.value.clientWidth / container.value.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
}

function animate() {
  animId = requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}
</script>

<template>
  <main class="flex-1 relative overflow-hidden">
    <div ref="container" class="w-full h-full"></div>
    <!-- 图例 -->
    <div class="absolute bottom-3 left-3 flex items-center gap-3 bg-slate-900/80 backdrop-blur rounded-lg px-3 py-2 text-[11px]">
      <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm" style="background:#22c55e"></span> 空闲</span>
      <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm" style="background:#9ca3af"></span> 占用</span>
      <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm" style="background:#ef4444"></span> 报修</span>
      <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm" style="background:#3b82f6"></span> 命中</span>
      <span class="text-slate-500 ml-1">点击房间查看详情</span>
    </div>
    <!-- 统计数据 -->
    <div class="absolute top-3 right-3 bg-slate-900/80 backdrop-blur rounded-lg px-3 py-2 text-[11px] text-slate-300 space-y-0.5">
      <div>教室/会议室: <strong class="text-white">{{ store.totalRooms }}</strong> 间</div>
      <div>空闲: <strong class="text-green-400">{{ store.freeRooms }}</strong> | 占用: <strong class="text-gray-400">{{ store.busyRooms }}</strong> | 报修: <strong class="text-red-400">{{ store.repairRooms }}</strong></div>
    </div>
  </main>
</template>

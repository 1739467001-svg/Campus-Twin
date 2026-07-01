import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Building, Device, Booking, Ticket, Energy, Traffic, User, Room, PanelType, ChatMsg, DispatchStep } from '../types/campus'
import { parseIntent } from '../utils/intentParser'

// ============ Mock 数据 ============

const mockBuildings: Building[] = [
  {
    id: 'b1', name: '商大楼', position: [-8, -4], color: '#60a5fa',
    floors: [
      { id: 'b1f1', buildingId: 'b1', level: 1, rooms: [
        { id: 'r101', name: '101', type: 'meeting', floorId: 'b1f1', capacity: 20, equipment: ['projector','ac','mic'], status: 'busy', schedule: [{ start: '08:00', end: '10:00', by: '教务处' },{ start: '14:00', end: '16:00', by: '学生会' }] },
        { id: 'r102', name: '102', type: 'classroom', floorId: 'b1f1', capacity: 60, equipment: ['projector','ac'], status: 'free', schedule: [{ start: '10:00', end: '12:00', by: '线性代数' }] },
        { id: 'r103', name: '103', type: 'lab', floorId: 'b1f1', capacity: 30, equipment: ['projector','ac'], status: 'free', schedule: [] },
      ]},
      { id: 'b1f2', buildingId: 'b1', level: 2, rooms: [
        { id: 'r201', name: '201', type: 'meeting', floorId: 'b1f2', capacity: 12, equipment: ['projector','ac','mic'], status: 'free', schedule: [{ start: '09:00', end: '11:00', by: '院办会议' }] },
        { id: 'r202', name: '202', type: 'classroom', floorId: 'b1f2', capacity: 45, equipment: ['projector','ac'], status: 'busy', schedule: [{ start: '08:00', end: '10:00', by: '宏观经济学' },{ start: '14:00', end: '16:00', by: '统计学' }] },
        { id: 'r203', name: '203', type: 'venue', floorId: 'b1f2', capacity: 100, equipment: ['projector','ac','mic'], status: 'free', schedule: [] },
      ]},
      { id: 'b1f3', buildingId: 'b1', level: 3, rooms: [
        { id: 'r301', name: '301', type: 'classroom', floorId: 'b1f3', capacity: 40, equipment: ['projector','ac'], status: 'free', schedule: [{ start: '10:00', end: '12:00', by: '管理学原理' }] },
        { id: 'r302', name: '302', type: 'meeting', floorId: 'b1f3', capacity: 8, equipment: ['projector','ac'], status: 'repair', schedule: [] },
      ]},
    ]
  },
  {
    id: 'b2', name: '信息楼', position: [-2, -6], color: '#a78bfa',
    floors: [
      { id: 'b2f1', buildingId: 'b2', level: 1, rooms: [
        { id: 'r401', name: '101', type: 'lab', floorId: 'b2f1', capacity: 40, equipment: ['projector','ac'], status: 'busy', schedule: [{ start: '08:00', end: '12:00', by: '计算机网络实验' }] },
        { id: 'r402', name: '102', type: 'lab', floorId: 'b2f1', capacity: 35, equipment: ['projector','ac'], status: 'free', schedule: [{ start: '14:00', end: '16:00', by: '数据库实验' }] },
        { id: 'r403', name: '103', type: 'classroom', floorId: 'b2f1', capacity: 50, equipment: ['projector','ac'], status: 'free', schedule: [] },
      ]},
      { id: 'b2f2', buildingId: 'b2', level: 2, rooms: [
        { id: 'r501', name: '201', type: 'meeting', floorId: 'b2f2', capacity: 16, equipment: ['projector','ac','mic'], status: 'free', schedule: [] },
        { id: 'r502', name: '202', type: 'classroom', floorId: 'b2f2', capacity: 55, equipment: ['projector','ac'], status: 'busy', schedule: [{ start: '08:00', end: '10:00', by: '数据结构' },{ start: '14:00', end: '16:00', by: '操作系统' }] },
      ]},
    ]
  },
  {
    id: 'b3', name: '图书馆', position: [5, -3], color: '#34d399',
    floors: [
      { id: 'b3f1', buildingId: 'b3', level: 1, rooms: [
        { id: 'r601', name: '自习室A', type: 'classroom', floorId: 'b3f1', capacity: 80, equipment: ['ac'], status: 'busy', schedule: [{ start: '07:00', end: '22:00', by: '开放自习' }] },
        { id: 'r602', name: '自习室B', type: 'classroom', floorId: 'b3f1', capacity: 60, equipment: ['ac'], status: 'free', schedule: [] },
        { id: 'r603', name: '研讨室1', type: 'meeting', floorId: 'b3f1', capacity: 10, equipment: ['projector','ac'], status: 'free', schedule: [{ start: '10:00', end: '12:00', by: '课题讨论' }] },
      ]},
      { id: 'b3f2', buildingId: 'b3', level: 2, rooms: [
        { id: 'r701', name: '电子阅览室', type: 'lab', floorId: 'b3f2', capacity: 50, equipment: ['projector','ac'], status: 'free', schedule: [] },
        { id: 'r702', name: '研讨室2', type: 'meeting', floorId: 'b3f2', capacity: 8, equipment: ['projector','ac','mic'], status: 'free', schedule: [] },
      ]},
    ]
  },
  {
    id: 'b4', name: '艺术楼', position: [10, -7], color: '#fb923c',
    floors: [
      { id: 'b4f1', buildingId: 'b4', level: 1, rooms: [
        { id: 'r801', name: '排练厅', type: 'venue', floorId: 'b4f1', capacity: 40, equipment: ['ac','mic'], status: 'busy', schedule: [{ start: '09:00', end: '11:00', by: '合唱团排练' }] },
        { id: 'r802', name: '画室', type: 'classroom', floorId: 'b4f1', capacity: 30, equipment: ['ac'], status: 'free', schedule: [] },
      ]},
      { id: 'b4f2', buildingId: 'b4', level: 2, rooms: [
        { id: 'r901', name: '音乐厅', type: 'venue', floorId: 'b4f2', capacity: 200, equipment: ['projector','ac','mic'], status: 'free', schedule: [{ start: '19:00', end: '21:00', by: '周末音乐会' }] },
        { id: 'r902', name: '202', type: 'meeting', floorId: 'b4f2', capacity: 15, equipment: ['projector','ac'], status: 'repair', schedule: [] },
      ]},
    ]
  },
  {
    id: 'b5', name: '综合楼', position: [2, 2], color: '#f472b6',
    floors: [
      { id: 'b5f1', buildingId: 'b5', level: 1, rooms: [
        { id: 'ra01', name: '多功能厅', type: 'venue', floorId: 'b5f1', capacity: 150, equipment: ['projector','ac','mic'], status: 'free', schedule: [{ start: '14:00', end: '17:00', by: '学术讲座' }] },
        { id: 'ra02', name: '102', type: 'meeting', floorId: 'b5f1', capacity: 20, equipment: ['projector','ac','mic'], status: 'busy', schedule: [{ start: '08:00', end: '12:00', by: '校务会议' }] },
      ]},
      { id: 'b5f2', buildingId: 'b5', level: 2, rooms: [
        { id: 'rb01', name: '201', type: 'classroom', floorId: 'b5f2', capacity: 70, equipment: ['projector','ac'], status: 'free', schedule: [] },
        { id: 'rb02', name: '202', type: 'classroom', floorId: 'b5f2', capacity: 45, equipment: ['projector','ac'], status: 'free', schedule: [{ start: '10:00', end: '12:00', by: '英语听力' }] },
        { id: 'rb03', name: '203', type: 'meeting', floorId: 'b5f2', capacity: 10, equipment: ['projector','ac'], status: 'free', schedule: [] },
      ]},
    ]
  },
]

const mockDevices: Device[] = [
  { id: 'd1', roomId: 'r101', type: 'projector', status: 'ok', name: '投影仪' },
  { id: 'd2', roomId: 'r101', type: 'ac', status: 'ok', name: '空调' },
  { id: 'd3', roomId: 'r302', type: 'projector', status: 'fault', name: '投影仪' },
  { id: 'd4', roomId: 'r302', type: 'ac', status: 'ok', name: '空调' },
  { id: 'd5', roomId: 'r902', type: 'projector', status: 'fault', name: '投影仪' },
  { id: 'd6', roomId: 'r401', type: 'projector', status: 'ok', name: '投影仪' },
  { id: 'd7', roomId: 'r502', type: 'ac', status: 'ok', name: '空调' },
  { id: 'd8', roomId: 'r601', type: 'ac', status: 'ok', name: '空调' },
  { id: 'd9', roomId: 'r801', type: 'mic', status: 'ok', name: '麦克风' },
  { id: 'd10', roomId: 'ra01', type: 'projector', status: 'ok', name: '投影仪' },
]

const mockBookings: Booking[] = [
  { id: 'bk1', roomId: 'r101', user: '教务处', start: '08:00', end: '10:00', status: 'ok' },
  { id: 'bk2', roomId: 'r101', user: '学生会', start: '14:00', end: '16:00', status: 'ok' },
  { id: 'bk3', roomId: 'r202', user: '张教授', start: '08:00', end: '10:00', status: 'ok' },
  { id: 'bk4', roomId: 'ra02', user: '校办', start: '08:00', end: '12:00', status: 'ok' },
]

const mockTickets: Ticket[] = [
  { id: 'tk1', deviceId: 'd3', roomId: 'r302', desc: '投影仪无法开机，指示灯不亮', status: 'doing', assignee: '后勤张工', createdAt: '2026-06-30 09:15' },
  { id: 'tk2', deviceId: 'd5', roomId: 'r902', desc: '投影画面偏色，疑似灯泡老化', status: 'new', assignee: '后勤李工', createdAt: '2026-07-01 08:30' },
]

const mockEnergy: Energy[] = [
  { buildingId: 'b1', kwh: 342, ts: '2026-07-01' },
  { buildingId: 'b2', kwh: 287, ts: '2026-07-01' },
  { buildingId: 'b3', kwh: 198, ts: '2026-07-01' },
  { buildingId: 'b4', kwh: 156, ts: '2026-07-01' },
  { buildingId: 'b5', kwh: 265, ts: '2026-07-01' },
]

const mockTraffic: Traffic[] = [
  { zoneId: 'b1', count: 230, ts: '2026-07-01 08:00' },
  { zoneId: 'b2', count: 185, ts: '2026-07-01 08:00' },
  { zoneId: 'b3', count: 310, ts: '2026-07-01 08:00' },
  { zoneId: 'b4', count: 78, ts: '2026-07-01 08:00' },
  { zoneId: 'b5', count: 156, ts: '2026-07-01 08:00' },
]

const mockUser: User = { id: 'u1', role: 'student', name: '演示用户' }

// ============ Store ============

export const useCampusStore = defineStore('campus', () => {
  // 数据
  const buildings = ref<Building[]>(mockBuildings)
  const devices = ref<Device[]>(mockDevices)
  const bookings = ref<Booking[]>(mockBookings)
  const tickets = ref<Ticket[]>(mockTickets)
  const energy = ref<Energy[]>(mockEnergy)
  const traffic = ref<Traffic[]>(mockTraffic)
  const currentUser = ref<User>(mockUser)

  // UI 状态
  const activePanel = ref<PanelType>('welcome')
  const chatMessages = ref<ChatMsg[]>([
    { id: 'welcome', role: 'system', text: '你好！我是 CampusTwin 智能助手。你可以对我说：\n• "帮我订明天下午有投影的会议室"\n• "现在哪里有空的教室"\n• "商大楼302投影坏了"\n• "带我去图书馆"\n• "看一下全校占用情况"', timestamp: Date.now() }
  ])
  const highlightedRooms = ref<{ ids: string[], color: string }>({ ids: [], color: '' })
  const selectedRoom = ref<Room | null>(null)
  const candidateRooms = ref<Room[]>([])

  // 计算属性
  const allRooms = computed(() => {
    const rooms: Room[] = []
    buildings.value.forEach(b => b.floors.forEach(f => f.rooms.forEach(r => rooms.push(r))))
    return rooms
  })

  const totalRooms = computed(() => allRooms.value.length)
  const freeRooms = computed(() => allRooms.value.filter(r => r.status === 'free').length)
  const busyRooms = computed(() => allRooms.value.filter(r => r.status === 'busy').length)
  const repairRooms = computed(() => allRooms.value.filter(r => r.status === 'repair').length)
  const occupancyRate = computed(() => totalRooms.value > 0 ? Math.round((busyRooms.value / totalRooms.value) * 100) : 0)
  const totalEnergy = computed(() => energy.value.reduce((s, e) => s + e.kwh, 0))
  const totalTraffic = computed(() => traffic.value.reduce((s, t) => s + t.count, 0))

  // 方法
  function findRoomById(id: string): Room | null {
    for (const b of buildings.value)
      for (const f of b.floors)
        for (const r of f.rooms)
          if (r.id === id) return r
    return null
  }

  function findBuildingByName(name: string): Building | null {
    return buildings.value.find(b => b.name.includes(name)) || null
  }

  function findRoomByNameAndBuilding(roomName: string, buildingName?: string): Room | null {
    for (const b of buildings.value) {
      if (buildingName && !b.name.includes(buildingName)) continue
      for (const f of b.floors)
        for (const r of f.rooms)
          if (r.name === roomName) return r
    }
    return null
  }

  function setHighlight(ids: string[], color: string) {
    highlightedRooms.value = { ids, color }
  }

  function clearHighlight() {
    highlightedRooms.value = { ids: [], color: '' }
  }

  function addMessage(role: ChatMsg['role'], text: string, intent?: ChatMsg['intent'], steps?: ChatMsg['steps']) {
    chatMessages.value.push({ id: `msg_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, role, text, timestamp: Date.now(), intent, steps })
  }

  // ======== Agent 调度 ========
  async function handleUserInput(text: string) {
    addMessage('user', text)
    const intent = parseIntent(text)

    const steps: DispatchStep[] = [
      { label: '调度Agent 解析意图', status: 'running' },
      { label: `${intent.agent} 执行任务`, status: 'pending' },
      { label: '联动 3D 场景', status: 'pending' },
    ]
    addMessage('agent', `正在分析你的请求…`, intent, steps)
    const msgIdx = chatMessages.value.length - 1

    await delay(400)
    steps[0].status = 'done'
    steps[0].detail = `意图: ${intentLabel(intent.intent)}（置信度 ${(intent.confidence * 100).toFixed(0)}%）`

    steps[1].status = 'running'
    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
    await delay(500)

    // 分发到子Agent
    switch (intent.intent) {
      case 'book_room':
        await handleBookRoom(intent, steps, msgIdx)
        break
      case 'find_free_classroom':
        await handleFindFree(intent, steps, msgIdx)
        break
      case 'repair':
        await handleRepair(intent, steps, msgIdx)
        break
      case 'navigate':
        await handleNavigate(intent, steps, msgIdx)
        break
      case 'admin_overview':
        await handleAdmin(intent, steps, msgIdx)
        break
      default:
        steps[1].status = 'error'
        steps[1].detail = '未识别的意图'
        addMessage('agent', '抱歉，我暂时无法理解你的请求。试试说"帮我订会议室"或"哪里有空的教室"？')
    }
    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
  }

  async function handleBookRoom(intent: ReturnType<typeof parseIntent>, steps: DispatchStep[], msgIdx: number) {
    const equipNeed = intent.slots.equipment || []
    let candidates = allRooms.value.filter(r =>
      (r.type === 'meeting' || r.type === 'venue') && r.status !== 'repair'
    )
    if (equipNeed.length) {
      candidates = candidates.filter(r => equipNeed.every(e => r.equipment.includes(e)))
    }
    if (intent.slots.building) {
      const bld = findBuildingByName(intent.slots.building)
      if (bld) {
        const bldRoomIds = new Set(bld.floors.flatMap(f => f.rooms.map(r => r.id)))
        candidates = candidates.filter(r => bldRoomIds.has(r.id))
      }
    }
    // 按时间过滤——找当前空闲时段的
    candidates = candidates.filter(r => r.status === 'free')

    steps[1].status = 'done'
    steps[1].detail = `找到 ${candidates.length} 间候选${equipNeed.length ? `（含${equipNeed.map(equipLabel).join('、')}）` : ''}`

    steps[2].status = 'running'
    candidateRooms.value = candidates
    setHighlight(candidates.map(r => r.id), '#3b82f6')
    activePanel.value = 'booking'
    steps[2].status = 'done'
    steps[2].detail = '3D 高亮 + 候选列表已展示'

    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
    if (candidates.length > 0) {
      addMessage('agent', `找到 ${candidates.length} 间符合条件的房间，已在地图上高亮标注。请在右侧面板中选择并确认预约。`)
    } else {
      addMessage('agent', '抱歉，暂时没有找到符合条件的房间。试试放宽条件？比如不限设备或换个时间段。')
    }
  }

  async function handleFindFree(intent: ReturnType<typeof parseIntent>, steps: DispatchStep[], msgIdx: number) {
    let candidates = allRooms.value.filter(r => r.type === 'classroom' && r.status === 'free')
    if (intent.slots.building) {
      const bld = findBuildingByName(intent.slots.building)
      if (bld) {
        const bldRoomIds = new Set(bld.floors.flatMap(f => f.rooms.map(r => r.id)))
        candidates = candidates.filter(r => bldRoomIds.has(r.id))
      }
    }

    steps[1].status = 'done'
    steps[1].detail = `找到 ${candidates.length} 间空闲教室`

    steps[2].status = 'running'
    candidateRooms.value = candidates
    setHighlight(candidates.map(r => r.id), '#3b82f6')
    activePanel.value = 'booking'
    steps[2].status = 'done'
    steps[2].detail = '3D 高亮 + 列表已展示'

    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
    if (candidates.length > 0) {
      addMessage('agent', `当前有 ${candidates.length} 间空闲教室，已在 3D 地图上用蓝色标注。点击右侧列表或地图上的房间可查看详情。`)
    } else {
      addMessage('agent', '目前没有找到空闲教室，建议稍后再试或查看其他楼栋。')
    }
  }

  async function handleRepair(intent: ReturnType<typeof parseIntent>, steps: DispatchStep[], msgIdx: number) {
    let targetRoom: Room | null = null
    if (intent.slots.room && intent.slots.building) {
      targetRoom = findRoomByNameAndBuilding(intent.slots.room, intent.slots.building)
    } else if (intent.slots.room) {
      targetRoom = findRoomByNameAndBuilding(intent.slots.room)
    }

    steps[1].status = 'done'
    steps[1].detail = targetRoom ? `定位到 ${intent.slots.building || ''}${targetRoom.name}` : '未精确定位，请手动选择'

    steps[2].status = 'running'
    if (targetRoom) {
      setHighlight([targetRoom.id], '#ef4444')
      selectedRoom.value = targetRoom
    }
    activePanel.value = 'repair'
    steps[2].status = 'done'
    steps[2].detail = targetRoom ? '3D 标红 + 报修表单已自动填入' : '报修面板已打开'

    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
    if (targetRoom) {
      addMessage('agent', `已定位到${intent.slots.building || ''}${targetRoom.name}，报修表单已自动填入。请在右侧确认后提交。`)
    } else {
      addMessage('agent', '请告诉我具体的楼栋和房间号，例如"商大楼302投影仪坏了"。或者在右侧面板手动填写报修信息。')
    }
  }

  async function handleNavigate(intent: ReturnType<typeof parseIntent>, steps: DispatchStep[], msgIdx: number) {
    const target = intent.slots.target || intent.slots.building || ''
    const targetBld = target ? findBuildingByName(target) : null

    steps[1].status = 'done'
    steps[1].detail = targetBld ? `目标: ${targetBld.name}` : '未找到目标位置'

    steps[2].status = 'running'
    if (targetBld) {
      const firstRoom = targetBld.floors[0]?.rooms[0]
      if (firstRoom) setHighlight([firstRoom.id], '#3b82f6')
    }
    activePanel.value = 'navigate'
    steps[2].status = 'done'
    steps[2].detail = targetBld ? '导航路线已展示' : '无法定位'

    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
    if (targetBld) {
      addMessage('agent', `已为你规划前往${targetBld.name}的路线，请查看右侧导航面板和地图上的路线标识。预计步行约 5 分钟。`)
    } else {
      addMessage('agent', '请告诉我要去哪里，例如"带我去图书馆"。')
    }
  }

  async function handleAdmin(_intent: ReturnType<typeof parseIntent>, steps: DispatchStep[], msgIdx: number) {
    steps[1].status = 'done'
    steps[1].detail = '汇总全校态势数据'
    steps[2].status = 'done'
    steps[2].detail = '管理看板已展示'
    activePanel.value = 'admin'

    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
    addMessage('agent', `全校态势一览：教室/会议室共 ${totalRooms.value} 间，当前占用率 ${occupancyRate.value}%，今日总能耗 ${totalEnergy.value} kWh，实时人流约 ${totalTraffic.value} 人。详情已切换到管理看板。`)
  }

  // ======== 预约确认 ========
  function confirmBooking(roomId: string) {
    const room = findRoomById(roomId)
    if (!room) return
    room.status = 'busy'
    const newBooking: Booking = {
      id: `bk_${Date.now()}`,
      roomId,
      user: currentUser.value.name,
      start: '14:00',
      end: '16:00',
      status: 'ok',
    }
    bookings.value.push(newBooking)
    clearHighlight()
    candidateRooms.value = []
    addMessage('agent', `预约成功！${getRoomFullName(room)} 已为你预留（14:00-16:00），预约编号 ${newBooking.id}。`)
    activePanel.value = 'welcome'
  }

  // ======== 提交报修 ========
  function submitRepair(roomId: string, deviceType: string, desc: string) {
    const room = findRoomById(roomId)
    if (!room) return
    room.status = 'repair'
    const newTicket: Ticket = {
      id: `tk_${Date.now()}`,
      deviceId: deviceType,
      roomId,
      desc,
      status: 'new',
      assignee: '后勤值班',
      createdAt: new Date().toLocaleString('zh-CN'),
    }
    tickets.value.push(newTicket)
    setHighlight([roomId], '#ef4444')
    addMessage('agent', `报修工单已提交！工单编号 ${newTicket.id}，${getRoomFullName(room)} 的${desc}问题已派给后勤处理。你可以在报修面板中跟踪进度。`)
  }

  function advanceTicket(ticketId: string) {
    const t = tickets.value.find(tk => tk.id === ticketId)
    if (!t) return
    if (t.status === 'new') { t.status = 'doing'; addMessage('agent', `工单 ${ticketId} 状态已更新：处理中。`) }
    else if (t.status === 'doing') {
      t.status = 'done'
      const room = findRoomById(t.roomId)
      if (room && room.status === 'repair') room.status = 'free'
      clearHighlight()
      addMessage('agent', `工单 ${ticketId} 已完成！设备已恢复正常。`)
    }
  }

  // 辅助
  function getRoomFullName(room: Room): string {
    for (const b of buildings.value)
      for (const f of b.floors)
        if (f.id === room.floorId) return `${b.name}${room.name}`
    return room.name
  }

  return {
    buildings, devices, bookings, tickets, energy, traffic, currentUser,
    activePanel, chatMessages, highlightedRooms, selectedRoom, candidateRooms,
    allRooms, totalRooms, freeRooms, busyRooms, repairRooms, occupancyRate, totalEnergy, totalTraffic,
    findRoomById, findBuildingByName, setHighlight, clearHighlight, addMessage,
    handleUserInput, confirmBooking, submitRepair, advanceTicket, getRoomFullName,
  }
})

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)) }

function intentLabel(i: string): string {
  const map: Record<string, string> = {
    book_room: '预约房间', find_free_classroom: '查找空教室', repair: '设备报修',
    navigate: '寻路导航', admin_overview: '管理态势', unknown: '未知',
  }
  return map[i] || i
}

function equipLabel(e: string): string {
  const map: Record<string, string> = { projector: '投影', ac: '空调', mic: '麦克风', light: '灯光', whiteboard: '白板', screen: '屏幕' }
  return map[e] || e
}

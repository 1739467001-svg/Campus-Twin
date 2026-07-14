import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Building, Device, Booking, Ticket, Energy, Traffic, User, Room, PanelType, ChatMsg, DispatchStep, Intent } from '../types/campus'
import { parseIntent } from '../utils/intentParser'

// ============ Mock 数据 ============

const mockBuildings: Building[] = [
  {
    id: 'b1', name: '商大楼', position: [-12, -5], color: '#2596eb',
    floors: [
      { id: 'b1f1', buildingId: 'b1', level: 1, rooms: [
        { id: 'r101', name: '101', type: 'meeting', floorId: 'b1f1', capacity: 20, equipment: ['projector','ac','mic'], status: 'busy', schedule: [{ start: '08:00', end: '10:00', by: '教务处' },{ start: '14:00', end: '16:00', by: '学生会' }] },
        { id: 'r102', name: '102', type: 'classroom', floorId: 'b1f1', capacity: 60, equipment: ['projector','ac'], status: 'free', schedule: [{ start: '10:00', end: '12:00', by: '线性代数' }] },
        { id: 'r103', name: '103', type: 'meeting', floorId: 'b1f1', capacity: 15, equipment: ['projector','ac'], status: 'free', schedule: [] },
      ]},
      { id: 'b1f2', buildingId: 'b1', level: 2, rooms: [
        { id: 'r201', name: '201', type: 'meeting', floorId: 'b1f2', capacity: 12, equipment: ['projector','ac','mic'], status: 'free', schedule: [{ start: '09:00', end: '11:00', by: '院办会议' }] },
        { id: 'r202', name: '202', type: 'classroom', floorId: 'b1f2', capacity: 45, equipment: ['projector','ac'], status: 'busy', schedule: [{ start: '08:00', end: '10:00', by: '宏观经济学' },{ start: '14:00', end: '16:00', by: '统计学' }] },
        { id: 'r203', name: '203', type: 'meeting', floorId: 'b1f2', capacity: 10, equipment: ['projector','ac'], status: 'free', schedule: [] },
      ]},
      { id: 'b1f3', buildingId: 'b1', level: 3, rooms: [
        { id: 'r301', name: '301', type: 'classroom', floorId: 'b1f3', capacity: 40, equipment: ['projector','ac'], status: 'free', schedule: [{ start: '10:00', end: '12:00', by: '管理学原理' }] },
        { id: 'r302', name: '302', type: 'meeting', floorId: 'b1f3', capacity: 8, equipment: ['projector','ac'], status: 'repair', schedule: [] },
        { id: 'r303', name: '303', type: 'meeting', floorId: 'b1f3', capacity: 15, equipment: ['projector','ac','mic'], status: 'free', schedule: [] },
      ]},
    ]
  },
  {
    id: 'b2', name: '信息楼', position: [-5, -9], color: '#a78bfa',
    floors: [
      { id: 'b2f1', buildingId: 'b2', level: 1, rooms: [
        { id: 'r401', name: '101', type: 'lab', floorId: 'b2f1', capacity: 40, equipment: ['projector','ac'], status: 'busy', schedule: [{ start: '08:00', end: '12:00', by: '计算机网络实验' }] },
        { id: 'r402', name: '102', type: 'lab', floorId: 'b2f1', capacity: 35, equipment: ['projector','ac'], status: 'free', schedule: [{ start: '14:00', end: '16:00', by: '数据库实验' }] },
        { id: 'r403', name: '103', type: 'meeting', floorId: 'b2f1', capacity: 12, equipment: ['projector','ac'], status: 'free', schedule: [] },
      ]},
      { id: 'b2f2', buildingId: 'b2', level: 2, rooms: [
        { id: 'r501', name: '201', type: 'meeting', floorId: 'b2f2', capacity: 16, equipment: ['projector','ac','mic'], status: 'free', schedule: [] },
        { id: 'r502', name: '202', type: 'classroom', floorId: 'b2f2', capacity: 55, equipment: ['projector','ac'], status: 'busy', schedule: [{ start: '08:00', end: '10:00', by: '数据结构' },{ start: '14:00', end: '16:00', by: '操作系统' }] },
        { id: 'r503', name: '203', type: 'meeting', floorId: 'b2f2', capacity: 8, equipment: ['projector','ac'], status: 'free', schedule: [] },
      ]},
    ]
  },
  {
    id: 'b3', name: '图书馆', position: [8, -5], color: '#34d399',
    floors: [
      { id: 'b3f1', buildingId: 'b3', level: 1, rooms: [
        { id: 'r601', name: '自习室A', type: 'classroom', floorId: 'b3f1', capacity: 80, equipment: ['ac'], status: 'busy', schedule: [{ start: '07:00', end: '22:00', by: '开放自习' }] },
        { id: 'r602', name: '自习室B', type: 'classroom', floorId: 'b3f1', capacity: 60, equipment: ['ac'], status: 'free', schedule: [] },
        { id: 'r603', name: '研讨室1', type: 'meeting', floorId: 'b3f1', capacity: 10, equipment: ['projector','ac'], status: 'free', schedule: [{ start: '10:00', end: '12:00', by: '课题讨论' }] },
        { id: 'r604', name: '研讨室3', type: 'meeting', floorId: 'b3f1', capacity: 12, equipment: ['projector','ac','mic'], status: 'free', schedule: [] },
      ]},
      { id: 'b3f2', buildingId: 'b3', level: 2, rooms: [
        { id: 'r701', name: '电子阅览室', type: 'lab', floorId: 'b3f2', capacity: 50, equipment: ['projector','ac'], status: 'free', schedule: [] },
        { id: 'r702', name: '研讨室2', type: 'meeting', floorId: 'b3f2', capacity: 8, equipment: ['projector','ac','mic'], status: 'free', schedule: [] },
        { id: 'r703', name: '研讨室4', type: 'meeting', floorId: 'b3f2', capacity: 15, equipment: ['projector','ac','mic'], status: 'free', schedule: [] },
      ]},
    ]
  },
  {
    id: 'b4', name: '艺术楼', position: [14, -10], color: '#fb923c',
    floors: [
      { id: 'b4f1', buildingId: 'b4', level: 1, rooms: [
        { id: 'r801', name: '排练厅', type: 'venue', floorId: 'b4f1', capacity: 40, equipment: ['ac','mic'], status: 'busy', schedule: [{ start: '09:00', end: '11:00', by: '合唱团排练' }] },
        { id: 'r802', name: '画室', type: 'classroom', floorId: 'b4f1', capacity: 30, equipment: ['ac'], status: 'free', schedule: [] },
        { id: 'r803', name: '103', type: 'meeting', floorId: 'b4f1', capacity: 10, equipment: ['projector','ac'], status: 'free', schedule: [] },
      ]},
      { id: 'b4f2', buildingId: 'b4', level: 2, rooms: [
        { id: 'r901', name: '音乐厅', type: 'venue', floorId: 'b4f2', capacity: 200, equipment: ['projector','ac','mic'], status: 'free', schedule: [{ start: '19:00', end: '21:00', by: '周末音乐会' }] },
        { id: 'r902', name: '202', type: 'meeting', floorId: 'b4f2', capacity: 15, equipment: ['projector','ac'], status: 'repair', schedule: [] },
        { id: 'r903', name: '203', type: 'meeting', floorId: 'b4f2', capacity: 12, equipment: ['projector','ac','mic'], status: 'free', schedule: [] },
      ]},
    ]
  },
  {
    id: 'b5', name: '综合楼', position: [0, 5], color: '#f472b6',
    floors: [
      { id: 'b5f1', buildingId: 'b5', level: 1, rooms: [
        { id: 'ra01', name: '多功能厅', type: 'venue', floorId: 'b5f1', capacity: 150, equipment: ['projector','ac','mic'], status: 'free', schedule: [{ start: '14:00', end: '17:00', by: '学术讲座' }] },
        { id: 'ra02', name: '102', type: 'meeting', floorId: 'b5f1', capacity: 20, equipment: ['projector','ac','mic'], status: 'busy', schedule: [{ start: '08:00', end: '12:00', by: '校务会议' }] },
        { id: 'ra03', name: '103', type: 'meeting', floorId: 'b5f1', capacity: 15, equipment: ['projector','ac'], status: 'free', schedule: [] },
      ]},
      { id: 'b5f2', buildingId: 'b5', level: 2, rooms: [
        { id: 'rb01', name: '201', type: 'classroom', floorId: 'b5f2', capacity: 70, equipment: ['projector','ac'], status: 'free', schedule: [] },
        { id: 'rb02', name: '202', type: 'classroom', floorId: 'b5f2', capacity: 45, equipment: ['projector','ac'], status: 'free', schedule: [{ start: '10:00', end: '12:00', by: '英语听力' }] },
        { id: 'rb03', name: '203', type: 'meeting', floorId: 'b5f2', capacity: 10, equipment: ['projector','ac'], status: 'free', schedule: [] },
        { id: 'rb04', name: '204', type: 'meeting', floorId: 'b5f2', capacity: 8, equipment: ['projector','ac'], status: 'free', schedule: [] },
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
  const navigateTarget = ref<string>('')
  const repairDeviceSlot = ref<string>('')
  const navigationRoute = ref<{ start: [number, number], end: [number, number], waypoints: [number, number][] } | null>(null)
  const myBookedRoomIds = ref<string[]>([])
  const bookingTimeRange = ref<{ start: string, end: string } | null>(null)

  // ============ 持久化 ============
  const STORAGE_KEY = 'campustwin_data'
  
  function loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        if (data.myBookedRoomIds) {
          myBookedRoomIds.value = data.myBookedRoomIds
        }
        if (data.bookings) {
          const storedBookings = data.bookings as Booking[]
          storedBookings.forEach(b => {
            if (!bookings.value.some(existing => existing.id === b.id)) {
              bookings.value.push(b)
              const room = findRoomById(b.roomId)
              if (room && !room.schedule.some(s => s.start === b.start && s.end === b.end)) {
                room.schedule.push({ start: b.start, end: b.end, by: b.user })
                if (room.status !== 'repair') room.status = 'busy'
              }
            }
          })
        }
      }
    } catch (e) {
      console.warn('Failed to load from storage:', e)
    }
  }

  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        myBookedRoomIds: myBookedRoomIds.value,
        bookings: bookings.value.filter(b => b.status === 'ok')
      }))
    } catch (e) {
      console.warn('Failed to save to storage:', e)
    }
  }

  watch([myBookedRoomIds, bookings], () => {
    saveToStorage()
  }, { deep: true })

  loadFromStorage()

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
      { label: '接收请求', status: 'running', detail: `输入: "${text}"` },
      { label: 'NLP 意图识别', status: 'pending' },
      { label: '实体抽取与槽填充', status: 'pending' },
      { label: '路由到子Agent', status: 'pending' },
      { label: `${intent.agent} 执行任务`, status: 'pending' },
      { label: '3D 场景联动', status: 'pending' },
      { label: '生成响应', status: 'pending' },
    ]
    addMessage('agent', `正在处理你的请求…`, intent, steps)
    const msgIdx = chatMessages.value.length - 1

    await delay(200)
    steps[0].status = 'done'

    steps[1].status = 'running'
    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
    await delay(300)
    steps[1].status = 'done'
    steps[1].detail = `意图: ${intentLabel(intent.intent)}`

    steps[2].status = 'running'
    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
    await delay(300)
    const slotDetails = Object.entries(intent.slots)
      .filter(([, v]) => v && (Array.isArray(v) ? v.length > 0 : true))
      .map(([k, v]) => `${slotLabel(k)}: ${Array.isArray(v) ? v.map(slotLabel).join(', ') : slotLabel(String(v))}`)
      .join('; ')
    steps[2].status = 'done'
    steps[2].detail = slotDetails || '无额外参数'

    steps[3].status = 'running'
    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
    await delay(200)
    steps[3].status = 'done'
    steps[3].detail = `路由至: ${intent.agent}`

    steps[4].status = 'running'
    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }

    switch (intent.intent) {
      case 'book_room':
        await handleBookRoom(intent, steps, msgIdx)
        break
      case 'find_free_classroom':
        await handleFindFree(intent, steps, msgIdx)
        break
      case 'check_booking':
        await handleCheckBooking(intent, steps, msgIdx)
        break
      case 'schedule_query':
        await handleScheduleQuery(intent, steps, msgIdx)
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
        steps[4].status = 'error'
        steps[4].detail = '未识别的意图'
        addMessage('agent', '抱歉，我暂时无法理解你的请求。试试说"帮我订会议室"或"哪里有空的教室"？')
    }

    steps[6].status = 'done'
    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
  }

  async function handleBookRoom(intent: Intent, steps: DispatchStep[], msgIdx: number) {
    const equipNeed = intent.slots.equipment || []
    const startTime = intent.slots.startTime
    const endTime = intent.slots.endTime
    const hour = intent.slots.hour
    const duration = intent.slots.duration || 2
    
    await delay(300)
    steps[4].detail = '查询房间数据库...'
    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
    
    let candidates = allRooms.value.filter(r =>
      (r.type === 'meeting' || r.type === 'venue') && r.status !== 'repair'
    )
    
    await delay(200)
    
    let filterDesc = equipNeed.length ? equipNeed.map(equipLabel).join('、') : '无设备要求'
    if (startTime && endTime) {
      filterDesc += ` · ${startTime}-${endTime}`
    } else if (hour !== undefined) {
      filterDesc += ` · ${hour}:00开始${duration}小时`
    } else if (intent.slots.time) {
      filterDesc += ` · ${intent.slots.time}`
    }
    
    steps[4].detail = `筛选条件: ${filterDesc}`
    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
    
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
    
    let queryStart: string, queryEnd: string
    if (startTime && endTime) {
      queryStart = startTime
      queryEnd = endTime
    } else if (hour !== undefined) {
      queryStart = `${hour.toString().padStart(2, '0')}:00`
      queryEnd = `${(hour + duration).toString().padStart(2, '0')}:00`
    } else {
      queryStart = '08:00'
      queryEnd = '18:00'
    }
    
    candidates = candidates.filter(r => isRoomAvailable(r, queryStart, queryEnd))

    steps[4].status = 'done'
    steps[4].detail = `找到 ${candidates.length} 间候选${equipNeed.length ? `（含${equipNeed.map(equipLabel).join('、')}）` : ''}`

    steps[5].status = 'running'
    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
    await delay(200)
    
    candidateRooms.value = candidates
    if (startTime && endTime) {
      bookingTimeRange.value = { start: startTime, end: endTime }
    }
    setHighlight(candidates.map(r => r.id), '#3b82f6')
    activePanel.value = 'booking'
    
    steps[5].status = 'done'
    steps[5].detail = '3D 高亮 + 候选列表已展示'

    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
    if (candidates.length > 0) {
      let response = `找到 ${candidates.length} 间符合条件的房间`
      if (startTime && endTime) {
        response += `（${startTime}-${endTime}可用）`
      } else if (hour !== undefined) {
        response += `（${hour}:00开始${duration}小时可用）`
      }
      response += `，已在地图上高亮标注。请在右侧面板中选择并确认预约。`
      addMessage('agent', response)
    } else {
      let reason = '暂时没有找到符合条件的房间'
      if (startTime && endTime) {
        reason = `${startTime}-${endTime}期间没有可用会议室`
      } else if (hour !== undefined) {
        reason = `${hour}:00开始${duration}小时期间没有可用会议室`
      }
      addMessage('agent', `抱歉，${reason}。试试放宽条件？比如不限设备或换个时间段。`)
    }
  }

  async function handleCheckBooking(_intent: Intent, steps: DispatchStep[], msgIdx: number) {
    await delay(300)
    steps[4].detail = '查询个人预约记录...'
    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
    
    await delay(200)
    const myBookings = bookings.value.filter(b => b.user === currentUser.value.name && b.status === 'ok')
    
    steps[4].status = 'done'
    steps[4].detail = `找到 ${myBookings.length} 条预约记录`

    steps[5].status = 'running'
    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
    await delay(200)
    
    if (myBookings.length > 0) {
      const bookingRoomIds = myBookings.map(b => b.roomId)
      setHighlight(bookingRoomIds, '#fbbf24')
      
      let response = `📅 你的预约记录：\n\n`
      for (const booking of myBookings) {
        const room = findRoomById(booking.roomId)
        const roomName = room ? getRoomFullName(room) : '未知房间'
        response += `• ${roomName}：${booking.start} - ${booking.end}\n`
      }
      response += `\n已在 3D 地图上用金色标注你的预约房间。`
      addMessage('agent', response)
    } else {
      addMessage('agent', '你目前没有任何预约记录。需要我帮你预订会议室吗？')
    }
    
    steps[5].status = 'done'
    steps[5].detail = myBookings.length > 0 ? '预约记录已展示 + 3D 高亮' : '无预约记录'
    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
  }

  async function handleScheduleQuery(intent: Intent, steps: DispatchStep[], msgIdx: number) {
    await delay(300)
    steps[4].detail = '分析时间需求...'
    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
    
    const targetTime = intent.slots.time || ''
    const startTime = intent.slots.startTime
    const endTime = intent.slots.endTime
    const hour = intent.slots.hour
    const duration = intent.slots.duration || 2
    
    await delay(200)
    
    let queryTimeDesc = '全天'
    if (startTime && endTime) {
      queryTimeDesc = `${startTime} - ${endTime}`
    } else if (hour !== undefined) {
      queryTimeDesc = `${hour}:00 开始，${duration}小时`
    } else if (targetTime) {
      queryTimeDesc = targetTime
    }
    
    steps[4].detail = `查询时间段: ${queryTimeDesc}`
    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
    
    await delay(300)
    steps[4].detail = '搜索可用会议室...'
    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
    
    let candidates = allRooms.value.filter(r =>
      (r.type === 'meeting' || r.type === 'venue') && r.status !== 'repair'
    )
    
    if (intent.slots.equipment?.length) {
      candidates = candidates.filter(r => 
        intent.slots.equipment!.every(e => r.equipment.includes(e))
      )
    }
    
    if (intent.slots.building) {
      const bld = findBuildingByName(intent.slots.building)
      if (bld) {
        const bldRoomIds = new Set(bld.floors.flatMap(f => f.rooms.map(r => r.id)))
        candidates = candidates.filter(r => bldRoomIds.has(r.id))
      }
    }
    
    const capacity = intent.slots.capacity
    if (capacity !== undefined) {
      candidates = candidates.filter(r => r.capacity >= capacity)
    }
    
    if (startTime && endTime) {
      candidates = candidates.filter(r => {
        for (const schedule of r.schedule) {
          if (isTimeOverlap(startTime, endTime, schedule.start, schedule.end)) {
            return false
          }
        }
        return true
      })
    } else if (hour !== undefined) {
      const queryStart = `${hour.toString().padStart(2, '0')}:00`
      const queryEnd = `${(hour + duration).toString().padStart(2, '0')}:00`
      candidates = candidates.filter(r => {
        for (const schedule of r.schedule) {
          if (isTimeOverlap(queryStart, queryEnd, schedule.start, schedule.end)) {
            return false
          }
        }
        return true
      })
    }
    
    steps[4].status = 'done'
    steps[4].detail = `找到 ${candidates.length} 间可用房间`

    steps[5].status = 'running'
    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
    await delay(200)
    
    candidateRooms.value = candidates
    setHighlight(candidates.map(r => r.id), '#3b82f6')
    activePanel.value = 'booking'
    
    steps[5].status = 'done'
    steps[5].detail = '3D 高亮 + 候选列表已展示'

    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
    
    if (candidates.length > 0) {
      let response = `🕐 ${queryTimeDesc} 期间，找到 ${candidates.length} 间可用会议室：\n\n`
      const sortedCandidates = [...candidates].sort((a, b) => a.capacity - b.capacity)
      for (const room of sortedCandidates.slice(0, 5)) {
        const building = buildings.value.find(b => 
          b.floors.some(f => f.rooms.some(r => r.id === room.id))
        )
        const buildingName = building?.name || ''
        response += `• ${buildingName}${room.name}（${room.capacity}人）${room.equipment.length > 0 ? '· ' + room.equipment.map(eq => equipLabel(eq)).join('、') : ''}\n`
      }
      if (sortedCandidates.length > 5) {
        response += `...还有 ${sortedCandidates.length - 5} 间可用\n`
      }
      response += `\n已在地图上高亮标注，点击右侧面板选择预约。`
      addMessage('agent', response)
    } else {
      addMessage('agent', `抱歉，${queryTimeDesc} 期间没有找到可用的会议室。试试其他时间段？`)
    }
  }

  function isTimeOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    const [h1, m1] = start1.split(':').map(Number)
    const [h2, m2] = end1.split(':').map(Number)
    const [h3, m3] = start2.split(':').map(Number)
    const [h4, m4] = end2.split(':').map(Number)
    
    const t1 = h1 * 60 + m1
    const t2 = h2 * 60 + m2
    const t3 = h3 * 60 + m3
    const t4 = h4 * 60 + m4
    
    return !(t2 <= t3 || t1 >= t4)
  }

  function isRoomAvailable(room: Room, start: string, end: string): boolean {
    if (room.status === 'repair') return false
    
    for (const schedule of room.schedule) {
      if (isTimeOverlap(start, end, schedule.start, schedule.end)) {
        return false
      }
    }
    
    for (const booking of bookings.value) {
      if (booking.roomId === room.id && booking.status === 'ok') {
        if (isTimeOverlap(start, end, booking.start, booking.end)) {
          return false
        }
      }
    }
    
    return true
  }

  async function handleFindFree(intent: Intent, steps: DispatchStep[], msgIdx: number) {
    await delay(300)
    steps[4].detail = '扫描教室状态...'
    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
    
    let candidates = allRooms.value.filter(r => r.type === 'classroom' && r.status !== 'repair')
    
    await delay(200)
    if (intent.slots.building) {
      steps[4].detail = `限定楼栋: ${intent.slots.building}`
      chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
      const bld = findBuildingByName(intent.slots.building)
      if (bld) {
        const bldRoomIds = new Set(bld.floors.flatMap(f => f.rooms.map(r => r.id)))
        candidates = candidates.filter(r => bldRoomIds.has(r.id))
      }
    }

    steps[4].status = 'done'
    steps[4].detail = `找到 ${candidates.length} 间空闲教室`

    steps[5].status = 'running'
    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
    await delay(200)
    
    candidateRooms.value = candidates
    setHighlight(candidates.map(r => r.id), '#3b82f6')
    activePanel.value = 'booking'
    
    steps[5].status = 'done'
    steps[5].detail = '3D 高亮 + 列表已展示'

    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
    if (candidates.length > 0) {
      addMessage('agent', `当前有 ${candidates.length} 间空闲教室，已在 3D 地图上用蓝色标注。点击右侧列表或地图上的房间可查看详情。`)
    } else {
      addMessage('agent', '目前没有找到空闲教室，建议稍后再试或查看其他楼栋。')
    }
  }

  async function handleRepair(intent: Intent, steps: DispatchStep[], msgIdx: number) {
    await delay(300)
    steps[4].detail = '分析故障描述...'
    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
    
    const faultAnalysis = analyzeFault(intent)
    
    await delay(200)
    steps[4].detail = `识别故障: ${faultAnalysis.deviceName || '未知设备'} · ${faultAnalysis.symptom || '故障'}`
    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
    
    await delay(300)
    steps[4].detail = '定位故障位置...'
    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
    
    let targetRoom: Room | null = null
    if (intent.slots.room && intent.slots.building) {
      targetRoom = findRoomByNameAndBuilding(intent.slots.room, intent.slots.building)
    } else if (intent.slots.room) {
      targetRoom = findRoomByNameAndBuilding(intent.slots.room)
    }

    steps[4].status = 'done'
    steps[4].detail = targetRoom ? `定位到 ${intent.slots.building || ''}${targetRoom.name}` : '未精确定位，请手动选择'

    steps[5].status = 'running'
    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
    await delay(200)
    
    if (targetRoom) {
      setHighlight([targetRoom.id], '#ef4444')
      selectedRoom.value = targetRoom
      repairDeviceSlot.value = intent.slots.device || ''
    }
    activePanel.value = 'repair'
    
    steps[5].status = 'done'
    steps[5].detail = targetRoom ? '3D 标红 + 报修表单已自动填入' : '报修面板已打开'

    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
    
    if (targetRoom) {
      let response = `已定位到${intent.slots.building || ''}${targetRoom.name}，${faultAnalysis.deviceName || '设备'}出现${faultAnalysis.symptom || '故障'}。`
      if (faultAnalysis.suggestion) {
        response += `\n\n💡 建议：${faultAnalysis.suggestion}`
      }
      if (faultAnalysis.priority === 'high') {
        response += `\n\n⚠️ 紧急报修已标记，预计15分钟内响应。`
      } else {
        response += `\n\n请在右侧确认后提交报修工单。`
      }
      addMessage('agent', response)
    } else {
      addMessage('agent', `检测到${faultAnalysis.deviceName || '设备'}${faultAnalysis.symptom || '故障'}。请告诉我具体的楼栋和房间号，例如"商大楼302投影仪坏了"。或者在右侧面板手动填写报修信息。`)
    }
  }

  async function handleNavigate(intent: Intent, steps: DispatchStep[], msgIdx: number) {
    await delay(300)
    steps[4].detail = '搜索目标位置...'
    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
    
    const target = intent.slots.target || intent.slots.building || ''
    const targetBld = target ? findBuildingByName(target) : null

    steps[4].status = 'done'
    steps[4].detail = targetBld ? `目标: ${targetBld.name}` : '未找到目标位置'
    navigateTarget.value = targetBld ? targetBld.name : target

    steps[5].status = 'running'
    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
    await delay(200)
    
    if (targetBld) {
      const firstRoom = targetBld.floors[0]?.rooms[0]
      if (firstRoom) setHighlight([firstRoom.id], '#3b82f6')
      
      const route = calculateRoute(targetBld)
      navigationRoute.value = route
    } else {
      navigationRoute.value = null
    }
    activePanel.value = 'navigate'
    
    steps[5].status = 'done'
    steps[5].detail = targetBld ? '导航路线已展示' : '无法定位'

    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
    if (targetBld) {
      addMessage('agent', `已为你规划前往${targetBld.name}的路线，请查看右侧导航面板和地图上的路线标识。预计步行约 5 分钟。`)
    } else {
      addMessage('agent', '请告诉我要去哪里，例如"带我去图书馆"。')
    }
  }

  function calculateRoute(targetBld: Building): { start: [number, number], end: [number, number], waypoints: [number, number][] } {
    const start: [number, number] = [0, 15]
    const end: [number, number] = [targetBld.position[0], targetBld.position[1]]
    
    const waypoints: [number, number][] = []
    
    switch (targetBld.id) {
      case 'b1':
        waypoints.push([0, 8])
        waypoints.push([-6, 8])
        waypoints.push([-6, -5])
        waypoints.push([-12, -5])
        break
      case 'b2':
        waypoints.push([0, 8])
        waypoints.push([0, -3])
        waypoints.push([-5, -3])
        waypoints.push([-5, -9])
        break
      case 'b3':
        waypoints.push([0, 8])
        waypoints.push([4, 8])
        waypoints.push([4, -5])
        waypoints.push([8, -5])
        break
      case 'b4':
        waypoints.push([0, 8])
        waypoints.push([7, 8])
        waypoints.push([7, -5])
        waypoints.push([7, -10])
        waypoints.push([14, -10])
        break
      case 'b5':
        waypoints.push([0, 10])
        waypoints.push([0, 5])
        break
      default:
        waypoints.push([0, 0])
        waypoints.push([end[0], 0])
        break
    }
    
    return { start, end, waypoints }
  }

  async function handleAdmin(_intent: Intent, steps: DispatchStep[], msgIdx: number) {
    await delay(300)
    steps[4].detail = '汇总全校态势数据...'
    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
    
    await delay(200)
    steps[4].detail = `统计完成: ${totalRooms.value} 房间, ${totalEnergy.value} kWh, ${totalTraffic.value} 人流`
    steps[4].status = 'done'

    steps[5].status = 'running'
    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
    await delay(200)
    
    activePanel.value = 'admin'
    
    steps[5].status = 'done'
    steps[5].detail = '管理看板已展示'

    chatMessages.value[msgIdx] = { ...chatMessages.value[msgIdx], steps: [...steps] }
    addMessage('agent', `全校态势一览：教室/会议室共 ${totalRooms.value} 间，当前占用率 ${occupancyRate.value}%，今日总能耗 ${totalEnergy.value} kWh，实时人流约 ${totalTraffic.value} 人。详情已切换到管理看板。`)
  }

  // ======== 预约确认 ========
  function confirmBooking(roomId: string, start: string = '14:00', end: string = '16:00', user?: string) {
    const room = findRoomById(roomId)
    if (!room) return

    const existingBooking = bookings.value.find(b => 
      b.roomId === roomId && b.status === 'ok' && isTimeOverlap(start, end, b.start, b.end)
    )
    if (existingBooking) {
      addMessage('agent', `❌ 预约失败！${getRoomFullName(room)} 在 ${start}-${end} 时间段已被预约（预约人：${existingBooking.user}）。请选择其他时间段或房间。`)
      return
    }

    const existingSchedule = room.schedule.find(s => isTimeOverlap(start, end, s.start, s.end))
    if (existingSchedule) {
      addMessage('agent', `❌ 预约失败！${getRoomFullName(room)} 在 ${start}-${end} 时间段已有安排（${existingSchedule.by}）。请选择其他时间段。`)
      return
    }

    room.status = 'busy'
    const bookingUser = user || currentUser.value.name
    const newBooking: Booking = {
      id: `bk_${Date.now()}`,
      roomId,
      user: bookingUser,
      start,
      end,
      status: 'ok',
    }
    bookings.value.push(newBooking)
    room.schedule.push({ start, end, by: bookingUser })
    if (!myBookedRoomIds.value.includes(roomId)) {
      myBookedRoomIds.value.push(roomId)
    }
    clearHighlight()
    candidateRooms.value = []
    addMessage('agent', `✅ 预约成功！${getRoomFullName(room)} 已为 ${bookingUser} 预留（${start}-${end}），预约编号 ${newBooking.id}。`)
    activePanel.value = 'welcome'
  }

  // ======== 提交报修 ========
  function submitRepair(roomId: string, deviceType: string, desc: string) {
    const room = findRoomById(roomId)
    if (!room) return
    room.status = 'repair'
    // 查找真实设备 ID，找不到则用类型字符串兜底
    const device = devices.value.find(d => d.roomId === roomId && d.type === deviceType)
    const newTicket: Ticket = {
      id: `tk_${Date.now()}`,
      deviceId: device?.id || deviceType,
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
    navigateTarget, repairDeviceSlot, navigationRoute, myBookedRoomIds, bookingTimeRange,
    allRooms, totalRooms, freeRooms, busyRooms, repairRooms, occupancyRate, totalEnergy, totalTraffic,
    findRoomById, findBuildingByName, findRoomByNameAndBuilding,
    setHighlight, clearHighlight, addMessage,
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

function slotLabel(s: string): string {
  const map: Record<string, string> = {
    time: '时间', equipment: '设备', building: '楼栋', room: '房间', 
    device: '设备类型', target: '目的地', projector: '投影仪',
    classroom: '教室', meeting: '会议室', venue: '场馆', lab: '实验室'
  }
  return map[s] || s
}

function analyzeFault(intent: Intent) {
  const deviceNameMap: Record<string, string> = {
    projector: '投影仪', ac: '空调', light: '灯光', mic: '麦克风',
    whiteboard: '电子白板', screen: '显示屏', computer: '电脑',
    network: '网络', lock: '门锁', water: '饮水机', fan: '风扇',
    furniture: '桌椅', unknown: '设备'
  }
  
  const device = intent.slots.device || 'unknown'
  const deviceName = deviceNameMap[device] || '设备'
  
  let symptom = '故障'
  let suggestion = ''
  let priority: 'low' | 'medium' | 'high' = 'medium'
  
  const symptomMap: Record<string, { text: string, priority: 'low' | 'medium' | 'high', suggestion: string }> = {
    黑屏: { text: '黑屏', priority: 'high', suggestion: '请检查电源线是否插好，尝试重启设备。如果无效，请立即报修。' },
    不亮: { text: '无法点亮', priority: 'high', suggestion: '请检查电源开关和线路连接。' },
    闪烁: { text: '画面闪烁', priority: 'medium', suggestion: '可能是灯泡老化或连接线松动，建议检查连接线。' },
    死机: { text: '死机', priority: 'high', suggestion: '请尝试强制重启设备。' },
    卡机: { text: '运行卡顿', priority: 'medium', suggestion: '建议关闭其他程序或重启设备。' },
    卡顿: { text: '运行卡顿', priority: 'medium', suggestion: '建议关闭其他程序或重启设备。' },
    蓝屏: { text: '蓝屏', priority: 'high', suggestion: '系统故障，需要专业维修。' },
    没反应: { text: '无响应', priority: 'high', suggestion: '请检查电源连接或尝试重启。' },
    无法启动: { text: '无法启动', priority: 'high', suggestion: '请检查电源和启动开关。' },
    启动不了: { text: '无法启动', priority: 'high', suggestion: '请检查电源和启动开关。' },
    打不开: { text: '无法打开', priority: 'high', suggestion: '请检查电源连接。' },
    开不了机: { text: '无法开机', priority: 'high', suggestion: '请检查电源和电源线。' },
    声音小: { text: '声音过小', priority: 'low', suggestion: '请检查音量设置和音频线连接。' },
    没声音: { text: '无声音', priority: 'medium', suggestion: '请检查音量设置、静音状态和音频线。' },
    杂音: { text: '有杂音', priority: 'medium', suggestion: '请检查音频线是否插好，尝试更换连接线。' },
    啸叫: { text: '啸叫', priority: 'medium', suggestion: '请调整麦克风和扬声器的距离。' },
    漏水: { text: '漏水', priority: 'high', suggestion: '请立即关闭水源并报修，避免损坏其他设备。' },
    滴水: { text: '滴水', priority: 'high', suggestion: '请立即关闭水源并报修。' },
    不出水: { text: '不出水', priority: 'medium', suggestion: '请检查水源开关和滤网是否堵塞。' },
    水温不正常: { text: '水温异常', priority: 'medium', suggestion: '请检查温度设置。' },
    网速慢: { text: '网速慢', priority: 'low', suggestion: '请检查网络连接或重启路由器。' },
    断网: { text: '断网', priority: 'medium', suggestion: '请检查网线连接或切换WiFi。' },
    连不上: { text: '无法连接', priority: 'medium', suggestion: '请检查网络设置和密码。' },
    信号差: { text: '信号差', priority: 'low', suggestion: '请靠近路由器或检查网络环境。' },
    门打不开: { text: '门打不开', priority: 'high', suggestion: '请检查门禁卡是否有效，尝试重新刷卡。' },
    锁不上: { text: '无法上锁', priority: 'high', suggestion: '请检查门锁状态，确保门完全关闭。' },
    刷卡没反应: { text: '刷卡无效', priority: 'medium', suggestion: '请检查门禁卡是否在有效期内。' },
    发热: { text: '异常发热', priority: 'high', suggestion: '请立即关闭设备并报修，防止损坏。' },
    烫手: { text: '温度过高', priority: 'high', suggestion: '请立即关闭设备并报修！' },
    异味: { text: '有异味', priority: 'high', suggestion: '请立即关闭设备电源并通风！' },
    冒烟: { text: '冒烟', priority: 'high', suggestion: '⚠️ 紧急！请立即断电并撤离现场！' },
    抖动: { text: '抖动', priority: 'medium', suggestion: '请检查设备是否放置平稳。' },
    异响: { text: '异响', priority: 'medium', suggestion: '请检查是否有异物进入设备。' },
    松动: { text: '松动', priority: 'low', suggestion: '请检查螺丝是否拧紧。' },
    脱落: { text: '脱落', priority: 'high', suggestion: '请立即停止使用并报修。' },
  }
  
  const symptoms = Object.keys(symptomMap)
  for (const s of symptoms) {
    if (intent.slots.room?.includes(s) || intent.slots.building?.includes(s) || 
        intent.slots.device?.includes(s)) {
      const info = symptomMap[s]
      symptom = info.text
      suggestion = info.suggestion
      priority = info.priority
      break
    }
  }
  
  if (!suggestion) {
    const deviceSuggestions: Record<string, string> = {
      projector: '请检查投影设备的电源、信号输入和遥控器。',
      ac: '请检查空调遥控器电池和模式设置。',
      light: '请检查灯光开关和灯泡是否损坏。',
      mic: '请检查麦克风电池和音量设置。',
      whiteboard: '请检查触控笔电池和连接。',
      screen: '请检查显示设备的输入源和连接。',
      computer: '请尝试重启电脑或检查显示器连接。',
      network: '请检查网络连接或尝试切换WiFi。',
      lock: '请检查门禁卡是否有效。',
      water: '请检查水源开关和设备电源。',
      fan: '请检查风扇电源和转速设置。',
      furniture: '请小心使用，避免进一步损坏。',
      unknown: '请检查设备电源和基本设置。',
    }
    suggestion = deviceSuggestions[device] || '请检查设备电源和基本设置。'
  }
  
  return { deviceName, symptom, suggestion, priority }
}

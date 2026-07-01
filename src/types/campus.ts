// CampusTwin 核心数据契约

export type RoomType = 'meeting' | 'classroom' | 'venue' | 'lab'
export type RoomStatus = 'free' | 'busy' | 'repair'

export interface Room {
  id: string
  name: string
  type: RoomType
  floorId: string
  capacity: number
  equipment: string[]
  status: RoomStatus
  schedule: ScheduleEntry[]
}

export interface ScheduleEntry {
  start: string
  end: string
  by: string
}

export interface Floor {
  id: string
  buildingId: string
  level: number
  rooms: Room[]
}

export interface Building {
  id: string
  name: string
  position: [number, number]
  floors: Floor[]
  color?: string
}

export interface Device {
  id: string
  roomId: string
  type: 'projector' | 'ac' | 'light' | 'mic'
  status: 'ok' | 'fault'
  name: string
}

export interface Booking {
  id: string
  roomId: string
  user: string
  start: string
  end: string
  status: 'ok' | 'cancelled'
}

export interface Ticket {
  id: string
  deviceId: string
  roomId: string
  desc: string
  status: 'new' | 'doing' | 'done'
  assignee: string
  createdAt: string
}

export interface Energy {
  buildingId: string
  kwh: number
  ts: string
}

export interface Traffic {
  zoneId: string
  count: number
  ts: string
}

export interface User {
  id: string
  role: 'student' | 'teacher' | 'admin' | 'visitor'
  name: string
}

// Agent 意图
export interface Intent {
  intent: 'book_room' | 'find_free_classroom' | 'repair' | 'navigate' | 'admin_overview' | 'unknown'
  slots: {
    time?: string
    equipment?: string[]
    building?: string
    room?: string
    device?: string
    target?: string
  }
  agent: string
  confidence: number
}

// 聊天消息
export interface ChatMsg {
  id: string
  role: 'user' | 'agent' | 'system'
  text: string
  timestamp: number
  intent?: Intent
  steps?: DispatchStep[]
}

export interface DispatchStep {
  label: string
  status: 'pending' | 'running' | 'done' | 'error'
  detail?: string
}

// 右栏面板类型
export type PanelType = 'welcome' | 'booking' | 'repair' | 'navigate' | 'admin'

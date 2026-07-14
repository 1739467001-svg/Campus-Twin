<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCampusStore } from '../stores/campusStore'

const store = useCampusStore()

const selectedBuilding = ref<string>('')
const selectedFloor = ref<number>(0)
const selectedTime = ref<string>('')

const timeOptions = [
  { value: '08:00-10:00', label: '08:00-10:00' },
  { value: '10:00-12:00', label: '10:00-12:00' },
  { value: '14:00-16:00', label: '14:00-16:00' },
  { value: '16:00-18:00', label: '16:00-18:00' },
  { value: '18:00-20:00', label: '18:00-20:00' },
]

const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']

function typeLabel(t: string) {
  const m: Record<string, string> = { meeting: '会议室', classroom: '教室', venue: '场馆', lab: '实验室' }
  return m[t] || t
}

function getBuildingForRoom(roomId: string): string {
  for (const b of store.buildings)
    for (const f of b.floors)
      for (const r of f.rooms)
        if (r.id === roomId) return b.name
  return ''
}

function getFloorForRoom(roomId: string): number {
  for (const b of store.buildings)
    for (const f of b.floors)
      for (const r of f.rooms)
        if (r.id === roomId) return f.level
  return 0
}

function isSlotAvailable(roomId: string, slotIdx: number): boolean {
  const room = store.findRoomById(roomId)
  if (!room) return false
  
  const slotTime = timeSlots[slotIdx]
  const nextSlotTime = timeSlots[slotIdx + 1] || '21:00'
  
  for (const schedule of room.schedule) {
    if (isTimeOverlap(slotTime, nextSlotTime, schedule.start, schedule.end)) {
      return false
    }
  }
  
  for (const booking of store.bookings) {
    if (booking.roomId === roomId && booking.status === 'ok') {
      if (isTimeOverlap(slotTime, nextSlotTime, booking.start, booking.end)) {
        return false
      }
    }
  }
  
  return room.status !== 'repair'
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

const filteredRooms = computed(() => {
  let rooms = [...store.candidateRooms]
  
  if (selectedBuilding.value) {
    rooms = rooms.filter(r => getBuildingForRoom(r.id) === selectedBuilding.value)
  }
  if (selectedFloor.value > 0) {
    rooms = rooms.filter(r => getFloorForRoom(r.id) === selectedFloor.value)
  }
  
  if (rooms.length === 0) {
    rooms = store.allRooms.filter(r => r.type === 'meeting' && r.status !== 'repair')
  }
  
  return rooms
})

const buildings = computed(() => {
  const bldNames = new Set<string>()
  store.buildings.forEach(b => {
    b.floors.forEach(f => {
      f.rooms.forEach(r => {
        if (r.type === 'meeting') bldNames.add(b.name)
      })
    })
  })
  return ['', ...Array.from(bldNames)]
})

const floors = computed(() => {
  if (!selectedBuilding.value) return [0]
  const bld = store.buildings.find(b => b.name === selectedBuilding.value)
  if (!bld) return [0]
  const floorNums = new Set<number>()
  bld.floors.forEach(f => {
    f.rooms.forEach(r => {
      if (r.type === 'meeting') floorNums.add(f.level)
    })
  })
  return [0, ...Array.from(floorNums).sort((a, b) => a - b)]
})

watch(selectedBuilding, () => {
  selectedFloor.value = 0
})

watch(() => store.bookingTimeRange, (range) => {
  if (range) {
    selectedTime.value = `${range.start}-${range.end}`
  }
})

function handleRoomSelect(roomId: string) {
  const room = store.findRoomById(roomId)
  if (room) {
    store.selectedRoom = room
    store.setHighlight([roomId], '#3b82f6')
  }
}

function confirmBooking(roomId: string) {
  const [start, end] = selectedTime.value.split('-')
  store.confirmBooking(roomId, start || '14:00', end || '16:00')
}
</script>

<template>
  <div class="animate-slide-up h-full flex flex-col">
    <div class="px-3 py-2 border-b border-zjgsu-blue-500/10 bg-zjgsu-blue-900/30">
      <h3 class="text-xs font-semibold text-white flex items-center gap-1.5">
        <span class="w-1 h-2.5 rounded-full bg-gradient-to-b from-zjgsu-blue-400 to-zjgsu-blue-600"></span>
        一句话预约
      </h3>
    </div>

    <div class="p-3 space-y-2 border-b border-zjgsu-blue-500/5">
      <div class="grid grid-cols-2 gap-2">
        <select 
          v-model="selectedBuilding" 
          class="glass-select w-full px-2 py-1.5 text-white text-[10px] focus:border-zjgsu-blue-400 focus:outline-none transition-colors"
        >
          <option value="">全部建筑</option>
          <option v-for="b in buildings" :key="b" :value="b">{{ b }}</option>
        </select>
        <select 
          v-model="selectedFloor" 
          class="glass-select w-full px-2 py-1.5 text-white text-[10px] focus:border-zjgsu-blue-400 focus:outline-none transition-colors"
        >
          <option :value="0">全部楼层</option>
          <option v-for="f in floors" :key="f" :value="f">{{ f }}楼</option>
        </select>
      </div>
      <select 
        v-model="selectedTime" 
        class="glass-select w-full px-2 py-1.5 text-white text-[10px] focus:border-zjgsu-blue-400 focus:outline-none transition-colors"
      >
        <option value="">选择时间段</option>
        <option v-for="t in timeOptions" :key="t.value" :value="t.value">{{ t.label }}</option>
      </select>
    </div>

    <div v-if="filteredRooms.length === 0" class="flex-1 flex items-center justify-center text-zjgsu-blue-200/50 text-xs p-4">
      <div class="text-center">
        <div class="w-10 h-10 rounded-xl bg-zjgsu-blue-500/8 flex items-center justify-center mx-auto mb-2">
          <span class="text-xl">🏢</span>
        </div>
        <p>暂无可用会议室</p>
        <p class="text-[9px] mt-0.5 text-zjgsu-blue-200/30">调整筛选条件试试</p>
      </div>
    </div>

    <div v-else class="flex-1 p-3 space-y-2 overflow-y-auto">
      <div class="flex items-center justify-between mb-1">
        <span class="text-[9px] text-zjgsu-blue-200/40">共 <span class="text-zjgsu-blue-300 font-semibold">{{ filteredRooms.length }}</span> 间</span>
        <div class="flex items-center gap-2 text-[8px]">
          <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-green-400"></span>空闲</span>
          <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-zjgsu-blue-400"></span>占用</span>
        </div>
      </div>
      
      <div 
        v-for="room in filteredRooms" 
        :key="room.id"
        class="glass-card p-2.5 cursor-pointer group"
        @click="handleRoomSelect(room.id)"
      >
        <div class="flex items-center justify-between mb-1.5">
          <div>
            <span class="font-semibold text-white text-xs">{{ getBuildingForRoom(room.id) }}</span>
            <span class="text-zjgsu-blue-300/50 text-[9px] ml-1">· {{ getFloorForRoom(room.id) }}楼</span>
          </div>
          <span class="tag-green">可预约</span>
        </div>
        <div class="flex items-center gap-2 text-[10px] text-zjgsu-blue-200/50 mb-1.5">
          <span class="font-medium text-white">{{ room.name }}</span>
          <span>{{ typeLabel(room.type) }}</span>
          <span>容量 {{ room.capacity }} 人</span>
        </div>
        <div v-if="room.equipment.length" class="flex flex-wrap gap-1 mb-1.5">
          <span 
            v-for="eq in room.equipment" 
            :key="eq"
            class="tag-blue"
          >
            {{ {projector:'投影',ac:'空调',mic:'麦克风',whiteboard:'白板',screen:'屏幕',computer:'电脑'}[eq] || eq }}
          </span>
        </div>
        
        <div class="mb-1.5">
          <div class="text-[8px] text-zjgsu-blue-200/30 mb-1 flex items-center gap-1">
            <span class="w-1 h-1 rounded-full bg-zjgsu-blue-400/30"></span>
            时间安排
          </div>
          <div class="flex gap-0.5 h-4">
            <div 
              v-for="(slot, idx) in timeSlots.slice(0, -1)" 
              :key="slot"
              class="flex-1 rounded text-[7px] flex items-center justify-center"
              :class="isSlotAvailable(room.id, idx) ? 'bg-green-500/15 text-green-400' : 'bg-zjgsu-blue-500/20 text-zjgsu-blue-300/30'"
            >
              {{ slot.split(':')[0] }}
            </div>
          </div>
        </div>
        
        <div v-if="room.schedule.length" class="text-[9px] text-zjgsu-blue-200/40 mb-1.5 flex flex-wrap gap-1">
          <span v-for="(s, i) in room.schedule" :key="i" class="tag-blue">
            {{ s.start }}-{{ s.end }}
          </span>
        </div>
        
        <button 
          @click.stop="confirmBooking(room.id)"
          :disabled="!selectedTime"
          class="w-full py-1.5 bg-gradient-to-r from-zjgsu-blue-600 to-zjgsu-blue-500 hover:from-zjgsu-blue-500 hover:to-zjgsu-blue-400 disabled:from-zjgsu-blue-800/30 disabled:to-zjgsu-blue-700/30 disabled:cursor-not-allowed text-white text-[10px] font-medium rounded-lg transition-all"
        >
          {{ selectedTime ? `预约 ${selectedTime}` : '请选择时间段' }}
        </button>
      </div>
    </div>

    <div v-if="store.bookings.filter(b => b.user === store.currentUser.name).length" class="border-t border-zjgsu-blue-500/5 p-3">
      <h4 class="text-[9px] font-semibold text-zjgsu-blue-200/50 mb-2 flex items-center gap-1">
        <span class="text-zjgsu-gold-400">📅</span> 我的预约
      </h4>
      <div v-for="bk in store.bookings.filter(b => b.user === store.currentUser.name)" :key="bk.id"
        class="text-[10px] bg-zjgsu-gold-500/8 border border-zjgsu-gold-500/15 rounded-lg p-2 mb-1.5 flex items-center justify-between"
      >
        <span class="text-zjgsu-gold-200/80">{{ getBuildingForRoom(bk.roomId) }} {{ store.findRoomById(bk.roomId)?.name }} · {{ bk.start }}-{{ bk.end }}</span>
        <span class="tag-gold">已预约</span>
      </div>
    </div>
  </div>
</template>
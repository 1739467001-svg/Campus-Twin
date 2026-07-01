<script setup lang="ts">
import { useCampusStore } from '../stores/campusStore'

const store = useCampusStore()

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
</script>

<template>
  <div class="animate-slideUp">
    <div class="px-4 py-3 border-b border-slate-100 bg-white">
      <h3 class="font-semibold text-slate-800 text-sm flex items-center gap-2">
        <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
        预约 / 找空教室
      </h3>
      <p class="text-[11px] text-slate-400 mt-0.5">选择下方房间并确认预约</p>
    </div>

    <div v-if="store.candidateRooms.length === 0" class="p-6 text-center text-slate-400 text-sm">
      <svg class="w-10 h-10 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
      暂无候选房间<br/>试试说"帮我订会议室"
    </div>

    <div v-else class="p-3 space-y-2 max-h-[calc(100vh-240px)] overflow-y-auto">
      <div v-for="room in store.candidateRooms" :key="room.id"
        class="border border-slate-200 rounded-xl p-3 hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer group"
        @click="store.confirmBooking(room.id)">
        <div class="flex items-center justify-between mb-1.5">
          <span class="font-medium text-slate-800 text-sm">{{ getBuildingForRoom(room.id) }} {{ room.name }}</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded-full" :class="room.status === 'free' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'">
            {{ room.status === 'free' ? '可预约' : room.status }}
          </span>
        </div>
        <div class="flex items-center gap-3 text-[11px] text-slate-500">
          <span>{{ typeLabel(room.type) }}</span>
          <span>容量 {{ room.capacity }} 人</span>
          <span v-if="room.equipment.length" class="truncate">{{ room.equipment.join(' · ') }}</span>
        </div>
        <div v-if="room.schedule.length" class="mt-1.5 text-[10px] text-slate-400">
          已有安排: <span v-for="(s, i) in room.schedule" :key="i">{{ s.start }}-{{ s.end }} {{ s.by }}<span v-if="i < room.schedule.length - 1">, </span></span>
        </div>
        <div class="mt-2 text-[11px] text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">点击确认预约 →</div>
      </div>
    </div>

    <!-- 我的预约 -->
    <div v-if="store.bookings.filter(b => b.user === store.currentUser.name).length" class="border-t border-slate-200 p-3">
      <h4 class="text-xs font-semibold text-slate-600 mb-2">我的预约</h4>
      <div v-for="bk in store.bookings.filter(b => b.user === store.currentUser.name)" :key="bk.id"
        class="text-[11px] bg-blue-50 rounded-lg p-2 mb-1 flex items-center justify-between">
        <span>{{ getBuildingForRoom(bk.roomId) }} {{ store.findRoomById(bk.roomId)?.name }} · {{ bk.start }}-{{ bk.end }}</span>
        <span class="text-blue-600">{{ bk.id }}</span>
      </div>
    </div>
  </div>
</template>

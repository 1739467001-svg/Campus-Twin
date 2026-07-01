<script setup lang="ts">
import { ref } from 'vue'
import { useCampusStore } from '../stores/campusStore'

const store = useCampusStore()
const desc = ref('')

function getBuildingForRoom(roomId: string): string {
  for (const b of store.buildings)
    for (const f of b.floors)
      for (const r of f.rooms)
        if (r.id === roomId) return b.name
  return ''
}

function statusLabel(s: string) {
  const m: Record<string, string> = { new: '待受理', doing: '处理中', done: '已完成' }
  return m[s] || s
}

function statusColor(s: string) {
  const m: Record<string, string> = { new: 'bg-yellow-100 text-yellow-700', doing: 'bg-blue-100 text-blue-700', done: 'bg-green-100 text-green-700' }
  return m[s] || 'bg-slate-100 text-slate-500'
}

function submit() {
  const room = store.selectedRoom
  if (!room) return
  const d = desc.value.trim() || '设备故障需维修'
  store.submitRepair(room.id, 'projector', d)
  desc.value = ''
}
</script>

<template>
  <div class="animate-slideUp">
    <div class="px-4 py-3 border-b border-slate-100 bg-white">
      <h3 class="font-semibold text-slate-800 text-sm flex items-center gap-2">
        <svg class="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17l-5.7-3.29a.75.75 0 01-.02-1.3l5.7-3.29a.75.75 0 01.76 0l5.7 3.29a.75.75 0 01.02 1.3l-5.7 3.29a.75.75 0 01-.76 0zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        设备报修
      </h3>
    </div>

    <!-- 报修表单 -->
    <div class="p-4 space-y-3">
      <template v-if="store.selectedRoom">
        <div class="bg-red-50 rounded-lg p-3 border border-red-200">
          <div class="text-xs text-red-600 font-medium mb-1">故障位置</div>
          <div class="text-sm font-semibold text-slate-800">{{ getBuildingForRoom(store.selectedRoom.id) }} {{ store.selectedRoom.name }}</div>
        </div>
        <div>
          <label class="text-xs text-slate-500 block mb-1">故障描述</label>
          <textarea v-model="desc" rows="3"
            class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none placeholder:text-slate-400"
            placeholder="描述故障情况，如：投影仪无法开机..."></textarea>
        </div>
        <button @click="submit"
          class="w-full h-9 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors cursor-pointer">
          提交报修工单
        </button>
      </template>
      <template v-else>
        <div class="text-center text-slate-400 text-sm py-6">
          <p>请在地图上点击故障房间，或告诉我具体位置</p>
          <p class="text-xs mt-1">例如："商大楼302投影坏了"</p>
        </div>
      </template>
    </div>

    <!-- 已有工单 -->
    <div class="border-t border-slate-200 p-3">
      <h4 class="text-xs font-semibold text-slate-600 mb-2">报修工单</h4>
      <div v-for="tk in store.tickets" :key="tk.id"
        class="border border-slate-200 rounded-lg p-2.5 mb-2">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-medium text-slate-700">{{ getBuildingForRoom(tk.roomId) }} {{ store.findRoomById(tk.roomId)?.name }}</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded-full" :class="statusColor(tk.status)">{{ statusLabel(tk.status) }}</span>
        </div>
        <div class="text-[11px] text-slate-500 mb-1">{{ tk.desc }}</div>
        <div class="flex items-center justify-between text-[10px] text-slate-400">
          <span>{{ tk.assignee }} · {{ tk.createdAt }}</span>
          <button v-if="tk.status !== 'done'" @click.stop="store.advanceTicket(tk.id)"
            class="text-blue-600 hover:underline cursor-pointer">推进状态 →</button>
        </div>
      </div>
    </div>
  </div>
</template>

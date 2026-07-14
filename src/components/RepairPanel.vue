<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCampusStore } from '../stores/campusStore'

const store = useCampusStore()
const desc = ref('')

const selectedDevice = ref('')
const deviceType = computed(() => selectedDevice.value || store.repairDeviceSlot || 'projector')

const deviceOptions = [
  { value: 'projector', label: '投影仪' },
  { value: 'ac', label: '空调' },
  { value: 'light', label: '灯光' },
  { value: 'mic', label: '麦克风' },
  { value: 'whiteboard', label: '电子白板' },
  { value: 'screen', label: '显示屏' },
  { value: 'computer', label: '电脑' },
  { value: 'network', label: '网络/WiFi' },
  { value: 'lock', label: '门锁/门禁' },
  { value: 'water', label: '饮水机' },
  { value: 'fan', label: '风扇' },
  { value: 'furniture', label: '桌椅' },
]

watch(() => store.repairDeviceSlot, (v) => { if (v) selectedDevice.value = v })

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
  const m: Record<string, string> = { new: 'bg-red-500/20 text-red-400', doing: 'bg-zjgsu-blue-500/20 text-zjgsu-blue-400', done: 'bg-green-500/20 text-green-400' }
  return m[s] || 'bg-zjgsu-blue-500/10 text-zjgsu-blue-200/60'
}

function submit() {
  const room = store.selectedRoom
  if (!room) return
  const d = desc.value.trim() || '设备故障需维修'
  store.submitRepair(room.id, deviceType.value, d)
  desc.value = ''
  selectedDevice.value = ''
}
</script>

<template>
  <div class="animate-slide-up">
    <div class="px-3 py-2 border-b border-zjgsu-blue-500/10 bg-zjgsu-blue-900/30">
      <h3 class="text-xs font-semibold text-white flex items-center gap-1.5">
        <span class="w-1 h-2.5 rounded-full bg-gradient-to-b from-red-400 to-red-600"></span>
        设备报修
      </h3>
    </div>

    <div class="p-3 space-y-2">
      <template v-if="store.selectedRoom">
        <div class="bg-red-500/8 rounded-lg p-2.5 border border-red-500/15">
          <div class="text-[9px] text-red-400 font-medium mb-1">故障位置</div>
          <div class="text-xs font-semibold text-white">{{ getBuildingForRoom(store.selectedRoom.id) }} {{ store.selectedRoom.name }}</div>
        </div>
        <div>
          <label class="text-[9px] text-zjgsu-blue-200/50 block mb-1">故障设备</label>
          <div class="flex flex-wrap gap-1">
            <button v-for="opt in deviceOptions" :key="opt.value"
              @click="selectedDevice = opt.value"
              class="text-[9px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer"
              :class="deviceType === opt.value ? 'bg-red-500/15 text-red-400 border-red-500/30' : 'border-zjgsu-blue-500/10 text-zjgsu-blue-200/50 hover:border-red-500/20'">
              {{ opt.label }}
            </button>
          </div>
        </div>
        <div>
          <label class="text-[9px] text-zjgsu-blue-200/50 block mb-1">故障描述</label>
          <textarea v-model="desc" rows="2"
            class="glass-input w-full px-2 py-1.5 text-[10px] resize-none"
            placeholder="描述故障情况..."></textarea>
        </div>
        <button @click="submit"
          class="w-full py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/25 text-[10px] font-medium hover:bg-red-500/25 transition-colors cursor-pointer">
          提交报修工单
        </button>
      </template>
      <template v-else>
        <div class="text-center text-zjgsu-blue-200/40 text-xs py-4">
          <div class="w-10 h-10 rounded-xl bg-zjgsu-blue-500/8 flex items-center justify-center mx-auto mb-2">
            <span class="text-xl">🔧</span>
          </div>
          <p>请在3D场景中点击故障房间</p>
          <p class="text-[9px] mt-1">或告诉Agent具体位置</p>
        </div>
      </template>
    </div>

    <div class="border-t border-zjgsu-blue-500/5 p-3">
      <h4 class="text-[9px] font-semibold text-zjgsu-blue-200/50 mb-2 flex items-center gap-1">
        <span class="text-red-400">📋</span> 报修工单
      </h4>
      <div v-for="tk in store.tickets" :key="tk.id"
        class="glass-card p-2 mb-1.5">
        <div class="flex items-center justify-between mb-1">
          <span class="text-[10px] font-medium text-white">{{ getBuildingForRoom(tk.roomId) }} {{ store.findRoomById(tk.roomId)?.name }}</span>
          <span class="text-[9px] px-1.5 py-0.5 rounded" :class="statusColor(tk.status)">{{ statusLabel(tk.status) }}</span>
        </div>
        <div class="text-[9px] text-zjgsu-blue-200/40 mb-1">{{ tk.desc }}</div>
        <div class="flex items-center justify-between text-[9px] text-zjgsu-blue-200/30">
          <span>{{ tk.assignee }} · {{ tk.createdAt }}</span>
          <button v-if="tk.status !== 'done'" @click.stop="store.advanceTicket(tk.id)"
            class="text-zjgsu-blue-400 hover:text-zjgsu-blue-300 cursor-pointer">推进</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCampusStore } from '../stores/campusStore'

const store = useCampusStore()

const stats = computed(() => {
  const total = store.allRooms.length
  const free = store.allRooms.filter((r: { status: string }) => r.status === 'free').length
  const busy = store.allRooms.filter((r: { status: string }) => r.status === 'busy').length
  const repair = store.allRooms.filter((r: { status: string }) => r.status === 'repair').length
  return { total, free, busy, repair, rate: Math.round((busy / total) * 100) }
})
</script>

<template>
  <div class="animate-slide-up p-4 space-y-3">
    <div class="text-[10px] text-zjgsu-blue-200/60 font-medium mb-1">校园资源概览</div>
    <div class="grid grid-cols-2 gap-2">
      <div class="stat-card">
        <div class="text-[9px] text-zjgsu-blue-200/50 mb-0.5">总房间数</div>
        <div class="text-lg font-bold text-white">{{ stats.total }}</div>
        <div class="text-[8px] text-zjgsu-blue-200/40 mt-0.5">覆盖5栋楼宇</div>
      </div>
      <div class="stat-card">
        <div class="text-[9px] text-green-300/50 mb-0.5">空闲房间</div>
        <div class="text-lg font-bold text-green-400">{{ stats.free }}</div>
        <div class="text-[8px] text-green-300/40 mt-0.5">可立即预约</div>
      </div>
    </div>

    <div class="bg-dark-surface3/40 rounded-lg p-2.5 border border-dark-border">
      <div class="flex items-center justify-between mb-2">
        <span class="text-[9px] text-dark-text3 font-medium">房间占用率</span>
        <span class="text-[10px] font-bold text-dark-accent">{{ stats.rate }}%</span>
      </div>
      <div class="h-2 bg-dark-surface4 rounded-full overflow-hidden">
        <div class="h-full bg-gradient-to-r from-dark-accent to-dark-accent/50 rounded-full" :style="{ width: stats.rate + '%' }"></div>
      </div>
      <div class="flex items-center justify-between mt-1.5 text-[8px] text-dark-text4">
        <span>已占用 {{ stats.busy }} 间</span>
        <span>报修中 {{ stats.repair }} 间</span>
      </div>
    </div>

    <div class="text-[10px] text-zjgsu-blue-200/60 font-medium mb-1">快捷服务</div>
    <div class="grid grid-cols-2 gap-1.5">
      <button @click="store.activePanel = 'booking'" class="quick-btn">
        <span>预约会议</span>
      </button>
      <button @click="store.activePanel = 'repair'" class="quick-btn">
        <span>设备报修</span>
      </button>
      <button @click="store.activePanel = 'admin'" class="quick-btn">
        <span>管理态势</span>
      </button>
      <button @click="store.activePanel = 'navigate'" class="quick-btn">
        <span>寻路导航</span>
      </button>
    </div>

    <div v-if="store.selectedRoom" class="selected-room-card">
      <div class="flex items-center justify-between mb-1">
        <span class="text-[9px] text-zjgsu-blue-200/60 font-medium">选中房间</span>
        <div class="w-1.5 h-1.5 rounded-full animate-pulse" :class="store.selectedRoom.status === 'free' ? 'bg-green-400' : store.selectedRoom.status === 'busy' ? 'bg-zjgsu-gold-400' : 'bg-red-400'"></div>
      </div>
      <div class="text-xs font-medium text-white">{{ store.getRoomFullName(store.selectedRoom) }}</div>
      <div class="text-[9px] text-zjgsu-blue-200/50 mt-0.5">
        {{ store.selectedRoom.type === 'meeting' ? '会议室' : store.selectedRoom.type === 'classroom' ? '教室' : store.selectedRoom.type === 'venue' ? '场馆' : '实验室' }}
        · 容量 {{ store.selectedRoom.capacity }} 人
      </div>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  padding: 8px 10px;
}

.quick-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  padding: 8px;
  color: rgba(232, 240, 250, 0.5);
  font-size: 9px;
  transition: all 0.2s;
  gap: 2px;
}

.quick-btn:hover {
  background: rgba(37, 150, 235, 0.1);
  color: #e8f0fa;
}

.selected-room-card {
  background: rgba(37, 150, 235, 0.06);
  border: 1px solid rgba(37, 150, 235, 0.15);
  border-radius: 8px;
  padding: 10px;
}
</style>

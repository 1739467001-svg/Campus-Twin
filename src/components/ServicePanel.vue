<script setup lang="ts">
import { useCampusStore } from '../stores/campusStore'
import WelcomePanel from './WelcomePanel.vue'
import BookingPanel from './BookingPanel.vue'
import RepairPanel from './RepairPanel.vue'
import AdminPanel from './AdminPanel.vue'
import NavigatePanel from './NavigatePanel.vue'

const store = useCampusStore()

function panelLabel(p: string) {
  const m: Record<string, string> = { welcome: '首页', booking: '预约', repair: '报修', admin: '态势', navigate: '导航' }
  return m[p] || p
}
</script>

<template>
  <aside class="w-[340px] shrink-0 flex flex-col relative overflow-hidden glass-panel">
    <div class="absolute inset-0 bg-gradient-to-br from-zjgsu-blue-900/60 via-zjgsu-blue-950/70 to-zjgsu-blue-900/60"></div>
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(37,150,235,0.1),transparent_50%)]"></div>
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.05),transparent_50%)]"></div>
    <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zjgsu-blue-400/20 to-transparent"></div>
    
    <div class="relative z-10 flex flex-col h-full">
      <div class="h-12 px-3 py-2 flex items-center shrink-0">
        <div class="flex items-center gap-2">
          <div class="relative">
            <div class="w-2 h-2 rounded-full bg-zjgsu-olive-400"></div>
            <div class="absolute inset-0 w-2 h-2 rounded-full bg-zjgsu-olive-400 blur-md -z-10 opacity-40"></div>
          </div>
          <h2 class="text-xs font-semibold text-white tracking-wider flex items-center gap-1.5">
            <span class="text-zjgsu-olive-400 font-bold">一站式</span>
            <span class="text-zjgsu-blue-200/60">服务台</span>
          </h2>
        </div>
        
        <div class="ml-auto flex items-center gap-1">
          <span class="w-1 h-1 rounded-full bg-green-400 animate-pulse-soft"></span>
          <span class="text-[9px] text-zjgsu-blue-200/50">在线</span>
        </div>
      </div>

      <div class="flex border-b border-white/3 shrink-0 relative">
        <button v-for="p in (['welcome','booking','repair','admin','navigate'] as const)" :key="p"
          @click="store.activePanel = p"
          class="glass-tab flex-shrink-0 py-2.5 px-2 text-[10px] font-medium relative z-10">
          <span :class="store.activePanel === p ? 'text-white' : 'text-zjgsu-blue-300/50'">{{ panelLabel(p) }}</span>
        </button>
        <div v-if="store.activePanel === 'welcome'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-zjgsu-blue-400 to-transparent"></div>
        <div v-if="store.activePanel === 'welcome'" class="absolute bottom-0 left-0 w-[20%] h-0.5 bg-zjgsu-blue-400"></div>
        <div v-if="store.activePanel === 'booking'" class="absolute bottom-0 left-[20%] w-[20%] h-0.5 bg-zjgsu-blue-400"></div>
        <div v-if="store.activePanel === 'repair'" class="absolute bottom-0 left-[40%] w-[20%] h-0.5 bg-zjgsu-blue-400"></div>
        <div v-if="store.activePanel === 'admin'" class="absolute bottom-0 left-[60%] w-[20%] h-0.5 bg-zjgsu-blue-400"></div>
        <div v-if="store.activePanel === 'navigate'" class="absolute bottom-0 left-[80%] w-[20%] h-0.5 bg-zjgsu-blue-400"></div>
      </div>

      <div class="flex-1 overflow-y-auto p-3 custom-scrollbar">
        <div class="glass-content">
          <WelcomePanel v-if="store.activePanel === 'welcome'" />
          <BookingPanel v-if="store.activePanel === 'booking'" />
          <RepairPanel v-if="store.activePanel === 'repair'" />
          <AdminPanel v-if="store.activePanel === 'admin'" />
          <NavigatePanel v-if="store.activePanel === 'navigate'" />
        </div>
      </div>

      <div class="p-3 border-t border-white/3">
        <div class="glass-footer flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <div class="w-1 h-1 rounded-full bg-green-400 animate-pulse-soft"></div>
            <span class="text-[9px] text-zjgsu-blue-300/50 font-medium">响应时间</span>
          </div>
          <div class="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zjgsu-blue-500/8 border border-zjgsu-blue-500/15">
            <svg class="w-3 h-3 text-zjgsu-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span class="text-[9px] text-zjgsu-gold-300 font-bold">≤ 10s</span>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>
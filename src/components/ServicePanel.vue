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
  <aside class="w-[360px] shrink-0 bg-slate-50 flex flex-col border-l border-slate-200 overflow-hidden">
    <!-- Tab 切换 -->
    <div class="flex items-center gap-0.5 px-2 py-2 border-b border-slate-200 bg-white shrink-0">
      <button v-for="p in (['welcome','booking','repair','admin','navigate'] as const)" :key="p"
        @click="store.activePanel = p"
        class="text-[11px] px-2.5 py-1.5 rounded-md transition-colors cursor-pointer"
        :class="store.activePanel === p ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'">
        {{ panelLabel(p) }}
      </button>
    </div>

    <!-- 面板内容 -->
    <div class="flex-1 overflow-y-auto">
      <WelcomePanel v-if="store.activePanel === 'welcome'" />
      <BookingPanel v-if="store.activePanel === 'booking'" />
      <RepairPanel v-if="store.activePanel === 'repair'" />
      <AdminPanel v-if="store.activePanel === 'admin'" />
      <NavigatePanel v-if="store.activePanel === 'navigate'" />
    </div>
  </aside>
</template>

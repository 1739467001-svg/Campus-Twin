<script setup lang="ts">
import { computed } from 'vue'
import { useCampusStore } from '../stores/campusStore'

const store = useCampusStore()

const routeInfo = computed(() => {
  const target = store.navigateTarget
  if (!target) return null
  const bld = store.findBuildingByName(target)
  if (!bld) return { name: target, steps: ['目标暂未定位'], distance: '未知', time: '未知' }

  const routes: Record<string, { steps: string[], distance: string, time: string }> = {
    '商大楼': { steps: ['沿主路直行约 80 米', '在第一个路口左转', '前行 60 米即到'], distance: '约 180 米', time: '约 3 分钟' },
    '信息楼': { steps: ['沿主路直行约 100 米', '在十字路口左转', '前行 120 米，左手边即是'], distance: '约 260 米', time: '约 4 分钟' },
    '图书馆': { steps: ['沿主路直行约 120 米', '在十字路口右转', '前行 80 米，右手边即是'], distance: '约 280 米', time: '约 5 分钟' },
    '艺术楼': { steps: ['沿主路直行约 150 米', '在第二个路口右转', '前行 100 米即到'], distance: '约 320 米', time: '约 5 分钟' },
    '综合楼': { steps: ['沿主路直行约 50 米', '在广场处右转', '前行 40 米即到'], distance: '约 120 米', time: '约 2 分钟' },
  }
  const route = routes[bld.name] || { steps: ['沿校园主路前行'], distance: '约 200 米', time: '约 4 分钟' }
  return { name: bld.name, steps: route.steps, distance: route.distance, time: route.time }
})

function navigateTo(buildingName: string) {
  store.navigateTarget = buildingName
  store.handleUserInput(`带我去${buildingName}`)
}
</script>

<template>
  <div class="animate-slide-up">
    <div class="px-4 py-3 border-b border-zjgsu-blue-500/20 bg-zjgsu-blue-900/40">
      <h3 class="font-semibold text-white text-sm">寻路导航</h3>
      <p class="text-[11px] text-zjgsu-blue-200/70 mt-0.5">新生/访客友好 · 说目的地即可导航</p>
    </div>

    <div class="p-4 space-y-3">
      <div class="bg-zjgsu-blue-500/10 border border-zjgsu-blue-500/20 rounded-lg p-3">
        <div class="text-xs font-medium text-zjgsu-blue-400 mb-1">无障碍导航已开启</div>
        <div class="text-[10px] text-zjgsu-blue-200/60">系统自动规避楼梯路段，优先规划电梯/坡道路线，保障出行安全便捷</div>
      </div>

      <template v-if="routeInfo">
        <div class="space-y-2">
          <div class="flex items-center gap-2.5">
            <div class="w-5 h-5 rounded-full bg-zjgsu-blue-500/30 text-zjgsu-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0">起</div>
            <div>
              <div class="text-sm font-medium text-white">当前位置（校门口）</div>
              <div class="text-[10px] text-zjgsu-blue-200/50">面向校园主路</div>
            </div>
          </div>
          <div class="ml-2 border-l-2 border-dashed border-zjgsu-blue-500/20 pl-5 py-2 space-y-2.5">
            <div v-for="(step, i) in routeInfo.steps" :key="i" class="flex items-center gap-2.5">
              <div class="w-4 h-4 rounded-full bg-zjgsu-blue-950/50 flex items-center justify-center text-[9px] text-zjgsu-blue-200/60 shrink-0">{{ i + 1 }}</div>
              <div class="text-xs text-zjgsu-blue-100">{{ step }}</div>
            </div>
          </div>
          <div class="flex items-center gap-2.5">
            <div class="w-5 h-5 rounded-full bg-green-500/30 text-green-400 flex items-center justify-center text-[10px] font-bold shrink-0">终</div>
            <div>
              <div class="text-sm font-medium text-white">{{ routeInfo.name }}</div>
              <div class="text-[10px] text-zjgsu-blue-200/50">预计步行 {{ routeInfo.time }} · {{ routeInfo.distance }}</div>
            </div>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="text-center text-zjgsu-blue-200/60 text-sm py-4">
          <p>告诉我你要去哪里</p>
          <p class="text-xs mt-1">例如："带我去图书馆"</p>
        </div>
      </template>

      <div class="border-t border-zjgsu-blue-500/15 pt-3">
        <div class="text-xs text-zjgsu-blue-200/70 mb-2">常见目的地</div>
        <div class="flex flex-wrap gap-1.5">
          <button v-for="b in store.buildings" :key="b.id"
            @click="navigateTo(b.name)"
            class="text-[11px] px-2.5 py-1 rounded-full border transition-colors cursor-pointer"
            :class="store.navigateTarget === b.name ? 'bg-zjgsu-blue-500/20 text-zjgsu-blue-400 border-zjgsu-blue-500/40' : 'border-zjgsu-blue-500/15 text-zjgsu-blue-200/70 hover:bg-zjgsu-blue-500/15 hover:border-zjgsu-blue-500/30'">
            {{ b.name }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

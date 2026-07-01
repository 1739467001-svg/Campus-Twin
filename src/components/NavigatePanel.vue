<script setup lang="ts">
import { useCampusStore } from '../stores/campusStore'

const store = useCampusStore()
</script>

<template>
  <div class="animate-slideUp">
    <div class="px-4 py-3 border-b border-slate-100 bg-white">
      <h3 class="font-semibold text-slate-800 text-sm flex items-center gap-2">
        <svg class="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>
        寻路导航
      </h3>
      <p class="text-[11px] text-slate-400 mt-0.5">新生/访客友好 · 说目的地即可导航</p>
    </div>

    <div class="p-4 space-y-3">
      <!-- 无障碍提示 -->
      <div class="bg-cyan-50 border border-cyan-200 rounded-xl p-3">
        <div class="flex items-center gap-2 text-xs font-medium text-cyan-700">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
          无障碍导航已开启
        </div>
        <div class="text-[10px] text-cyan-600 mt-1">系统自动规避楼梯路段，优先规划电梯/坡道路线</div>
      </div>

      <!-- 路线步骤 -->
      <div class="space-y-2">
        <div class="flex items-center gap-3">
          <div class="w-7 h-7 rounded-full bg-cyan-600 text-white flex items-center justify-center text-xs font-bold shrink-0">起</div>
          <div>
            <div class="text-sm font-medium text-slate-800">当前位置（校门口）</div>
            <div class="text-[10px] text-slate-400">面向校园主路</div>
          </div>
        </div>
        <div class="ml-3 border-l-2 border-dashed border-cyan-300 pl-6 py-2 space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-600 shrink-0">1</div>
            <div class="text-xs text-slate-600">沿主路直行约 120 米</div>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-600 shrink-0">2</div>
            <div class="text-xs text-slate-600">在十字路口右转</div>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-600 shrink-0">3</div>
            <div class="text-xs text-slate-600">前行 80 米，右手边即是</div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div class="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold shrink-0">终</div>
          <div>
            <div class="text-sm font-medium text-slate-800">图书馆</div>
            <div class="text-[10px] text-slate-400">预计步行 5 分钟 · 约 280 米</div>
          </div>
        </div>
      </div>

      <!-- 目的地列表 -->
      <div class="border-t border-slate-200 pt-3">
        <div class="text-xs text-slate-500 mb-2">常见目的地</div>
        <div class="flex flex-wrap gap-1.5">
          <button v-for="b in store.buildings" :key="b.id"
            class="text-[11px] px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 hover:bg-cyan-50 hover:border-cyan-400 hover:text-cyan-700 transition-colors cursor-pointer">
            {{ b.name }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

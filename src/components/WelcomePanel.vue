<script setup lang="ts">
import { useCampusStore } from '../stores/campusStore'

const store = useCampusStore()
</script>

<template>
  <div class="animate-slideUp p-4">
    <!-- 欢迎 -->
    <div class="text-center mb-5">
      <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/20">
        <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
        </svg>
      </div>
      <h2 class="text-lg font-bold text-slate-800">CampusTwin</h2>
      <p class="text-sm text-slate-500 mt-0.5">校园数字孪生服务台</p>
    </div>

    <!-- 核心价值 -->
    <div class="space-y-2.5 mb-5">
      <div class="flex items-center gap-3 bg-blue-50 rounded-xl p-3">
        <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
          <span class="text-sm font-bold text-blue-600">N→1</span>
        </div>
        <div>
          <div class="text-xs font-semibold text-slate-800">多系统合一</div>
          <div class="text-[10px] text-slate-500">预约/报修/导航/态势 — 一个入口全搞定</div>
        </div>
      </div>
      <div class="flex items-center gap-3 bg-green-50 rounded-xl p-3">
        <div class="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
          <span class="text-sm font-bold text-green-600">10s</span>
        </div>
        <div>
          <div class="text-xs font-semibold text-slate-800">一句话办事</div>
          <div class="text-[10px] text-slate-500">告别登录→找系统→填表→等审批的繁琐流程</div>
        </div>
      </div>
      <div class="flex items-center gap-3 bg-purple-50 rounded-xl p-3">
        <div class="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
        </div>
        <div>
          <div class="text-xs font-semibold text-slate-800">可复制推广</div>
          <div class="text-[10px] text-slate-500">校园→社区→园区，一套方案灵活适配</div>
        </div>
      </div>
      <div class="flex items-center gap-3 bg-amber-50 rounded-xl p-3">
        <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
        </div>
        <div>
          <div class="text-xs font-semibold text-slate-800">包容所有人</div>
          <div class="text-[10px] text-slate-500">新生/访客/无障碍人群，说话就能办事</div>
        </div>
      </div>
    </div>

    <!-- 快捷功能 -->
    <div class="text-xs text-slate-500 mb-2">快速切换面板</div>
    <div class="grid grid-cols-2 gap-2">
      <button @click="store.activePanel = 'booking'" class="text-left p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer">
        <div class="text-xs font-semibold text-slate-700">预约会议室</div>
        <div class="text-[10px] text-slate-400">查看空闲 · 一键预约</div>
      </button>
      <button @click="store.activePanel = 'repair'" class="text-left p-2.5 rounded-xl border border-slate-200 hover:border-orange-400 hover:bg-orange-50 transition-colors cursor-pointer">
        <div class="text-xs font-semibold text-slate-700">设备报修</div>
        <div class="text-[10px] text-slate-400">快速建单 · 跟踪进度</div>
      </button>
      <button @click="store.activePanel = 'admin'" class="text-left p-2.5 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-colors cursor-pointer">
        <div class="text-xs font-semibold text-slate-700">管理态势</div>
        <div class="text-[10px] text-slate-400">KPI · 图表 · 异常告警</div>
      </button>
      <button @click="store.activePanel = 'navigate'" class="text-left p-2.5 rounded-xl border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50 transition-colors cursor-pointer">
        <div class="text-xs font-semibold text-slate-700">寻路导航</div>
        <div class="text-[10px] text-slate-400">新生/访客友好寻路</div>
      </button>
    </div>

    <!-- 房间详情浮层 -->
    <div v-if="store.selectedRoom && store.activePanel === 'welcome'" class="mt-3 border border-blue-200 bg-blue-50 rounded-xl p-3">
      <div class="text-xs font-semibold text-blue-800 mb-1">选中房间</div>
      <div class="text-sm font-bold text-slate-800">{{ store.getRoomFullName(store.selectedRoom) }}</div>
      <div class="text-[11px] text-slate-500">
        {{ store.selectedRoom.type === 'meeting' ? '会议室' : store.selectedRoom.type === 'classroom' ? '教室' : store.selectedRoom.type === 'venue' ? '场馆' : '实验室' }}
        · 容量 {{ store.selectedRoom.capacity }} 人
        · {{ store.selectedRoom.status === 'free' ? '空闲' : store.selectedRoom.status === 'busy' ? '占用' : '报修中' }}
      </div>
    </div>
  </div>
</template>

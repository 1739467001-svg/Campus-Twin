<script setup lang="ts">
import { useCampusStore } from '../stores/campusStore'
const store = useCampusStore()
</script>

<template>
  <header class="h-12 bg-slate-900 border-b border-slate-700 flex items-center px-5 shrink-0">
    <div class="flex items-center gap-3">
      <div class="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
        </svg>
      </div>
      <h1 class="text-white font-semibold text-base tracking-wide">CampusTwin</h1>
      <span class="text-slate-400 text-sm hidden sm:inline">校园数字孪生服务台</span>
    </div>
    <div class="ml-auto flex items-center gap-4">
      <div class="flex items-center gap-2 text-xs text-slate-400">
        <span class="inline-block w-2 h-2 rounded-full bg-green-500"></span>
        <span>N 系统 → 1 入口</span>
      </div>
      <div class="text-xs text-slate-500 hidden md:block">
        一句话 · 10 秒办事
      </div>
      <div class="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full">
        {{ store.currentUser.name }}
      </div>
    </div>
  </header>
</template>

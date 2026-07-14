<script setup lang="ts">
import { useCampusStore } from '../stores/campusStore'
const store = useCampusStore()
</script>

<template>
  <header class="h-14 relative overflow-hidden shrink-0">
    <div class="absolute inset-0 bg-gradient-to-r from-zjgsu-blue-900 via-zjgsu-blue-800 to-zjgsu-blue-900 opacity-90"></div>
    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-zjgsu-blue-500/10 to-transparent animate-shimmer"></div>
    <div class="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-zjgsu-blue-400/20 to-transparent"></div>
    <div class="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-zjgsu-blue-400/20 to-transparent"></div>
    
    <div class="relative h-full flex items-center px-6 backdrop-blur-xl border-b border-zjgsu-blue-500/30">
      <div class="flex items-center gap-4">
        <div class="relative">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-zjgsu-blue-400 via-zjgsu-blue-500 to-zjgsu-blue-600 flex items-center justify-center shadow-glow-blue-lg animate-pulse-glow">
            <svg class="w-5.5 h-5.5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div class="absolute -inset-1.5 bg-zjgsu-blue-400/30 rounded-2xl blur-md -z-10"></div>
        </div>
        <div>
          <h1 class="text-lg font-bold text-white tracking-wide flex items-center gap-2">
            CampusTwin
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-zjgsu-gold-500/20 text-zjgsu-gold-300 border border-zjgsu-gold-500/30 font-normal">v2.0</span>
          </h1>
          <p class="text-[10px] text-zjgsu-blue-200/80">浙江工商大学 · 校园数字孪生服务台</p>
        </div>
      </div>
      
      <div class="ml-auto flex items-center gap-6">
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zjgsu-blue-800/50 border border-zjgsu-blue-600/30">
          <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse-soft"></span>
          <span class="text-xs text-zjgsu-blue-100 font-medium">N 系统 → 1 入口</span>
        </div>
        
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zjgsu-gold-500/10 border border-zjgsu-gold-500/20">
          <svg class="w-3.5 h-3.5 text-zjgsu-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span class="text-xs text-zjgsu-gold-300 font-medium">≤ 10 秒办事</span>
        </div>
        
        <div class="flex items-center gap-2.5 bg-zjgsu-blue-800/60 px-3 py-1.5 rounded-full border border-zjgsu-blue-600/40 hover:border-zjgsu-blue-400/60 transition-all duration-300">
          <div class="relative">
            <div class="w-7 h-7 rounded-full bg-gradient-to-br from-zjgsu-gold-400 to-zjgsu-gold-600 flex items-center justify-center text-zjgsu-blue-900 text-xs font-bold shadow-lg">
              {{ store.currentUser.name.charAt(0) }}
            </div>
            <div class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-zjgsu-blue-800"></div>
          </div>
          <div>
            <span class="text-xs text-white font-medium">{{ store.currentUser.name }}</span>
            <span class="text-[10px] text-zjgsu-blue-200/70 block">演示用户</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zjgsu-blue-400/50 to-transparent"></div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import BrandBar from './components/BrandBar.vue'
import AgentPanel from './components/AgentPanel.vue'
import CampusScene from './components/CampusScene.vue'
import ServicePanel from './components/ServicePanel.vue'

const isLoading = ref(true)

onMounted(() => {
  setTimeout(() => {
    isLoading.value = false
  }, 1500)
})
</script>

<template>
  <div class="w-full h-full flex flex-col">
    <div v-if="isLoading" class="fixed inset-0 z-[1000] flex items-center justify-center bg-zjgsu-blue-950">
      <div class="flex flex-col items-center">
        <div class="relative w-20 h-20 mb-6">
          <div class="absolute inset-0 border-4 border-zjgsu-blue-500/30 rounded-full"></div>
          <div class="absolute inset-0 border-4 border-t-zjgsu-blue-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          <div class="absolute inset-2 border-4 border-zjgsu-gold-400/20 rounded-full"></div>
        </div>
        <div class="text-white font-bold text-xl tracking-widest mb-2">CAMPUS TWIN</div>
        <div class="text-zjgsu-blue-300/60 text-xs tracking-wider">正在构建数字孪生场景...</div>
        <div class="mt-6 w-48 h-1 bg-zjgsu-blue-500/20 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-zjgsu-blue-500 to-zjgsu-gold-400 animate-pulse" style="width: 60%"></div>
        </div>
      </div>
    </div>
    
    <BrandBar />
    <div class="flex flex-1 overflow-hidden">
      <AgentPanel />
      <CampusScene />
      <ServicePanel />
    </div>
  </div>
</template>

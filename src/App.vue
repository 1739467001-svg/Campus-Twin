<script setup lang="ts">
import BrandBar from './components/BrandBar.vue'
import AgentPanel from './components/AgentPanel.vue'
import CampusScene from './components/CampusScene.vue'
import ServicePanel from './components/ServicePanel.vue'
</script>

<template>
  <div class="w-full h-full flex flex-col">
    <BrandBar />
    <div class="flex flex-1 overflow-hidden">
      <AgentPanel />
      <CampusScene />
      <ServicePanel />
    </div>
  </div>
</template>

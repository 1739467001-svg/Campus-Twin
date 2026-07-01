<script setup lang="ts">
import type { DispatchStep } from '../types/campus'

defineProps<{ step: DispatchStep }>()
</script>

<template>
  <div class="flex items-start gap-2 py-1 animate-fadeIn">
    <div class="mt-0.5 shrink-0">
      <div v-if="step.status === 'done'" class="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
        <svg class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
      </div>
      <div v-else-if="step.status === 'running'" class="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
      <div v-else-if="step.status === 'error'" class="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
        <svg class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </div>
      <div v-else class="w-4 h-4 rounded-full border-2 border-slate-400"></div>
    </div>
    <div class="flex-1 min-w-0">
      <span class="text-xs" :class="step.status === 'done' ? 'text-green-400' : step.status === 'running' ? 'text-blue-400' : step.status === 'error' ? 'text-red-400' : 'text-slate-400'">{{ step.label }}</span>
      <div v-if="step.detail" class="text-[10px] text-slate-500 mt-0.5 truncate">{{ step.detail }}</div>
    </div>
  </div>
</template>

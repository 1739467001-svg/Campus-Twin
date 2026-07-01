<script setup lang="ts">
import type { ChatMsg } from '../types/campus'
import IntentStepCard from './IntentStepCard.vue'

defineProps<{ msg: ChatMsg }>()
</script>

<template>
  <div class="animate-fadeIn" :class="msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'">
    <div class="max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap"
      :class="msg.role === 'user'
        ? 'bg-blue-600 text-white rounded-br-sm'
        : msg.role === 'system'
          ? 'bg-slate-700/50 text-slate-300 rounded-bl-sm'
          : 'bg-slate-700 text-slate-200 rounded-bl-sm'">
      <!-- 步骤卡 -->
      <div v-if="msg.steps && msg.steps.length" class="mb-2 pb-2 border-b border-slate-600/50">
        <div class="text-[10px] text-slate-400 mb-1 uppercase tracking-wider">Agent 调度</div>
        <IntentStepCard v-for="(s, i) in msg.steps" :key="i" :step="s" />
      </div>
      {{ msg.text }}
    </div>
  </div>
</template>

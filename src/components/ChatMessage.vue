<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const props = defineProps<{
  msg: { 
    role: 'user' | 'agent' | 'system', 
    text: string, 
    id: string,
    intent?: { intent: string, slots: Record<string, any>, agent: string, confidence: number },
    steps?: { label: string, status: 'pending' | 'running' | 'done' | 'error', detail?: string }[]
  }
}>()

const displayedText = ref('')
const isTyping = ref(false)

function typeText(text: string) {
  displayedText.value = ''
  isTyping.value = true
  let i = 0
  
  const baseDelay = Math.max(15, Math.min(35, 500 / text.length))
  
  const interval = setInterval(() => {
    if (i < text.length) {
      displayedText.value += text[i]
      i++
    } else {
      clearInterval(interval)
      isTyping.value = false
    }
  }, baseDelay)
}

onMounted(() => {
  if (props.msg.role === 'agent') {
    typeText(props.msg.text)
  } else {
    displayedText.value = props.msg.text
  }
})

watch(() => props.msg.text, (newText) => {
  if (props.msg.role === 'agent') {
    typeText(newText)
  }
})

function getStepIcon(status: string) {
  switch(status) {
    case 'running': return '⏳'
    case 'done': return '✓'
    case 'error': return '✗'
    default: return '○'
  }
}

function getStepColor(status: string) {
  switch(status) {
    case 'running': return 'text-zjgsu-gold-400'
    case 'done': return 'text-green-400'
    case 'error': return 'text-red-400'
    default: return 'text-zjgsu-blue-200/40'
  }
}

function getStepBg(status: string) {
  switch(status) {
    case 'running': return 'bg-zjgsu-gold-500/10 border-zjgsu-gold-500/30'
    case 'done': return 'bg-green-500/10 border-green-500/30'
    case 'error': return 'bg-red-500/10 border-red-500/30'
    default: return 'bg-zjgsu-blue-500/5 border-zjgsu-blue-500/10'
  }
}
</script>

<template>
  <div :class="['flex gap-3 animate-fade-in-up', msg.role === 'user' ? 'flex-row-reverse' : '']">
    <div class="relative shrink-0">
      <div :class="['w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-md',
        msg.role === 'user' 
          ? 'bg-gradient-to-br from-zjgsu-gold-400 to-zjgsu-gold-600 text-zjgsu-blue-900' 
          : 'bg-gradient-to-br from-zjgsu-blue-500 to-zjgsu-blue-600 text-white'
      ]">
        {{ msg.role === 'user' ? '我' : 'A' }}
      </div>
      <div :class="['absolute -inset-1 rounded-full blur-md -z-10 opacity-30',
        msg.role === 'user' ? 'bg-zjgsu-gold-400' : 'bg-zjgsu-blue-400'
      ]"></div>
      <div v-if="msg.role === 'agent' && isTyping" class="absolute -bottom-1 left-1/2 -translate-x-1/2">
        <div class="flex gap-0.5">
          <span class="w-1 h-1 rounded-full bg-zjgsu-blue-400 animate-bounce" style="animation-delay: 0ms"></span>
          <span class="w-1 h-1 rounded-full bg-zjgsu-blue-400 animate-bounce" style="animation-delay: 150ms"></span>
          <span class="w-1 h-1 rounded-full bg-zjgsu-blue-400 animate-bounce" style="animation-delay: 300ms"></span>
        </div>
      </div>
    </div>
    <div :class="['max-w-[280px]', msg.role === 'user' ? 'text-right' : '']">
      <div :class="['relative inline-block px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-lg',
        msg.role === 'user' 
          ? 'bg-gradient-to-r from-zjgsu-blue-600/90 to-zjgsu-blue-500/80 text-white rounded-br-md border border-zjgsu-blue-400/20' 
          : 'bg-white/5 backdrop-blur-md text-zjgsu-blue-100 rounded-bl-md border border-white/10'
      ]">
        <span class="relative z-10">{{ displayedText }}</span>
        <div :class="['absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300',
          msg.role === 'user' ? 'bg-zjgsu-blue-400/10' : 'bg-white/5'
        ]"></div>
      </div>
      
      <div v-if="msg.role === 'agent' && msg.steps && msg.steps.length" class="mt-2 ml-2">
        <div class="bg-zjgsu-blue-950/60 rounded-lg p-2 border border-zjgsu-blue-500/15">
          <div class="text-[9px] text-zjgsu-blue-200/50 mb-1.5 font-medium">任务执行日志</div>
          <div class="space-y-1">
            <div v-for="(step, idx) in msg.steps" :key="idx" 
              :class="['flex items-center gap-2 px-2 py-1 rounded text-[9px] border', getStepBg(step.status)]">
              <span :class="['font-bold', getStepColor(step.status)]">{{ getStepIcon(step.status) }}</span>
              <span class="text-zjgsu-blue-100 flex-1">{{ step.label }}</span>
              <span v-if="step.status === 'running'" class="w-1.5 h-1.5 rounded-full bg-zjgsu-gold-400 animate-pulse"></span>
              <span v-if="step.detail && step.status === 'done'" class="text-zjgsu-blue-200/60 truncate max-w-[120px]">{{ step.detail }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="msg.role === 'agent' && msg.intent" class="mt-1.5 ml-2 flex items-center gap-1.5">
        <span class="text-[8px] text-zjgsu-blue-200/40 bg-zjgsu-blue-950/40 px-1.5 py-0.5 rounded">
          {{ msg.intent.agent }}
        </span>
        <span class="text-[8px] text-zjgsu-blue-200/40">
          置信度 {{ (msg.intent.confidence * 100).toFixed(0) }}%
        </span>
      </div>
    </div>
  </div>
</template>

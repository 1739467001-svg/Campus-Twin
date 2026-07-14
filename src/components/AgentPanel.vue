<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { useCampusStore } from '../stores/campusStore'
import ChatMessage from './ChatMessage.vue'
import BookingForm from './BookingForm.vue'

const store = useCampusStore()
const input = ref('')
const chatArea = ref<HTMLElement>()
const processing = ref(false)

watch(() => store.chatMessages.length, () => {
  nextTick(() => {
    if (chatArea.value) chatArea.value.scrollTop = chatArea.value.scrollHeight
  })
})

async function send() {
  const text = input.value.trim()
  if (!text || processing.value) return
  input.value = ''
  processing.value = true
  await store.handleUserInput(text)
  processing.value = false
}

function quickCmd(cmd: string) {
  input.value = cmd
  send()
}
</script>

<template>
  <aside class="w-[340px] shrink-0 flex flex-col relative overflow-hidden glass-panel">
    <div class="absolute inset-0 bg-gradient-to-br from-zjgsu-blue-900/60 via-zjgsu-blue-950/70 to-zjgsu-blue-900/60"></div>
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(37,150,235,0.1),transparent_50%)]"></div>
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(251,191,36,0.05),transparent_50%)]"></div>
    <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zjgsu-blue-400/20 to-transparent"></div>
    
    <div class="relative z-10 flex flex-col h-full">
      <div class="h-12 px-3 py-2 flex items-center shrink-0">
        <div class="flex items-center gap-2">
          <div class="relative">
            <div class="w-2 h-2 rounded-full bg-zjgsu-blue-400 animate-pulse-glow"></div>
            <div class="absolute inset-0 w-2 h-2 rounded-full bg-zjgsu-blue-400 blur-md -z-10 opacity-50"></div>
          </div>
          <h2 class="text-xs font-semibold text-white tracking-wider flex items-center gap-1.5">
            <span class="text-zjgsu-blue-400 font-bold">Agent</span>
            <span class="text-zjgsu-blue-200/60">指挥中心</span>
          </h2>
        </div>
        
        <div class="ml-auto flex items-center gap-1.5">
          <span class="w-1 h-1 rounded-full bg-green-400 animate-pulse-soft"></span>
          <span class="text-[9px] text-zjgsu-blue-200/50">在线</span>
        </div>
      </div>

      <div class="px-3 py-2 flex gap-1.5 flex-wrap border-b border-white/3">
        <button v-for="cmd in ['订会议室','空教室','报修','态势']" :key="cmd"
          @click="quickCmd(cmd === '订会议室' ? '帮我订会议室' : cmd === '空教室' ? '哪里有空教室' : cmd === '报修' ? '设备报修' : '看一下全校情况')"
          class="glass-btn text-[9px] px-2.5 py-1 rounded-full font-medium">
          {{ cmd }}
        </button>
      </div>

      <div ref="chatArea" class="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        <ChatMessage v-for="msg in store.chatMessages" :key="msg.id" :msg="msg" />
      </div>

      <BookingForm />

      <div class="p-3 border-t border-white/3">
        <div class="relative">
          <div class="glass-input-wrapper">
            <textarea
              v-model="input"
              @keydown.enter.exact.prevent="send"
              placeholder="说句话，我来帮你办…"
              rows="1"
              class="glass-textarea"
            ></textarea>
            <button
              @click="send"
              :disabled="processing || !input.trim()"
              class="glass-send-btn absolute right-2 bottom-2 w-7 h-7 rounded-lg flex items-center justify-center"
              :class="{ 'opacity-50 cursor-not-allowed': processing || !input.trim() }">
              <svg v-if="!processing" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
              <svg v-else class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </button>
          </div>
        </div>
        <div class="flex items-center justify-between mt-1.5 text-[9px] text-zjgsu-blue-300/30">
          <span>支持语音输入</span>
          <span>Enter 发送</span>
        </div>
      </div>
    </div>
  </aside>
</template>
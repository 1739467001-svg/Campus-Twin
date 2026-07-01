<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { useCampusStore } from '../stores/campusStore'
import ChatMessage from './ChatMessage.vue'

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
  <aside class="w-[360px] shrink-0 bg-slate-50 flex flex-col border-r border-slate-200">
    <!-- 标题 -->
    <div class="px-4 py-3 border-b border-slate-200 bg-white">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
          <svg class="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
        </div>
        <span class="font-semibold text-slate-800 text-sm">Agent 指挥中心</span>
      </div>
    </div>

    <!-- 快捷指令 -->
    <div class="px-3 py-2 flex gap-1.5 flex-wrap border-b border-slate-100">
      <button v-for="cmd in ['帮我订有投影的会议室','哪里有空教室','商大楼302投影坏了','看一下全校情况']" :key="cmd"
        class="text-[11px] px-2 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 transition-colors cursor-pointer"
        @click="quickCmd(cmd)">{{ cmd }}</button>
    </div>

    <!-- 消息区 -->
    <div ref="chatArea" class="flex-1 overflow-y-auto px-3 py-3 space-y-3">
      <ChatMessage v-for="msg in store.chatMessages" :key="msg.id" :msg="msg" />
    </div>

    <!-- 输入区 -->
    <div class="p-3 border-t border-slate-200 bg-white">
      <div class="flex gap-2">
        <input v-model="input" @keyup.enter="send" :disabled="processing"
          class="flex-1 h-9 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 placeholder:text-slate-400"
          placeholder="说一句话，例如：帮我订会议室" />
        <button @click="send" :disabled="processing || !input.trim()"
          class="h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1">
          <svg v-if="processing" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          {{ processing ? '处理中' : '发送' }}
        </button>
      </div>
    </div>
  </aside>
</template>

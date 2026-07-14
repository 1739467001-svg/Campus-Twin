<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCampusStore } from '../stores/campusStore'

const store = useCampusStore()

const bookingLocation = ref('')
const bookingTime = ref('')
const bookingPerson = ref(store.currentUser.name)
const showForm = ref(false)

const buildings = computed(() => {
  const bldNames = new Set<string>()
  store.buildings.forEach(b => {
    b.floors.forEach(f => {
      f.rooms.forEach(r => {
        if (r.type === 'meeting') bldNames.add(b.name)
      })
    })
  })
  return Array.from(bldNames)
})

const timeSlots = [
  { value: '08:00-10:00', label: '08:00-10:00' },
  { value: '10:00-12:00', label: '10:00-12:00' },
  { value: '14:00-16:00', label: '14:00-16:00' },
  { value: '16:00-18:00', label: '16:00-18:00' },
  { value: '18:00-20:00', label: '18:00-20:00' },
]

const isFormValid = computed(() => {
  return bookingLocation.value && bookingTime.value && bookingPerson.value
})

async function submitBooking() {
  if (!isFormValid.value) return
  const request = `帮我预约${bookingLocation.value}的会议室，时间是${bookingTime.value}，预约人${bookingPerson.value}`
  showForm.value = false
  bookingLocation.value = ''
  bookingTime.value = ''
  await store.handleUserInput(request)
}

function toggleForm() {
  showForm.value = !showForm.value
}

function quickSelectBuilding(building: string) {
  bookingLocation.value = building
}
</script>

<template>
  <div class="border-t border-white/3">
    <button 
      @click="toggleForm"
      class="w-full py-2.5 px-3 flex items-center justify-between hover:bg-white/3 transition-colors text-left"
    >
      <div class="flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-zjgsu-gold-400"></span>
        <div>
          <div class="text-[10px] font-semibold text-white">快速预约</div>
          <div class="text-[9px] text-zjgsu-blue-300/40">填写位置、时间、预约人，一键预约会议室</div>
        </div>
      </div>
      <span class="text-[9px] text-zjgsu-blue-300/50">点击展开</span>
    </button>
    
    <div v-if="showForm" class="px-3 pb-3 space-y-2 animate-slide-down">
      <div class="space-y-1">
        <label class="text-[9px] text-zjgsu-blue-300/50 font-medium flex items-center gap-1">
          <span class="w-1 h-1 rounded-full bg-zjgsu-blue-400"></span>
          位置
        </label>
        <div class="flex flex-wrap gap-1">
          <button 
            v-for="bld in buildings" 
            :key="bld"
            @click="quickSelectBuilding(bld)"
            class="px-2 py-0.5 rounded-md text-[9px] transition-all"
            :class="bookingLocation === bld ? 'bg-zjgsu-blue-500/20 text-zjgsu-blue-300 border border-zjgsu-blue-500/30' : 'bg-zjgsu-blue-900/30 text-zjgsu-blue-300/60 hover:bg-zjgsu-blue-800/30'"
          >
            {{ bld }}
          </button>
        </div>
        <input 
          v-model="bookingLocation"
          type="text"
          placeholder="输入建筑名称"
          class="glass-input w-full px-2 py-1.5 text-white text-[10px] focus:border-zjgsu-blue-400 focus:outline-none transition-colors"
        />
      </div>
      
      <div class="space-y-1">
        <label class="text-[9px] text-zjgsu-blue-300/50 font-medium flex items-center gap-1">
          <span class="w-1 h-1 rounded-full bg-zjgsu-blue-400"></span>
          时间
        </label>
        <select 
          v-model="bookingTime"
          class="glass-select w-full px-2 py-1.5 text-white text-[10px] focus:border-zjgsu-blue-400 focus:outline-none transition-colors"
        >
          <option value="">请选择时间段</option>
          <option v-for="t in timeSlots" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
      </div>
      
      <div class="space-y-1">
        <label class="text-[9px] text-zjgsu-blue-300/50 font-medium flex items-center gap-1">
          <span class="w-1 h-1 rounded-full bg-zjgsu-gold-400"></span>
          预约人
        </label>
        <input 
          v-model="bookingPerson"
          type="text"
          placeholder="输入预约人姓名"
          class="glass-input w-full px-2 py-1.5 text-white text-[10px] focus:border-zjgsu-blue-400 focus:outline-none transition-colors"
        />
      </div>
      
      <button 
        @click="submitBooking"
        :disabled="!isFormValid"
        class="w-full py-1.5 rounded-lg font-semibold text-[10px] transition-all mt-1"
        :class="isFormValid ? 'btn-primary' : 'bg-zjgsu-blue-900/30 text-zjgsu-blue-400/30 cursor-not-allowed border border-zjgsu-blue-500/5'"
      >
        {{ isFormValid ? '🚀 一键预约' : '请填写完整' }}
      </button>
      
      <div class="text-[9px] text-zjgsu-blue-300/30 text-center">
        Agent 将自动匹配可用会议室
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-slide-down {
  animation: slideDown 0.25s ease-out;
}
</style>
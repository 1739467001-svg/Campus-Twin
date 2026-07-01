<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts'
import { useCampusStore } from '../stores/campusStore'

const store = useCampusStore()
const chartOccupy = ref<HTMLDivElement>()
const chartEnergy = ref<HTMLDivElement>()
const chartTraffic = ref<HTMLDivElement>()
let charts: echarts.ECharts[] = []

onMounted(() => {
  renderCharts()
})

onBeforeUnmount(() => {
  charts.forEach(c => c.dispose())
  charts = []
})

watch(() => store.activePanel, (v) => {
  if (v === 'admin') {
    setTimeout(() => renderCharts(), 100)
  }
})

function renderCharts() {
  charts.forEach(c => c.dispose())
  charts = []

  if (chartOccupy.value) {
    const c = echarts.init(chartOccupy.value)
    const bldNames = store.buildings.map(b => b.name)
    const rates = store.buildings.map(b => {
      const rooms = b.floors.flatMap(f => f.rooms)
      const busy = rooms.filter(r => r.status === 'busy').length
      return rooms.length ? Math.round((busy / rooms.length) * 100) : 0
    })
    c.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: bldNames, axisLabel: { fontSize: 10 } },
      yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%', fontSize: 10 } },
      series: [{ type: 'bar', data: rates, itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] } }],
      grid: { left: 40, right: 10, top: 10, bottom: 30 },
    })
    charts.push(c)
  }

  if (chartEnergy.value) {
    const c = echarts.init(chartEnergy.value)
    c.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: ['06:00','08:00','10:00','12:00','14:00','16:00','18:00','20:00'], axisLabel: { fontSize: 10 } },
      yAxis: { type: 'value', axisLabel: { formatter: '{value} kWh', fontSize: 10 } },
      series: [
        { name: '商大楼', type: 'line', smooth: true, data: [20,45,80,65,90,85,55,30], lineStyle: { width: 2 } },
        { name: '信息楼', type: 'line', smooth: true, data: [15,55,70,50,75,65,40,20], lineStyle: { width: 2 } },
        { name: '图书馆', type: 'line', smooth: true, data: [10,30,50,45,55,60,70,45], lineStyle: { width: 2 } },
      ],
      legend: { top: 0, textStyle: { fontSize: 10 } },
      grid: { left: 50, right: 10, top: 30, bottom: 30 },
    })
    charts.push(c)
  }

  if (chartTraffic.value) {
    const c = echarts.init(chartTraffic.value)
    const data = store.traffic.map(t => ({
      name: store.buildings.find(b => b.id === t.zoneId)?.name || t.zoneId,
      value: t.count,
    }))
    c.setOption({
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie', radius: ['35%', '65%'],
        data,
        label: { fontSize: 10 },
        itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
      }],
    })
    charts.push(c)
  }
}
</script>

<template>
  <div class="animate-slideUp">
    <div class="px-4 py-3 border-b border-slate-100 bg-white">
      <h3 class="font-semibold text-slate-800 text-sm flex items-center gap-2">
        <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
        管理态势看板
      </h3>
      <p class="text-[11px] text-slate-400 mt-0.5">演示数据 · 全校一屏掌握</p>
    </div>

    <!-- KPI 卡片 -->
    <div class="grid grid-cols-2 gap-2 p-3">
      <div class="bg-blue-50 rounded-xl p-3 text-center">
        <div class="text-2xl font-bold text-blue-700">{{ store.occupancyRate }}%</div>
        <div class="text-[11px] text-blue-500">全校占用率</div>
      </div>
      <div class="bg-green-50 rounded-xl p-3 text-center">
        <div class="text-2xl font-bold text-green-700">{{ store.freeRooms }}</div>
        <div class="text-[11px] text-green-500">空闲房间</div>
      </div>
      <div class="bg-amber-50 rounded-xl p-3 text-center">
        <div class="text-2xl font-bold text-amber-700">{{ store.totalEnergy }}<span class="text-sm">kWh</span></div>
        <div class="text-[11px] text-amber-500">今日能耗</div>
      </div>
      <div class="bg-purple-50 rounded-xl p-3 text-center">
        <div class="text-2xl font-bold text-purple-700">{{ store.totalTraffic }}</div>
        <div class="text-[11px] text-purple-500">实时人流</div>
      </div>
    </div>

    <!-- 图表 -->
    <div class="px-3 pb-3 space-y-3">
      <div class="bg-white rounded-xl border border-slate-200 p-3">
        <div class="text-xs font-medium text-slate-700 mb-2">各楼宇占用率</div>
        <div ref="chartOccupy" class="w-full h-36"></div>
      </div>
      <div class="bg-white rounded-xl border border-slate-200 p-3">
        <div class="text-xs font-medium text-slate-700 mb-2">能耗趋势（今日）</div>
        <div ref="chartEnergy" class="w-full h-40"></div>
      </div>
      <div class="bg-white rounded-xl border border-slate-200 p-3">
        <div class="text-xs font-medium text-slate-700 mb-2">人流分布</div>
        <div ref="chartTraffic" class="w-full h-36"></div>
      </div>
    </div>

    <!-- 异常提示 -->
    <div v-if="store.repairRooms > 0" class="px-3 pb-3">
      <div class="bg-red-50 border border-red-200 rounded-xl p-3">
        <div class="text-xs font-semibold text-red-700 flex items-center gap-1">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" /></svg>
          异常提示
        </div>
        <div class="text-[11px] text-red-600 mt-1">当前有 {{ store.repairRooms }} 间房间处于报修状态，建议关注处理进度。</div>
      </div>
    </div>
  </div>
</template>

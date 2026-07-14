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
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  charts.forEach(c => c.dispose())
  charts = []
})

watch(() => store.activePanel, (v) => {
  if (v === 'admin') {
    setTimeout(() => renderCharts(), 100)
  }
})

function handleResize() {
  charts.forEach(c => c.resize())
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function renderCharts() {
  charts.forEach(c => c.dispose())
  charts = []

  if (chartOccupy.value) {
    const c = echarts.init(chartOccupy.value, 'dark')
    const bldNames = store.buildings.map(b => b.name)
    const rates = store.buildings.map(b => {
      const rooms = b.floors.flatMap(f => f.rooms)
      const busy = rooms.filter(r => r.status === 'busy').length
      return rooms.length ? Math.round((busy / rooms.length) * 100) : 0
    })
    c.setOption({
      tooltip: { 
        trigger: 'axis', 
        backgroundColor: 'rgba(17, 24, 39, 0.95)', 
        borderColor: '#2d3a4f', 
        textStyle: { color: '#f1f5f9' },
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(14, 165, 233, 0.1)' } }
      },
      xAxis: { type: 'category', data: bldNames, axisLabel: { fontSize: 10, color: '#94a3b8' }, axisLine: { lineStyle: { color: '#2d3a4f' } }, axisTick: { show: false } },
      yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%', fontSize: 10, color: '#94a3b8' }, axisLine: { lineStyle: { color: '#2d3a4f' } }, splitLine: { lineStyle: { color: '#1e2a3d', type: 'dashed' } }, axisTick: { show: false } },
      series: [{ 
        type: 'bar', 
        data: rates, 
        barWidth: '50%',
        itemStyle: { 
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#38bdf8' },
            { offset: 1, color: '#0ea5e9' }
          ]),
          borderRadius: [4, 4, 0, 0] 
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#7dd3fc' },
              { offset: 1, color: '#38bdf8' }
            ])
          }
        }
      }],
      grid: { left: 40, right: 10, top: 15, bottom: 30 },
    })
    charts.push(c)
  }

  if (chartEnergy.value) {
    const c = echarts.init(chartEnergy.value, 'dark')
    const hours = ['06:00','08:00','10:00','12:00','14:00','16:00','18:00','20:00']
    const hourlyRatios = [0.06, 0.14, 0.22, 0.16, 0.24, 0.20, 0.14, 0.08]
    const colors = ['#0ea5e9', '#699169', '#ffb800', '#a78bfa', '#34d399']
    const series = store.buildings.map((bld, i) => {
      const dailyKwh = store.energy.find(e => e.buildingId === bld.id)?.kwh || 200
      const color = colors[i % colors.length]
      return {
        name: bld.name,
        type: 'line' as const,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        data: hourlyRatios.map(r => Math.round(dailyKwh * r)),
        lineStyle: { width: 2.5, color },
        itemStyle: { color, borderColor: '#111827', borderWidth: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: hexToRgba(color, 0.3) },
            { offset: 1, color: hexToRgba(color, 0) }
          ])
        },
        emphasis: {
          scale: true,
          itemStyle: { borderWidth: 3 }
        }
      }
    })
    c.setOption({
      tooltip: { 
        trigger: 'axis', 
        backgroundColor: 'rgba(17, 24, 39, 0.95)', 
        borderColor: '#2d3a4f', 
        textStyle: { color: '#f1f5f9' },
        axisPointer: { type: 'cross', lineStyle: { color: '#2d3a4f', type: 'dashed' } }
      },
      xAxis: { type: 'category', data: hours, axisLabel: { fontSize: 10, color: '#94a3b8' }, axisLine: { lineStyle: { color: '#2d3a4f' } }, axisTick: { show: false } },
      yAxis: { type: 'value', axisLabel: { formatter: '{value} kWh', fontSize: 10, color: '#94a3b8' }, axisLine: { lineStyle: { color: '#2d3a4f' } }, splitLine: { lineStyle: { color: '#1e2a3d', type: 'dashed' } }, axisTick: { show: false } },
      series,
      legend: { top: 5, textStyle: { fontSize: 9, color: '#cbd5e1' }, itemWidth: 12, itemHeight: 6 },
      grid: { left: 50, right: 10, top: 35, bottom: 30 },
    })
    charts.push(c)
  }

  if (chartTraffic.value) {
    const c = echarts.init(chartTraffic.value, 'dark')
    const data = store.traffic.map(t => ({
      name: store.buildings.find(b => b.id === t.zoneId)?.name || t.zoneId,
      value: t.count,
    }))
    c.setOption({
      tooltip: { 
        trigger: 'item', 
        backgroundColor: 'rgba(17, 24, 39, 0.95)', 
        borderColor: '#2d3a4f', 
        textStyle: { color: '#f1f5f9' },
        formatter: (params: any) => `${params.name}<br/>人数: ${params.value} (${params.percent}%)`
      },
      series: [{
        type: 'pie', 
        radius: ['45%', '70%'],
        center: ['50%', '50%'],
        data,
        label: { fontSize: 10, color: '#cbd5e1', formatter: '{b}\n{c}人' },
        labelLine: { lineStyle: { color: '#2d3a4f' } },
        itemStyle: { borderRadius: 6, borderColor: '#111827', borderWidth: 3, color: ['#0ea5e9', '#699169', '#ffb800', '#a78bfa', '#34d399'] },
        emphasis: {
          scale: true,
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(14, 165, 233, 0.3)' }
        }
      }],
    })
    charts.push(c)
  }
}
</script>

<template>
  <div class="animate-slide-up">
    <div class="px-4 py-3 border-b border-zjgsu-blue-500/20 bg-zjgsu-blue-900/40">
      <h3 class="font-semibold text-white text-xs">管理态势看板</h3>
      <p class="text-[10px] text-zjgsu-blue-200/70 mt-0.5">实时监控校园资源使用情况，智能分析各项指标数据</p>
    </div>

    <div class="grid grid-cols-2 gap-2 p-3">
      <div class="bg-zjgsu-blue-950/30 rounded-lg p-2.5 border border-zjgsu-blue-500/15 hover:border-zjgsu-blue-400/30 transition-all duration-300">
        <div class="text-[9px] text-zjgsu-blue-200/60 font-medium mb-1">全校占用率</div>
        <div class="text-xl font-bold text-zjgsu-blue-400">{{ store.occupancyRate }}%</div>
        <div class="mt-1.5 h-1.5 bg-zjgsu-blue-900/50 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-zjgsu-blue-400 to-zjgsu-blue-500/60 rounded-full" :style="{ width: store.occupancyRate + '%' }"></div>
        </div>
        <div class="text-[9px] text-zjgsu-blue-200/50 mt-1">较昨日下降 3%</div>
      </div>
      <div class="bg-zjgsu-blue-950/30 rounded-lg p-2.5 border border-zjgsu-blue-500/15 hover:border-green-500/30 transition-all duration-300">
        <div class="text-[9px] text-zjgsu-blue-200/60 font-medium mb-1">空闲房间</div>
        <div class="text-xl font-bold text-green-400">{{ store.freeRooms }}</div>
        <div class="text-[9px] text-zjgsu-blue-200/50 mt-1">可立即预约使用</div>
      </div>
      <div class="bg-zjgsu-blue-950/30 rounded-lg p-2.5 border border-zjgsu-blue-500/15 hover:border-zjgsu-gold-500/30 transition-all duration-300">
        <div class="text-[9px] text-zjgsu-blue-200/60 font-medium mb-1">今日能耗</div>
        <div class="text-xl font-bold text-zjgsu-gold-400">{{ store.totalEnergy }}<span class="text-[10px] ml-0.5">kWh</span></div>
        <div class="text-[9px] text-zjgsu-blue-200/50 mt-1">预计电费 ¥{{ Math.round(store.totalEnergy * 0.65) }}</div>
      </div>
      <div class="bg-zjgsu-blue-950/30 rounded-lg p-2.5 border border-zjgsu-blue-500/15 hover:border-zjgsu-blue-400/30 transition-all duration-300">
        <div class="text-[9px] text-zjgsu-blue-200/60 font-medium mb-1">实时人流</div>
        <div class="text-xl font-bold text-zjgsu-blue-400">{{ store.totalTraffic }}</div>
        <div class="text-[9px] text-zjgsu-blue-200/50 mt-1">较昨日增长 12%</div>
      </div>
    </div>

    <div class="px-3 pb-3 space-y-3">
      <div class="bg-zjgsu-blue-950/20 rounded-lg border border-zjgsu-blue-500/15 p-3 hover:border-zjgsu-blue-400/20 transition-all duration-300">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[11px] font-medium text-zjgsu-blue-100">各楼宇占用率</span>
          <span class="text-[9px] text-zjgsu-blue-200/60 bg-zjgsu-blue-900/50 px-1.5 py-0.5 rounded">实时</span>
        </div>
        <div ref="chartOccupy" class="w-full h-32"></div>
        <div class="mt-2 flex items-center justify-between text-[9px] text-zjgsu-blue-200/50">
          <span>最高: 经管楼 68%</span>
          <span>最低: 艺术楼 23%</span>
        </div>
      </div>
      <div class="bg-zjgsu-blue-950/20 rounded-lg border border-zjgsu-blue-500/15 p-3 hover:border-zjgsu-blue-400/20 transition-all duration-300">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[11px] font-medium text-zjgsu-blue-100">能耗趋势（今日）</span>
          <span class="text-[9px] text-zjgsu-blue-200/60 bg-zjgsu-blue-900/50 px-1.5 py-0.5 rounded">统计</span>
        </div>
        <div ref="chartEnergy" class="w-full h-36"></div>
        <div class="mt-2 flex items-center justify-between text-[9px] text-zjgsu-blue-200/50">
          <span>峰值: 14:00 380 kWh</span>
          <span>均值: 240 kWh/h</span>
        </div>
      </div>
      <div class="bg-zjgsu-blue-950/20 rounded-lg border border-zjgsu-blue-500/15 p-3 hover:border-zjgsu-blue-400/20 transition-all duration-300">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[11px] font-medium text-zjgsu-blue-100">人流分布</span>
          <span class="text-[9px] text-zjgsu-blue-200/60 bg-zjgsu-blue-900/50 px-1.5 py-0.5 rounded">监测</span>
        </div>
        <div ref="chartTraffic" class="w-full h-32"></div>
        <div class="mt-2 flex items-center justify-between text-[9px] text-zjgsu-blue-200/50">
          <span>密集区: 图书馆</span>
          <span>疏散区: 体育馆</span>
        </div>
      </div>
    </div>

    <div v-if="store.repairRooms > 0" class="px-3 pb-3">
      <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
        <div class="text-[11px] font-semibold text-red-400 mb-1.5">异常提示</div>
        <div class="text-[10px] text-red-400/80">当前有 {{ store.repairRooms }} 间房间处于报修状态，建议及时关注并处理维修进度，确保教学与办公秩序正常。</div>
        <div class="mt-2 flex items-center gap-2">
          <span class="text-[9px] text-red-400/60">报修位置:</span>
          <span class="text-[9px] text-red-400/80">教学楼B栋 · 图书馆三楼 · 体育馆东侧</span>
        </div>
      </div>
    </div>
  </div>
</template>

import type { Intent } from '../types/campus'

export function parseIntent(text: string): Intent {
  const t = text.trim()
  const slots: Intent['slots'] = {}

  const equipMap: Record<string, string> = {
    '投影仪': 'projector', '投影': 'projector', '投影机': 'projector',
    '空调': 'ac', '冷气': 'ac', '空调机': 'ac', '中央空调': 'ac',
    '灯光': 'light', '灯': 'light', '电灯': 'light', '日光灯': 'light', 'LED灯': 'light',
    '麦克风': 'mic', '话筒': 'mic', '音响': 'mic', '音箱': 'mic', '喇叭': 'mic',
    '白板': 'whiteboard', '电子白板': 'whiteboard', '触控屏': 'whiteboard',
    '屏幕': 'screen', '显示屏': 'screen', '显示器': 'screen', '电视': 'screen',
    '电脑': 'computer', 'PC': 'computer', '主机': 'computer', '服务器': 'computer',
    '网络': 'network', 'WiFi': 'network', '无线': 'network', '网线': 'network',
    '门锁': 'lock', '门禁': 'lock', '刷卡机': 'lock',
    '饮水机': 'water', '热水器': 'water',
    '风扇': 'fan', '换气扇': 'fan',
    '桌椅': 'furniture', '桌子': 'furniture', '椅子': 'furniture',
  }
  const foundEquip = new Set<string>()
  const sortedKeys = Object.keys(equipMap).sort((a, b) => b.length - a.length)
  for (const keyword of sortedKeys) {
    if (t.includes(keyword)) foundEquip.add(equipMap[keyword])
  }
  if (foundEquip.size) slots.equipment = [...foundEquip]

  const buildings = ['商大楼', '信息楼', '图书馆', '艺术楼', '综合楼', '教学楼', '实验楼', '体育馆']
  for (const b of buildings) {
    if (t.includes(b)) { slots.building = b; break }
  }

  for (const keyword of sortedKeys) {
    if (t.includes(keyword) && /坏|修|故障|不能[用使]|不好使|出问题|失灵|失效|死机|黑屏|闪烁|不亮|没反应|异常/.test(t)) {
      slots.device = equipMap[keyword]; break
    }
  }

  const roomMatch = t.match(/([1-5]\d{2})[室号房]?/)
  if (roomMatch) slots.room = roomMatch[1]

  const timePatterns = [
    { re: /明天下午/, val: '明天下午' },
    { re: /明天上午/, val: '明天上午' },
    { re: /今天下午/, val: '今天下午' },
    { re: /今天上午/, val: '今天上午' },
    { re: /明天/, val: '明天' },
    { re: /今天/, val: '今天' },
    { re: /现在/, val: '现在' },
    { re: /下周[一二三四五六日天]/, val: t.match(/下周[一二三四五六日天]/)?.[0] || '' },
  ]
  for (const { re, val } of timePatterns) {
    if (re.test(t)) { slots.time = val; break }
  }

  const hourMatch = t.match(/(\d{1,2})[:点](\d{2})?/)
  if (hourMatch) {
    slots.hour = parseInt(hourMatch[1])
    slots.minute = hourMatch[2] ? parseInt(hourMatch[2]) : 0
  }
  
  const durationMatch = t.match(/(\d+)小时|(\d+)个小时|(\d+)时/)
  if (durationMatch) {
    slots.duration = parseInt(durationMatch[1] || durationMatch[2] || durationMatch[3])
  }
  
  const timeRangeMatch = t.match(/(\d{1,2}):(\d{2})[-~到至](\d{1,2}):(\d{2})/)
  if (timeRangeMatch) {
    slots.startTime = `${timeRangeMatch[1]}:${timeRangeMatch[2]}`
    slots.endTime = `${timeRangeMatch[3]}:${timeRangeMatch[4]}`
  }
  
  const simpleTimeRangeMatch = t.match(/(\d{1,2})[-~到至](\d{1,2})/)
  if (!slots.startTime && simpleTimeRangeMatch) {
    slots.startTime = `${simpleTimeRangeMatch[1]}:00`
    slots.endTime = `${simpleTimeRangeMatch[2]}:00`
  }

  const targets = [...buildings, '食堂', '体育馆', '操场', '校门', '宿舍', '行政楼', '机房', '报告厅']
  for (const target of targets) {
    if (t.includes(target)) { slots.target = target; break }
  }

  const faultSymptoms = [
    '黑屏', '不亮', '闪烁', '死机', '卡机', '卡顿', '蓝屏',
    '没反应', '无法启动', '启动不了', '打不开', '开不了机',
    '声音小', '没声音', '杂音', '啸叫',
    '漏水', '滴水', '不出水', '水温不正常',
    '网速慢', '断网', '连不上', '信号差',
    '门打不开', '锁不上', '刷卡没反应',
    '发热', '烫手', '异味', '冒烟',
    '抖动', '异响', '松动', '脱落',
  ]
  for (const symptom of faultSymptoms) {
    if (t.includes(symptom)) {
      slots.device = slots.device || 'unknown'
      break
    }
  }

  let intent: Intent['intent'] = 'unknown'
  let agent = '调度Agent'
  let confidence = 0.5

  const repairKeywords = /坏|报修|故障|修[一了]?|不能[用使]|不好使|出问题|失灵|失效|死机|黑屏|闪烁|不亮|没反应|异常|漏水|断网|发热|异响|松动|脱落|门打不开|锁不上/
  const repairContext = /楼|室|房|投影|空调|灯|麦克|设备|电脑|网络|门锁|屏幕|白板|风扇|桌椅|饮水机/
  
  if (repairKeywords.test(t) && repairContext.test(t)) {
    intent = 'repair'
    agent = '报修Agent'
    confidence = 0.93
    if (t.includes('紧急') || t.includes('立刻') || t.includes('马上')) {
      confidence = 0.98
    }
  } else if (/空教室|空房间|哪里有空|找[个一间]?空|空闲|有没有.*教室|哪间.*空|现在.*空/.test(t)) {
    intent = 'find_free_classroom'
    agent = '预约Agent'
    confidence = 0.92
  } else if (/订|预约|借|预定|约/.test(t) && /会议室|教室|房间|场地|研讨/.test(t)) {
    intent = 'book_room'
    agent = '预约Agent'
    confidence = 0.95
  } else if (/我的预约|我的会议|我订了|我预约了|查看预约|预约记录|已预约/.test(t)) {
    intent = 'check_booking'
    agent = '预约Agent'
    confidence = 0.96
  } else if (/时间表|课表|日程|安排|规划|时间安排|什么时候有空|哪个时间段|几点到几点/.test(t)) {
    intent = 'schedule_query'
    agent = '预约Agent'
    confidence = 0.90
  } else if (/带我去|怎么走|导航|路线|寻路|找不到|去(?!掉|除|年)/.test(t) && (slots.target || slots.building)) {
    intent = 'navigate'
    agent = '导航Agent'
    confidence = 0.9
  } else if (/占用|能耗|人流|态势|总览|概览|全校.*情况|数据|统计|报表|看板|整体/.test(t)) {
    intent = 'admin_overview'
    agent = '态势Agent'
    confidence = 0.88
  }

  return { intent, slots, agent, confidence }
}

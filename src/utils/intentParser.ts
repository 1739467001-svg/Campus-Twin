import type { Intent } from '../types/campus'

/** 规则引擎：离线可用的意图解析 */
export function parseIntent(text: string): Intent {
  const t = text.trim()
  const slots: Intent['slots'] = {}

  // 提取设备槽位
  const equipMap: Record<string, string> = {
    '投影': 'projector', '投影仪': 'projector',
    '空调': 'ac', '灯': 'light', '灯光': 'light',
    '麦克风': 'mic', '话筒': 'mic', '音响': 'mic',
    '白板': 'whiteboard', '屏幕': 'screen',
  }
  const foundEquip: string[] = []
  for (const [keyword, equip] of Object.entries(equipMap)) {
    if (t.includes(keyword)) foundEquip.push(equip)
  }
  if (foundEquip.length) slots.equipment = foundEquip

  // 提取楼宇
  const buildings = ['商大楼', '信息楼', '图书馆', '艺术楼', '综合楼']
  for (const b of buildings) {
    if (t.includes(b)) { slots.building = b; break }
  }

  // 提取设备（报修用）
  for (const keyword of Object.keys(equipMap)) {
    if (t.includes(keyword) && (t.includes('坏') || t.includes('修') || t.includes('故障'))) {
      slots.device = keyword; break
    }
  }

  // 提取房间号
  const roomMatch = t.match(/(\d{3})/)
  if (roomMatch) slots.room = roomMatch[1]

  // 提取时间
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

  // 提取目的地（导航）
  const targets = ['图书馆', '食堂', '体育馆', '操场', '校门', '宿舍', '行政楼']
  for (const target of targets) {
    if (t.includes(target)) { slots.target = target; break }
  }

  // 意图分类
  let intent: Intent['intent'] = 'unknown'
  let agent = '调度Agent'
  let confidence = 0.5

  if (/订|预约|借|预定|约/.test(t) && /会议室|教室|房间|场地/.test(t)) {
    intent = 'book_room'
    agent = '预约Agent'
    confidence = 0.95
  } else if (/空教室|空房间|哪里有空|找教室|空闲|有没有.*教室|哪间/.test(t)) {
    intent = 'find_free_classroom'
    agent = '预约Agent'
    confidence = 0.92
  } else if (/坏|报修|故障|修|不能用|不好使|出问题/.test(t)) {
    intent = 'repair'
    agent = '报修Agent'
    confidence = 0.93
  } else if (/带我去|怎么走|导航|去.*|路线|寻路|找不到/.test(t)) {
    intent = 'navigate'
    agent = '导航Agent'
    confidence = 0.9
  } else if (/占用|能耗|人流|态势|总览|情况|概览|数据|统计|报表|看板/.test(t)) {
    intent = 'admin_overview'
    agent = '态势Agent'
    confidence = 0.88
  }

  return { intent, slots, agent, confidence }
}

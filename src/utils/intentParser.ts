import type { Intent } from '../types/campus'

/** 规则引擎：离线可用的意图解析 */
export function parseIntent(text: string): Intent {
  const t = text.trim()
  const slots: Intent['slots'] = {}

  // 提取设备槽位（去重）
  const equipMap: Record<string, string> = {
    '投影仪': 'projector', '投影': 'projector',
    '空调': 'ac', '灯光': 'light', '灯': 'light',
    '麦克风': 'mic', '话筒': 'mic', '音响': 'mic',
    '白板': 'whiteboard', '屏幕': 'screen',
  }
  const foundEquip = new Set<string>()
  // 先匹配长词再匹配短词，避免"投影仪"同时匹配"投影"
  const sortedKeys = Object.keys(equipMap).sort((a, b) => b.length - a.length)
  for (const keyword of sortedKeys) {
    if (t.includes(keyword)) foundEquip.add(equipMap[keyword])
  }
  if (foundEquip.size) slots.equipment = [...foundEquip]

  // 提取楼宇
  const buildings = ['商大楼', '信息楼', '图书馆', '艺术楼', '综合楼']
  for (const b of buildings) {
    if (t.includes(b)) { slots.building = b; break }
  }

  // 提取设备类型（报修用）— 取映射后的标准名
  for (const keyword of sortedKeys) {
    if (t.includes(keyword) && /坏|修|故障|不能[用使]|不好使|出问题/.test(t)) {
      slots.device = equipMap[keyword]; break
    }
  }

  // 提取房间号（限定 1xx-5xx 范围，更精准）
  const roomMatch = t.match(/([1-5]\d{2})[室号房]?/)
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

  // 提取目的地（导航）— 包含实际楼栋 + 常见地点
  const targets = [...buildings, '食堂', '体育馆', '操场', '校门', '宿舍', '行政楼']
  for (const target of targets) {
    if (t.includes(target)) { slots.target = target; break }
  }

  // ======== 意图分类（优先级：报修 > 找空教室 > 预约 > 导航 > 态势）========
  let intent: Intent['intent'] = 'unknown'
  let agent = '调度Agent'
  let confidence = 0.5

  if (/坏|报修|故障|修[一了]?|不能用|不好使|出问题/.test(t) && /楼|室|房|投影|空调|灯|麦克|设备/.test(t)) {
    // 报修优先——涉及具体设备故障
    intent = 'repair'
    agent = '报修Agent'
    confidence = 0.93
  } else if (/空教室|空房间|哪里有空|找[个一间]?空|空闲|有没有.*教室|哪间.*空|现在.*空/.test(t)) {
    // 找空教室——有明确的"空"语义
    intent = 'find_free_classroom'
    agent = '预约Agent'
    confidence = 0.92
  } else if (/订|预约|借|预定|约/.test(t) && /会议室|教室|房间|场地|研讨/.test(t)) {
    intent = 'book_room'
    agent = '预约Agent'
    confidence = 0.95
  } else if (/带我去|怎么走|导航|路线|寻路|找不到|去(?!掉|除|年)/.test(t) && (slots.target || slots.building)) {
    // 导航——必须匹配到目的地才分类，避免"去掉预约"等误判
    intent = 'navigate'
    agent = '导航Agent'
    confidence = 0.9
  } else if (/占用|能耗|人流|态势|总览|概览|全校.*情况|数据|统计|报表|看板|整体/.test(t)) {
    // 管理态势——用复合词避免"情况"单字误判
    intent = 'admin_overview'
    agent = '态势Agent'
    confidence = 0.88
  }

  return { intent, slots, agent, confidence }
}

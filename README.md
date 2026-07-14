# CampusTwin 校园数字孪生服务台

> 一句话，办成校园里的所有事。

## 项目简介

CampusTwin 是一款基于 Vue 3 + Three.js 的校园数字孪生智能服务网站，以浙江工商大学为原型构建沉浸式 3D 校园场景，一站式提供会议室预约、设备报修、校园导航、管理态势可视化服务。

## 核心功能

1. **3D 数字孪生校园**
   - 使用 Three.js 构建真实校园建筑模型（校门、教学楼、图书馆、行政楼等）
   - 支持昼夜模式切换
   - 建筑窗户实时状态指示灯：蓝色=空闲，金色=占用，红色=维修

2. **智能会议室预约**
   - 3D 场景中直观查看会议室状态
   - 支持时间冲突检测、智能筛选可用房间
   - 用户预约的房间以金色高亮 + 呼吸动画标识
   - 支持通过 AI Agent 用自然语言预约

3. **3D 寻路导航**
   - 从校门出发的三维路线可视化
   - 三层导航线：白色底边 + 青色主线 + 发光外层
   - 流动光粒子、呼吸式起终点标记

4. **管理态势看板**
   - 使用 ECharts 展示会议室占用率、报修统计、能耗趋势等数据
   - 暗色主题，统一校园视觉风格

## 技术栈

- 前端框架：Vue 3 + TypeScript + Vite
- 3D 引擎：Three.js + WebGL
- 状态管理：Pinia
- UI 样式：Tailwind CSS
- 数据可视化：ECharts

## 项目结构

```
campustwin/
├── src/
│   ├── components/      # Vue 组件
│   ├── stores/          # Pinia 状态管理
│   ├── utils/           # 工具函数
│   ├── types/           # TypeScript 类型定义
│   ├── assets/          # 静态资源
│   ├── App.vue
│   ├── main.ts
│   └── style.css
├── public/              # 公共资源
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发环境运行

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 体验方式

下载 `CampusTwin_Demo.zip`，解压后用浏览器打开 `index.html` 即可体验完整功能。

## 参赛信息

- 赛事：TRAE AI 创造力大赛
- 赛道：社会服务
- 作品名称：校园数字孪生服务台 CampusTwin
- 开发工具：TRAE IDE

## 作者

- 作者：陈俊烨 CJY
- 学校：浙江工商大学 信电人工智能学院

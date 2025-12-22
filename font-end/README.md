# 考研刷题小程序前端

基于 uni-app (Vue 3 + Vite) 开发的考研刷题小程序前端项目。

## 技术栈

- **框架**: uni-app
- **Vue 版本**: Vue 3
- **构建工具**: Vite
- **状态管理**: Pinia
- **UI 组件**: uni-ui (推荐使用 uView Plus)
- **CSS 预处理**: SCSS

## 项目结构

```
font-end/
├── pages/              # 页面
│   ├── index/          # 首页
│   ├── bank/           # 题库页
│   ├── user/           # 个人中心
│   ├── answer/         # 答题页
│   ├── login/          # 登录页
│   └── sub-pages/      # 分包页面
├── components/         # 公共组件
│   ├── app-countdown   # 倒计时组件
│   ├── question-card   # 题目卡片
│   ├── bank-selector   # 题库选择器
│   └── draft-board     # 草稿纸
├── store/              # 状态管理
│   ├── user.js         # 用户状态
│   └── bank.js         # 题库状态
├── utils/              # 工具函数
│   ├── request.js      # 请求封装
│   └── date.js         # 日期处理
├── static/             # 静态资源
└── uni.scss            # 全局样式
```

## 开发指南

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 运行项目

```bash
# H5
npm run dev:h5

# 微信小程序
npm run dev:mp-weixin
```

### 构建项目

```bash
# H5
npm run build:h5

# 微信小程序
npm run build:mp-weixin
```

## 功能模块

### P0 核心功能（已完成）

- ✅ 项目基础架构
- ✅ 请求封装
- ✅ 状态管理（Pinia）
- ✅ 首页 UI
- ✅ 答题页核心功能
- ✅ 题库列表展示

### P1 业务功能（已完成）

- ✅ 用户登录/注册
- ✅ 题库切换与权限判断
- ✅ 做题记录与解析显示

### P2 增值功能（部分完成）

- ✅ 倒计时配置化
- ✅ 草稿纸 Canvas
- ⏳ 支付与激活码流程（UI 已完成）
- ⏳ 错题集、收藏功能（UI 已完成）

## 接口说明

### 基础配置

- 开发环境: `http://localhost:3000/api`
- 生产环境: `https://api.example.com/api`

### 主要接口

- `GET /home/config` - 获取首页配置
- `GET /bank/list` - 获取题库列表
- `GET /bank/:id` - 获取题库详情
- `GET /paper/:id/questions` - 获取试卷题目
- `POST /auth/login` - 用户登录
- `POST /activation/verify` - 激活码验证
- `POST /exam/:id/submit` - 提交考试答案

## 注意事项

1. **环境变量**: 需要在 `utils/request.js` 中配置正确的 API 地址
2. **微信小程序**: 需要在 `manifest.json` 中配置正确的 appid
3. **静态资源**: TabBar 图标需要放置在 `static/tabbar/` 目录下
4. **权限控制**: 部分功能需要后端接口支持，当前为 Mock 数据

## 开发规范

- 使用 ES6+ 语法
- 组件使用 `<script setup>` 语法
- 样式使用 SCSS，遵循全局变量规范
- 函数命名采用语义化命名
- 注释写在复杂逻辑处

## 待完善功能

- [ ] 支付流程完整实现
- [ ] 错题集数据对接
- [ ] 收藏功能数据对接
- [ ] 学习轨迹数据可视化
- [ ] 排行榜实时更新
- [ ] 题目图片上传
- [ ] 公式渲染优化


# AppIcon 组件使用说明

## 概述

`AppIcon` 是一个基于 SVG 的图标组件，使用内联 SVG 路径，无需外部字体文件。

## 使用方法

### 基础用法

```vue
<template>
  <app-icon name="home" />
</template>

<script setup>
import AppIcon from '@/components/app-icon/app-icon.vue'
</script>
```

### 自定义大小

```vue
<app-icon name="settings" :size="32" />
<app-icon name="user" :size="48" />
```

### 自定义颜色

```vue
<app-icon name="star" color="#ffd700" />
<app-icon name="error" color="#e74c3c" />
```

### 带描边

```vue
<app-icon name="lock" :size="24" stroke-color="#333" :stroke-width="1" />
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| name | String | 必填 | 图标名称 |
| size | Number/String | 24 | 图标大小（px） |
| color | String | '' | 填充颜色，为空时使用 currentColor |
| strokeColor | String | '' | 描边颜色 |
| strokeWidth | Number/String | 0 | 描边宽度 |
| customClass | String | '' | 自定义类名 |

## 可用图标

### TabBar 图标
- `home` / `home-fill` - 首页
- `book` / `book-fill` - 书籍/题库
- `user` / `user-fill` - 用户

### 功能图标
- `ticket` - 票券/激活码
- `settings` - 设置
- `star` / `star-fill` - 收藏
- `wrong` / `error` - 错误/错题
- `rank` - 排行榜
- `chart` - 图表/学习轨迹
- `note` - 笔记
- `info` - 信息
- `logout` - 退出

### 操作图标
- `arrow-right` - 右箭头
- `arrow-down` - 下箭头
- `close` - 关闭
- `correct` / `check` - 正确/选中
- `lock` - 锁定
- `clock` - 时钟/待支付
- `progress` - 进度

### 答题相关
- `exam` - 考试
- `random` - 随机
- `favorite` - 收藏
- `draft` - 草稿纸
- `report` - 报告/纠错
- `prev` - 上一题
- `next` - 下一题
- `submit` - 提交
- `answer-sheet` - 答题卡
- `eraser` - 橡皮擦
- `clear` - 清空
- `minimize` - 最小化

## 添加新图标

1. 在 `icon-paths.js` 中添加新的路径定义：

```javascript
export const iconPaths = {
  // ... 现有图标
  'new-icon': 'M12 2L2 7l10 5 10-5-10-5z' // SVG path 数据
}
```

2. 使用新图标：

```vue
<app-icon name="new-icon" />
```

## SVG Path 获取方式

1. **从 IconFont 获取**：
   - 访问 https://www.iconfont.cn/
   - 选择图标，点击"复制 SVG 代码"
   - 提取 `<path>` 标签的 `d` 属性值

2. **从其他图标库获取**：
   - Material Icons: https://fonts.google.com/icons
   - Heroicons: https://heroicons.com/
   - Feather Icons: https://feathericons.com/

3. **使用 AI 生成**：
   - 使用 ChatGPT/Claude 等 AI 工具描述图标需求
   - 要求生成 SVG path 数据

## 优势

- ✅ 无需外部字体文件，减少依赖
- ✅ 图标可任意缩放，不失真
- ✅ 支持自定义颜色和样式
- ✅ 文件体积小，加载快
- ✅ 易于维护和扩展

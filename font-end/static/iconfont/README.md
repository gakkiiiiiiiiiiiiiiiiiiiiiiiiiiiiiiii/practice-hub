# IconFont 使用说明

## 获取 IconFont

1. 访问 [IconFont 官网](https://www.iconfont.cn/)
2. 创建项目并添加所需图标
3. 下载字体文件到本目录
4. 更新 `iconfont.css` 中的图标类名

## 已定义的图标

### TabBar 图标
- `icon-home` / `icon-home-fill` - 首页
- `icon-book` / `icon-book-fill` - 题库
- `icon-user` / `icon-user-fill` - 我的

### 功能图标
- `icon-ticket` - 激活码/票券
- `icon-settings` - 设置
- `icon-star` / `icon-star-fill` - 收藏
- `icon-wrong` - 错题
- `icon-rank` - 排行榜
- `icon-chart` - 图表/学习轨迹
- `icon-note` - 笔记
- `icon-info` - 信息
- `icon-logout` - 退出登录

### 操作图标
- `icon-arrow-right` - 右箭头
- `icon-arrow-down` - 下箭头
- `icon-close` - 关闭
- `icon-correct` - 正确
- `icon-error` - 错误
- `icon-lock` - 锁定
- `icon-check` - 选中
- `icon-progress` - 进度

### 答题相关
- `icon-exam` - 考试
- `icon-random` - 随机
- `icon-favorite` - 收藏
- `icon-draft` - 草稿纸
- `icon-report` - 纠错
- `icon-prev` - 上一题
- `icon-next` - 下一题
- `icon-submit` - 提交
- `icon-answer-sheet` - 答题卡
- `icon-eraser` - 橡皮擦
- `icon-clear` - 清空
- `icon-minimize` - 最小化

## 使用方法

### 方式一：使用组件（推荐）

```vue
<template>
  <app-icon name="home" :size="24" color="#333" />
</template>

<script setup>
import AppIcon from '@/components/app-icon/app-icon.vue'
</script>
```

### 方式二：直接使用类名

```vue
<template>
  <text class="iconfont icon-home"></text>
</template>
```

## 注意事项

1. **字体文件**：需要从 IconFont 下载实际的字体文件（.woff2, .woff, .ttf）
2. **图标映射**：确保 CSS 中的 content 值与实际字体文件中的字符编码一致
3. **TabBar**：TabBar 图标仍需要使用图片，IconFont 可用于页面内的图标

## 快速开始

1. 在 IconFont 创建项目
2. 搜索并添加所需图标到项目
3. 下载字体文件，替换本目录中的文件
4. 复制 CSS 代码，更新 `iconfont.css` 中的类名定义


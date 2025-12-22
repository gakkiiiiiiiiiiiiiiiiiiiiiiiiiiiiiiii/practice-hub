# IconFont 快速设置指南

## 重要提示

当前项目已配置好 IconFont 的基础结构，但**需要您从 IconFont 官网下载实际的字体文件**才能正常使用。

## 快速开始（3步）

### 1. 访问 IconFont 并创建项目

访问：https://www.iconfont.cn/

1. 登录账号（支持 GitHub/微博登录）
2. 创建新项目："考研刷题小程序"

### 2. 添加图标到项目

在 IconFont 搜索并添加以下图标（建议使用 Ant Design Icons 或 Element Icons）：

#### TabBar 图标（需要普通+填充两种）
- `home` / `home-fill` - 首页
- `book` / `book-fill` - 书籍/题库
- `user` / `user-fill` - 用户

#### 功能图标
- `ticket` - 票券/激活码
- `settings` - 设置
- `star` / `star-fill` - 收藏
- `wrong` / `error` - 错误/错题
- `rank` - 排行榜
- `chart` - 图表/学习轨迹
- `note` - 笔记
- `info` - 信息
- `logout` - 退出

#### 操作图标
- `arrow-right` - 右箭头
- `arrow-down` - 下箭头
- `close` - 关闭
- `correct` / `check` - 正确/选中
- `lock` - 锁定
- `clock` - 时钟/待支付

#### 答题相关
- `exam` - 考试
- `random` - 随机
- `draft` - 草稿纸
- `report` - 报告/纠错
- `prev` - 上一题
- `next` - 下一题
- `submit` - 提交
- `answer-sheet` - 答题卡
- `eraser` - 橡皮擦
- `clear` - 清空
- `minimize` - 最小化

### 3. 下载并替换字体文件

1. 在 IconFont 项目页面，点击"下载至本地"
2. 解压下载的文件
3. 将以下文件复制到 `static/iconfont/` 目录：
   - `iconfont.woff2`
   - `iconfont.woff`
   - `iconfont.ttf`

4. 打开下载包中的 `iconfont.css`，找到每个图标的 Unicode 编码
5. 更新 `static/iconfont/iconfont.css` 中的 content 值

例如，如果 `home` 图标的 Unicode 是 `\e600`，则：

```css
.icon-home::before { content: "\e600"; }
```

## 使用方式

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

1. **TabBar 图标**：微信小程序的 TabBar 必须使用图片，不能使用字体图标。当前配置仍使用图片，IconFont 仅用于页面内图标。

2. **字体文件大小**：建议控制在 100KB 以内，只添加实际使用的图标。

3. **图标颜色**：可以通过 CSS `color` 属性或组件的 `color` prop 控制。

4. **图标大小**：通过 `font-size` 或组件的 `size` prop 控制。

## 已完成替换的页面

- ✅ 首页 - 功能入口图标
- ✅ 题库页 - 功能矩阵图标、状态图标
- ✅ 答题页 - 操作按钮图标
- ✅ 个人中心 - 菜单图标、状态图标
- ✅ 题目卡片 - 正确/错误图标
- ✅ 草稿纸 - 工具图标

所有 emoji 图标已替换为 IconFont 组件或类名，等待字体文件即可正常显示。


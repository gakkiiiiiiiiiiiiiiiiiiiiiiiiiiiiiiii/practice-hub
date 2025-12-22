# 静态资源生成脚本

## 使用方法

```bash
node scripts/generate-assets.js
```

## 生成的文件

### TabBar 图标
- `static/tabbar/home.png` - 首页图标（未选中）
- `static/tabbar/home-active.png` - 首页图标（选中）
- `static/tabbar/book.png` - 题库图标（未选中）
- `static/tabbar/book-active.png` - 题库图标（选中）
- `static/tabbar/user.png` - 我的图标（未选中）
- `static/tabbar/user-active.png` - 我的图标（选中）

### 其他资源
- `static/default-avatar.png` - 默认头像
- `static/pattern.png` - 背景图案
- `static/course/*.jpg` - 课程封面占位图

## 注意事项

1. **当前生成的是 SVG 格式的占位图片**，虽然扩展名是 .png/.jpg，但实际是 SVG 文件
2. **小程序环境**：微信小程序可能不完全支持 SVG，建议替换为真实的 PNG 图片
3. **替换真实图片**：在实际项目中，请使用设计师提供的真实图标和图片

## 获取真实图片的建议

1. **图标**：使用 [IconFont](https://www.iconfont.cn/) 或 [Flaticon](https://www.flaticon.com/) 下载
2. **头像**：使用占位图服务如 [UI Avatars](https://ui-avatars.com/)
3. **课程封面**：使用设计工具（Figma、Sketch）或图片库

## 使用 Canvas 生成真实 PNG（需要额外依赖）

如果需要生成真实的 PNG 图片，可以安装 `canvas` 包：

```bash
npm install canvas --save-dev
```

然后修改脚本使用 canvas API 生成图片。


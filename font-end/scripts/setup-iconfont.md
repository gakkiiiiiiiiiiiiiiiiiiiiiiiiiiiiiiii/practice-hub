# IconFont 设置指南

## 步骤 1: 在 IconFont 创建项目

1. 访问 https://www.iconfont.cn/
2. 登录账号（支持 GitHub/微博登录）
3. 点击"图标管理" -> "我的项目" -> "新建项目"
4. 项目名称：考研刷题小程序

## 步骤 2: 添加图标

### TabBar 图标
搜索并添加以下图标：
- `home` (首页) - 添加普通和填充两种样式
- `book` (书籍) - 添加普通和填充两种样式  
- `user` (用户) - 添加普通和填充两种样式

### 功能图标
- `ticket` (票券) - 激活码
- `settings` (设置)
- `star` (星星) - 收藏，需要普通和填充
- `wrong` (错误/叉号) - 错题
- `rank` (排行榜)
- `chart` (图表) - 学习轨迹
- `note` (笔记)
- `info` (信息)
- `logout` (退出)

### 操作图标
- `arrow-right` (右箭头)
- `arrow-down` (下箭头)
- `close` (关闭)
- `correct` (正确/对号)
- `error` (错误)
- `lock` (锁定)
- `check` (选中)

### 答题相关
- `exam` (考试)
- `random` (随机)
- `favorite` (收藏)
- `draft` (草稿纸)
- `report` (报告)
- `prev` (上一题)
- `next` (下一题)
- `submit` (提交)
- `answer-sheet` (答题卡)
- `eraser` (橡皮擦)
- `clear` (清空)
- `minimize` (最小化)

## 步骤 3: 下载字体文件

1. 在项目页面，点击"下载至本地"
2. 解压下载的文件
3. 将以下文件复制到 `static/iconfont/` 目录：
   - `iconfont.woff2`
   - `iconfont.woff`
   - `iconfont.ttf`
   - `iconfont.css` (可选，我们会使用自定义的 CSS)

## 步骤 4: 更新 CSS 类名

1. 打开下载的 `iconfont.css` 或查看 IconFont 项目页面
2. 找到每个图标的 Unicode 编码（如 `\e600`）
3. 更新 `static/iconfont/iconfont.css` 中的 content 值

例如：
```css
.icon-home::before { content: "\e600"; }  /* 替换为实际的 Unicode */
```

## 步骤 5: 验证

运行项目，检查图标是否正常显示：

```bash
npm run dev:mp-weixin
```

## 推荐图标库

如果不想自己创建，可以使用以下现成的图标库：

1. **Ant Design Icons** - https://www.iconfont.cn/collections/detail?cid=9401
2. **Element Icons** - https://www.iconfont.cn/collections/detail?cid=314
3. **Font Awesome** - https://www.iconfont.cn/collections/detail?cid=9399

## 注意事项

- TabBar 图标在微信小程序中必须使用图片，不能使用字体图标
- 字体文件大小建议控制在 100KB 以内
- 图标颜色可以通过 CSS 的 `color` 属性控制
- 图标大小通过 `font-size` 控制


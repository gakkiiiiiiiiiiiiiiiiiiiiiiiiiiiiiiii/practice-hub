# 小程序脚本说明

## sync-page-routes.js - 同步页面路由

### 功能说明

该脚本用于读取 `pages.json` 文件中的所有页面路由信息，并上传到后端数据库。这样管理端就可以动态获取小程序的所有页面列表，用于配置轮播图跳转等功能。

### 使用方法

#### 方法1：使用 npm 脚本（推荐）

```bash
# 在 font-end 目录下运行
npm run sync-routes
```

#### 方法2：直接运行脚本

```bash
# 在 font-end 目录下运行
node scripts/sync-page-routes.js
```

#### 方法3：指定后端地址

```bash
# 设置环境变量
export API_BASE_URL=https://your-api-domain.com
npm run sync-routes

# 或者在命令中直接指定
API_BASE_URL=https://your-api-domain.com node scripts/sync-page-routes.js
```

### 配置说明

脚本会读取以下配置：

- `API_BASE_URL`: 后端 API 地址（默认：`http://localhost:3000`）
- `PAGES_JSON_PATH`: pages.json 文件路径（默认：`../pages.json`）

### 工作原理

1. 读取 `pages.json` 文件
2. 提取所有页面路径和标题：
   - 主包页面（`pages` 数组）
   - 子包页面（`subPackages` 数组）
   - 自动识别 TabBar 页面
3. 调用后端接口 `/api/app/page-routes/sync` 上传数据
4. 后端会：
   - 创建新的页面路由记录
   - 更新已存在的页面路由（根据路径匹配）
   - 返回同步结果统计

### 输出示例

```
🚀 开始同步小程序页面路由...
   后端地址: http://localhost:3000
   pages.json: /path/to/pages.json

✅ 读取 pages.json 成功
✅ 提取到 19 个页面路由

页面路由列表:
   1. [tabBar] /pages/index/index - 首页
   2. [tabBar] /pages/bank/index - 题库
   3. [tabBar] /pages/user/index - 我的
   4. [main] /pages/answer/index - 答题
   ...

✅ 同步成功！
   创建: 19 条
   更新: 0 条
   总计: 19 条

✨ 同步完成！
```

### 注意事项

1. 确保后端服务已启动
2. 确保已执行数据库迁移（创建 `page_route` 表）
3. 脚本会自动识别页面类型（main/sub/tabBar）
4. 如果页面路径已存在，会更新标题和类型
5. 同步后的页面路由状态默认为"启用"

### 故障排查

1. **连接失败**：检查后端服务是否启动，API 地址是否正确
2. **读取失败**：检查 `pages.json` 文件是否存在且格式正确
3. **同步失败**：检查后端日志，查看具体错误信息
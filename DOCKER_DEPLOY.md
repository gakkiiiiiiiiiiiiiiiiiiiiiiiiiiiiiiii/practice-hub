# 微信云托管 Docker 部署指南

本文档说明如何将项目部署到微信云托管平台。

## 项目结构

项目包含两个主要服务：

1. **后端服务** (`back-end/`) - NestJS API 服务
2. **管理后台** (`admin-web/`) - Vue 3 管理后台（静态文件）

## 前置准备

### 1. 环境变量配置

#### 后端服务环境变量

在微信云托管控制台配置以下环境变量：

```env
# 数据库配置
DB_HOST=your_database_host
DB_PORT=3306
DB_USERNAME=your_database_username
DB_PASSWORD=your_database_password
DB_DATABASE=practice_hub

# JWT 配置
JWT_SECRET=your_very_secure_jwt_secret_key_min_32_chars
JWT_EXPIRE=7d

# 微信小程序配置
WECHAT_APPID=your_wechat_appid
WECHAT_SECRET=your_wechat_secret

# 腾讯云 COS 配置（图片上传）
COS_BUCKET=your_cos_bucket_name
COS_REGION=ap-shanghai

# 服务器配置
PORT=8080
NODE_ENV=production

# 可选配置
COUNTDOWN_DATE=2024-12-23
```

#### 管理后台构建参数

管理后台是静态文件，需要在构建时配置 API 地址。

**方式一：通过构建参数（推荐）**

在微信云托管控制台配置构建参数：

```env
VITE_API_BASE_URL=https://your-backend-api-domain.com/api
```

**方式二：通过环境变量文件**

在 `admin-web/.env.production` 文件中配置：

```env
VITE_API_BASE_URL=https://your-backend-api-domain.com/api
```

然后在构建时复制该文件到镜像中。

### 2. 数据库准备

确保 MySQL 数据库已创建，数据库表结构会在应用启动时自动同步（TypeORM）。

## 部署步骤

### 方式一：通过微信云托管控制台部署

#### 1. 部署后端服务

1. **创建服务**
   - 登录微信云托管控制台
   - 创建新服务，选择"代码部署"

2. **配置代码仓库**
   - 连接 GitHub/GitLab 仓库
   - 选择 `back-end` 目录
   - 选择分支（如 `main` 或 `master`）

3. **配置构建**
   - 构建方式：Dockerfile
   - Dockerfile 路径：`back-end/Dockerfile`
   - 构建命令：自动使用 Dockerfile

4. **配置环境变量**
   - 在服务配置中添加所有必需的环境变量
   - 参考上面的环境变量列表

5. **配置端口**
   - 容器端口：8080
   - 微信云托管会自动映射到外部端口

6. **部署**
   - 点击"部署"按钮
   - 等待构建和部署完成

#### 2. 部署管理后台

1. **创建服务**
   - 创建新服务，选择"代码部署"

2. **配置代码仓库**
   - 选择 `admin-web` 目录
   - 选择分支

3. **配置构建**
   - 构建方式：Dockerfile
   - Dockerfile 路径：`admin-web/Dockerfile`
   - 构建命令：自动使用 Dockerfile
   - **构建参数**（重要）：
     - `VITE_API_BASE_URL`: 后端 API 地址
       - 如果后端和管理后台部署在同一域名下：`/api`
       - 如果后端部署在不同域名：`https://your-backend-api-domain.com/api`

4. **配置端口**
   - 容器端口：8080
   - Readiness Probe：8080
   - Liveness Probe：8080
   - 微信云托管会自动映射到外部端口

5. **部署**
   - 点击"部署"按钮
   - 等待构建和部署完成

**注意**：`VITE_API_BASE_URL` 必须在构建时传入，因为 Vite 会将环境变量打包到静态文件中。部署后无法修改。

### 方式二：通过命令行部署

```bash
# 1. 安装微信云托管 CLI
npm install -g @cloudbase/cli

# 2. 登录
tcb login

# 3. 部署后端服务
cd back-end
tcb init
tcb deploy

# 4. 部署管理后台
cd ../admin-web
tcb init
tcb deploy
```

## 本地构建测试

在推送到微信云托管之前，可以在本地测试 Docker 镜像：

### 测试后端服务

```bash
cd back-end

# 构建镜像
docker build -t practice-hub-backend:latest .

# 运行容器（需要配置环境变量）
docker run -d \
  -p 8080:8080 \
  -e DB_HOST=your_db_host \
  -e DB_PORT=3306 \
  -e DB_USERNAME=your_db_username \
  -e DB_PASSWORD=your_db_password \
  -e DB_DATABASE=practice_hub \
  -e JWT_SECRET=your_jwt_secret \
  -e WECHAT_APPID=your_appid \
  -e WECHAT_SECRET=your_secret \
  -e COS_BUCKET=your_bucket \
  -e COS_REGION=ap-shanghai \
  -e PORT=8080 \
  -e NODE_ENV=production \
  practice-hub-backend:latest

# 测试 API
curl http://localhost:8080/api
```

### 测试管理后台

```bash
cd admin-web

# 构建镜像（传入 API 地址）
# 方式一：使用 --build-arg（推荐）
docker build \
  --build-arg VITE_API_BASE_URL=http://localhost:8080/api \
  -t practice-hub-admin:latest .

# 方式二：使用环境变量文件
# 创建 .env.production 文件：
# VITE_API_BASE_URL=http://localhost:8080/api
docker build -t practice-hub-admin:latest .

# 运行容器
docker run -d -p 8081:80 practice-hub-admin:latest

# 访问管理后台
open http://localhost:8081

# 验证 API 地址是否正确
# 打开浏览器开发者工具，查看网络请求，确认 baseURL 是否正确
```

## 健康检查

### 后端服务健康检查

后端服务包含健康检查配置：

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

健康检查端点：`GET /api`

### 管理后台健康检查

管理后台包含健康检查配置：

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1
```

健康检查端点：`GET /`

## 常见问题

### Q: 后端服务启动失败，提示端口权限错误？

A: 确保使用 8080 端口（非 root 用户无法监听 1024 以下端口）。Dockerfile 已配置为使用 8080 端口。

### Q: 数据库连接失败？

A: 
1. 检查数据库地址是否正确
2. 检查数据库是否允许从微信云托管网络访问
3. 检查数据库用户名和密码是否正确
4. 如果使用腾讯云数据库，确保开启了外网访问或配置了 VPC

### Q: 管理后台无法访问后端 API？

A: 
1. **检查构建参数**：确保在构建时传入了正确的 `VITE_API_BASE_URL`
   ```bash
   # 在微信云托管控制台检查构建参数
   VITE_API_BASE_URL=https://your-backend-api-domain.com/api
   ```

2. **验证构建结果**：检查构建后的代码中是否包含正确的 API 地址
   - 打开浏览器开发者工具
   - 查看 Network 请求，确认 baseURL 是否正确
   - 或者查看构建后的 `dist` 目录中的 JS 文件，搜索 `VITE_API_BASE_URL`

3. **检查后端服务**：
   - 确认后端服务正常运行
   - 确认后端 API 地址可访问
   - 检查 CORS 配置（后端已配置允许跨域）

4. **重新构建**：如果 API 地址不正确，需要重新构建镜像（Vite 的环境变量在构建时打包，无法运行时修改）

### Q: 如何查看部署日志？

A: 在微信云托管控制台 → 服务 → 日志中查看。

### Q: 如何更新部署？

A: 
1. 推送代码到 Git 仓库
2. 在微信云托管控制台点击"重新部署"
3. 或配置自动部署（Git 推送时自动部署）

## 性能优化建议

1. **使用多阶段构建**：已实现，减少镜像大小
2. **使用 .dockerignore**：已配置，排除不必要的文件
3. **使用缓存层**：先复制 package.json，利用 Docker 缓存
4. **使用 Alpine 镜像**：减小镜像大小
5. **启用 Nginx gzip**：管理后台已配置 gzip 压缩

## 安全建议

1. **使用非 root 用户**：后端服务已配置
2. **环境变量敏感信息**：不要在代码中硬编码，使用环境变量
3. **定期更新依赖**：定期运行 `npm audit` 检查安全漏洞
4. **使用 HTTPS**：微信云托管会自动提供 HTTPS

## 相关文档

- [后端部署文档](./back-end/DEPLOY.md)
- [后端故障排查](./back-end/DEPLOY_TROUBLESHOOTING.md)
- [环境变量配置](./ENV_CONFIG.md)

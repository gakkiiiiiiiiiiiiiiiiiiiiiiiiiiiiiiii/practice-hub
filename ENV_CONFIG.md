# 环境变量配置说明

本文档说明如何通过环境变量配置 API 地址。

## 管理后台 (admin-web)

### 环境变量说明

在 `admin-web` 目录下创建 `.env` 文件（可参考 `.env.example`）：

```bash
# API 配置
# 生产环境使用的 API 基础地址
# 例如：https://api.example.com 或 https://your-domain.com/api
VITE_API_BASE_URL=/api

# 开发环境代理目标（仅开发时使用）
# 当 VITE_ENABLE_PROXY=true 时，会将 /api 请求代理到此地址
# 例如：http://localhost:3333
VITE_PROXY_TARGET=http://localhost:3333

# 是否启用代理（开发环境）
# true: 启用代理，使用真实后端 API
# false: 禁用代理，使用 Mock 数据
VITE_ENABLE_PROXY=false

# 开发服务器端口
VITE_PORT=3000
```

### 使用方式

1. **开发环境（使用 Mock）**：
   ```bash
   # .env 文件
   VITE_ENABLE_PROXY=false
   ```

2. **开发环境（使用真实后端）**：
   ```bash
   # .env 文件
   VITE_ENABLE_PROXY=true
   VITE_PROXY_TARGET=http://localhost:3333
   ```

3. **生产环境**：
   ```bash
   # .env.production 文件
   VITE_API_BASE_URL=https://api.example.com/api
   ```

### 配置说明

- `VITE_API_BASE_URL`: 生产环境构建时使用的 API 基础地址
- `VITE_PROXY_TARGET`: 开发环境代理目标，仅当 `VITE_ENABLE_PROXY=true` 时生效
- `VITE_ENABLE_PROXY`: 是否启用开发代理，启用后会禁用 Mock
- `VITE_PORT`: 开发服务器端口

## 小程序端 (font-end)

### 环境变量说明

在 `font-end` 目录下创建 `.env` 文件（可参考 `.env.example`）：

```bash
# API 配置
# API 基础地址（完整 URL，包含协议和端口）
# 开发环境示例：http://127.0.0.1:3333/api
# 生产环境示例：https://api.example.com/api
VITE_API_BASE_URL=http://127.0.0.1:3333/api
```

### 使用方式

1. **开发环境**：
   ```bash
   # .env 文件
   VITE_API_BASE_URL=http://127.0.0.1:3333/api
   ```

2. **生产环境**：
   ```bash
   # .env.production 文件
   VITE_API_BASE_URL=https://api.example.com/api
   ```

### 配置说明

- `VITE_API_BASE_URL`: API 基础地址，必须是完整的 URL（包含协议、域名和端口）
- 小程序端会根据环境自动选择使用微信云服务或 `uni.request`
- 如果配置了完整 URL，会直接使用；如果是相对路径，会拼接 `VITE_API_BASE_URL`

## 环境变量文件

### 不同环境的配置文件

- `.env`: 所有环境的默认配置
- `.env.local`: 本地环境配置（会被 git 忽略）
- `.env.development`: 开发环境配置
- `.env.production`: 生产环境配置

### 优先级

环境变量文件的优先级（从高到低）：
1. `.env.local`
2. `.env.[mode].local`（如 `.env.production.local`）
3. `.env.[mode]`（如 `.env.production`）
4. `.env`

## 注意事项

1. **不要提交 `.env` 文件到 Git**：`.env` 文件通常包含敏感信息，应该添加到 `.gitignore`
2. **使用 `.env.example` 作为模板**：将 `.env.example` 提交到 Git，作为配置模板
3. **重启开发服务器**：修改环境变量后，需要重启开发服务器才能生效
4. **生产环境构建**：生产环境构建时，确保设置了正确的 `VITE_API_BASE_URL`

## 示例

### 开发环境配置

**admin-web/.env**:
```bash
VITE_ENABLE_PROXY=true
VITE_PROXY_TARGET=http://localhost:3333
VITE_API_BASE_URL=/api
```

**font-end/.env**:
```bash
VITE_API_BASE_URL=http://127.0.0.1:3333/api
```

### 生产环境配置

**admin-web/.env.production**:
```bash
VITE_API_BASE_URL=https://api.example.com/api
```

**font-end/.env.production**:
```bash
VITE_API_BASE_URL=https://api.example.com/api
```


import { defineConfig, loadEnv } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { resolve } from 'path'

// 从 font-end/.env 读取（必须用 __dirname：从仓库根目录执行脚本时 process.cwd() 读不到 .env）
const resolveApiBaseUrl = (mode) => {
	const envDir = resolve(__dirname)
	const env = loadEnv(mode, envDir, '')
	const resolved =
		env.VITE_API_BASE_URL ||
		env.API_BASE_URL ||
		process.env.VITE_API_BASE_URL ||
		process.env.API_BASE_URL ||
		'http://127.0.0.1:3333/api'
	if (!env.VITE_API_BASE_URL && !env.API_BASE_URL) {
		console.warn(
			`[vite] 未在 ${envDir}/.env 中找到 VITE_API_BASE_URL 或 API_BASE_URL，小程序将使用默认本地地址（请检查 .env 是否在 font-end 目录且已保存）`,
		)
	}
	return resolved
}

export default defineConfig(({ mode }) => {
	const apiBaseUrl = resolveApiBaseUrl(mode)

	return {
  plugins: [uni()],
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
      '~': resolve(__dirname, '.')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/uni.scss";`
      }
    }
  },
  // 配置静态资源处理
  publicDir: 'static',
  define: {
		// uni 部分构建链路仍走 process.env，双写避免 uploadFile 等读不到地址
		'process.env.VITE_API_BASE_URL': JSON.stringify(apiBaseUrl),
		'process.env.API_BASE_URL': JSON.stringify(apiBaseUrl),
	},
	}
})


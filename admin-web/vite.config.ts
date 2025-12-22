import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { viteMockServe } from 'vite-plugin-mock';

// 是否启用代理（当后端服务可用时设置为 true）
// 开发时如果后端未启动，设置为 false 以使用 Mock
const enableProxy = process.env.VITE_ENABLE_PROXY === 'true';

export default defineConfig({
	plugins: [
		vue(),
		viteMockServe({
			mockPath: 'src/mock/modules',
			enable: false, // 当启用代理时，禁用 Mock
			watchFiles: true,
		}),
	],
	resolve: {
		alias: {
			'@': resolve(__dirname, 'src'),
		},
	},
	server: {
		port: 3000,
		open: true,
		// 代理配置：仅在启用时使用
		// 当后端服务启动后，设置环境变量 VITE_ENABLE_PROXY=true 来启用代理
		proxy: {
			'/api': {
				target: 'http://localhost:3333', // 后端服务端口（默认 3333，可通过环境变量 PORT 修改）
				changeOrigin: true,
				secure: false,
				// 后端已设置全局前缀 'api'，所以不需要 rewrite
				// rewrite: (path) => path.replace(/^\/api/, ''),
			},
		},
	},
	build: {
		outDir: 'dist',
		sourcemap: false,
		chunkSizeWarningLimit: 1500,
	},
	define: {
		'import.meta.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || '/api'),
	},
});

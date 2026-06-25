/**
 * 同步小程序页面路由到后端
 * 读取 pages.json 文件，提取所有页面路径和标题，上传到后端接口
 * 
 * 使用方法：
 * 1. 在项目根目录运行：node scripts/sync-page-routes.js
 * 2. 或者在 package.json 中添加脚本：npm run sync-routes
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// 读取环境变量或配置文件
function getApiBaseUrl() {
	// 优先使用环境变量
	if (process.env.API_BASE_URL) {
		return process.env.API_BASE_URL;
	}
	
	// 尝试读取 .env 文件
	try {
		const envPath = path.join(__dirname, '../.env');
		if (fs.existsSync(envPath)) {
			const envContent = fs.readFileSync(envPath, 'utf-8');
			const match = envContent.match(/API_BASE_URL\s*=\s*(.+)/);
			if (match) {
				return match[1].trim();
			}
		}
	} catch (error) {
		// 忽略错误
	}
	
	// 默认值
	return 'http://localhost:3000';
}

// 配置
const CONFIG = {
	// 后端 API 地址
	API_BASE_URL: getApiBaseUrl(),
	// pages.json 文件路径
	PAGES_JSON_PATH: path.join(__dirname, '../pages.json'),
};

// TabBar 页面列表
const TABBAR_PAGES = [
	'/pages/index/index',
	'/pages/bank/index',
	'/pages/user/index',
];

/**
 * 读取 pages.json 文件
 */
function readPagesJson() {
	try {
		const content = fs.readFileSync(CONFIG.PAGES_JSON_PATH, 'utf-8');
		return JSON.parse(content);
	} catch (error) {
		console.error('读取 pages.json 失败:', error.message);
		process.exit(1);
	}
}

/**
 * 提取页面路由信息
 */
function extractPageRoutes(pagesJson) {
	const routes = [];

	// 提取主包页面
	if (pagesJson.pages && Array.isArray(pagesJson.pages)) {
		pagesJson.pages.forEach((page) => {
			const pagePath = `/${page.path}`;
			const title = page.style?.navigationBarTitleText || page.path.split('/').pop() || '未命名页面';
			const type = TABBAR_PAGES.includes(pagePath) ? 'tabBar' : 'main';

			routes.push({
				path: pagePath,
				title: title,
				type: type,
			});
		});
	}

	// 提取子包页面
	if (pagesJson.subPackages && Array.isArray(pagesJson.subPackages)) {
		pagesJson.subPackages.forEach((subPackage) => {
			const root = subPackage.root || 'pages/sub-pages';
			if (subPackage.pages && Array.isArray(subPackage.pages)) {
				subPackage.pages.forEach((page) => {
					const pagePath = `/${root}/${page.path}`;
					const title = page.style?.navigationBarTitleText || page.path.split('/').pop() || '未命名页面';

					routes.push({
						path: pagePath,
						title: title,
						type: 'sub',
					});
				});
			}
		});
	}

	return routes;
}

/**
 * 上传页面路由到后端
 */
async function syncPageRoutes(routes) {
	try {
		console.log(`准备同步 ${routes.length} 个页面路由...`);

		const response = await axios.post(`${CONFIG.API_BASE_URL}/api/app/page-routes/sync`, {
			routes: routes,
		});

		if (response.data && response.data.code === 200) {
			const result = response.data.data;
			console.log('✅ 同步成功！');
			console.log(`   创建: ${result.created} 条`);
			console.log(`   更新: ${result.updated} 条`);
			console.log(`   总计: ${result.total} 条`);
			return true;
		} else {
			console.error('❌ 同步失败:', response.data?.msg || '未知错误');
			return false;
		}
	} catch (error) {
		console.error('❌ 同步失败:', error.message);
		if (error.response) {
			console.error('   响应数据:', error.response.data);
		}
		return false;
	}
}

/**
 * 主函数
 */
async function main() {
	console.log('🚀 开始同步小程序页面路由...');
	console.log(`   后端地址: ${CONFIG.API_BASE_URL}`);
	console.log(`   pages.json: ${CONFIG.PAGES_JSON_PATH}`);
	console.log('');

	// 读取 pages.json
	const pagesJson = readPagesJson();
	console.log('✅ 读取 pages.json 成功');

	// 提取页面路由
	const routes = extractPageRoutes(pagesJson);
	console.log(`✅ 提取到 ${routes.length} 个页面路由`);

	// 显示路由列表
	console.log('\n页面路由列表:');
	routes.forEach((route, index) => {
		console.log(`   ${index + 1}. [${route.type}] ${route.path} - ${route.title}`);
	});

	console.log('');

	// 上传到后端
	const success = await syncPageRoutes(routes);

	if (success) {
		console.log('\n✨ 同步完成！');
		process.exit(0);
	} else {
		console.log('\n❌ 同步失败，请检查错误信息');
		process.exit(1);
	}
}

// 运行主函数
main();

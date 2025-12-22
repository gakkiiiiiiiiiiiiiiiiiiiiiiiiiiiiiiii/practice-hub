/**
 * 生成静态资源占位图片
 * 使用 canvas 生成简单的占位图片
 */

const fs = require('fs');
const path = require('path');

// 创建目录
const staticDir = path.join(__dirname, '../static');
const tabbarDir = path.join(__dirname, '../static/tabbar');
const courseDir = path.join(__dirname, '../static/course');

// 确保目录存在
[staticDir, tabbarDir, courseDir].forEach((dir) => {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
});

// 生成简单的 SVG 占位图片
function generateSVG(width, height, text, color = '#e74c3c', bgColor = '#f5f5f5') {
	return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${bgColor}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${Math.min(width, height) / 4}" 
        fill="${color}" text-anchor="middle" dominant-baseline="middle">${text}</text>
</svg>`;
}

// 生成 TabBar 图标
const tabbarIcons = [
	{ name: 'home.png', text: '🏠', color: '#7A7E83' },
	{ name: 'home-active.png', text: '🏠', color: '#3cc51f' },
	{ name: 'book.png', text: '📚', color: '#7A7E83' },
	{ name: 'book-active.png', text: '📚', color: '#3cc51f' },
	{ name: 'user.png', text: '👤', color: '#7A7E83' },
	{ name: 'user-active.png', text: '👤', color: '#3cc51f' },
];

tabbarIcons.forEach((icon) => {
	const svg = generateSVG(81, 81, icon.text, icon.color, '#ffffff');
	fs.writeFileSync(path.join(tabbarDir, icon.name), svg);
	console.log(`✅ 生成: ${icon.name}`);
});

// 生成默认头像
const defaultAvatar = generateSVG(200, 200, '👤', '#999999', '#f0f0f0');
fs.writeFileSync(path.join(staticDir, 'default-avatar.png'), defaultAvatar);
console.log('✅ 生成: default-avatar.png');

// 生成背景图案（简单的网格图案）
const pattern = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" stroke-width="0.5"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#grid)"/>
</svg>`;
fs.writeFileSync(path.join(staticDir, 'pattern.png'), pattern);
console.log('✅ 生成: pattern.png');

// 生成课程封面占位图
const courseCovers = [
	{ name: 'politics.jpg', text: '政治', color: '#e74c3c' },
	{ name: 'english.jpg', text: '英语', color: '#3498db' },
	{ name: 'math.jpg', text: '数学', color: '#2ecc71' },
	{ name: 'professional.jpg', text: '专业课', color: '#9b59b6' },
];

courseCovers.forEach((cover) => {
	const svg = generateSVG(400, 300, cover.text, '#ffffff', cover.color);
	fs.writeFileSync(path.join(courseDir, cover.name), svg);
	console.log(`✅ 生成: ${cover.name}`);
});

console.log('\n✨ 所有静态资源已生成！');
console.log('注意：这些是 SVG 占位图片，实际项目中建议使用真实的设计图片。');

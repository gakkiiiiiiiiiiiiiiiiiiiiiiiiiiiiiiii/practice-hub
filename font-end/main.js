import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

console.log('========== main.js 执行 ==========');
console.log('Vue version:', createSSRApp);

export function createApp() {
  console.log('========== createApp 函数执行 ==========');
  const app = createSSRApp(App)
  console.log('App 实例创建成功:', app);
  const pinia = createPinia()
  app.use(pinia)
  console.log('Pinia 已注册');
  return {
    app
  }
}


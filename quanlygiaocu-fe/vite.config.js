import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Mọi request bắt đầu bằng /api sẽ được chuyển hướng sang cổng 8080
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '') // Xóa chữ /api trước khi gửi sang BE
      }
    }
  }
})
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // 상대 경로로 빌드해 어떤 하위 경로에 올려도 그대로 동작하게 한다.
  base: './',
  plugins: [react(), tailwindcss()],
})

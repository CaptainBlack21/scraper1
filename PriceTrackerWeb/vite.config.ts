import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Electron prod'da file:// ile açıyoruz → base './' olmalı
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? './' : '/', // 👈 kritik satır
}))

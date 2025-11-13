import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    https: {
      key: fs.existsSync('./cert/key.pem') ? fs.readFileSync('./cert/key.pem') : undefined,
      cert: fs.existsSync('./cert/cert.pem') ? fs.readFileSync('./cert/cert.pem') : undefined,
    },
  },
})

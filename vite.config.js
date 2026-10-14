import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' — чтобы сборка открывалась и с GitHub Pages, и из любой папки
export default defineConfig({
  plugins: [react()],
  base: './',
})

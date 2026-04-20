import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  assetsInclude: ['**/*.onnx'],   // ← tells Vite to serve .onnx as binary
  optimizeDeps: {
    exclude: ['onnxruntime-web']  // ← prevents Vite from bundling ONNX runtime
  }
})
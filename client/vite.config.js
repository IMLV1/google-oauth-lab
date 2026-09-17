import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // ส่งต่อ /api ไปที่ backend เพื่อให้ browser มองว่าเป็น origin เดียวกัน
    // ผลคือ cookie ทำงานได้โดยไม่ต้องตั้ง CORS ให้ยุ่งยาก
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});

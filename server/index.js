import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import { mountAuthRoutes } from './auth.js';

const app = express();

app.use(express.json());
app.use(cookieParser());

// ตรวจ .env ตั้งแต่ตอนเปิด server จะได้ไม่ไปงงตอน login ไม่ผ่าน
for (const key of ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']) {
  if (!process.env[key]) {
    console.error(`ไม่พบ ${key} ใน server/.env — คัดลอกจาก .env.example แล้วเติมค่าให้ครบก่อน`);
    process.exit(1);
  }
}

mountAuthRoutes(app);

app.get('/api/health', (req, res) => res.json({ ok: true }));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`server พร้อมแล้วที่ http://localhost:${port}`);
});

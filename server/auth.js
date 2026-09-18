import { OAuth2Client } from 'google-auth-library';
import { upsertUser, findUserById } from './db.js';
import {
  createSession,
  getSession,
  destroySession,
  SESSION_COOKIE,
  cookieOptions,
} from './sessions.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Middleware: อนุญาตเฉพาะ request ที่มี session ถูกต้อง
 * ให้มาแล้ว ไม่ต้องแก้ ใช้เป็นตัวอย่างของการอ่าน cookie ได้
 */
export async function requireSession(req, res, next) {
  const session = await getSession(req.cookies[SESSION_COOKIE]);
  if (!session) {
    return res.status(401).json({ error: 'ยังไม่ได้เข้าสู่ระบบ' });
  }
  req.userId = session.userId;
  next();
}

export function mountAuthRoutes(app) {
  /**
   * ─────────────────────────────────────────────────────────────
   * TODO 1 — ตรวจสอบ ID token แล้วเปิด session
   * ─────────────────────────────────────────────────────────────
   * React จะส่ง { credential } มาให้ ซึ่งคือ ID token (JWT) จาก Google
   *
   * สิ่งที่ต้องทำตามลำดับ
   *   1.1 เรียก client.verifyIdToken({ idToken, audience }) เพื่อตรวจ
   *       ลายเซ็น, ค่า aud และวันหมดอายุ  ***ห้ามข้ามขั้นนี้***
   *       ถ้าข้าม ใครก็ปลอม JWT บอกว่าตัวเองเป็นใครก็ได้
   *   1.2 ดึง payload ด้วย ticket.getPayload() แล้วหยิบ
   *       sub, email, email_verified, name, picture
   *   1.3 ปฏิเสธถ้า email_verified ไม่เป็น true
   *   1.4 บันทึกผู้ใช้ด้วย upsertUser({ googleId: sub, ... })
   *       ใช้ sub เป็น key อย่าใช้ email
   *   1.5 สร้าง session ด้วย createSession(user.id)
   *   1.6 ส่ง cookie กลับด้วย res.cookie(SESSION_COOKIE, sid, cookieOptions)
   *   1.7 ตอบกลับข้อมูลผู้ใช้เท่าที่หน้าเว็บต้องใช้ ไม่ต้องส่ง token ใดๆ กลับไป
   *
   * เมื่อเกิดข้อผิดพลาด ให้ตอบ 401 พร้อมข้อความที่บอกว่าต้องทำอะไรต่อ
   */
  
  app.post('/api/auth/google', async (req, res) => {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'ไม่พบ credential ใน request' });
    }

    try {
      // เขียนโค้ดของ TODO 1 ตรงนี้
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const { sub, email, email_verified, name, picture } = ticket.getPayload();

      if (!email_verified) {
        return res.status(401).json({ error: 'email ไม่ถูกต้อง' });
      }

      const user = await upsertUser({ googleId: sub, email, name, picture });
      const sid = await createSession(user.id);
      res.cookie(SESSION_COOKIE, sid, cookieOptions);
      res.json({ name: user.name, email: user.email, picture: user.picture });
    } catch (err) {
      console.error('ตรวจสอบ token ไม่ผ่าน:', err.message);
      res.status(401).json({ error: 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่' });
    }
  });

  /**
   * ─────────────────────────────────────────────────────────────
   * TODO 2 — บอกว่าตอนนี้ใครล็อกอินอยู่
   * ─────────────────────────────────────────────────────────────
   * React จะเรียกเส้นนี้ทุกครั้งที่โหลดหน้า เพื่อดูว่ายังมี session อยู่ไหม
   * ใช้ requireSession เป็น middleware แล้วคืนข้อมูลผู้ใช้จาก findUserById(req.userId)
   * ระวังอย่าคืนข้อมูลที่หน้าเว็บไม่ได้ใช้ออกไปโดยไม่จำเป็น
   */
  app.get('/api/me', requireSession, async (req, res) => {
    // เขียนโค้ดของ TODO 2 ตรงนี้
    const user = await findUserById(req.userId);
    if (!user) return res.status(404).json({ error: 'ไม่พบข้อมูลผู้ใช้' });
    res.json({ name: user.name, email: user.email, picture: user.picture });
  });

  /**
   * ─────────────────────────────────────────────────────────────
   * TODO 3 — ออกจากระบบ
   * ─────────────────────────────────────────────────────────────
   * การลบ state ใน React อย่างเดียวไม่ถือว่าออกจากระบบ
   * เพราะ cookie ยังอยู่และยังใช้เรียก API ได้
   *
   *   3.1 ลบ session ที่ฝั่ง server ด้วย destroySession()
   *   3.2 ลบ cookie ด้วย res.clearCookie(SESSION_COOKIE, cookieOptions)
   */
  app.post('/api/auth/logout', async (req, res) => {
    // เขียนโค้ดของ TODO 3 ตรงนี้
    await destroySession(req.cookies[SESSION_COOKIE]);
    res.clearCookie(SESSION_COOKIE, cookieOptions);
    res.status(200).json({ ok: true });
  });
}

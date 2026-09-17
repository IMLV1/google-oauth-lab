// Session store อย่างง่ายเก็บใน memory
// หัวใจคือ client ได้แค่ "รหัส session" ที่เดาไม่ได้ ไม่ใช่ข้อมูลผู้ใช้ และไม่ใช่ token ของ Google

const sessions = new Map(); // sid -> { userId, createdAt }

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 วัน

export async function createSession(userId) {
  const sid = crypto.randomUUID() + crypto.randomUUID().replaceAll('-', '');
  sessions.set(sid, { userId, createdAt: Date.now() });
  return sid;
}

export async function getSession(sid) {
  if (!sid) return null;
  const session = sessions.get(sid);
  if (!session) return null;

  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    sessions.delete(sid);
    return null;
  }
  return session;
}

export async function destroySession(sid) {
  sessions.delete(sid);
}

export const SESSION_COOKIE = 'sid';

// ตัวเลือกของ cookie ใช้ร่วมกันทั้งตอนตั้งและตอนลบ
export const cookieOptions = {
  httpOnly: true,                                  // JavaScript อ่านไม่ได้ กัน XSS ขโมย session
  secure: process.env.NODE_ENV === 'production',   // ตอน dev เป็น http://localhost จึงยังเปิดไม่ได้
  sameSite: 'lax',                                 // กัน CSRF จากเว็บอื่น
  maxAge: SESSION_TTL_MS,
  path: '/',
};

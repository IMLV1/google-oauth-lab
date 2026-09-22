import { OAuth2Client } from 'google-auth-library';
import { upsertUser, findUserById } from './db.js';
import {
  createSession,
  getSession,
  updateSessionTokens,
  destroySession,
  SESSION_COOKIE,
  cookieOptions,
} from './sessions.js';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'postmessage'
);

function getCurrentMonthRange() {
  const now = new Date();

  const thaiDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);

  const year = Number(
    thaiDate.find((part) => part.type === 'year').value
  );

  const month = Number(
    thaiDate.find((part) => part.type === 'month').value
  );

  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;

  const pad = (value) => String(value).padStart(2, '0');

  return {
    timeMin: `${year}-${pad(month)}-01T00:00:00+07:00`,
    timeMax: `${nextYear}-${pad(nextMonth)}-01T00:00:00+07:00`,
    year,
    month,
  };
}

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
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        error: 'ไม่พบ authorization code',
      });
    }

    try {
      // แลก authorization code เป็น Google tokens
      const { tokens } = await client.getToken(code);

      if (!tokens.id_token) {
        return res.status(401).json({
          error: 'Google ไม่ได้ส่ง ID token กลับมา',
        });
      }

      // ตรวจสอบ ID token ก่อนเชื่อข้อมูลผู้ใช้
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const {
        sub,
        email,
        email_verified,
        name,
        picture,
      } = payload;

      if (!email_verified) {
        return res.status(401).json({
          error: 'อีเมล Google ยังไม่ได้รับการยืนยัน',
        });
      }

      const user = await upsertUser({
        googleId: sub,
        email,
        name,
        picture,
      });

      const sid = await createSession(user.id, tokens);

      res.cookie(SESSION_COOKIE, sid, cookieOptions);

      res.json({
        name: user.name,
        email: user.email,
        picture: user.picture,
      });
    } catch (error) {
      console.error('Google OAuth error:', error.message);

      res.status(401).json({
        error: 'เข้าสู่ระบบหรือขอสิทธิ์ Calendar ไม่สำเร็จ',
      });
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
    const user = await findUserById(req.userId);
    if (!user) return res.status(404).json({ error: 'ไม่พบข้อมูลผู้ใช้' });
    res.json({ name: user.name, email: user.email, picture: user.picture });
  });

  app.get('/api/calendar/events', requireSession, async (req, res) => {
    const sid = req.cookies[SESSION_COOKIE];
    const session = await getSession(sid);

    if (!session?.googleTokens) {
      return res.status(401).json({
        error: 'ไม่พบสิทธิ์ Google Calendar กรุณาเข้าสู่ระบบใหม่',
      });
    }

    try {
      const oauthClient = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        'postmessage'
      );

      oauthClient.setCredentials(session.googleTokens);

      oauthClient.on('tokens', async (tokens) => {
        await updateSessionTokens(sid, tokens);
      });

      const { timeMin, timeMax, year, month } = getCurrentMonthRange();

      const events = [];
      let pageToken;

      do {
        const params = new URLSearchParams({
          timeMin,
          timeMax,
          singleEvents: 'true',
          orderBy: 'startTime',
          maxResults: '2500',
          timeZone: 'Asia/Bangkok',
        });

        if (pageToken) {
          params.set('pageToken', pageToken);
        }

        const response = await oauthClient.request({
          url:
            'https://www.googleapis.com/calendar/v3/' +
            `calendars/primary/events?${params.toString()}`,
        });

        events.push(...(response.data.items || []));
        pageToken = response.data.nextPageToken;
      } while (pageToken);

      const result = events.map((event) => ({
        id: event.id,
        summary: event.summary || '(ไม่มีชื่อกิจกรรม)',
        description: event.description || '',
        location: event.location || '',
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        htmlLink: event.htmlLink,
        status: event.status,
      }));

      res.json({
        year,
        month,
        count: result.length,
        events: result,
      });
    } catch (error) {
      console.error('Calendar API error:', error.response?.data || error.message);

      const status = error.response?.status;

      res.status(status === 403 ? 403 : 500).json({
        error:
          status === 403
            ? 'ยังไม่ได้อนุญาตให้อ่าน Google Calendar'
            : 'ดึงข้อมูล Google Calendar ไม่สำเร็จ',
      });
    }
  });

  app.post('/api/auth/logout', async (req, res) => {
    await destroySession(req.cookies[SESSION_COOKIE]);
    res.clearCookie(SESSION_COOKIE, cookieOptions);
    res.status(200).json({ ok: true });
  });
}

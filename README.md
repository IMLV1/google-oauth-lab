# แล็บ Sign in with Google

โครงตั้งต้นสำหรับแล็บวิชา Web Application Development หัวข้อ OAuth 2.0

เป้าหมายคือทำหน้าเว็บที่ล็อกอินด้วยบัญชี Google แล้วแสดงรูปโปรไฟล์ ชื่อ และอีเมลของผู้ใช้
พร้อมปุ่มออกจากระบบ โดยเก็บ session อย่างปลอดภัย

โครงนี้เตรียมทุกอย่างไว้ให้แล้ว ยกเว้น 6 จุดที่มีคำว่า `TODO` กำกับไว้ ซึ่งเป็นส่วนที่ต้องเติมเอง

---

## 1. ตั้งค่าที่ Google Cloud Console

1. เข้า https://console.cloud.google.com แล้วสร้างโปรเจกต์ใหม่
2. ไปที่ **APIs & Services → OAuth consent screen** เลือก **External**
   ใส่ชื่อแอปและอีเมลติดต่อ
3. ในหน้า **Audience** เพิ่มอีเมล Google ของตัวเองเข้าไปในรายการ **Test users**
   ถ้าข้ามขั้นนี้จะล็อกอินไม่ผ่าน และได้ error `access_denied`
4. ไปที่ **Credentials → Create credentials → OAuth client ID**
   เลือกชนิด **Web application**
5. กรอกสองช่องนี้ ระวังว่าเป็นคนละช่องกัน

   | ช่อง | ค่าที่ต้องใส่ |
   |---|---|
   | Authorized JavaScript origins | `http://localhost:5173` |
   | Authorized redirect URIs | `http://localhost:5173` |

6. คัดลอก **Client ID** และ **Client secret** เก็บไว้

---

## 2. ติดตั้งและรัน

```bash
npm run install:all

cp client/.env.example client/.env     # ใส่ Client ID
cp server/.env.example server/.env     # ใส่ทั้ง Client ID และ Client secret

npm run dev
```

เปิด http://localhost:5173

- client รันที่พอร์ต 5173
- server รันที่พอร์ต 3000
- Vite ส่งต่อ `/api` ไปที่ server ให้อัตโนมัติ เบราว์เซอร์จึงมองว่าเป็น origin เดียวกัน
  ซึ่งทำให้ cookie ทำงานได้โดยไม่ต้องตั้ง CORS

---

## 3. สิ่งที่ต้องทำ

ค้นคำว่า `TODO` ในโปรเจกต์เพื่อดูคำอธิบายแบบละเอียดของแต่ละข้อ

```bash
grep -rn "TODO" client/src server --include="*.js*"
```

| # | ไฟล์ | สิ่งที่ต้องทำ |
|---|---|---|
| 1 | `server/auth.js` | ตรวจ ID token ด้วย `verifyIdToken` บันทึกผู้ใช้ และตั้ง session cookie |
| 2 | `server/auth.js` | ทำเส้น `GET /api/me` ให้บอกว่าตอนนี้ใครล็อกอินอยู่ |
| 3 | `server/auth.js` | ออกจากระบบ ลบทั้ง session ที่ server และ cookie |
| 4 | `client/src/App.jsx` | เรียก `/api/me` ตอนโหลดหน้า เพื่อให้รีเฟรชแล้วยังล็อกอินอยู่ |
| 5 | `client/src/App.jsx` | ต่อปุ่มออกจากระบบเข้ากับ API |
| 6 | `client/src/components/LoginButton.jsx` | ส่ง ID token ไปให้ backend ตรวจ |

ลำดับที่แนะนำคือ 6 → 1 → 4 → 2 → 5 → 3 เพราะจะได้เห็นผลลัพธ์บนหน้าจอเร็วที่สุด

---

## 4. เกณฑ์ว่าผ่าน

- [ ] ล็อกอินแล้วเห็นรูป ชื่อ และอีเมลของตัวเอง
- [ ] ID token ถูกตรวจที่ฝั่ง server ด้วย `verifyIdToken` เท่านั้น
- [ ] ไม่มีการใช้ `localStorage` หรือ `sessionStorage` เก็บข้อมูลล็อกอินเลย
- [ ] รีเฟรชหน้าแล้วยังล็อกอินอยู่
- [ ] กดออกจากระบบแล้วรีเฟรช ต้องกลับมาเป็นหน้าล็อกอิน
- [ ] `npm run check:secret` ขึ้นว่าผ่าน

ข้อสุดท้ายคือการ build แล้วค้นหาร่องรอยของ `client_secret` ในไฟล์ที่ส่งให้เบราว์เซอร์จริง
ถ้าไม่ผ่านแปลว่ามี secret รั่วไปอยู่ฝั่ง client

---

## 5. ทำเสร็จก่อนเพื่อน ลองต่อ

1. เพิ่ม scope `https://www.googleapis.com/auth/calendar.readonly` ด้วย `useGoogleLogin`
   แบบ `flow: 'auth-code'` แล้วแสดงนัดหมาย 5 รายการถัดไป
   สังเกตว่าขั้นแลก code ต้องอยู่บน server เพราะต้องใช้ client secret
2. จัดการกรณี access token หมดอายุด้วย refresh token
3. เพิ่ม React Router แล้วทำ protected route ที่เด้งกลับหน้าล็อกอินเมื่อไม่มี session
4. ย้าย session store จาก memory ไปไว้ใน Redis หรือฐานข้อมูล

---

## 6. เจอ error แล้วทำอย่างไร

| ข้อความ | สาเหตุและวิธีแก้ |
|---|---|
| `redirect_uri_mismatch` | URL ไม่ตรงทีละตัวอักษร ตรวจ `http` กับ `https`, เลขพอร์ต, slash ปิดท้าย และจำไว้ว่า `localhost` กับ `127.0.0.1` ถือว่าคนละค่า |
| `origin_mismatch` หรือปุ่มไม่ขึ้น | ยังไม่ได้กรอก Authorized JavaScript origins ซึ่งเป็นคนละช่องกับ redirect URI |
| `invalid_client` | client id หรือ secret ผิด หรือแก้ `.env` แล้วลืมรีสตาร์ท server |
| `access_denied` | อีเมลที่ใช้ยังไม่อยู่ในรายการ Test users |
| `invalid_grant` | code ถูกใช้ไปแล้วหรือหมดอายุ ถ้าเจอตอน dev ให้ดูว่า StrictMode ทำให้ยิงซ้ำสองรอบหรือเปล่า |
| ล็อกอินผ่านแต่รีเฟรชแล้วหลุด | cookie ไม่ถูกตั้งหรือไม่ถูกส่ง ตรวจว่าใส่ `credentials: 'include'` ครบทุก request แล้ว และดูแท็บ Application ใน DevTools ว่ามี cookie ชื่อ `sid` จริงไหม |
| `501 ยังไม่ได้ทำ TODO` | ยังไม่ได้เขียนโค้ดในจุดนั้น เป็นข้อความที่โครงตั้งต้นใส่ไว้ให้ ไม่ใช่ bug |

---

## 7. โครงสร้างโปรเจกต์

```
client/
  src/
    main.jsx                 ห่อแอปด้วย GoogleOAuthProvider
    App.jsx                  จัดการ state ของผู้ใช้        TODO 4, 5
    api.js                   ตัวห่อ fetch พร้อม credentials
    components/
      LoginButton.jsx        ปุ่มของ Google               TODO 6
      Profile.jsx            แสดงข้อมูลผู้ใช้

server/
  index.js                   ตั้งค่า Express
  auth.js                    เส้นทางเกี่ยวกับการล็อกอิน    TODO 1, 2, 3
  sessions.js                session store และตัวเลือก cookie
  db.js                      ฐานข้อมูลจำลองใน memory
```

ไฟล์ที่ไม่มี TODO คือส่วนที่ให้มาแล้ว อ่านให้เข้าใจก่อนเริ่มเขียน
โดยเฉพาะ `sessions.js` ที่อธิบายว่าทำไม cookie ต้องตั้งค่าแบบนั้น

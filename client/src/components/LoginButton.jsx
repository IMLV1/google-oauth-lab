import { GoogleLogin } from '@react-oauth/google';
import { api } from '../api.js';

export default function LoginButton({ onLoggedIn, onError }) {
  return (
    <div className="center">
      <GoogleLogin
        /**
         * ─────────────────────────────────────────────────────────
         * TODO 6 — ส่ง ID token ไปให้ backend ตรวจ
         * ─────────────────────────────────────────────────────────
         * เมื่อผู้ใช้ล็อกอินสำเร็จ ไลบรารีจะเรียก onSuccess พร้อมออบเจกต์
         * ที่มี field ชื่อ credential ซึ่งคือ ID token (JWT) จาก Google
         *
         *   6.1 เรียก api.loginWithGoogle(credentialResponse.credential)
         *   6.2 นำผลที่ backend ตอบกลับมาส่งให้ onLoggedIn()
         *   6.3 ถ้าพลาดให้เรียก onError() พร้อมข้อความที่ผู้ใช้เข้าใจ
         *
         * คำถามชวนคิด: ทำไมเราไม่ decode JWT ตรงนี้แล้วใช้ชื่อกับอีเมล
         * ที่อยู่ข้างในเลย จะได้ไม่ต้องยิง request ไปหา backend
         */
        onSuccess={async (credentialResponse) => {
          // เขียนโค้ดของ TODO 6 ตรงนี้
          try {
            const user = await api.loginWithGoogle(credentialResponse.credential);
            onLoggedIn(user);
          } catch (e) {
            onError(e.message);
          }
          // console.log('ได้ ID token มาแล้ว', credentialResponse.credential);
        }}
        onError={() => onError('เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองใหม่')}
      />
    </div>
  );
}

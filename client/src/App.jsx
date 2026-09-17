import { useEffect, useState } from 'react';
import { api } from './api.js';
import LoginButton from './components/LoginButton.jsx';
import Profile from './components/Profile.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /**
   * ─────────────────────────────────────────────────────────────
   * TODO 4 — คงสถานะล็อกอินไว้หลังรีเฟรชหน้า
   * ─────────────────────────────────────────────────────────────
   * React ไม่รู้เลยว่ามี cookie อยู่หรือเปล่า เพราะ cookie เป็น httpOnly
   * วิธีเดียวที่จะรู้คือถาม backend
   *
   *   4.1 เรียก api.me() ตอน component mount
   *   4.2 ถ้าสำเร็จให้ setUser ด้วยข้อมูลที่ได้
   *   4.3 ถ้าได้ 401 ถือว่ายังไม่ล็อกอิน ไม่ใช่ error ที่ต้องแสดงให้ผู้ใช้เห็น
   *   4.4 ปิด loading ไม่ว่าทางไหน มิฉะนั้นหน้าจะค้างที่ "กำลังโหลด" ตลอดไป
   */
  useEffect(() => {
    // เขียนโค้ดของ TODO 4 ตรงนี้
    api.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
    //setLoading(false);
  }, []);

  async function handleLogout() {
    /**
     * ───────────────────────────────────────────────────────────
     * TODO 5 — ออกจากระบบให้ครบทั้งสองฝั่ง
     * ───────────────────────────────────────────────────────────
     *   5.1 เรียก api.logout() เพื่อให้ server ลบ session และ cookie
     *   5.2 เคลียร์ user ใน state
     *
     * ลองคิดดูว่าถ้าทำแค่ข้อ 5.2 อย่างเดียวจะเกิดอะไรขึ้นเมื่อผู้ใช้รีเฟรชหน้า
     */
    // เขียนโค้ดของ TODO 5 ตรงนี้
    
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  }

  if (loading) return <main className="card"><p>กำลังโหลด</p></main>;

  return (
    <main className="card">
      <h1>แล็บ Sign in with Google</h1>

      {error && <p className="error">{error}</p>}

      {user ? (
        <Profile user={user} onLogout={handleLogout} />
      ) : (
        <LoginButton onLoggedIn={setUser} onError={setError} />
      )}
    </main>
  );
}

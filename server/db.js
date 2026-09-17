// ฐานข้อมูลจำลองเก็บใน memory — ข้อมูลหายเมื่อปิด server
// ของจริงเปลี่ยนเป็น PostgreSQL หรือ MongoDB ได้โดยที่ฟังก์ชันข้างล่างยังหน้าตาเหมือนเดิม

const users = new Map(); // googleId -> user

export async function upsertUser({ googleId, email, name, picture }) {
  const existing = users.get(googleId);

  if (existing) {
    // ผู้ใช้อาจเปลี่ยนชื่อหรือรูปโปรไฟล์ที่ Google จึงอัปเดตทุกครั้งที่ล็อกอิน
    Object.assign(existing, { email, name, picture, lastLoginAt: new Date() });
    return existing;
  }

  const user = {
    id: crypto.randomUUID(),
    googleId,            // มาจาก sub ใน id token — เป็น key ถาวรของผู้ใช้
    email,
    name,
    picture,
    createdAt: new Date(),
    lastLoginAt: new Date(),
  };
  users.set(googleId, user);
  return user;
}

export async function findUserById(id) {
  for (const user of users.values()) {
    if (user.id === id) return user;
  }
  return null;
}

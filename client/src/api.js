// ตัวห่อ fetch ให้สั้นลง
// credentials: 'include' คือหัวใจ ถ้าลืม เบราว์เซอร์จะไม่ส่งและไม่รับ cookie เลย
async function request(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `เรียก ${path} ไม่สำเร็จ`);
  return data;
}

export const api = {
  me: () => request('/api/me'),

  loginWithGoogle: (code) =>
    request('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  getCalendarEvents: () => request('/api/calendar/events'),
  
  logout: () => request('/api/auth/logout', { method: 'POST' }),
};

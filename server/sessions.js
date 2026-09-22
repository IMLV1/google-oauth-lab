const sessions = new Map();

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function createSession(userId, googleTokens) {
  const sid =
    crypto.randomUUID() +
    crypto.randomUUID().replaceAll('-', '');

  sessions.set(sid, {
    userId,
    googleTokens,
    createdAt: Date.now(),
  });

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

export async function updateSessionTokens(sid, googleTokens) {
  const session = sessions.get(sid);

  if (session) {
    session.googleTokens = {
      ...session.googleTokens,
      ...googleTokens,
    };
  }
}

export async function destroySession(sid) {
  if (sid) sessions.delete(sid);
}

export const SESSION_COOKIE = 'sid';

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: SESSION_TTL_MS,
  path: '/',
};
import { useGoogleLogin } from '@react-oauth/google';
import { api } from '../api.js';

export default function LoginButton({ onLoggedIn, onError }) {
  const login = useGoogleLogin({
    flow: 'auth-code',

    scope: [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/calendar.readonly',
    ].join(' '),

    onSuccess: async ({ code }) => {
      try {
        const user = await api.loginWithGoogle(code);
        onLoggedIn(user);
      } catch (error) {
        onError(error.message);
      }
    },

    onError: () => {
      onError('เข้าสู่ระบบด้วย Google ไม่สำเร็จ');
    },
  });

  return (
    <div className="center">
      <button onClick={() => login()}>
        เข้าสู่ระบบด้วย Google
      </button>
    </div>
  );
}
import CalendarEvents from './CalendarEvents.jsx';

export default function Profile({ user, onLogout }) {
  return (
    <div>
      <div className="profile-header">
        {user.picture && (
          <img className="avatar" src={user.picture} alt="รูปโปรไฟล์" />
        )}

        <h2>{user.name}</h2>
        <p className="email">{user.email}</p>
      </div>

      <CalendarEvents />

      <button onClick={onLogout}>ออกจากระบบ</button>
    </div>
  );
}

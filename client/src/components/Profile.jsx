export default function Profile({ user, onLogout }) {
  return (
    <div>
      {user.picture && <img className="avatar" src={user.picture} alt="" />}
      <h2 style={{ fontSize: '1.05rem', margin: '0.75rem 0 0' }}>{user.name}</h2>
      <p className="email">{user.email}</p>
      <button onClick={onLogout}>ออกจากระบบ</button>
    </div>
  );
}

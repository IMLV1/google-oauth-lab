import { useEffect, useState } from 'react';
import { api } from '../api.js';

function formatDate(value) {
  if (!value) return '-';

  if (!value.includes('T')) {
    return new Intl.DateTimeFormat('th-TH', {
      dateStyle: 'long',
    }).format(new Date(`${value}T00:00:00+07:00`));
  }

  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Bangkok',
  }).format(new Date(value));
}

export default function CalendarEvents() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getCalendarEvents()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p>กำลังโหลดกิจกรรม...</p>;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  return (
    <section className="calendar-section">
      <h2>กิจกรรมในเดือนนี้</h2>
      <p className="event-count">พบทั้งหมด {data.count} รายการ</p>

      {data.events.length === 0 ? (
        <p>เดือนนี้ไม่มีกิจกรรม</p>
      ) : (
        <div className="event-list">
          {data.events.map((event) => (
            <article className="event-card" key={event.id}>
              <h3>{event.summary}</h3>

              <p>
                <strong>เริ่ม:</strong> {formatDate(event.start)}
              </p>

              <p>
                <strong>สิ้นสุด:</strong> {formatDate(event.end)}
              </p>

              {event.location && (
                <p>
                  <strong>สถานที่:</strong> {event.location}
                </p>
              )}

              {event.description && <p>{event.description}</p>}

              {event.htmlLink && (
                <a href={event.htmlLink} target="_blank" rel="noreferrer">
                  เปิดใน Google Calendar
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

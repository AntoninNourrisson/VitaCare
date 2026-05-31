import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { notificationsAPI } from '../services/api'
import Spinner from '../components/Spinner'

const TYPE_ICONS = {
  reservation: 'bi-calendar-check',
  activite:    'bi-people',
  systeme:     'bi-info-circle',
  admin:       'bi-shield-check',
}

export default function Notifications() {
  const [data, setData]       = useState({ notifications: [], unread: 0 })
  const [loading, setLoading] = useState(true)

  const load = () => notificationsAPI.list().then(r => setData(r.data)).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const markOne = async (id) => {
    await notificationsAPI.markRead({ id })
    load()
  }
  const markAll = async () => {
    await notificationsAPI.markRead({ all: true })
    load()
  }

  if (loading) return <Spinner fullscreen />

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0" style={{ color: 'var(--vc-blue)' }}>
            <i className="bi bi-bell me-2"></i>Notifications
          </h2>
          {data.unread > 0 && <span className="badge mt-1" style={{ background: 'var(--vc-red)' }}>{data.unread} non lue{data.unread > 1 ? 's' : ''}</span>}
        </div>
        {data.unread > 0 && (
          <button className="btn btn-sm btn-vitacare-outline" onClick={markAll}>
            <i className="bi bi-check-all me-1"></i>Tout marquer comme lu
          </button>
        )}
      </div>

      <div className="card-vitacare card overflow-hidden">
        {data.notifications.length === 0 ? (
          <div className="p-5 text-center text-muted">
            <i className="bi bi-bell-slash fs-1 d-block mb-3"></i>Aucune notification.
          </div>
        ) : (
          data.notifications.map(n => (
            <div key={n.id} className={`notification-item d-flex gap-3 align-items-start ${!n.lu ? 'unread' : ''}`}>
              <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-1"
                style={{ width: 36, height: 36, background: n.lu ? 'var(--vc-blue-pale)' : 'var(--vc-blue)', color: n.lu ? 'var(--vc-blue)' : '#fff' }}>
                <i className={`bi ${TYPE_ICONS[n.type] || 'bi-bell'} small`}></i>
              </div>
              <div className="flex-grow-1">
                <p className={`mb-1 ${!n.lu ? 'fw-semibold' : ''}`} style={{ fontSize: '0.92rem' }}>{n.message}</p>
                <div className="small text-muted">
                  {new Date(n.date_creation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                </div>
                {n.lien && (
                  <Link to={n.lien} className="small mt-1 d-inline-block" style={{ color: 'var(--vc-blue)' }}>
                    Voir le détail →
                  </Link>
                )}
              </div>
              {!n.lu && (
                <button className="btn btn-sm btn-link p-0 text-muted flex-shrink-0" onClick={() => markOne(n.id)}>
                  <i className="bi bi-check2 fs-5"></i>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

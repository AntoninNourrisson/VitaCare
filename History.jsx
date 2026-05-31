import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { reservationsAPI, activitiesAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import StatutBadge from '../components/StatutBadge'
import PoleBadge from '../components/PoleBadge'
import Spinner from '../components/Spinner'

export default function History() {
  const { user } = useAuth()
  const [rdvs, setRdvs]       = useState([])
  const [activites, setActivites] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('a-venir')
  const [msgs, setMsgs]       = useState({})

  const load = async () => {
    setLoading(true)
    const [r, a] = await Promise.all([
      reservationsAPI.list().then(r => r.data).catch(() => []),
      activitiesAPI.list({}).then(r => r.data.filter(a => {
        return true // on récupère toutes et on filtre par inscription côté client via userInscrit
      })).catch(() => []),
    ])
    setRdvs(r)
    // On veut uniquement les activités auxquelles l'utilisateur est inscrit
    // Le back ne renvoie pas userInscrit directement — on charge depuis dashboard/recent
    setActivites([]) // sera chargé séparément si besoin
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleCancel = async (id_rdv) => {
    setMsgs({})
    try {
      await reservationsAPI.cancel({ id_rdv })
      setMsgs({ [id_rdv]: 'RDV annulé.' })
      load()
    } catch (e) {
      setMsgs({ [`err_${id_rdv}`]: e.response?.data?.error || 'Erreur.' })
    }
  }

  const now   = new Date()
  const past  = rdvs.filter(r => new Date(r.date_heure) < now)
  const future = rdvs.filter(r => new Date(r.date_heure) >= now)

  const renderRdv = (r) => (
    <div key={r.id_rdv} className="card-vitacare card p-3 mb-3">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
        <div>
          <div className="d-flex gap-2 align-items-center mb-1">
            <PoleBadge pole={r.pole} />
            <StatutBadge statut={r.statut} />
          </div>
          <h6 className="fw-bold mb-1">{r.service_nom}</h6>
          <div className="small text-muted">
            <i className="bi bi-calendar me-1"></i>
            {new Date(r.date_heure).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {' à '}{new Date(r.date_heure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </div>
          {r.praticien && <div className="small text-muted"><i className="bi bi-person me-1"></i>{r.praticien}</div>}
          {r.duree && <div className="small text-muted"><i className="bi bi-clock me-1"></i>{r.duree} min</div>}
        </div>
        <div className="d-flex flex-column gap-2 align-items-end">
          {msgs[r.id_rdv] && <span className="badge bg-success">{msgs[r.id_rdv]}</span>}
          {msgs[`err_${r.id_rdv}`] && <span className="badge bg-danger">{msgs[`err_${r.id_rdv}`]}</span>}
          {['en_attente', 'confirme'].includes(r.statut) && new Date(r.date_heure) >= now && (
            <>
              <Link to={`/services/${r.id_service}`} className="btn btn-sm btn-vitacare-outline">
                <i className="bi bi-pencil me-1"></i>Modifier
              </Link>
              <button className="btn btn-sm btn-outline-danger" onClick={() => handleCancel(r.id_rdv)}>
                <i className="bi bi-x-circle me-1"></i>Annuler
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )

  if (loading) return <Spinner fullscreen />

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4" style={{ color: 'var(--vc-blue)' }}>
        <i className="bi bi-clock-history me-2"></i>Mon historique
      </h2>

      <ul className="nav nav-tabs mb-4">
        {[
          { key: 'a-venir', label: 'À venir', count: future.length },
          { key: 'passes',  label: 'Passés',  count: past.length  },
        ].map(t => (
          <li key={t.key} className="nav-item">
            <button className={`nav-link ${tab === t.key ? 'active fw-bold' : ''}`}
              style={tab === t.key ? { color: 'var(--vc-blue)', borderBottomColor: 'var(--vc-blue)' } : {}}
              onClick={() => setTab(t.key)}>
              {t.label} <span className="badge ms-1" style={{ background: tab === t.key ? 'var(--vc-blue)' : 'var(--vc-gray)', color: '#fff' }}>{t.count}</span>
            </button>
          </li>
        ))}
      </ul>

      {tab === 'a-venir' && (
        <>
          {future.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-calendar-x fs-1 d-block mb-3"></i>
              Aucun rendez-vous à venir.
              <br /><Link to="/services" className="btn btn-vitacare mt-3">Explorer les services</Link>
            </div>
          ) : (
            future.sort((a, b) => new Date(a.date_heure) - new Date(b.date_heure)).map(renderRdv)
          )}
        </>
      )}

      {tab === 'passes' && (
        <>
          {past.length === 0 ? (
            <p className="text-muted text-center py-5">Aucun rendez-vous passé.</p>
          ) : (
            past.sort((a, b) => new Date(b.date_heure) - new Date(a.date_heure)).map(renderRdv)
          )}
        </>
      )}
    </div>
  )
}

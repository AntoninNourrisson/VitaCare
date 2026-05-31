import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { activitiesAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import PoleBadge, { POLES } from '../components/PoleBadge'
import Spinner from '../components/Spinner'

export default function Activities() {
  const { user } = useAuth()
  const [activities, setActivities] = useState([])
  const [loading, setLoading]       = useState(true)
  const [pole, setPole]             = useState('')
  const [msgs, setMsgs]             = useState({})
  const [errs, setErrs]             = useState({})

  const load = useCallback(() => {
    setLoading(true)
    activitiesAPI.list({ pole })
      .then(r => setActivities(r.data))
      .catch(() => setActivities([]))
      .finally(() => setLoading(false))
  }, [pole])

  useEffect(() => { load() }, [load])

  const handleInscription = async (id, alreadyInscrit) => {
    setMsgs({}); setErrs({})
    try {
      if (alreadyInscrit) {
        await activitiesAPI.unregister({ id_activite: id })
        setMsgs({ [id]: 'Désinscription effectuée.' })
      } else {
        await activitiesAPI.register({ id_activite: id })
        setMsgs({ [id]: 'Inscription confirmée !' })
      }
      load()
    } catch (err) {
      setErrs({ [id]: err.response?.data?.error || 'Erreur.' })
    }
  }

  const futurActivities = activities.filter(a => !a.passe)
  const pastActivities  = activities.filter(a => a.passe)

  const renderCard = (a) => (
    <div key={a.id} className="col-md-6 col-lg-4">
      <div className={`card-vitacare card h-100 ${a.passe ? 'opacity-75' : ''}`}>
        <div className="card-body p-4 d-flex flex-column">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <PoleBadge pole={a.pole} />
            {a.complet ? (
              <span className="badge bg-danger">Complet</span>
            ) : (
              <span className="badge" style={{ background: 'var(--vc-blue-pale)', color: 'var(--vc-blue)' }}>
                {a.places_restantes} place{a.places_restantes > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <h5 className="fw-bold mt-2 mb-1">{a.nom}</h5>
          <p className="text-muted small flex-grow-1">{a.description}</p>

          <div className="mt-2 mb-3 small text-muted d-flex flex-column gap-1">
            <span><i className="bi bi-calendar-event me-1"></i>
              {new Date(a.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
              {' '}{new Date(a.date_debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {a.lieu && <span><i className="bi bi-geo-alt me-1"></i>{a.lieu}</span>}
            <span><i className="bi bi-people me-1"></i>{a.inscrits}/{a.capacite_max} inscrits</span>
            {a.responsable && <span><i className="bi bi-person-badge me-1"></i>{a.responsable}</span>}
          </div>

          {msgs[a.id] && <div className="alert alert-success py-1 small">{msgs[a.id]}</div>}
          {errs[a.id] && <div className="alert alert-danger py-1 small">{errs[a.id]}</div>}

          <div className="d-flex gap-2 mt-auto">
            <Link to={`/activities/${a.id}`} className="btn btn-sm btn-vitacare-outline flex-fill">Détails</Link>
            {!a.passe && user && (
              <button
                className={`btn btn-sm flex-fill ${a.complet && !a.userInscrit ? 'btn-secondary' : a.userInscrit ? 'btn-danger' : 'btn-vitacare'}`}
                disabled={a.complet && !a.userInscrit}
                onClick={() => handleInscription(a.id, a.userInscrit)}>
                {a.complet && !a.userInscrit ? 'Complet' : a.userInscrit ? 'Se désinscrire' : "S'inscrire"}
              </button>
            )}
            {!user && !a.passe && (
              <Link to="/login" className="btn btn-sm btn-vitacare flex-fill">S'inscrire</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="container py-4">
      <h1 className="fw-bold mb-1" style={{ color: 'var(--vc-blue)' }}>Séances & Activités</h1>
      <p className="text-muted mb-4">Programmes collectifs animés par nos praticiens experts</p>

      {/* Filtre pôle */}
      <ul className="nav nav-pills mb-4 flex-wrap gap-1">
        <li className="nav-item">
          <button className={`nav-link ${pole === '' ? 'active' : ''}`}
            style={pole === '' ? {background:'var(--vc-blue)'} : {color:'var(--vc-blue)', border:'1px solid var(--vc-blue)'}}
            onClick={() => setPole('')}>Tous</button>
        </li>
        {Object.entries(POLES).map(([k, v]) => (
          <li key={k}>
            <button className={`nav-link ${pole === k ? 'active' : ''}`}
              style={pole !== k ? {color:'var(--vc-gray)', border:'1px solid var(--vc-border)'} : {background:'var(--vc-blue)'}}
              onClick={() => setPole(k)}>
              <i className={`bi ${v.icon} me-1`}></i>{v.label}
            </button>
          </li>
        ))}
      </ul>

      {loading ? <Spinner /> : (
        <>
          {futurActivities.length > 0 && (
            <>
              <h4 className="fw-bold mb-3" style={{ color: 'var(--vc-blue)' }}>
                <i className="bi bi-calendar-event me-2"></i>À venir
              </h4>
              <div className="row g-4 mb-5">{futurActivities.map(renderCard)}</div>
            </>
          )}

          {pastActivities.length > 0 && (
            <>
              <h4 className="fw-bold mb-3 text-muted">
                <i className="bi bi-clock-history me-2"></i>Passées
              </h4>
              <div className="row g-4">{pastActivities.map(renderCard)}</div>
            </>
          )}

          {activities.length === 0 && (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-calendar-x fs-1 d-block mb-3"></i>
              Aucune activité disponible.
            </div>
          )}
        </>
      )}
    </div>
  )
}

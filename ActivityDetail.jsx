import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { activitiesAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import PoleBadge from '../components/PoleBadge'
import Breadcrumb from '../components/Breadcrumb'
import Spinner from '../components/Spinner'

export default function ActivityDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isPraticien } = useAuth()

  const [activity, setActivity]   = useState(null)
  const [participants, setParticipants] = useState([])
  const [loading, setLoading]     = useState(true)
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('')

  // Chargement de l'activité — dépend uniquement de l'id
  useEffect(() => {
    setLoading(true)
    activitiesAPI.detail(id)
      .then(r => setActivity(r.data))
      .catch(() => navigate('/activities'))
      .finally(() => setLoading(false))
  }, [id])

  // Chargement des participants — séparé car isPraticien est connu après le chargement de l'auth
  useEffect(() => {
    if (!isPraticien || !id) return
    activitiesAPI.participants(id)
      .then(r => setParticipants(r.data))
      .catch(() => {})
  }, [id, isPraticien])

  const handleAction = async (alreadyInscrit) => {
    setMsg(''); setErr('')
    try {
      if (alreadyInscrit) {
        await activitiesAPI.unregister({ id_activite: parseInt(id) })
        setMsg('Désinscription effectuée.')
      } else {
        await activitiesAPI.register({ id_activite: parseInt(id) })
        setMsg('Inscription confirmée !')
      }
      // Recharger l'activité pour mettre à jour le compteur de places
      activitiesAPI.detail(id).then(r => setActivity(r.data)).catch(() => {})
    } catch (e) { setErr(e.response?.data?.error || 'Erreur.') }
  }

  if (loading) return <Spinner fullscreen />
  if (!activity) return null

  const dateDebut = new Date(activity.date_debut)
  const dateFin   = new Date(activity.date_fin)

  return (
    <div className="container py-4">
      <Breadcrumb items={[
        { label: 'Accueil', href: '/' },
        { label: 'Séances', href: '/activities' },
        { label: activity.nom },
      ]} />

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card-vitacare card p-4 mb-4">
            <PoleBadge pole={activity.pole} />
            <h1 className="fw-bold mt-3 mb-3" style={{ color: 'var(--vc-blue)' }}>{activity.nom}</h1>
            <p className="text-muted">{activity.description}</p>

            <hr />
            <div className="row g-3">
              <div className="col-sm-6">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-calendar-event fs-4" style={{ color: 'var(--vc-blue)' }}></i>
                  <div>
                    <div className="fw-bold">{dateDebut.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    <div className="small text-muted">{dateDebut.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} – {dateFin.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              </div>
              {activity.lieu && (
                <div className="col-sm-6">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-geo-alt fs-4" style={{ color: 'var(--vc-blue)' }}></i>
                    <div><div className="fw-bold">{activity.lieu}</div></div>
                  </div>
                </div>
              )}
              <div className="col-sm-6">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-people fs-4" style={{ color: 'var(--vc-blue)' }}></i>
                  <div>
                    <div className="fw-bold">{activity.inscrits}/{activity.capacite_max} inscrits</div>
                    <div className="small text-muted">{activity.places_restantes} place{activity.places_restantes > 1 ? 's' : ''} restante{activity.places_restantes > 1 ? 's' : ''}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {msg && <div className="alert alert-success">{msg}</div>}
          {err && <div className="alert alert-danger">{err}</div>}

          {!activity.passe && user && (
            <button
              className={`btn btn-lg ${activity.complet ? 'btn-secondary' : 'btn-vitacare'}`}
              disabled={activity.complet && !activity.userInscrit}
              onClick={() => handleAction(activity.userInscrit)}>
              {activity.complet && !activity.userInscrit ? 'Activité complète' : activity.userInscrit ? 'Se désinscrire' : "S'inscrire à cette activité"}
            </button>
          )}
          {activity.passe && <div className="alert alert-secondary">Cette activité est terminée.</div>}
        </div>

        <div className="col-lg-4">
          {isPraticien && (
            <div className="card-vitacare card p-4">
              <h5 className="fw-bold mb-3" style={{ color: 'var(--vc-blue)' }}>
                <i className="bi bi-people me-2"></i>Participants ({participants.length})
              </h5>
              {participants.length === 0 ? (
                <p className="text-muted small">Aucun inscrit.</p>
              ) : (
                <ul className="list-group list-group-flush">
                  {participants.map(p => (
                    <li key={p.id_utilisateur} className="list-group-item px-0 small">
                      <div className="fw-semibold">{p.prenom} {p.nom}</div>
                      <div className="text-muted">{p.sport_pratique} {p.federation && `— ${p.federation}`}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

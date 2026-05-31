import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { servicesAPI, reservationsAPI, panierAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import PoleBadge from '../components/PoleBadge'
import Breadcrumb from '../components/Breadcrumb'
import Spinner from '../components/Spinner'

export default function ServiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [service, setService]         = useState(null)
  const [loading, setLoading]         = useState(true)
  const [selectedCreneau, setSelected] = useState(null)
  const [actionMsg, setActionMsg]      = useState('')
  const [actionErr, setActionErr]      = useState('')
  const [submitting, setSubmitting]    = useState(false)

  useEffect(() => {
    servicesAPI.detail(id)
      .then(r => setService(r.data))
      .catch(() => navigate('/services'))
      .finally(() => setLoading(false))
  }, [id])

  const groupByDate = (creneaux) => {
    return creneaux.reduce((acc, c) => {
      acc[c.date_creneau] = acc[c.date_creneau] || []
      acc[c.date_creneau].push(c)
      return acc
    }, {})
  }

  const handleReserver = async () => {
    if (!user) { navigate('/login'); return }
    if (!selectedCreneau) { setActionErr('Veuillez sélectionner un créneau.'); return }
    setSubmitting(true); setActionErr(''); setActionMsg('')
    try {
      await reservationsAPI.create({ id_service: parseInt(id), id_creneau: selectedCreneau.id_creneau })
      setActionMsg('Réservation effectuée ! Elle est en attente de validation.')
      setSelected(null)
      const r = await servicesAPI.detail(id)
      setService(r.data)
    } catch (err) {
      setActionErr(err.response?.data?.error || 'Erreur lors de la réservation.')
    } finally { setSubmitting(false) }
  }

  const handleAddToCart = async () => {
    if (!user) { navigate('/login'); return }
    if (!selectedCreneau) { setActionErr('Veuillez sélectionner un créneau.'); return }
    setSubmitting(true); setActionErr(''); setActionMsg('')
    try {
      await panierAPI.add({ id_service: parseInt(id), id_creneau: selectedCreneau.id_creneau })
      setActionMsg('Ajouté au panier !')
    } catch (err) {
      setActionErr(err.response?.data?.error || 'Erreur.')
    } finally { setSubmitting(false) }
  }

  if (loading) return <Spinner fullscreen />
  if (!service) return null

  const grouped = groupByDate(service.creneaux || [])

  return (
    <div className="container py-4">
      <Breadcrumb items={[
        { label: 'Accueil', href: '/' },
        { label: 'Pôles & Services', href: '/services' },
        { label: service.nom },
      ]} />

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card-vitacare card p-4 mb-4">
            <div className="d-flex align-items-start gap-3 mb-3">
              <PoleBadge pole={service.pole} />
              {service.prix && <span className="fw-bold fs-5" style={{ color: 'var(--vc-gold)' }}>{service.prix} €</span>}
            </div>
            <h1 className="fw-bold mb-3" style={{ color: 'var(--vc-blue)' }}>{service.nom}</h1>
            <div className="d-flex flex-wrap gap-4 text-muted mb-4">
              <span><i className="bi bi-clock me-1"></i><strong>{service.duree} min</strong></span>
              {service.praticien && <span><i className="bi bi-person-badge me-1"></i><strong>{service.praticien}</strong></span>}
              {service.categorie && <span><i className="bi bi-tag me-1"></i>{service.categorie}</span>}
            </div>
            <p className="text-muted">{service.description}</p>
          </div>

          {/* Créneaux */}
          <div className="card-vitacare card p-4">
            <h4 className="fw-bold mb-1" style={{ color: 'var(--vc-blue)' }}>
              <i className="bi bi-calendar3 me-2"></i>Créneaux disponibles
            </h4>
            <p className="text-muted small mb-4">Sélectionnez un créneau pour réserver</p>

            {Object.keys(grouped).length === 0 ? (
              <p className="text-muted text-center py-3">Aucun créneau disponible pour le moment.</p>
            ) : (
              Object.entries(grouped).map(([date, creneaux]) => (
                <div key={date} className="mb-4">
                  <h6 className="fw-semibold mb-2 text-muted">
                    {new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h6>
                  <div className="d-flex flex-wrap gap-2">
                    {creneaux.map(c => (
                      <div key={c.id_creneau}
                        className={`creneau-slot available ${selectedCreneau?.id_creneau === c.id_creneau ? 'selected' : ''}`}
                        onClick={() => setSelected(selectedCreneau?.id_creneau === c.id_creneau ? null : c)}>
                        {c.heure_debut.slice(0, 5)} – {c.heure_fin.slice(0, 5)}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}

            {selectedCreneau && (
              <div className="alert py-2" style={{ background: 'var(--vc-blue-pale)', border: '1px solid var(--vc-blue)' }}>
                <i className="bi bi-check-circle me-2" style={{ color: 'var(--vc-blue)' }}></i>
                Créneau sélectionné : <strong>
                  {new Date(selectedCreneau.date_creneau + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                  {' '}à {selectedCreneau.heure_debut.slice(0, 5)}
                </strong>
              </div>
            )}

            {actionMsg && <div className="alert alert-success py-2 mt-3">{actionMsg}</div>}
            {actionErr && <div className="alert alert-danger py-2 mt-3">{actionErr}</div>}

            <div className="d-flex gap-2 mt-3 flex-wrap">
              <button className="btn btn-vitacare" onClick={handleReserver} disabled={submitting || !selectedCreneau}>
                {submitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-calendar-check me-2"></i>}
                Réserver ce créneau
              </button>
              <button className="btn btn-vitacare-outline" onClick={handleAddToCart} disabled={submitting || !selectedCreneau}>
                <i className="bi bi-cart-plus me-2"></i>Ajouter au panier
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar praticien */}
        <div className="col-lg-4">
          <div className="card-vitacare card p-4">
            <h5 className="fw-bold mb-3" style={{ color: 'var(--vc-blue)' }}>Praticien responsable</h5>
            {service.praticien ? (
              <>
                <div className="d-flex align-items-center mb-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center me-3"
                    style={{ width: 56, height: 56, background: 'var(--vc-blue-pale)', color: 'var(--vc-blue)', fontSize: '1.5rem' }}>
                    <i className="bi bi-person-fill"></i>
                  </div>
                  <div>
                    <div className="fw-bold">{service.praticien}</div>
                    <div className="text-muted small">{service.categorie}</div>
                  </div>
                </div>
                {service.praticien_email && (
                  <a href={`mailto:${service.praticien_email}`} className="btn btn-vitacare-outline w-100 btn-sm">
                    <i className="bi bi-envelope me-2"></i>Contacter
                  </a>
                )}
              </>
            ) : (
              <p className="text-muted small">Non assigné</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

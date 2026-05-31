import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { panierAPI } from '../services/api'
import PoleBadge from '../components/PoleBadge'
import Spinner from '../components/Spinner'

export default function Cart() {
  const navigate = useNavigate()
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [msg, setMsg]         = useState('')
  const [errors, setErrors]   = useState([])

  const load = () => panierAPI.list().then(r => setItems(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const total = items.reduce((sum, i) => sum + (i.prix || 0), 0)

  const handleCheckout = async () => {
    setChecking(true); setMsg(''); setErrors([])
    try {
      const r = await panierAPI.checkout()
      setMsg(r.data.message)
      if (r.data.errors?.length) setErrors(r.data.errors)
      load()
      setTimeout(() => navigate('/history'), 2000)
    } catch (e) {
      setErrors([e.response?.data?.error || 'Erreur lors du checkout.'])
    } finally { setChecking(false) }
  }

  if (loading) return <Spinner fullscreen />

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4" style={{ color: 'var(--vc-blue)' }}>
        <i className="bi bi-cart3 me-2"></i>Mon panier
      </h2>

      {msg && <div className="alert alert-success">{msg}</div>}
      {errors.map((e, i) => <div key={i} className="alert alert-warning">{e}</div>)}

      {items.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-cart-x fs-1 d-block mb-3"></i>
          Votre panier est vide.
          <br />
          <Link to="/services" className="btn btn-vitacare mt-3">
            <i className="bi bi-search me-2"></i>Explorer les services
          </Link>
        </div>
      ) : (
        <div className="row g-4">
          <div className="col-lg-8">
            {items.map(item => (
              <div key={item.id_panier} className={`card-vitacare card p-3 mb-3 ${!item.disponible ? 'border-danger' : ''}`}>
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <div>
                    <div className="d-flex gap-2 align-items-center mb-1">
                      <PoleBadge pole={item.pole} />
                      {!item.disponible && <span className="badge bg-danger">Créneau indisponible</span>}
                    </div>
                    <h6 className="fw-bold mb-1">{item.service_nom}</h6>
                    <div className="small text-muted">
                      <i className="bi bi-calendar me-1"></i>
                      {new Date(item.date_creneau + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                      {' '}· {item.heure_debut?.slice(0, 5)} – {item.heure_fin?.slice(0, 5)}
                    </div>
                    <div className="small text-muted"><i className="bi bi-clock me-1"></i>{item.duree} min</div>
                  </div>
                  <div className="text-end">
                    <div className="fw-bold fs-5" style={{ color: 'var(--vc-gold)' }}>{item.prix} €</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="col-lg-4">
            <div className="card-vitacare card p-4">
              <h5 className="fw-bold mb-3" style={{ color: 'var(--vc-blue)' }}>Récapitulatif</h5>
              <div className="d-flex justify-content-between mb-2">
                <span>{items.length} réservation{items.length > 1 ? 's' : ''}</span>
                <span className="fw-bold">{total.toFixed(2)} €</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-4">
                <span className="fw-bold">Total</span>
                <span className="fw-bold fs-5" style={{ color: 'var(--vc-gold)' }}>{total.toFixed(2)} €</span>
              </div>
              <p className="small text-muted mb-3">
                <i className="bi bi-info-circle me-1"></i>
                Le paiement est simulé. Vos réservations seront soumises à validation.
              </p>
              <button className="btn btn-vitacare w-100 py-2" onClick={handleCheckout} disabled={checking || items.length === 0}>
                {checking ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-bag-check me-2"></i>}
                Confirmer ({total.toFixed(2)} €)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

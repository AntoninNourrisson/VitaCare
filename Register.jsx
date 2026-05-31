import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm]       = useState({ nom: '', prenom: '', email: '', mot_de_passe: '', confirmation: '', telephone: '', sport_pratique: '', federation: '' })
  const [errors, setErrors]   = useState([])
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors([])

    // Validation côté client
    const errs = []
    if (!form.nom)   errs.push('Le nom est obligatoire.')
    if (!form.prenom) errs.push('Le prénom est obligatoire.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.push('Email invalide.')
    if (form.mot_de_passe.length < 8) errs.push('Mot de passe : 8 caractères minimum.')
    if (form.mot_de_passe !== form.confirmation) errs.push('Les mots de passe ne correspondent pas.')
    if (errs.length) { setErrors(errs); return }

    setLoading(true)
    try {
      await register(form)
      navigate('/login', { state: { success: 'Compte créé ! Connectez-vous.' } })
    } catch (err) {
      const d = err.response?.data
      setErrors(d?.errors || [d?.error || 'Erreur lors de l\'inscription.'])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-7">
          <div className="text-center mb-4">
            <i className="bi bi-person-plus-fill fs-1" style={{ color: 'var(--vc-blue)' }}></i>
            <h2 className="fw-bold mt-2" style={{ color: 'var(--vc-blue)' }}>Créer mon compte</h2>
            <p className="text-muted">Rejoignez la plateforme médicale de l'élite sportive</p>
          </div>

          <div className="card-vitacare card p-4">
            {errors.length > 0 && (
              <div className="alert alert-danger py-2 small">
                <ul className="mb-0 ps-3">
                  {errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Nom *</label>
                  <input type="text" name="nom" className="form-control" value={form.nom} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Prénom *</label>
                  <input type="text" name="prenom" className="form-control" value={form.prenom} onChange={handleChange} required />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Email *</label>
                  <input type="email" name="email" className="form-control" value={form.email} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Mot de passe * <span className="text-muted fw-normal small">(min. 8 caractères)</span></label>
                  <input type="password" name="mot_de_passe" className="form-control" value={form.mot_de_passe} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Confirmer le mot de passe *</label>
                  <input type="password" name="confirmation" className="form-control" value={form.confirmation} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Téléphone</label>
                  <input type="tel" name="telephone" className="form-control" value={form.telephone} onChange={handleChange} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Sport pratiqué</label>
                  <input type="text" name="sport_pratique" className="form-control" value={form.sport_pratique} onChange={handleChange} placeholder="ex : Natation" />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Fédération <span className="text-muted fw-normal small">(optionnel)</span></label>
                  <input type="text" name="federation" className="form-control" value={form.federation} onChange={handleChange} placeholder="ex : Fédération Française de Natation" />
                </div>
              </div>

              <button type="submit" className="btn btn-vitacare w-100 py-2 mt-4" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check-circle me-2"></i>}
                Créer mon compte
              </button>
            </form>

            <hr />
            <div className="text-center small">
              <span className="text-muted">Déjà inscrit ? </span>
              <Link to="/login" style={{ color: 'var(--vc-blue)' }}>Se connecter</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

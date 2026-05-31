import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [form, setForm]       = useState({ email: '', mot_de_passe: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.mot_de_passe)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de connexion.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="text-center mb-4">
            <i className="bi bi-heart-pulse-fill fs-1" style={{ color: 'var(--vc-blue)' }}></i>
            <h2 className="fw-bold mt-2" style={{ color: 'var(--vc-blue)' }}>Connexion</h2>
            <p className="text-muted">Accédez à votre espace VitaCare</p>
          </div>

          <div className="card-vitacare card p-4">
            {error && <div className="alert alert-danger py-2 small">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold">Email</label>
                <input type="email" name="email" className="form-control" value={form.email}
                  onChange={handleChange} required placeholder="votre@email.fr" />
              </div>
              <div className="mb-4">
                <label className="form-label fw-semibold">Mot de passe</label>
                <input type="password" name="mot_de_passe" className="form-control" value={form.mot_de_passe}
                  onChange={handleChange} required placeholder="••••••••" />
              </div>
              <button type="submit" className="btn btn-vitacare w-100 py-2" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-box-arrow-in-right me-2"></i>}
                Se connecter
              </button>
            </form>

            <hr />
            <div className="text-center small">
              <span className="text-muted">Pas encore de compte ? </span>
              <Link to="/register" style={{ color: 'var(--vc-blue)' }}>Créer un compte</Link>
            </div>

            <div className="mt-3 p-2 rounded" style={{ background: 'var(--vc-blue-pale)', fontSize: '0.78rem' }}>
              <strong>Comptes de démo :</strong><br />
              admin@vitacare.fr / dr.martin@vitacare.fr / j.dupont@vitacare.fr<br />
              <strong>Mot de passe :</strong> password (voir README)
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

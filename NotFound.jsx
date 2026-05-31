import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container py-5 text-center">
      <div style={{ fontSize: '6rem', color: 'var(--vc-blue-pale)' }}>404</div>
      <h2 className="fw-bold mb-2" style={{ color: 'var(--vc-blue)' }}>Page introuvable</h2>
      <p className="text-muted mb-4">La page que vous cherchez n'existe pas ou a été déplacée.</p>
      <Link to="/" className="btn btn-vitacare px-5">
        <i className="bi bi-house me-2"></i>Retour à l'accueil
      </Link>
    </div>
  )
}

import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{ background: 'var(--vc-blue)', color: 'rgba(255,255,255,0.8)' }} className="py-4 mt-auto">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-md-4 mb-3 mb-md-0">
            <span className="fw-bold text-white fs-5">
              <i className="bi bi-heart-pulse-fill me-2" style={{ color: 'var(--vc-red)' }}></i>VitaCare
            </span>
            <p className="small mt-1 mb-0">Médecine du sport pour l'élite française</p>
          </div>
          <div className="col-md-4 mb-3 mb-md-0">
            <ul className="list-unstyled small mb-0">
              <li><Link to="/services" className="text-white-50 text-decoration-none hover-white">Pôles & Services</Link></li>
              <li><Link to="/activities" className="text-white-50 text-decoration-none">Séances collectives</Link></li>
              <li><Link to="/register" className="text-white-50 text-decoration-none">Créer un compte</Link></li>
            </ul>
          </div>
          <div className="col-md-4 text-md-end">
            <p className="small mb-0">© {new Date().getFullYear()} VitaCare</p>
            <p className="small mb-0 text-white-50">Projet ECE Paris — ING2 Web Dynamique 2026</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

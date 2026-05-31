import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { notificationsAPI } from '../services/api'
import { useEffect, useState } from 'react'

const POLE_LABELS = {
  reeducation: 'Rééducation', preparation: 'Préparation',
  recuperation: 'Récupération', mental: 'Mental', nutrition: 'Nutrition',
}

export default function Navbar() {
  const { user, logout, isAdmin, isPraticien } = useAuth()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user) return
    notificationsAPI.list().then(r => setUnread(r.data.unread)).catch(() => {})
    const iv = setInterval(() => {
      notificationsAPI.list().then(r => setUnread(r.data.unread)).catch(() => {})
    }, 30000)
    return () => clearInterval(iv)
  }, [user])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <nav className="navbar navbar-vitacare navbar-expand-lg sticky-top">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <i className="bi bi-heart-pulse-fill me-2" style={{ color: 'var(--vc-red)' }}></i>
          VitaCare
        </Link>

        <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navMain">
          <span className="navbar-toggler-icon" style={{ filter: 'invert(1)' }}></span>
        </button>

        <div className="collapse navbar-collapse" id="navMain">
          <ul className="navbar-nav me-auto gap-1">
            <li className="nav-item">
              <NavLink className="nav-link" to="/">Accueil</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/services">Pôles & Services</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/activities">Séances</NavLink>
            </li>
            {user && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/dashboard">Mon Espace</NavLink>
              </li>
            )}
            {(isAdmin || isPraticien) && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/admin">Administration</NavLink>
              </li>
            )}
          </ul>

          <ul className="navbar-nav gap-1 align-items-center">
            {user ? (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link position-relative" to="/cart">
                    <i className="bi bi-cart3"></i>
                    <span className="ms-1 d-none d-lg-inline">Panier</span>
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link position-relative" to="/notifications">
                    <i className="bi bi-bell-fill"></i>
                    {unread > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/profile">
                    <i className="bi bi-person-circle me-1"></i>
                    {user.prenom} {user.nom}
                  </NavLink>
                </li>
                <li className="nav-item ms-1">
                  <button className="btn btn-sm btn-vitacare-red px-3" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-1"></i>Déconnexion
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">Connexion</Link>
                </li>
                <li className="nav-item">
                  <Link className="btn btn-sm btn-vitacare-red ms-1 px-3" to="/register">Inscription</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}

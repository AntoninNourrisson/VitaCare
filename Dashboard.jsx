import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { dashboardAPI, reservationsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import StatutBadge from '../components/StatutBadge'
import PoleBadge from '../components/PoleBadge'
import Spinner from '../components/Spinner'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const POLE_COLORS = { reeducation: '#0077B6', preparation: '#2D6A4F', recuperation: '#6A4C93', mental: '#E76F51', nutrition: '#F4A261' }
const POLE_LABELS = { reeducation: 'Rééducation', preparation: 'Préparation', recuperation: 'Récupération', mental: 'Mental', nutrition: 'Nutrition' }

export default function Dashboard() {
  const { user, isAdmin, isPraticien } = useAuth()
  const [stats, setStats]   = useState(null)
  const [recent, setRecent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([dashboardAPI.stats(), dashboardAPI.recent()])
      .then(([s, r]) => { setStats(s.data); setRecent(r.data) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner fullscreen />

  const statCards = isAdmin ? [
    { label: 'Utilisateurs', value: stats?.total_users, icon: 'bi-people-fill', color: 'var(--vc-blue)' },
    { label: 'RDV ce mois', value: stats?.rdv_mois, icon: 'bi-calendar-check', color: 'var(--pole-preparation)' },
    { label: 'En attente', value: stats?.en_attente, icon: 'bi-hourglass-split', color: '#FFC107' },
    { label: 'Services actifs', value: stats?.total_services, icon: 'bi-grid-3x3-gap', color: 'var(--vc-red)' },
  ] : [
    { label: 'RDV à venir', value: stats?.rdv_a_venir, icon: 'bi-calendar-check', color: 'var(--vc-blue)' },
    { label: 'Activités inscrites', value: stats?.activites_inscrit, icon: 'bi-people', color: 'var(--pole-preparation)' },
    { label: 'En attente', value: stats?.en_attente, icon: 'bi-hourglass-split', color: '#FFC107' },
    { label: 'Total consultations', value: stats?.total_consultations, icon: 'bi-clipboard-check', color: 'var(--pole-recuperation)' },
  ]

  const pieData = (stats?.repartition_poles || []).map(r => ({
    name: POLE_LABELS[r.pole] || r.pole,
    value: parseInt(r.nb),
    color: POLE_COLORS[r.pole] || '#ccc',
  }))

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h2 className="fw-bold mb-0" style={{ color: 'var(--vc-blue)' }}>
          Bonjour, {user.prenom} 👋
        </h2>
        <p className="text-muted">Bienvenue dans votre espace VitaCare</p>
      </div>

      {/* Cartes stats */}
      <div className="row g-3 mb-4">
        {statCards.map((s, i) => (
          <div key={i} className="col-6 col-md-3">
            <div className="card-vitacare card p-3 text-center">
              <i className={`bi ${s.icon} fs-2 mb-1`} style={{ color: s.color }}></i>
              <div className="fs-3 fw-black" style={{ color: s.color }}>{s.value ?? '—'}</div>
              <div className="small text-muted">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        {/* RDV récents */}
        <div className="col-lg-7">
          <div className="card-vitacare card p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0" style={{ color: 'var(--vc-blue)' }}>
                <i className="bi bi-calendar3 me-2"></i>
                {isAdmin ? 'Derniers RDV' : 'Mes derniers RDV'}
              </h5>
              <Link to="/history" className="small" style={{ color: 'var(--vc-blue)' }}>Voir tout →</Link>
            </div>

            {recent?.rdvs?.length === 0 ? (
              <p className="text-muted small">Aucun rendez-vous.</p>
            ) : (
              <div className="list-group list-group-flush">
                {(recent?.rdvs || []).map(r => (
                  <div key={r.id_rdv} className="list-group-item px-0 py-2">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="fw-semibold small">{r.service_nom}</div>
                        <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                          {new Date(r.date_heure).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          {' '}à {new Date(r.date_heure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          {r.praticien && ` · ${r.praticien}`}
                        </div>
                      </div>
                      <StatutBadge statut={r.statut} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Activités + graphique */}
        <div className="col-lg-5">
          <div className="card-vitacare card p-4 mb-4">
            <h5 className="fw-bold mb-3" style={{ color: 'var(--vc-blue)' }}>
              <i className="bi bi-people me-2"></i>Prochaines activités
            </h5>
            {recent?.activites?.length === 0 ? (
              <p className="text-muted small">Aucune activité à venir.</p>
            ) : (
              <ul className="list-unstyled mb-0">
                {(recent?.activites || []).map(a => (
                  <li key={a.id_activite} className="mb-2 pb-2 border-bottom">
                    <Link to={`/activities/${a.id_activite}`} className="text-decoration-none">
                      <div className="fw-semibold small">{a.nom}</div>
                      <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                        <PoleBadge pole={a.pole} showIcon={false} />
                        {' · '}{new Date(a.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {pieData.length > 0 && (
            <div className="card-vitacare card p-4">
              <h5 className="fw-bold mb-3" style={{ color: 'var(--vc-blue)' }}>
                <i className="bi bi-pie-chart me-2"></i>Répartition par pôle
              </h5>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Accès rapide */}
      <div className="mt-4">
        <h5 className="fw-bold mb-3" style={{ color: 'var(--vc-blue)' }}>Accès rapide</h5>
        <div className="d-flex flex-wrap gap-2">
          <Link to="/services" className="btn btn-vitacare-outline"><i className="bi bi-grid me-2"></i>Services</Link>
          <Link to="/activities" className="btn btn-vitacare-outline"><i className="bi bi-calendar me-2"></i>Séances</Link>
          <Link to="/history" className="btn btn-vitacare-outline"><i className="bi bi-clock-history me-2"></i>Historique</Link>
          <Link to="/cart" className="btn btn-vitacare-outline"><i className="bi bi-cart me-2"></i>Panier</Link>
          {(isAdmin || isPraticien) && <Link to="/admin" className="btn btn-vitacare"><i className="bi bi-shield-check me-2"></i>Administration</Link>}
        </div>
      </div>
    </div>
  )
}

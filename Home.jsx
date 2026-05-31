import { Link } from 'react-router-dom'
import { POLES } from '../components/PoleBadge'

const POLE_ICONS = {
  reeducation:  { icon: 'bi-bandaid-fill',      color: 'var(--pole-reeducation)' },
  preparation:  { icon: 'bi-lightning-charge-fill', color: 'var(--pole-preparation)' },
  recuperation: { icon: 'bi-snow2',             color: 'var(--pole-recuperation)' },
  mental:       { icon: 'bi-brain',             color: 'var(--pole-mental)' },
  nutrition:    { icon: 'bi-egg-fried',         color: 'var(--pole-nutrition)' },
}

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="hero-section text-white py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-7">
              <span className="badge mb-3 px-3 py-2" style={{ background: 'var(--vc-gold)', color: '#000', fontSize: '0.8rem', fontWeight: 700, letterSpacing: 1 }}>
                ÉLITE SPORTIVE FRANÇAISE
              </span>
              <h1 className="display-4 fw-black mb-3" style={{ fontWeight: 900 }}>
                La médecine du sport<br />au service de l'excellence
              </h1>
              <p className="lead mb-4 opacity-75">
                VitaCare accompagne les sportifs de haut niveau avec une approche médicale personnalisée — rééducation, préparation, récupération, mental et nutrition.
              </p>
              <div className="d-flex gap-3 flex-wrap">
                <Link to="/services" className="btn btn-lg btn-vitacare-red px-4">
                  <i className="bi bi-grid-3x3-gap me-2"></i>Découvrir les services
                </Link>
                <Link to="/register" className="btn btn-lg btn-outline-light px-4">
                  <i className="bi bi-person-plus me-2"></i>Créer mon espace
                </Link>
              </div>
            </div>
            <div className="col-lg-5 d-none d-lg-flex justify-content-center">
              <div className="text-center">
                <i className="bi bi-heart-pulse-fill" style={{ fontSize: '8rem', opacity: 0.15 }}></i>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-4" style={{ background: 'var(--vc-blue-pale)' }}>
        <div className="container">
          <div className="row text-center g-4">
            {[
              { val: '500+', label: 'Athlètes suivis', icon: 'bi-people-fill' },
              { val: '5',    label: 'Pôles de soins',  icon: 'bi-grid-3x3-gap-fill' },
              { val: '15+',  label: 'Praticiens experts', icon: 'bi-person-badge-fill' },
              { val: '98%',  label: 'Satisfaction',    icon: 'bi-star-fill' },
            ].map((s) => (
              <div key={s.label} className="col-6 col-md-3">
                <i className={`bi ${s.icon} fs-2 mb-1`} style={{ color: 'var(--vc-blue)' }}></i>
                <div className="fw-bold fs-3" style={{ color: 'var(--vc-blue)' }}>{s.val}</div>
                <div className="text-muted small">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5 pôles */}
      <section className="py-5">
        <div className="container">
          <h2 className="fw-bold mb-1 text-center" style={{ color: 'var(--vc-blue)' }}>Nos 5 pôles de services</h2>
          <p className="text-center text-muted mb-5">Une prise en charge globale de l'athlète</p>
          <div className="row g-4">
            {Object.entries(POLES).map(([key, { label, icon }]) => (
              <div key={key} className="col-sm-6 col-lg-4">
                <Link to={`/services?pole=${key}`} className="text-decoration-none">
                  <div className="card-vitacare card p-4 h-100">
                    <div className="d-flex align-items-center mb-3">
                      <div className="rounded-circle d-flex align-items-center justify-content-center me-3"
                        style={{ width: 56, height: 56, background: POLE_ICONS[key]?.color + '20' }}>
                        <i className={`bi ${icon} fs-4`} style={{ color: POLE_ICONS[key]?.color }}></i>
                      </div>
                      <span className={`badge-pole badge-${key}`}>{label}</span>
                    </div>
                    <h5 className="fw-bold mb-2" style={{ color: 'var(--vc-dark)' }}>{label}</h5>
                    <p className="text-muted small mb-0">
                      {key === 'reeducation'  && 'Rééducation post-blessure, kinésithérapie sportive, reprise progressive.'}
                      {key === 'preparation'  && 'Préparation physique optimale avant vos compétitions majeures.'}
                      {key === 'recuperation' && 'Cryothérapie, massages sportifs, séances de récupération active.'}
                      {key === 'mental'       && 'Préparation mentale, gestion du stress, visualisation sportive.'}
                      {key === 'nutrition'    && 'Plans alimentaires personnalisés, régimes pré-compétition, suivi nutritionnel.'}
                    </p>
                    <div className="mt-3 text-end">
                      <span className="small fw-semibold" style={{ color: 'var(--vc-blue)' }}>
                        Voir les services <i className="bi bi-arrow-right-short"></i>
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
            <div className="col-sm-6 col-lg-4 d-flex align-items-stretch">
              <div className="card-vitacare card p-4 w-100 d-flex flex-column justify-content-center align-items-center text-center"
                style={{ background: 'var(--vc-blue)', color: 'white' }}>
                <i className="bi bi-calendar-check fs-1 mb-3" style={{ color: 'var(--vc-gold)' }}></i>
                <h5 className="fw-bold mb-2">Séances collectives</h5>
                <p className="small opacity-75 mb-3">Programmes en groupe avec des experts, ouverts à tous les niveaux.</p>
                <Link to="/activities" className="btn btn-sm btn-vitacare-red">Voir les séances</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-5" style={{ background: 'var(--vc-blue-pale)' }}>
        <div className="container text-center">
          <h2 className="fw-bold mb-3" style={{ color: 'var(--vc-blue)' }}>Prêt à rejoindre l'élite ?</h2>
          <p className="text-muted mb-4 col-md-6 mx-auto">
            Créez votre espace personnel et accédez à l'ensemble de nos services, réservez vos créneaux et suivez votre progression.
          </p>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <Link to="/register" className="btn btn-vitacare btn-lg px-5">
              <i className="bi bi-person-plus me-2"></i>Créer mon compte
            </Link>
            <Link to="/services" className="btn btn-vitacare-outline btn-lg px-5">
              <i className="bi bi-search me-2"></i>Explorer les services
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

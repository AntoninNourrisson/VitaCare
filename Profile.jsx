import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { usersAPI } from '../services/api'

const ROLE_LABELS = {
  admin:     'Administrateur',
  praticien: 'Praticien',
  sportif:   'Sportif',
  visiteur:  'Visiteur',
}
const ROLE_ICONS = {
  admin:     'bi-shield-fill',
  praticien: 'bi-clipboard2-pulse',
  sportif:   'bi-trophy-fill',
  visiteur:  'bi-person',
}

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState(null)
  const [msg, setMsg]         = useState('')
  const [err, setErr]         = useState('')
  const [saving, setSaving]   = useState(false)

  const startEditing = () => {
    // Réinitialise depuis le contexte à chaque ouverture pour avoir les valeurs fraîches
    setForm({
      nom:            user.nom,
      prenom:         user.prenom,
      telephone:      user.telephone      || '',
      sport_pratique: user.sport_pratique || '',
      federation:     user.federation     || '',
      mot_de_passe:   '',
    })
    setMsg(''); setErr('')
    setEditing(true)
  }

  const cancelEditing = () => { setEditing(false); setErr('') }

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.nom.trim() || !form.prenom.trim()) {
      setErr('Le nom et le prénom sont obligatoires.')
      return
    }
    setSaving(true); setMsg(''); setErr('')
    try {
      await usersAPI.update(form)
      updateUser({
        nom:            form.nom.trim(),
        prenom:         form.prenom.trim(),
        telephone:      form.telephone,
        sport_pratique: form.sport_pratique,
        federation:     form.federation,
      })
      setMsg('Profil mis à jour avec succès.')
      setEditing(false)
    } catch (e) {
      setErr(e.response?.data?.error || 'Erreur lors de la mise à jour.')
    } finally {
      setSaving(false)
    }
  }

  const infoFields = [
    { label: 'Nom',            value: user.nom,                            icon: 'bi-person'         },
    { label: 'Prénom',         value: user.prenom,                         icon: 'bi-person'         },
    { label: 'Email',          value: user.email,                          icon: 'bi-envelope'       },
    { label: 'Téléphone',      value: user.telephone      || '—',          icon: 'bi-telephone'      },
    { label: 'Sport pratiqué', value: user.sport_pratique || '—',          icon: 'bi-trophy'         },
    { label: 'Fédération',     value: user.federation     || '—',          icon: 'bi-building'       },
    { label: 'Rôle',           value: ROLE_LABELS[user.role] || user.role, icon: ROLE_ICONS[user.role] || 'bi-person-badge', isRole: true },
    { label: 'Membre depuis',  value: new Date(user.date_creation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }), icon: 'bi-calendar-check' },
  ]

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-7 col-md-9">

          <h2 className="fw-bold mb-4" style={{ color: 'var(--vc-blue)' }}>
            <i className="bi bi-person-circle me-2"></i>Mon profil
          </h2>

          {msg && (
            <div className="alert alert-success d-flex align-items-center gap-2">
              <i className="bi bi-check-circle-fill"></i>{msg}
            </div>
          )}
          {err && (
            <div className="alert alert-danger d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-circle-fill"></i>{err}
            </div>
          )}

          {/* ── Carte identité ─────────────────────────────────── */}
          <div className="card-vitacare card overflow-hidden mb-4">
            {/* Header de carte */}
            <div className="p-4 d-flex align-items-center gap-3"
              style={{ background: 'linear-gradient(135deg, var(--vc-blue) 0%, var(--vc-blue-light) 100%)' }}>
              <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 72, height: 72, background: 'rgba(255,255,255,0.15)', fontSize: '2rem', color: '#fff' }}>
                <i className="bi bi-person-fill"></i>
              </div>
              <div>
                <h4 className="fw-bold mb-1 text-white">{user.prenom} {user.nom}</h4>
                <span className={`badge badge-role-${user.role} badge-pole`}>
                  <i className={`bi ${ROLE_ICONS[user.role] || 'bi-person'} me-1`}></i>
                  {ROLE_LABELS[user.role] || user.role}
                </span>
              </div>
            </div>

            {/* Corps : mode lecture */}
            {!editing && (
              <div className="p-4">
                <div className="row g-3 mb-4">
                  {infoFields.map(f => (
                    <div key={f.label} className="col-sm-6">
                      <div className="p-3 rounded h-100" style={{ background: 'var(--vc-blue-pale)' }}>
                        <div className="small text-muted mb-1">
                          <i className={`bi ${f.icon} me-1`}></i>{f.label}
                        </div>
                        {f.isRole ? (
                          <span className={`badge badge-role-${user.role} badge-pole`}>{f.value}</span>
                        ) : (
                          <div className="fw-semibold" style={{ wordBreak: 'break-word' }}>{f.value}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button className="btn btn-vitacare px-4" onClick={startEditing}>
                  <i className="bi bi-pencil-square me-2"></i>Modifier mon profil
                </button>
              </div>
            )}

            {/* Corps : mode édition */}
            {editing && form && (
              <form onSubmit={handleSave} className="p-4">
                <p className="text-muted small mb-3">
                  <i className="bi bi-lock me-1"></i>
                  L'email et le rôle ne sont pas modifiables ici.
                </p>
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Nom *</label>
                    <input type="text" name="nom" className="form-control"
                      value={form.nom} onChange={handleChange} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Prénom *</label>
                    <input type="text" name="prenom" className="form-control"
                      value={form.prenom} onChange={handleChange} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Téléphone</label>
                    <input type="tel" name="telephone" className="form-control"
                      value={form.telephone} onChange={handleChange}
                      placeholder="06 12 34 56 78" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Sport pratiqué</label>
                    <input type="text" name="sport_pratique" className="form-control"
                      value={form.sport_pratique} onChange={handleChange}
                      placeholder="ex : Natation" />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">Fédération</label>
                    <input type="text" name="federation" className="form-control"
                      value={form.federation} onChange={handleChange}
                      placeholder="ex : Fédération Française de Natation" />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      Nouveau mot de passe
                      <span className="fw-normal text-muted ms-1 small">(laisser vide pour ne pas changer)</span>
                    </label>
                    <input type="password" name="mot_de_passe" className="form-control"
                      value={form.mot_de_passe} onChange={handleChange}
                      placeholder="••••••••" autoComplete="new-password" />
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-vitacare px-4" disabled={saving}>
                    {saving
                      ? <><span className="spinner-border spinner-border-sm me-2"></span>Enregistrement...</>
                      : <><i className="bi bi-check-circle me-2"></i>Enregistrer</>}
                  </button>
                  <button type="button" className="btn btn-outline-secondary" onClick={cancelEditing}>
                    Annuler
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

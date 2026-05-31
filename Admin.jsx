import { useState, useEffect, useRef } from 'react'
import { reservationsAPI, usersAPI, servicesAPI, creneauxAPI, activitiesAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import StatutBadge from '../components/StatutBadge'
import PoleBadge, { POLES } from '../components/PoleBadge'
import Spinner from '../components/Spinner'

// ── Helpers créneaux ───────────────────────────────────────────
const toMin  = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m }
const toHHMM = (min)  => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

function buildFreeSlots(dureeMin, takenSlots) {
  const taken = takenSlots.map(s => ({ start: toMin(s.heure_debut), end: toMin(s.heure_fin) }))
  const slots = []
  for (let t = 8 * 60; t + dureeMin <= 19 * 60; t += 30) {
    const end = t + dureeMin
    if (!taken.some(tk => t < tk.end && end > tk.start))
      slots.push({ heure_debut: toHHMM(t), heure_fin: toHHMM(end) })
  }
  return slots
}

// ── Sous-composant : gestion créneaux ─────────────────────────
function GestionCreneaux({ services }) {
  const today = new Date().toISOString().slice(0, 10)
  const [idService, setIdService] = useState('')
  const [date,      setDate]      = useState(today)
  const [slots,     setSlots]     = useState([])
  const [takenRaw,  setTakenRaw]  = useState(null)
  const [fetching,  setFetching]  = useState(false)
  const [created,   setCreated]   = useState([])
  const [creating,  setCreating]  = useState(null)

  const selectedService = services.find(s => String(s.id_service ?? s.id) === String(idService))

  useEffect(() => {
    if (!idService || !date) { setSlots([]); setTakenRaw(null); return }
    setFetching(true)
    creneauxAPI.taken(idService, date)
      .then(r => { setTakenRaw(r.data); setSlots(buildFreeSlots(selectedService?.duree ?? 60, r.data)) })
      .catch(() => { setTakenRaw([]); setSlots([]) })
      .finally(() => setFetching(false))
  }, [idService, date])

  const freeSlots = slots.filter(
    s => !created.some(c => c.date === date && c.heure_debut === s.heure_debut)
  )

  const handleCreate = async (slot) => {
    setCreating(slot.heure_debut)
    try {
      await creneauxAPI.create({
        id_service:   parseInt(idService),
        date_creneau: date,
        heure_debut:  slot.heure_debut + ':00',
        heure_fin:    slot.heure_fin   + ':00',
      })
      setCreated(prev => [...prev, { date, heure_debut: slot.heure_debut }])
    } catch { /* slot déjà pris — ne devrait pas arriver */ }
    finally { setCreating(null) }
  }

  const dateLabel = date
    ? new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    : ''

  return (
    <>
      <div className="p-4 rounded mb-4 d-flex align-items-center justify-content-between flex-wrap gap-3"
        style={{ background: 'var(--vc-blue)', color: '#fff' }}>
        <div>
          <h4 className="fw-bold mb-1">Ajouter des créneaux</h4>
          <p className="mb-0 opacity-75 small">Seules les plages disponibles (sans conflit) sont proposées.</p>
        </div>
        <i className="bi bi-calendar-plus fs-1 opacity-25"></i>
      </div>

      <div className="card-vitacare card p-4 mb-4">
        <div className="row g-3 align-items-end">
          <div className="col-md-5">
            <label className="form-label fw-semibold">Service *</label>
            <select className="form-select" value={idService} onChange={e => { setIdService(e.target.value); setCreated([]) }}>
              <option value="">— Sélectionner un service —</option>
              {services.map(s => (
                <option key={s.id_service ?? s.id} value={s.id_service ?? s.id}>
                  {s.nom} ({s.duree} min)
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label fw-semibold">Date *</label>
            <input type="date" className="form-control" value={date} min={today}
              onChange={e => { setDate(e.target.value); setCreated([]) }} />
          </div>
          <div className="col-md-3">
            {idService && selectedService && (
              <div className="p-2 rounded text-center small" style={{ background: 'var(--vc-blue-pale)', color: 'var(--vc-blue)' }}>
                <i className="bi bi-clock me-1"></i>Durée : <strong>{selectedService.duree} min</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {idService && date && (
        <div className="card-vitacare card p-4">
          <h5 className="fw-semibold mb-1" style={{ color: 'var(--vc-blue)' }}>
            <i className="bi bi-calendar2-week me-2"></i>{dateLabel}
          </h5>
          <p className="text-muted small mb-4">
            Cliquez sur une plage pour la créer. Les plages déjà prises n'apparaissent pas.
          </p>
          {fetching ? <Spinner /> : freeSlots.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-calendar-x fs-2 d-block mb-2"></i>
              {takenRaw === null ? 'Sélectionnez un service et une date.' : 'Aucune plage disponible ce jour.'}
            </div>
          ) : (
            <>
              <div className="d-flex flex-wrap gap-2 mb-4">
                {freeSlots.map(slot => (
                  <button key={slot.heure_debut} className="creneau-slot available"
                    disabled={creating === slot.heure_debut}
                    onClick={() => handleCreate(slot)} style={{ minWidth: 110 }}>
                    {creating === slot.heure_debut
                      ? <span className="spinner-border spinner-border-sm"></span>
                      : <><i className="bi bi-plus me-1"></i>{slot.heure_debut} – {slot.heure_fin}</>}
                  </button>
                ))}
              </div>
              {created.filter(c => c.date === date).length > 0 && (
                <div>
                  <p className="small fw-semibold mb-2" style={{ color: 'var(--pole-preparation)' }}>
                    <i className="bi bi-check-circle me-1"></i>Créneaux ajoutés ce jour :
                  </p>
                  <div className="d-flex flex-wrap gap-2">
                    {created.filter(c => c.date === date).map(c => (
                      <span key={c.heure_debut} className="badge px-3 py-2"
                        style={{ background: 'var(--pole-preparation)', color: '#fff', fontSize: '0.85rem' }}>
                        <i className="bi bi-check2 me-1"></i>{c.heure_debut}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  )
}

// ── Constantes ────────────────────────────────────────────────
const ROLE_OPTIONS   = ['visiteur', 'sportif', 'praticien', 'admin']
const ROLE_LABELS    = { visiteur: 'Visiteur', sportif: 'Sportif', praticien: 'Praticien', admin: 'Administrateur' }
const SVC_FORM_EMPTY = { nom: '', description: '', duree: '', prix: '', pole: '', categorie: '' }
const ACT_FORM_EMPTY = { nom: '', description: '', pole: '', date_debut: '', date_fin: '', lieu: '', capacite_max: '' }

// ── Page principale ───────────────────────────────────────────
export default function Admin() {
  const { isAdmin } = useAuth()

  // Navigation
  const [section, setSection] = useState('services')   // 'services' | 'seances'
  const [tab,     setTab]     = useState('services')   // sous-onglet section services

  // ── RDV ──
  const [rdvs,    setRdvs]    = useState([])
  const [rdvMsgs, setRdvMsgs] = useState({})

  // ── Utilisateurs ──
  const [users, setUsers] = useState([])

  // ── Services ──
  const [services,    setServices]    = useState([])
  const [svcLoading,  setSvcLoading]  = useState(false)

  // Modal ajout service
  const [showAdd,    setShowAdd]    = useState(false)
  const [svcForm,    setSvcForm]    = useState(SVC_FORM_EMPTY)
  const [svcErrors,  setSvcErrors]  = useState([])
  const [svcSuccess, setSvcSuccess] = useState('')
  const [svcSaving,  setSvcSaving]  = useState(false)

  // Modal suppression service
  const [svcToDelete,  setSvcToDelete]  = useState(null)
  const [svcDeleteErr, setSvcDeleteErr] = useState('')
  const [svcDeleting,  setSvcDeleting]  = useState(false)

  // Modal annulation RDV admin
  const [rdvToCancel, setRdvToCancel] = useState(null)
  const [cancelErr,   setCancelErr]   = useState('')
  const [cancelling,  setCancelling]  = useState(false)

  // ── Activités ──
  const [activites,      setActivites]      = useState([])
  const [actLoading,     setActLoading]     = useState(false)
  const [expandedAct,    setExpandedAct]    = useState(null)
  const [actParticipants,setActParticipants]= useState({})
  const [partLoading,    setPartLoading]    = useState(false)

  // Modal ajout séance
  const [showAddAct,    setShowAddAct]    = useState(false)
  const [actForm,       setActForm]       = useState(ACT_FORM_EMPTY)
  const [actErrors,     setActErrors]     = useState([])
  const [actSuccess,    setActSuccess]    = useState('')
  const [actSaving,     setActSaving]     = useState(false)

  // Modal suppression séance
  const [actToDelete,  setActToDelete]  = useState(null)
  const [actDeleteErr, setActDeleteErr] = useState('')
  const [actDeleting,  setActDeleting]  = useState(false)

  // Modal retrait participant
  const [participantToRemove, setParticipantToRemove] = useState(null)
  const [removeErr,           setRemoveErr]           = useState('')
  const [removing,            setRemoving]            = useState(false)

  const [loading, setLoading] = useState(true)

  // Refs modales
  const addSvcModalRef   = useRef(null)
  const delSvcModalRef   = useRef(null)
  const cancelModalRef   = useRef(null)
  const addActModalRef   = useRef(null)
  const delActModalRef   = useRef(null)
  const removePartModalRef = useRef(null)

  // ── Chargements ────────────────────────────────────────────
  const loadRdvs     = () => reservationsAPI.list().then(r => setRdvs(r.data)).catch(() => {})
  const loadUsers    = () => usersAPI.list().then(r => setUsers(r.data)).catch(() => {})
  const loadServices = () => {
    setSvcLoading(true)
    return servicesAPI.list({}).then(r => setServices(r.data)).catch(() => {}).finally(() => setSvcLoading(false))
  }
  const loadActivites = () => {
    setActLoading(true)
    return activitiesAPI.list({}).then(r => setActivites(r.data)).catch(() => {}).finally(() => setActLoading(false))
  }
  const loadParticipants = (id) => {
    setPartLoading(true)
    return activitiesAPI.participants(id)
      .then(r => setActParticipants(prev => ({ ...prev, [id]: r.data })))
      .catch(() => setActParticipants(prev => ({ ...prev, [id]: [] })))
      .finally(() => setPartLoading(false))
  }

  useEffect(() => {
    Promise.all([
      loadRdvs(),
      loadServices(),
      loadActivites(),
      isAdmin ? loadUsers() : Promise.resolve(),
    ]).finally(() => setLoading(false))
  }, [])

  // ── RDV : valider / refuser ───────────────────────────────
  const handleValidate = async (id_rdv) => {
    setRdvMsgs({})
    try {
      await reservationsAPI.validate({ id_rdv })
      setRdvMsgs({ [id_rdv]: 'Validé !' })
      loadRdvs()
    } catch (e) { setRdvMsgs({ [`err_${id_rdv}`]: e.response?.data?.error || 'Erreur.' }) }
  }

  const handleRefuse = async (id_rdv) => {
    if (!window.confirm('Confirmer le refus ?')) return
    setRdvMsgs({})
    try {
      await reservationsAPI.refuse({ id_rdv })
      setRdvMsgs({ [id_rdv]: 'Refusé.' })
      loadRdvs()
    } catch { setRdvMsgs({ [`err_${id_rdv}`]: 'Erreur.' }) }
  }

  // ── RDV : annulation admin ────────────────────────────────
  const openCancelModal  = (r) => { setRdvToCancel(r); setCancelErr('') }
  const closeCancelModal = ()  => { setRdvToCancel(null); setCancelErr('') }

  const handleAdminCancel = async () => {
    if (!rdvToCancel) return
    setCancelling(true); setCancelErr('')
    try {
      await reservationsAPI.adminCancel({ id_rdv: rdvToCancel.id_rdv })
      closeCancelModal(); loadRdvs()
    } catch (e) { setCancelErr(e.response?.data?.error || 'Erreur.') }
    finally { setCancelling(false) }
  }

  // ── Utilisateurs : rôle ───────────────────────────────────
  const handleRoleChange = async (id_utilisateur, role) => {
    try {
      await usersAPI.setRole({ id_utilisateur, role }); loadUsers()
    } catch (e) { alert(e.response?.data?.error || 'Erreur.') }
  }

  // ── Services : ajout ──────────────────────────────────────
  const openAddSvcModal  = () => { setSvcForm(SVC_FORM_EMPTY); setSvcErrors([]); setSvcSuccess(''); setShowAdd(true) }
  const closeAddSvcModal = () => setShowAdd(false)

  const handleCreateSvc = async (e) => {
    e.preventDefault(); setSvcErrors([]); setSvcSuccess('')
    const errs = []
    if (!svcForm.nom.trim())                              errs.push('Le nom est obligatoire.')
    if (!svcForm.pole)                                    errs.push('Le pôle est obligatoire.')
    if (!svcForm.duree || parseInt(svcForm.duree) <= 0)  errs.push('La durée doit être positive.')
    if (errs.length) { setSvcErrors(errs); return }
    setSvcSaving(true)
    try {
      await servicesAPI.create({
        nom:         svcForm.nom.trim(),
        description: svcForm.description.trim(),
        duree:       parseInt(svcForm.duree),
        prix:        parseFloat(svcForm.prix) || 0,
        pole:        svcForm.pole,
        categorie:   svcForm.categorie.trim(),
      })
      setSvcSuccess('Service créé !'); loadServices(); setTimeout(closeAddSvcModal, 900)
    } catch (err) {
      const d = err.response?.data
      setSvcErrors(d?.errors || [d?.error || 'Erreur.'])
    } finally { setSvcSaving(false) }
  }

  // ── Services : suppression ───────────────────────────────
  const openDelSvcModal  = (s) => { setSvcToDelete(s); setSvcDeleteErr('') }
  const closeDelSvcModal = ()  => { setSvcToDelete(null); setSvcDeleteErr('') }

  const handleDeleteSvc = async () => {
    if (!svcToDelete) return
    setSvcDeleting(true); setSvcDeleteErr('')
    try {
      await servicesAPI.delete(svcToDelete.id_service ?? svcToDelete.id)
      closeDelSvcModal(); loadServices()
    } catch (err) { setSvcDeleteErr(err.response?.data?.error || 'Erreur.') }
    finally { setSvcDeleting(false) }
  }

  // ── Activités : toggle participants ──────────────────────
  const toggleExpand = (id) => {
    if (expandedAct === id) { setExpandedAct(null); return }
    setExpandedAct(id)
    if (!actParticipants[id]) loadParticipants(id)
  }

  // ── Activités : ajout ────────────────────────────────────
  const openAddActModal  = () => { setActForm(ACT_FORM_EMPTY); setActErrors([]); setActSuccess(''); setShowAddAct(true) }
  const closeAddActModal = () => setShowAddAct(false)

  const handleCreateAct = async (e) => {
    e.preventDefault(); setActErrors([]); setActSuccess('')
    const errs = []
    if (!actForm.nom.trim())                                    errs.push('Le nom est obligatoire.')
    if (!actForm.pole)                                          errs.push('Le pôle est obligatoire.')
    if (!actForm.date_debut)                                    errs.push('La date de début est obligatoire.')
    if (!actForm.date_fin)                                      errs.push('La date de fin est obligatoire.')
    if (!actForm.capacite_max || parseInt(actForm.capacite_max) <= 0) errs.push('La capacité doit être positive.')
    if (errs.length) { setActErrors(errs); return }
    setActSaving(true)
    try {
      await activitiesAPI.create({
        nom:          actForm.nom.trim(),
        description:  actForm.description.trim(),
        pole:         actForm.pole,
        date_debut:   actForm.date_debut,
        date_fin:     actForm.date_fin,
        lieu:         actForm.lieu.trim(),
        capacite_max: parseInt(actForm.capacite_max),
      })
      setActSuccess('Séance créée !'); loadActivites(); setTimeout(closeAddActModal, 900)
    } catch (err) {
      setActErrors([err.response?.data?.error || 'Erreur.'])
    } finally { setActSaving(false) }
  }

  // ── Activités : suppression ───────────────────────────────
  const openDelActModal  = (a) => { setActToDelete(a); setActDeleteErr('') }
  const closeDelActModal = ()  => { setActToDelete(null); setActDeleteErr('') }

  const handleDeleteAct = async () => {
    if (!actToDelete) return
    setActDeleting(true); setActDeleteErr('')
    try {
      await activitiesAPI.delete(actToDelete.id_activite)
      if (expandedAct === actToDelete.id_activite) setExpandedAct(null)
      setActParticipants(prev => { const n = { ...prev }; delete n[actToDelete.id_activite]; return n })
      closeDelActModal(); loadActivites()
    } catch (err) { setActDeleteErr(err.response?.data?.error || 'Erreur.') }
    finally { setActDeleting(false) }
  }

  // ── Participants : retrait ────────────────────────────────
  const openRemovePartModal  = (p) => { setParticipantToRemove(p); setRemoveErr('') }
  const closeRemovePartModal = ()  => { setParticipantToRemove(null); setRemoveErr('') }

  const handleRemoveParticipant = async () => {
    if (!participantToRemove) return
    setRemoving(true); setRemoveErr('')
    try {
      await activitiesAPI.manageParticipant({
        id_activite:    participantToRemove.id_activite,
        id_utilisateur: participantToRemove.id_utilisateur,
        action:         'remove',
      })
      closeRemovePartModal()
      loadParticipants(participantToRemove.id_activite)
      loadActivites()
    } catch (err) { setRemoveErr(err.response?.data?.error || 'Erreur.') }
    finally { setRemoving(false) }
  }

  if (loading) return <Spinner fullscreen />

  const pending = rdvs.filter(r => r.statut === 'en_attente')

  const svcTabs = [
    { key: 'services', label: 'Gestion des services',            icon: 'bi-grid-3x3-gap'     },
    { key: 'creneaux', label: 'Créneaux',                        icon: 'bi-calendar-plus'    },
    { key: 'rdv',      label: `RDV en attente (${pending.length})`, icon: 'bi-hourglass-split' },
    { key: 'all-rdv',  label: 'Tous les RDV',                    icon: 'bi-calendar3'        },
    ...(isAdmin ? [{ key: 'users', label: 'Utilisateurs', icon: 'bi-people' }] : []),
  ]

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4" style={{ color: 'var(--vc-blue)' }}>
        <i className="bi bi-shield-check me-2"></i>Administration
      </h2>

      {/* ══ Sélecteur de section ═══════════════════════════════════ */}
      <div className="row g-3 mb-4">
        {[
          { key: 'services', icon: 'bi-grid-3x3-gap-fill', title: 'Services & Rendez-vous', sub: 'Catalogue, créneaux, RDV' },
          { key: 'seances',  icon: 'bi-calendar-event-fill', title: 'Séances & Activités',  sub: 'Groupes, participants, inscriptions' },
        ].map(s => (
          <div key={s.key} className="col-md-6">
            <button onClick={() => setSection(s.key)}
              className="w-100 text-start border-0 p-4 rounded-3 d-flex align-items-center gap-3"
              style={{
                background:  section === s.key ? 'var(--vc-blue)' : 'var(--vc-blue-pale)',
                color:       section === s.key ? '#fff' : 'var(--vc-blue)',
                cursor:      'pointer',
                boxShadow:   section === s.key ? '0 4px 16px rgba(0,38,84,.25)' : 'none',
                transition:  'all .15s',
              }}>
              <i className={`bi ${s.icon} fs-2 flex-shrink-0`}></i>
              <div className="flex-grow-1">
                <div className="fw-bold">{s.title}</div>
                <div className={`small ${section === s.key ? 'opacity-75' : 'text-muted'}`}>{s.sub}</div>
              </div>
              {section === s.key && <i className="bi bi-chevron-right ms-auto flex-shrink-0"></i>}
            </button>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════
          SECTION 1 — SERVICES & RDV
      ══════════════════════════════════════════════════════════ */}
      {section === 'services' && (
        <>
          <ul className="nav nav-tabs mb-4">
            {svcTabs.map(t => (
              <li key={t.key} className="nav-item">
                <button
                  className={`nav-link ${tab === t.key ? 'active fw-bold' : ''}`}
                  style={tab === t.key ? { color: 'var(--vc-blue)', borderBottomColor: 'var(--vc-blue)' } : {}}
                  onClick={() => setTab(t.key)}>
                  <i className={`bi ${t.icon} me-1`}></i>{t.label}
                </button>
              </li>
            ))}
          </ul>

          {/* ── Gestion des services ──────────────────────────── */}
          {tab === 'services' && (
            <>
              <div className="p-4 rounded mb-4 d-flex align-items-center justify-content-between flex-wrap gap-3"
                style={{ background: 'var(--vc-blue)', color: '#fff' }}>
                <div>
                  <h4 className="fw-bold mb-1">Gérer les services</h4>
                  <p className="mb-0 opacity-75 small">
                    {services.length} service{services.length !== 1 ? 's' : ''} actif{services.length !== 1 ? 's' : ''} dans le catalogue
                  </p>
                </div>
                <button className="btn btn-lg px-4 fw-bold"
                  style={{ background: 'var(--vc-gold)', color: '#000', border: 'none' }}
                  onClick={openAddSvcModal}>
                  <i className="bi bi-plus-circle-fill me-2"></i>Ajouter un service
                </button>
              </div>

              {svcLoading ? <Spinner /> : (
                <div className="table-responsive card-vitacare card">
                  <table className="table table-hover align-middle mb-0">
                    <thead style={{ background: 'var(--vc-blue-pale)' }}>
                      <tr>
                        <th>Nom</th><th>Pôle</th><th>Durée</th><th>Prix</th><th>Praticien</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {services.length === 0 ? (
                        <tr><td colSpan={6} className="text-center text-muted py-4">Aucun service.</td></tr>
                      ) : services.map(s => (
                        <tr key={s.id_service ?? s.id}>
                          <td>
                            <div className="fw-semibold">{s.nom}</div>
                            {s.categorie && <div className="text-muted small">{s.categorie}</div>}
                          </td>
                          <td><PoleBadge pole={s.pole} /></td>
                          <td className="small">{s.duree} min</td>
                          <td className="small fw-semibold" style={{ color: 'var(--vc-gold)' }}>
                            {s.prix ? `${s.prix} €` : '—'}
                          </td>
                          <td className="small text-muted">{s.praticien || '—'}</td>
                          <td className="text-end">
                            <button className="btn btn-sm btn-outline-danger" onClick={() => openDelSvcModal(s)}>
                              <i className="bi bi-trash3 me-1"></i>Supprimer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ── Créneaux ──────────────────────────────────────── */}
          {tab === 'creneaux' && <GestionCreneaux services={services} />}

          {/* ── RDV en attente ────────────────────────────────── */}
          {tab === 'rdv' && (
            pending.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-check-circle fs-1 d-block mb-3 text-success"></i>
                Aucune demande en attente.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead style={{ background: 'var(--vc-blue-pale)' }}>
                    <tr><th>Sportif</th><th>Service</th><th>Pôle</th><th>Date</th><th>Statut</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {pending.map(r => (
                      <tr key={r.id_rdv}>
                        <td className="fw-semibold">{r.sportif || 'N/A'}</td>
                        <td>{r.service_nom}</td>
                        <td><PoleBadge pole={r.pole} /></td>
                        <td className="small">
                          {new Date(r.date_heure).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td><StatutBadge statut={r.statut} /></td>
                        <td>
                          <div className="d-flex gap-2 flex-wrap align-items-center">
                            {rdvMsgs[r.id_rdv]          && <span className="badge bg-success">{rdvMsgs[r.id_rdv]}</span>}
                            {rdvMsgs[`err_${r.id_rdv}`] && <span className="badge bg-danger">{rdvMsgs[`err_${r.id_rdv}`]}</span>}
                            <button className="btn btn-sm btn-success" onClick={() => handleValidate(r.id_rdv)}>
                              <i className="bi bi-check me-1"></i>Valider
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleRefuse(r.id_rdv)}>
                              <i className="bi bi-x me-1"></i>Refuser
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* ── Tous les RDV ──────────────────────────────────── */}
          {tab === 'all-rdv' && (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead style={{ background: 'var(--vc-blue-pale)' }}>
                  <tr><th>Sportif</th><th>Service</th><th>Pôle</th><th>Date</th><th>Statut</th><th className="text-end">Action</th></tr>
                </thead>
                <tbody>
                  {rdvs.map(r => (
                    <tr key={r.id_rdv}>
                      <td>{r.sportif || 'N/A'}</td>
                      <td>{r.service_nom}</td>
                      <td><PoleBadge pole={r.pole} /></td>
                      <td className="small">
                        {new Date(r.date_heure).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td><StatutBadge statut={r.statut} /></td>
                      <td className="text-end">
                        {r.statut !== 'annule' && (
                          <button className="btn btn-sm btn-outline-danger" onClick={() => openCancelModal(r)}>
                            <i className="bi bi-x-circle me-1"></i>Retirer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Utilisateurs (admin only) ─────────────────────── */}
          {tab === 'users' && isAdmin && (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead style={{ background: 'var(--vc-blue-pale)' }}>
                  <tr><th>Nom</th><th>Email</th><th>Sport</th><th>Rôle</th><th>Membre depuis</th></tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id_utilisateur}>
                      <td className="fw-semibold">{u.prenom} {u.nom}</td>
                      <td className="small text-muted">{u.email}</td>
                      <td className="small">{u.sport_pratique || '—'}</td>
                      <td>
                        <select className="form-select form-select-sm" value={u.role}
                          onChange={e => handleRoleChange(u.id_utilisateur, e.target.value)}
                          style={{ minWidth: 130 }}>
                          {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                        </select>
                      </td>
                      <td className="small text-muted">
                        {new Date(u.date_creation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
          SECTION 2 — SÉANCES & ACTIVITÉS
      ══════════════════════════════════════════════════════════ */}
      {section === 'seances' && (
        <>
          {/* Bandeau */}
          <div className="p-4 rounded mb-4 d-flex align-items-center justify-content-between flex-wrap gap-3"
            style={{ background: 'var(--vc-blue)', color: '#fff' }}>
            <div>
              <h4 className="fw-bold mb-1">Gérer les séances</h4>
              <p className="mb-0 opacity-75 small">
                {activites.length} séance{activites.length !== 1 ? 's' : ''} enregistrée{activites.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button className="btn btn-lg px-4 fw-bold"
              style={{ background: 'var(--vc-gold)', color: '#000', border: 'none' }}
              onClick={openAddActModal}>
              <i className="bi bi-plus-circle-fill me-2"></i>Ajouter une séance
            </button>
          </div>

          {/* Liste des activités */}
          {actLoading ? <Spinner /> : activites.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-calendar-x fs-1 d-block mb-3"></i>
              Aucune séance enregistrée.
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {activites.map(act => (
                <div key={act.id_activite} className="card-vitacare card overflow-hidden">

                  {/* En-tête activité */}
                  <div className="p-4">
                    <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
                          <h5 className="fw-bold mb-0" style={{ color: 'var(--vc-blue)' }}>{act.nom}</h5>
                          <PoleBadge pole={act.pole} />
                          {act.passe && <span className="badge bg-secondary small">Passée</span>}
                        </div>
                        <div className="d-flex flex-wrap gap-3 small text-muted">
                          {act.lieu && (
                            <span><i className="bi bi-geo-alt me-1"></i>{act.lieu}</span>
                          )}
                          <span>
                            <i className="bi bi-calendar me-1"></i>
                            {new Date(act.date_debut.replace(' ', 'T')).toLocaleDateString('fr-FR', {
                              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                          {act.description && (
                            <span className="d-none d-md-inline text-truncate" style={{ maxWidth: 260 }}>
                              <i className="bi bi-info-circle me-1"></i>{act.description}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Jauge places + boutons */}
                      <div className="d-flex flex-column align-items-end gap-2 flex-shrink-0">
                        {/* Compteur */}
                        <div className="d-flex align-items-center gap-2">
                          <span className="small fw-semibold"
                            style={{ color: act.complet ? 'var(--vc-red)' : 'var(--pole-preparation)' }}>
                            <i className="bi bi-people me-1"></i>
                            {act.inscrits} / {act.capacite_max}
                          </span>
                          <span className="badge"
                            style={{ background: act.complet ? 'var(--vc-red)' : 'var(--pole-preparation)', color: '#fff' }}>
                            {act.complet ? 'Complet' : `${act.places_restantes} place${act.places_restantes > 1 ? 's' : ''}`}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="d-flex gap-2">
                          <button className="btn btn-sm btn-outline-secondary"
                            onClick={() => toggleExpand(act.id_activite)}>
                            <i className={`bi ${expandedAct === act.id_activite ? 'bi-chevron-up' : 'bi-people'} me-1`}></i>
                            {expandedAct === act.id_activite ? 'Masquer' : `Participants (${act.inscrits})`}
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => openDelActModal(act)}>
                            <i className="bi bi-trash3 me-1"></i>Supprimer
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Barre de progression */}
                    <div className="mt-3">
                      <div className="progress" style={{ height: 6 }}>
                        <div className="progress-bar"
                          style={{
                            width: `${Math.min(100, (act.inscrits / act.capacite_max) * 100)}%`,
                            background: act.complet ? 'var(--vc-red)' : 'var(--pole-preparation)',
                          }}>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Panneau participants (expandable) */}
                  {expandedAct === act.id_activite && (
                    <div className="border-top" style={{ background: 'var(--vc-blue-pale)' }}>
                      <div className="p-4">
                        <h6 className="fw-semibold mb-3" style={{ color: 'var(--vc-blue)' }}>
                          <i className="bi bi-people-fill me-2"></i>
                          Participants inscrits ({(actParticipants[act.id_activite] || []).length})
                        </h6>

                        {partLoading ? (
                          <Spinner />
                        ) : (actParticipants[act.id_activite] || []).length === 0 ? (
                          <p className="text-muted small mb-0">
                            <i className="bi bi-info-circle me-1"></i>Aucun participant inscrit pour le moment.
                          </p>
                        ) : (
                          <div className="table-responsive">
                            <table className="table table-sm table-hover align-middle bg-white rounded mb-0"
                              style={{ borderRadius: 8, overflow: 'hidden' }}>
                              <thead style={{ background: 'var(--vc-blue)', color: '#fff' }}>
                                <tr>
                                  <th>Nom / Prénom</th>
                                  <th>Sport pratiqué</th>
                                  <th>Fédération</th>
                                  <th>Inscrit le</th>
                                  <th className="text-end">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {actParticipants[act.id_activite].map(p => (
                                  <tr key={p.id_utilisateur}>
                                    <td className="fw-semibold">{p.prenom} {p.nom}</td>
                                    <td className="small text-muted">{p.sport_pratique || '—'}</td>
                                    <td className="small text-muted">{p.federation || '—'}</td>
                                    <td className="small text-muted">
                                      {new Date(p.date_inscription).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="text-end">
                                      <button className="btn btn-sm btn-outline-danger"
                                        onClick={() => openRemovePartModal({ ...p, id_activite: act.id_activite, activite_nom: act.nom })}>
                                        <i className="bi bi-person-x me-1"></i>Retirer
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODALES
      ══════════════════════════════════════════════════════════ */}

      {/* Annulation RDV admin */}
      {rdvToCancel && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.55)' }}
          ref={cancelModalRef} onClick={e => { if (e.target === cancelModalRef.current) closeCancelModal() }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-danger">
                  <i className="bi bi-x-circle me-2"></i>Annuler le rendez-vous
                </h5>
                <button type="button" className="btn-close" onClick={closeCancelModal}></button>
              </div>
              <div className="modal-body pt-2">
                <p className="mb-2">Voulez-vous vraiment annuler ce rendez-vous ?</p>
                <div className="rounded p-3 mb-2" style={{ background: 'var(--vc-blue-pale)' }}>
                  <div className="small text-muted mb-1">Sportif</div>
                  <div className="fw-semibold">{rdvToCancel.sportif || 'N/A'}</div>
                  <div className="small text-muted mt-2 mb-1">Service</div>
                  <div className="fw-semibold">{rdvToCancel.service_nom}</div>
                  <div className="small text-muted mt-2 mb-1">Date</div>
                  <div className="fw-semibold">
                    {new Date(rdvToCancel.date_heure).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <p className="small text-muted mb-0">
                  <i className="bi bi-bell me-1"></i>Le sportif recevra une notification d'annulation.
                </p>
                {cancelErr && <div className="alert alert-danger py-2 small mt-3 mb-0"><i className="bi bi-x-circle me-1"></i>{cancelErr}</div>}
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-outline-secondary" onClick={closeCancelModal}>Fermer</button>
                <button type="button" className="btn btn-danger px-4" onClick={handleAdminCancel} disabled={cancelling}>
                  {cancelling ? <><span className="spinner-border spinner-border-sm me-2"></span>Annulation...</> : <><i className="bi bi-x-circle me-2"></i>Oui, annuler</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ajout service */}
      {showAdd && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.55)' }}
          ref={addSvcModalRef} onClick={e => { if (e.target === addSvcModalRef.current) closeAddSvcModal() }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header" style={{ background: 'var(--vc-blue)', color: '#fff' }}>
                <h5 className="modal-title fw-bold"><i className="bi bi-plus-circle me-2"></i>Ajouter un service</h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeAddSvcModal}></button>
              </div>
              <form onSubmit={handleCreateSvc}>
                <div className="modal-body">
                  {svcErrors.length > 0 && (
                    <div className="alert alert-danger py-2 small">
                      <ul className="mb-0 ps-3">{svcErrors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                    </div>
                  )}
                  {svcSuccess && <div className="alert alert-success py-2 small"><i className="bi bi-check-circle me-2"></i>{svcSuccess}</div>}
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold">Nom *</label>
                      <input type="text" className="form-control" value={svcForm.nom}
                        onChange={e => setSvcForm({ ...svcForm, nom: e.target.value })} required />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Description</label>
                      <textarea className="form-control" rows={3} value={svcForm.description}
                        onChange={e => setSvcForm({ ...svcForm, description: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Pôle *</label>
                      <select className="form-select" value={svcForm.pole}
                        onChange={e => setSvcForm({ ...svcForm, pole: e.target.value })} required>
                        <option value="">Sélectionner</option>
                        {Object.entries(POLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Catégorie</label>
                      <input type="text" className="form-control" value={svcForm.categorie}
                        onChange={e => setSvcForm({ ...svcForm, categorie: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Durée (min) *</label>
                      <div className="input-group">
                        <input type="number" className="form-control" value={svcForm.duree}
                          onChange={e => setSvcForm({ ...svcForm, duree: e.target.value })}
                          min="1" max="480" required />
                        <span className="input-group-text">min</span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Prix (€)</label>
                      <div className="input-group">
                        <input type="number" className="form-control" value={svcForm.prix}
                          onChange={e => setSvcForm({ ...svcForm, prix: e.target.value })}
                          min="0" step="0.01" />
                        <span className="input-group-text">€</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeAddSvcModal}>Annuler</button>
                  <button type="submit" className="btn btn-vitacare px-4" disabled={svcSaving}>
                    {svcSaving ? <><span className="spinner-border spinner-border-sm me-2"></span>Création...</> : <><i className="bi bi-check-circle me-2"></i>Créer</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Suppression service */}
      {svcToDelete && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.55)' }}
          ref={delSvcModalRef} onClick={e => { if (e.target === delSvcModalRef.current) closeDelSvcModal() }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-danger">
                  <i className="bi bi-exclamation-triangle me-2"></i>Supprimer le service
                </h5>
                <button type="button" className="btn-close" onClick={closeDelSvcModal}></button>
              </div>
              <div className="modal-body pt-2">
                <p>Voulez-vous supprimer <strong>« {svcToDelete.nom} »</strong> ?</p>
                <div className="rounded p-2 small" style={{ background: 'var(--vc-blue-pale)' }}>
                  <i className="bi bi-info-circle me-1" style={{ color: 'var(--vc-blue)' }}></i>
                  Bloqué s'il existe des RDV futurs confirmés pour ce service.
                </div>
                {svcDeleteErr && <div className="alert alert-danger py-2 small mt-3 mb-0"><i className="bi bi-x-circle me-1"></i>{svcDeleteErr}</div>}
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-outline-secondary" onClick={closeDelSvcModal}>Annuler</button>
                <button type="button" className="btn btn-danger px-4" onClick={handleDeleteSvc} disabled={svcDeleting}>
                  {svcDeleting ? <><span className="spinner-border spinner-border-sm me-2"></span>Suppression...</> : <><i className="bi bi-trash3 me-2"></i>Supprimer</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ajout séance */}
      {showAddAct && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.55)' }}
          ref={addActModalRef} onClick={e => { if (e.target === addActModalRef.current) closeAddActModal() }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header" style={{ background: 'var(--vc-blue)', color: '#fff' }}>
                <h5 className="modal-title fw-bold"><i className="bi bi-calendar-plus me-2"></i>Ajouter une séance</h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeAddActModal}></button>
              </div>
              <form onSubmit={handleCreateAct}>
                <div className="modal-body">
                  {actErrors.length > 0 && (
                    <div className="alert alert-danger py-2 small">
                      <ul className="mb-0 ps-3">{actErrors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                    </div>
                  )}
                  {actSuccess && <div className="alert alert-success py-2 small"><i className="bi bi-check-circle me-2"></i>{actSuccess}</div>}
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold">Nom de la séance *</label>
                      <input type="text" className="form-control" value={actForm.nom}
                        onChange={e => setActForm({ ...actForm, nom: e.target.value })}
                        placeholder="ex : Yoga de récupération" required />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Description</label>
                      <textarea className="form-control" rows={2} value={actForm.description}
                        onChange={e => setActForm({ ...actForm, description: e.target.value })}
                        placeholder="Décrivez la séance..." />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Pôle *</label>
                      <select className="form-select" value={actForm.pole}
                        onChange={e => setActForm({ ...actForm, pole: e.target.value })} required>
                        <option value="">Sélectionner un pôle</option>
                        {Object.entries(POLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Lieu</label>
                      <input type="text" className="form-control" value={actForm.lieu}
                        onChange={e => setActForm({ ...actForm, lieu: e.target.value })}
                        placeholder="ex : Salle A, Gymnase..." />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Date de début *</label>
                      <input type="datetime-local" className="form-control" value={actForm.date_debut}
                        onChange={e => setActForm({ ...actForm, date_debut: e.target.value })} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Date de fin *</label>
                      <input type="datetime-local" className="form-control" value={actForm.date_fin}
                        onChange={e => setActForm({ ...actForm, date_fin: e.target.value })} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Capacité maximale *</label>
                      <div className="input-group">
                        <input type="number" className="form-control" value={actForm.capacite_max}
                          onChange={e => setActForm({ ...actForm, capacite_max: e.target.value })}
                          min="1" max="500" placeholder="20" required />
                        <span className="input-group-text">personnes</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeAddActModal}>Annuler</button>
                  <button type="submit" className="btn btn-vitacare px-4" disabled={actSaving}>
                    {actSaving ? <><span className="spinner-border spinner-border-sm me-2"></span>Création...</> : <><i className="bi bi-check-circle me-2"></i>Créer la séance</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Suppression séance */}
      {actToDelete && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.55)' }}
          ref={delActModalRef} onClick={e => { if (e.target === delActModalRef.current) closeDelActModal() }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-danger">
                  <i className="bi bi-exclamation-triangle me-2"></i>Supprimer la séance
                </h5>
                <button type="button" className="btn-close" onClick={closeDelActModal}></button>
              </div>
              <div className="modal-body pt-2">
                <p>Voulez-vous supprimer <strong>« {actToDelete.nom} »</strong> ?</p>
                {actToDelete.inscrits > 0 && (
                  <div className="alert alert-warning py-2 small mb-3">
                    <i className="bi bi-people me-1"></i>
                    <strong>{actToDelete.inscrits} participant{actToDelete.inscrits > 1 ? 's' : ''}</strong> seront désinscrit{actToDelete.inscrits > 1 ? 's' : ''} et notifié{actToDelete.inscrits > 1 ? 's' : ''}.
                  </div>
                )}
                {actDeleteErr && <div className="alert alert-danger py-2 small mb-0"><i className="bi bi-x-circle me-1"></i>{actDeleteErr}</div>}
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-outline-secondary" onClick={closeDelActModal}>Annuler</button>
                <button type="button" className="btn btn-danger px-4" onClick={handleDeleteAct} disabled={actDeleting}>
                  {actDeleting ? <><span className="spinner-border spinner-border-sm me-2"></span>Suppression...</> : <><i className="bi bi-trash3 me-2"></i>Oui, supprimer</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Retrait participant */}
      {participantToRemove && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.55)' }}
          ref={removePartModalRef} onClick={e => { if (e.target === removePartModalRef.current) closeRemovePartModal() }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-danger">
                  <i className="bi bi-person-x me-2"></i>Retirer le participant
                </h5>
                <button type="button" className="btn-close" onClick={closeRemovePartModal}></button>
              </div>
              <div className="modal-body pt-2">
                <p className="mb-2">Voulez-vous retirer ce participant de la séance ?</p>
                <div className="rounded p-3 mb-2" style={{ background: 'var(--vc-blue-pale)' }}>
                  <div className="small text-muted mb-1">Participant</div>
                  <div className="fw-semibold">{participantToRemove.prenom} {participantToRemove.nom}</div>
                  <div className="small text-muted mt-2 mb-1">Séance</div>
                  <div className="fw-semibold">{participantToRemove.activite_nom}</div>
                </div>
                <p className="small text-muted mb-0">
                  <i className="bi bi-bell me-1"></i>Le sportif recevra une notification.
                </p>
                {removeErr && <div className="alert alert-danger py-2 small mt-3 mb-0"><i className="bi bi-x-circle me-1"></i>{removeErr}</div>}
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-outline-secondary" onClick={closeRemovePartModal}>Annuler</button>
                <button type="button" className="btn btn-danger px-4" onClick={handleRemoveParticipant} disabled={removing}>
                  {removing ? <><span className="spinner-border spinner-border-sm me-2"></span>Retrait...</> : <><i className="bi bi-person-x me-2"></i>Oui, retirer</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

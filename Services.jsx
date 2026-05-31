import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { servicesAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import PoleBadge, { POLES } from '../components/PoleBadge'
import Spinner from '../components/Spinner'

const FORM_EMPTY = { nom: '', description: '', duree: '', prix: '', pole: '', categorie: '' }

export default function Services() {
  const { isPraticien } = useAuth()
  const [searchParams]          = useSearchParams()
  const [services, setServices] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState(searchParams.get('search') || '')
  const [pole,   setPole]       = useState(searchParams.get('pole')   || '')
  const [sort,   setSort]       = useState('nom')
  const [dir,    setDir]        = useState('ASC')

  // — Ajout service —
  const [showAdd, setShowAdd]   = useState(false)
  const [form, setForm]         = useState(FORM_EMPTY)
  const [formErrors, setFormErrors] = useState([])
  const [saving, setSaving]     = useState(false)
  const [addSuccess, setAddSuccess] = useState('')

  // — Suppression service —
  const [toDelete, setToDelete] = useState(null)   // service à supprimer
  const [deleting, setDeleting] = useState(false)
  const [deleteErr, setDeleteErr] = useState('')

  const addModalRef = useRef(null)
  const delModalRef = useRef(null)

  const loadServices = () => {
    setLoading(true)
    servicesAPI.list({ search, pole, sort, dir })
      .then(r => setServices(r.data))
      .catch(() => setServices([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadServices() }, [search, pole, sort, dir])

  // Ouvre/ferme la modal d'ajout via Bootstrap JS
  const openAddModal = () => {
    setForm(FORM_EMPTY); setFormErrors([]); setAddSuccess(''); setShowAdd(true)
  }
  const closeAddModal = () => setShowAdd(false)

  // Ouvre la modal de confirmation de suppression
  const openDeleteModal = (service) => {
    setToDelete(service); setDeleteErr('')
  }
  const closeDeleteModal = () => { setToDelete(null); setDeleteErr('') }

  // Fermer au clic sur le backdrop
  const handleAddBackdrop  = (e) => { if (e.target === addModalRef.current) closeAddModal() }
  const handleDelBackdrop  = (e) => { if (e.target === delModalRef.current) closeDeleteModal() }

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormErrors([]); setAddSuccess('')

    const errs = []
    if (!form.nom.trim())          errs.push('Le nom est obligatoire.')
    if (!form.pole)                errs.push('Le pôle est obligatoire.')
    if (parseInt(form.duree) <= 0) errs.push('La durée doit être positive.')
    if (errs.length) { setFormErrors(errs); return }

    setSaving(true)
    try {
      await servicesAPI.create({
        nom:         form.nom.trim(),
        description: form.description.trim(),
        duree:       parseInt(form.duree),
        prix:        parseFloat(form.prix) || 0,
        pole:        form.pole,
        categorie:   form.categorie.trim(),
      })
      setAddSuccess('Service créé avec succès !')
      loadServices()
      setTimeout(closeAddModal, 1000)
    } catch (err) {
      const d = err.response?.data
      setFormErrors(d?.errors || [d?.error || 'Erreur lors de la création.'])
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    setDeleting(true); setDeleteErr('')
    try {
      await servicesAPI.delete(toDelete.id_service)
      closeDeleteModal()
      loadServices()
    } catch (err) {
      setDeleteErr(err.response?.data?.error || 'Erreur lors de la suppression.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="container py-4">
      {/* En-tête + bouton ajout */}
      <div className="d-flex justify-content-between align-items-start mb-1 flex-wrap gap-2">
        <div>
          <h1 className="fw-bold mb-0" style={{ color: 'var(--vc-blue)' }}>Pôles & Services</h1>
          <p className="text-muted mb-0">Explorez l'ensemble de nos prestations médicales sportives</p>
        </div>
        {isPraticien && (
          <button className="btn btn-vitacare" onClick={openAddModal}>
            <i className="bi bi-plus-circle me-2"></i>Ajouter un service
          </button>
        )}
      </div>

      {/* Filtres */}
      <div className="card-vitacare card p-3 mb-4 mt-3">
        <div className="row g-3 align-items-end">
          <div className="col-md-4">
            <label className="form-label fw-semibold small">Rechercher</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-search"></i></span>
              <input type="text" className="form-control" placeholder="Nom, description, praticien..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="col-md-3">
            <label className="form-label fw-semibold small">Pôle</label>
            <select className="form-select" value={pole} onChange={e => setPole(e.target.value)}>
              <option value="">Tous les pôles</option>
              {Object.entries(POLES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label fw-semibold small">Trier par</label>
            <select className="form-select" value={`${sort}_${dir}`} onChange={e => {
              const [s, d] = e.target.value.split('_')
              setSort(s); setDir(d)
            }}>
              <option value="nom_ASC">Nom A→Z</option>
              <option value="nom_DESC">Nom Z→A</option>
              <option value="prix_ASC">Prix croissant</option>
              <option value="prix_DESC">Prix décroissant</option>
              <option value="duree_ASC">Durée courte</option>
              <option value="duree_DESC">Durée longue</option>
            </select>
          </div>
          <div className="col-md-2">
            <button className="btn btn-vitacare-outline w-100"
              onClick={() => { setSearch(''); setPole(''); setSort('nom'); setDir('ASC') }}>
              <i className="bi bi-arrow-counterclockwise me-1"></i>Reset
            </button>
          </div>
        </div>
      </div>

      {/* Onglets pôles */}
      <ul className="nav nav-pills mb-4 flex-wrap gap-1">
        <li className="nav-item">
          <button
            className={`nav-link ${pole === '' ? 'active' : ''}`}
            style={pole === '' ? { background: 'var(--vc-blue)' } : { color: 'var(--vc-blue)', border: '1px solid var(--vc-blue)' }}
            onClick={() => setPole('')}>
            Tous
          </button>
        </li>
        {Object.entries(POLES).map(([k, v]) => (
          <li key={k} className="nav-item">
            <button
              className={`nav-link ${pole === k ? 'active' : ''} badge-${k}`}
              style={pole !== k ? { background: 'transparent', border: '1px solid' } : {}}
              onClick={() => setPole(k)}>
              <i className={`bi ${v.icon} me-1`}></i>{v.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Grille de services */}
      {loading ? <Spinner /> : (
        <>
          <p className="text-muted small mb-3">
            {services.length} service{services.length > 1 ? 's' : ''} trouvé{services.length > 1 ? 's' : ''}
          </p>
          {services.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-search fs-1 mb-3 d-block"></i>
              Aucun service ne correspond à vos critères.
            </div>
          ) : (
            <div className="row g-4">
              {services.map(s => (
                <div key={s.id_service ?? s.id} className="col-md-6 col-lg-4">
                  <div className="card-vitacare card h-100">
                    <div className="card-body p-4 d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <PoleBadge pole={s.pole} />
                        <span className="fw-bold" style={{ color: 'var(--vc-gold)' }}>
                          {s.prix ? `${s.prix} €` : 'Sur devis'}
                        </span>
                      </div>
                      <h5 className="card-title fw-bold mt-2 mb-1">{s.nom}</h5>
                      <p className="text-muted small flex-grow-1"
                        style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {s.description}
                      </p>
                      <div className="d-flex gap-3 text-muted small mt-2 mb-3">
                        <span><i className="bi bi-clock me-1"></i>{s.duree} min</span>
                        {s.praticien && <span><i className="bi bi-person me-1"></i>{s.praticien}</span>}
                      </div>

                      {/* Actions */}
                      <div className="d-flex gap-2 mt-auto">
                        <Link to={`/services/${s.id_service ?? s.id}`} className="btn btn-vitacare btn-sm flex-grow-1">
                          Voir les détails <i className="bi bi-arrow-right ms-1"></i>
                        </Link>
                        {isPraticien && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            title="Supprimer ce service"
                            onClick={() => openDeleteModal(s)}>
                            <i className="bi bi-trash3"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Modal Ajouter un service ──────────────────────────────── */}
      {showAdd && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }}
          ref={addModalRef} onClick={handleAddBackdrop}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header" style={{ background: 'var(--vc-blue)', color: '#fff' }}>
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-plus-circle me-2"></i>Ajouter un service
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeAddModal}></button>
              </div>

              <form onSubmit={handleCreate}>
                <div className="modal-body">
                  {formErrors.length > 0 && (
                    <div className="alert alert-danger py-2 small">
                      <ul className="mb-0 ps-3">
                        {formErrors.map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    </div>
                  )}
                  {addSuccess && (
                    <div className="alert alert-success py-2 small">
                      <i className="bi bi-check-circle me-2"></i>{addSuccess}
                    </div>
                  )}

                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold">Nom du service *</label>
                      <input type="text" name="nom" className="form-control"
                        value={form.nom} onChange={handleFormChange}
                        placeholder="ex : Kinésithérapie post-opératoire" required />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Description</label>
                      <textarea name="description" className="form-control" rows={3}
                        value={form.description} onChange={handleFormChange}
                        placeholder="Décrivez le service en détail..." />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Pôle *</label>
                      <select name="pole" className="form-select"
                        value={form.pole} onChange={handleFormChange} required>
                        <option value="">Sélectionner un pôle</option>
                        {Object.entries(POLES).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Catégorie</label>
                      <input type="text" name="categorie" className="form-control"
                        value={form.categorie} onChange={handleFormChange}
                        placeholder="ex : Kinésithérapie" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Durée (minutes) *</label>
                      <div className="input-group">
                        <input type="number" name="duree" className="form-control"
                          value={form.duree} onChange={handleFormChange}
                          min="1" max="480" placeholder="60" required />
                        <span className="input-group-text">min</span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Prix (€)</label>
                      <div className="input-group">
                        <input type="number" name="prix" className="form-control"
                          value={form.prix} onChange={handleFormChange}
                          min="0" step="0.01" placeholder="0.00" />
                        <span className="input-group-text">€</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeAddModal}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-vitacare px-4" disabled={saving}>
                    {saving
                      ? <><span className="spinner-border spinner-border-sm me-2"></span>Création...</>
                      : <><i className="bi bi-check-circle me-2"></i>Créer le service</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Confirmation suppression ───────────────────────── */}
      {toDelete && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }}
          ref={delModalRef} onClick={handleDelBackdrop}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-danger">
                  <i className="bi bi-exclamation-triangle me-2"></i>Confirmer la suppression
                </h5>
                <button type="button" className="btn-close" onClick={closeDeleteModal}></button>
              </div>

              <div className="modal-body pt-2">
                <p className="mb-1">Voulez-vous supprimer le service :</p>
                <p className="fw-bold mb-3">« {toDelete.nom} »</p>
                <div className="rounded p-2 small" style={{ background: 'var(--vc-blue-pale)' }}>
                  <i className="bi bi-info-circle me-1" style={{ color: 'var(--vc-blue)' }}></i>
                  La suppression sera bloquée s'il existe des rendez-vous futurs confirmés pour ce service.
                </div>
                {deleteErr && (
                  <div className="alert alert-danger py-2 small mt-3 mb-0">
                    <i className="bi bi-x-circle me-1"></i>{deleteErr}
                  </div>
                )}
              </div>

              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-outline-secondary" onClick={closeDeleteModal}>
                  Annuler
                </button>
                <button type="button" className="btn btn-danger px-4" onClick={handleDelete} disabled={deleting}>
                  {deleting
                    ? <><span className="spinner-border spinner-border-sm me-2"></span>Suppression...</>
                    : <><i className="bi bi-trash3 me-2"></i>Supprimer</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost/vitacare/backend/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ne pas faire de redirect ici : PrivateRoute dans App.jsx gère les redirections.
    // Un window.location.href sur 401 causerait une boucle infinie car AuthContext
    // appelle me.php à chaque montage, et me.php retourne 401 quand non connecté.
    return Promise.reject(error)
  }
)

export default api

// ── Helpers organisés par domaine ──────────────────────────────────────────

export const authAPI = {
  me:       ()  => api.get('/auth/me.php'),
  login:    (d) => api.post('/auth/login.php', d),
  logout:   ()  => api.post('/auth/logout.php'),
  register: (d) => api.post('/auth/register.php', d),
}

export const usersAPI = {
  update:  (d) => api.post('/users/update.php', d),
  list:    ()  => api.get('/users/list.php'),
  setRole: (d) => api.post('/admin/roles.php', d),
}

export const servicesAPI = {
  list:   (params) => api.get('/services/list.php', { params }),
  detail: (id)     => api.get('/services/detail.php', { params: { id } }),
  create: (d)      => api.post('/services/create.php', d),
  delete: (id)     => api.post('/services/delete.php', { id }),
}

export const reservationsAPI = {
  list:        ()  => api.get('/reservations/list.php'),
  create:      (d) => api.post('/reservations/create.php', d),
  update:      (d) => api.post('/reservations/update.php', d),
  cancel:      (d) => api.post('/reservations/cancel.php', d),
  validate:    (d) => api.post('/admin/rdv.php', { ...d, action: 'validate' }),
  refuse:      (d) => api.post('/admin/rdv.php', { ...d, action: 'refuse' }),
  adminCancel: (d) => api.post('/admin/rdv.php', { ...d, action: 'cancel' }),
}

export const panierAPI = {
  list:     () => api.get('/reservations/panier-list.php'),
  add:      (d) => api.post('/reservations/panier-add.php', d),
  checkout: () => api.post('/reservations/panier-checkout.php'),
}

export const activitiesAPI = {
  list:              (params) => api.get('/activities/list.php', { params }),
  detail:            (id)     => api.get('/activities/detail.php', { params: { id } }),
  register:          (d)      => api.post('/activities/register.php', d),
  unregister:        (d)      => api.post('/activities/unregister.php', d),
  participants:      (id)     => api.get('/activities/participants.php', { params: { id } }),
  manageParticipant: (d)      => api.post('/admin/participants.php', d),
  create:            (d)      => api.post('/activities/create.php', d),
  delete:            (id)     => api.post('/activities/delete.php', { id_activite: id }),
}

export const notificationsAPI = {
  list:     () => api.get('/notifications/index.php'),
  markRead: (d) => api.post('/notifications/index.php', d),
}

export const dashboardAPI = {
  stats:  () => api.get('/dashboard/index.php', { params: { action: 'stats' } }),
  recent: () => api.get('/dashboard/index.php', { params: { action: 'recent' } }),
}

export const creneauxAPI = {
  taken:  (id_service, date) => api.get('/creneaux/index.php', { params: { id_service, date } }),
  create: (d)                => api.post('/creneaux/index.php', d),
}

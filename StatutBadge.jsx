const STATUTS = {
  en_attente: { label: 'En attente', icon: 'bi-hourglass-split' },
  confirme:   { label: 'Confirmé',   icon: 'bi-check-circle-fill' },
  refuse:     { label: 'Refusé',     icon: 'bi-x-circle-fill' },
  annule:     { label: 'Annulé',     icon: 'bi-slash-circle' },
  termine:    { label: 'Terminé',    icon: 'bi-check-all' },
}

export default function StatutBadge({ statut }) {
  const s = STATUTS[statut] || { label: statut, icon: 'bi-circle' }
  return (
    <span className={`badge badge-statut-${statut} badge-pole`}>
      <i className={`bi ${s.icon} me-1`}></i>{s.label}
    </span>
  )
}

const POLES = {
  reeducation:  { label: 'Rééducation',   icon: 'bi-bandaid'         },
  preparation:  { label: 'Préparation',   icon: 'bi-lightning-charge' },
  recuperation: { label: 'Récupération',  icon: 'bi-snow2'            },
  mental:       { label: 'Mental',        icon: 'bi-brain'            },
  nutrition:    { label: 'Nutrition',     icon: 'bi-egg-fried'        },
}

export default function PoleBadge({ pole, showIcon = true }) {
  const p = POLES[pole] || { label: pole, icon: 'bi-circle' }
  return (
    <span className={`badge-pole badge-${pole}`}>
      {showIcon && <i className={`bi ${p.icon} me-1`}></i>}
      {p.label}
    </span>
  )
}

export { POLES }

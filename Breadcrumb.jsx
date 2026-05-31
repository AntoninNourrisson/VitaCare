import { Link } from 'react-router-dom'

export default function Breadcrumb({ items }) {
  return (
    <nav aria-label="fil d'ariane" className="mb-3">
      <ol className="breadcrumb">
        {items.map((item, i) => (
          <li key={i} className={`breadcrumb-item${i === items.length - 1 ? ' active' : ''}`}>
            {item.href && i < items.length - 1
              ? <Link to={item.href} style={{ color: 'var(--vc-blue)' }}>{item.label}</Link>
              : item.label
            }
          </li>
        ))}
      </ol>
    </nav>
  )
}

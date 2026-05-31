export default function Spinner({ fullscreen = false, text = 'Chargement...' }) {
  if (fullscreen) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border spinner-vitacare" role="status"></div>
          <p className="mt-2 text-muted">{text}</p>
        </div>
      </div>
    )
  }
  return (
    <div className="d-flex justify-content-center py-4">
      <div className="spinner-border spinner-vitacare" role="status">
        <span className="visually-hidden">{text}</span>
      </div>
    </div>
  )
}

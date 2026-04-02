import { Link } from '@tanstack/react-router'

export function PageAccessDenied() {
  return (
    <div className="py-8">
      <h1 className="text-xl font-semibold">Zugriff verweigert</h1>
      <p className="text-stone-600 mt-2">Sie haben keine Berechtigung, diesen Bereich zu nutzen.</p>
      <p className="mt-4">
        <Link to="/" className="text-blue-600 underline hover:text-blue-800">
          Zur Startseite
        </Link>
      </p>
    </div>
  )
}

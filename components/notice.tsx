export default function Notice({ ok, error }: { ok?: string; error?: string }) {
  if (error) {
    return <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
  }
  if (ok) {
    return <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{ok}</p>
  }
  return null
}
import LogoutButton from '@/components/logout-button'

export default function DeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-extrabold">Access denied</h1>
        <p className="text-sm text-slate-600">
          This account isn&apos;t authorized to use the admin area.
        </p>
        <LogoutButton />
      </div>
    </main>
  )
}
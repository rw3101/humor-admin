import LoginButton from './login-button'

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-extrabold tracking-tight">A New York Welcome</h1>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Admin</p>
        <p className="text-sm text-slate-600">Sign in with an authorized Google account.</p>
        <LoginButton />
      </div>
    </main>
  )
}
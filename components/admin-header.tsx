import LogoutButton from './logout-button'

const LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/users', label: 'Users' },
  { href: '/media', label: 'Media' },
  { href: '/votes', label: 'Votes' },
]

export default function AdminHeader({ current, email }: { current: string; email?: string }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-5">
          <span className="text-lg font-extrabold tracking-tight">🛠️ NY Welcome Admin</span>
          <nav className="flex gap-1">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  current === l.href ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {email && <span className="hidden text-sm text-slate-500 sm:inline">{email}</span>}
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}
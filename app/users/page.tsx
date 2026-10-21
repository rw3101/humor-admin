/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
import { requireAdmin } from '@/lib/admin'
import AdminHeader from '@/components/admin-header'

export const dynamic = 'force-dynamic'

const fmt = (d?: string | null) =>
  d
    ? new Date(d).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'America/New_York',
      })
    : '—'

export default async function UsersPage({ searchParams }: { searchParams: { q?: string } }) {
  const { supabase, user } = await requireAdmin()
  const q = (searchParams.q ?? '').trim()

  const { data, error } = await supabase.rpc('admin_list_profiles', { p_search: q || null })
  const rows = (data ?? []) as any[]

  return (
    <div className="min-h-screen">
      <AdminHeader current="/users" email={user.email} />

      <main className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Users</h1>
            <p className="text-slate-600">
              {rows.length} {rows.length === 1 ? 'profile' : 'profiles'}
              {q ? ` matching “${q}”` : ''} · read-only
            </p>
          </div>
          <form action="/users" method="get" className="flex items-center gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search name or email"
              className="w-60 rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm"
            />
            <button type="submit" className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500">
              Search
            </button>
            {q && (
              <a href="/users" className="text-sm underline">
                Clear
              </a>
            )}
          </form>
        </div>

        {error && <p className="text-red-600">Could not load users. {error.message}</p>}

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Last active</th>
                <th className="px-4 py-3 text-right">Streak</th>
                <th className="px-4 py-3 text-right">Photos</th>
                <th className="px-4 py-3 text-right">Points</th>
                <th className="px-4 py-3">Role</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const name = [r.first_name, r.last_name].filter(Boolean).join(' ')
                return (
                  <tr key={r.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {r.avatar_url ? (
                          <img src={r.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-slate-200" />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold">
                            {name || <span className="text-slate-400">Profile incomplete</span>}
                          </p>
                          <p className="truncate text-xs text-slate-500">{r.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{fmt(r.registered_at)}</td>
                    <td className="px-4 py-3 text-slate-600">{fmt(r.last_active_date)}</td>
                    <td className="px-4 py-3 text-right">🔥 {r.streak_count ?? 0}</td>
                    <td className="px-4 py-3 text-right">{r.photos}</td>
                    <td className="px-4 py-3 text-right font-semibold">{r.points}</td>
                    <td className="px-4 py-3">
                      {r.is_superadmin ? (
                        <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                          Superadmin
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">User</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 && !error && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
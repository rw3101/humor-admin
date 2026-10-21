/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
import { requireAdmin } from '@/lib/admin'
import { voiceInfo } from '@/lib/voices'
import AdminHeader from '@/components/admin-header'
import { Tile } from '@/components/charts'

export const dynamic = 'force-dynamic'

const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'up', label: '👍 Upvotes' },
    { key: 'down', label: '👎 Downvotes' },
]

export default async function VotesPage({
    searchParams,
}: {
    searchParams: { f?: string; q?: string }
}) {
    const { supabase, user } = await requireAdmin()
    const f = ['up', 'down'].includes(searchParams.f ?? '') ? (searchParams.f as string) : 'all'
    const q = (searchParams.q ?? '').trim()

    const [{ data, error }, { data: totals }] = await Promise.all([
        supabase.rpc('admin_list_votes', { p_filter: f, p_search: q || null }),
        supabase.rpc('admin_vote_totals'),
    ])
    const rows = (data ?? []) as any[]
    const t = (totals ?? { total: 0, up: 0, down: 0, voters: 0 }) as any
    const upShare = t.total ? Math.round((t.up / t.total) * 100) : 0

    const link = (key: string) => `/votes?f=${key}${q ? `&q=${encodeURIComponent(q)}` : ''}`

    return (
        <div className="min-h-screen">
            <AdminHeader current="/votes" email={user.email} />

            <main className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Votes</h1>
                    <p className="text-slate-600">Read-only log of every upvote and downvote, newest first (latest 300 shown).</p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Tile label="Total votes" value={t.total} sub={`from ${t.voters} voters`} />
                    <Tile label="Upvotes" value={t.up} />
                    <Tile label="Downvotes" value={t.down} />
                    <Tile label="Upvote share" value={`${upShare}%`} />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex gap-2">
                        {FILTERS.map((x) => (
                            <a
                                key={x.key}
                                href={link(x.key)}
                                className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${f === x.key ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white hover:bg-slate-100'
                                    }`}
                            >
                                {x.label}
                            </a>
                        ))}
                    </div>
                    <form className="flex gap-2" action="/votes">
                        <input type="hidden" name="f" value={f} />
                        <input
                            name="q"
                            defaultValue={q}
                            placeholder="Search caption or voter"
                            className="w-64 rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm"
                        />
                        <button className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white">Search</button>
                    </form>
                </div>

                {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error.message}</p>}

                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-4 py-3">When</th>
                                <th className="px-4 py-3">Voter</th>
                                <th className="px-4 py-3">Vote</th>
                                <th className="px-4 py-3">Caption</th>
                                <th className="px-4 py-3">Caption by</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.vote_id} className="border-b border-slate-100 last:border-0">
                                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                                        {new Date(r.voted_at).toLocaleString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            timeZone: 'America/New_York',
                                        })}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-semibold">{r.voter_name ?? 'Unknown'}</div>
                                        <div className="text-xs text-slate-500">{r.voter_email}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${r.vote_value > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                                }`}
                                        >
                                            {r.vote_value > 0 ? '👍 Up' : '👎 Down'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <img src={r.image_url} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                                            <span>
                                                <span className="mr-1 text-xs">{voiceInfo(r.caption_voice).emoji}</span>
                                                {r.caption_text}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{r.caption_author ?? 'Unknown'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {rows.length === 0 && !error && <p className="p-6 text-center text-slate-500">No votes match.</p>}
                </div>
            </main>
        </div>
    )
}
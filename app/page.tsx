/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
import { requireAdmin } from '@/lib/admin'
import { voiceInfo } from '@/lib/voices'
import AdminHeader from '@/components/admin-header'
import { Card, Tile, ColumnChart, HBars, HourStrip } from '@/components/charts'

export const dynamic = 'force-dynamic'

const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? ' AM' : ' PM'}`

export default async function Dashboard() {
  const { supabase, user } = await requireAdmin()

  const [{ data: stats, error }, { data: voiceRows }] = await Promise.all([
    supabase.rpc('admin_stats'),
    supabase.rpc('get_voice_stats'),
  ])

  if (error || !stats) {
    return (
      <div className="min-h-screen">
        <AdminHeader current="/" email={user.email} />
        <main className="mx-auto max-w-6xl p-6">
          <p className="text-red-600">Could not load stats. {error?.message}</p>
        </main>
      </div>
    )
  }

  const t = stats.totals
  const a = stats.activity
  const upShare = t.votes ? Math.round((t.upvotes / t.votes) * 100) : 0
  const dayLabel = (d: any) => String(d.day).slice(5).replace('-', '/')
  const hours: number[] = stats.uploads_by_hour.map((h: any) => h.count)
  const peakCount = Math.max(...hours)
  const peakHour = hours.indexOf(peakCount)

  return (
    <div className="min-h-screen">
      <AdminHeader current="/" email={user.email} />

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="text-slate-600">A live look at A New York Welcome.</p>
        </div>

        {/* headline numbers */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Tile label="Users" value={t.users} sub={`${t.profiles_complete} finished their profile`} />
          <Tile label="Photos" value={t.photos} />
          <Tile label="Captions" value={t.captions} sub={`avg score ${t.avg_caption_score}`} />
          <Tile label="Votes" value={t.votes} />
          <Tile label="Upvote share" value={`${upShare}%`} sub={`${t.upvotes} up · ${t.downvotes} down`} />
          <Tile label="Challenge entries" value={t.challenge_entries} />
        </div>

        {/* activity over time */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="📸 Uploads, last 14 days" subtitle="New York time">
            <ColumnChart data={stats.uploads_by_day.map((d: any) => ({ label: dayLabel(d), value: d.count }))} />
          </Card>
          <Card title="👋 New signups, last 14 days" subtitle="New York time">
            <ColumnChart data={stats.signups_by_day.map((d: any) => ({ label: dayLabel(d), value: d.count }))} />
          </Card>
        </div>

        {/* engagement + posting hours */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card title="🔥 Engagement" subtitle="Based on daily visits">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-extrabold">{a.active_today}</p>
                <p className="text-xs text-slate-500">active today</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold">{a.active_7d}</p>
                <p className="text-xs text-slate-500">active in 7 days</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold">{a.longest_streak}</p>
                <p className="text-xs text-slate-500">longest streak</p>
              </div>
            </div>
          </Card>
          <div className="lg:col-span-2">
            <Card
              title="🕒 When people post"
              subtitle={peakCount > 0 ? `Peak hour: ${hourLabel(peakHour)} (${peakCount} uploads) · New York time` : 'New York time'}
            >
              <HourStrip data={hours} />
            </Card>
          </div>
        </div>

        {/* voices + vote split */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="🎭 Voice win rates" subtitle="Share of photos where that voice's caption won">
            <HBars
              max={100}
              suffix="%"
              data={((voiceRows ?? []) as any[]).map((r) => {
                const v = voiceInfo(r.voice)
                return {
                  label: `${v.emoji} ${v.label}${v.retired ? ' (retired)' : ''}`,
                  value: Math.round(Number(r.win_rate ?? 0) * 100),
                  note: `${r.wins} wins / ${r.uploads} photos`,
                }
              })}
            />
          </Card>
          <Card title="👍 Vote split" subtitle="How generous are people?">
            <div className="flex h-8 overflow-hidden rounded-full bg-slate-100">
              <div className="bg-emerald-500" style={{ width: `${upShare}%` }} />
              <div className="bg-rose-500" style={{ width: `${t.votes ? 100 - upShare : 0}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="font-semibold text-emerald-700">▲ {t.upvotes} upvotes</span>
              <span className="font-semibold text-rose-700">▼ {t.downvotes} downvotes</span>
            </div>
            {stats.most_divisive && (
              <div className="mt-5 rounded-xl border border-slate-200 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">⚖️ Most divisive caption</p>
                <p className="mt-1 text-sm font-medium">“{stats.most_divisive.text}”</p>
                <p className="text-xs text-slate-500">
                  {stats.most_divisive.vote_count} votes, net score {stats.most_divisive.score}
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* where + which models */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card title="📍 Where photos are taken">
            <HBars data={stats.boroughs.map((b: any) => ({ label: b.borough, value: b.count }))} />
          </Card>
          <Card title="🏙️ Top neighborhoods">
            <HBars data={stats.neighborhoods.map((n: any) => ({ label: n.name, value: n.count }))} />
          </Card>
          <Card title="🤖 Gemini models used" subtitle="Shows when fallback models kicked in">
            <HBars data={stats.models.map((m: any) => ({ label: m.model, value: m.count }))} />
          </Card>
        </div>

        {/* leaders + top captions */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="🏅 Top contributors" subtitle="By total caption points">
            {stats.top_users.length === 0 ? (
              <p className="text-sm text-slate-500">No data yet.</p>
            ) : (
              <ol className="flex flex-col gap-2">
                {stats.top_users.map((u: any, i: number) => (
                  <li key={i} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                    <span className="font-semibold">
                      {['🥇', '🥈', '🥉'][i] ?? `#${i + 1}`} {u.name}
                    </span>
                    <span className="text-slate-600">
                      {u.points} pts · {u.photos} {u.photos === 1 ? 'photo' : 'photos'}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Card>
          <Card title="🏆 Top captions of all time">
            {stats.top_captions.length === 0 ? (
              <p className="text-sm text-slate-500">No data yet.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {stats.top_captions.map((c: any, i: number) => (
                  <li key={i} className="flex items-center gap-3">
                    <img src={c.image_url} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">“{c.text}”</p>
                      <p className="text-xs text-slate-500">
                        ▲ {c.score}
                        {c.voice ? ` · ${voiceInfo(c.voice).emoji} ${voiceInfo(c.voice).label}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* challenges */}
        <Card title="🎯 Weekly challenges" subtitle="Recent themes and how many people entered">
          {stats.challenges.length === 0 ? (
            <p className="text-sm text-slate-500">No challenges yet.</p>
          ) : (
            <HBars data={stats.challenges.map((c: any) => ({ label: `${String(c.week_start).slice(5).replace('-', '/')} · ${c.theme}`, value: c.entries, note: c.entries === 1 ? 'entry' : 'entries' }))} />
          )}
        </Card>
      </main>
    </div>
  )
}
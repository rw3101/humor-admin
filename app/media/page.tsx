/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
import { requireAdmin } from '@/lib/admin'
import { voiceInfo } from '@/lib/voices'
import AdminHeader from '@/components/admin-header'
import ConfirmButton from '@/components/confirm-button'
import Notice from '@/components/notice'
import { deleteImage } from './actions'

export const dynamic = 'force-dynamic'

export default async function MediaPage({
  searchParams,
}: {
  searchParams: { ok?: string; error?: string }
}) {
  const { supabase, user } = await requireAdmin()

  const [{ data: images, error }, { data: people }] = await Promise.all([
    supabase
      .from('images')
      .select('id, user_id, image_url, created_at, borough, neighborhood, challenge_week, captions(id, text, score, voice)')
      .order('created_at', { ascending: false })
      .limit(60),
    supabase.rpc('admin_list_profiles', { p_search: null }),
  ])

  const names = new Map<string, string>(
    ((people ?? []) as any[]).map((p) => [p.id, [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email])
  )
  const list = (images ?? []) as any[]

  return (
    <div className="min-h-screen">
      <AdminHeader current="/media" email={user.email} />

      <main className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Media</h1>
            <p className="text-slate-600">
              {list.length} most recent {list.length === 1 ? 'photo' : 'photos'} with their AI captions
            </p>
          </div>
          <a href="/media/new" className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
            + New photo
          </a>
        </div>

        <Notice ok={searchParams.ok} error={searchParams.error ?? error?.message} />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((img) => {
            const caps = [...img.captions].sort((a: any, b: any) => b.score - a.score)
            return (
              <article key={img.id} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <img src={img.image_url} alt="" className="aspect-[4/3] w-full object-cover" />
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold">{names.get(img.user_id) ?? 'Unknown user'}</span>
                    <span className="text-slate-500">
                      {new Date(img.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        timeZone: 'America/New_York',
                      })}
                    </span>
                    {img.neighborhood && (
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 font-semibold text-sky-800">📍 {img.neighborhood}</span>
                    )}
                    {img.challenge_week && (
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 font-semibold text-orange-800">🎯 Challenge</span>
                    )}
                  </div>

                  <ul className="flex flex-col gap-2">
                    {caps.map((c: any) => (
                      <li key={c.id} className="flex items-start justify-between gap-3 text-sm">
                        <span>
                          <span className="mr-1 text-xs text-slate-500">{voiceInfo(c.voice).emoji}</span>
                          {c.text}
                        </span>
                        <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold">{c.score}</span>
                      </li>
                    ))}
                  </ul>

                  <form className="mt-auto flex gap-2 pt-1">
                    <input type="hidden" name="image_id" value={img.id} />
                    <a
                      href={`/media/${img.id}`}
                      className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold hover:bg-slate-100"
                    >
                      Edit
                    </a>
                    <ConfirmButton
                      action={deleteImage}
                      message="Delete this photo with all of its captions and votes? This cannot be undone."
                      className="rounded-full border border-red-200 px-4 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </ConfirmButton>
                  </form>
                </div>
              </article>
            )
          })}
        </div>
        {list.length === 0 && !error && <p className="text-center text-slate-500">No photos yet.</p>}
      </main>
    </div>
  )
}
/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import { voiceInfo, ALL_VOICE_KEYS } from '@/lib/voices'
import { LOCATIONS } from '@/lib/options'
import AdminHeader from '@/components/admin-header'
import ConfirmButton from '@/components/confirm-button'
import Notice from '@/components/notice'
import { updateMedia, deleteCaption, deleteImage } from '../actions'

export const dynamic = 'force-dynamic'

export default async function EditMediaPage({
    params,
    searchParams,
}: {
    params: { id: string }
    searchParams: { ok?: string; error?: string }
}) {
    const { supabase, user } = await requireAdmin()

    const { data: image } = await supabase
        .from('images')
        .select('id, image_url, created_at, borough, neighborhood, challenge_week, captions(id, text, score, vote_count, voice, model, created_at)')
        .eq('id', params.id)
        .maybeSingle()
    if (!image) notFound()

    const caps = [...(image.captions as any[])].sort((a, b) => b.score - a.score)
    const field = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm'

    return (
        <div className="min-h-screen">
            <AdminHeader current="/media" email={user.email} />

            <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-8">
                <a href="/media" className="text-sm underline">← Back to media</a>
                <h1 className="text-3xl font-extrabold tracking-tight">Edit photo</h1>
                <Notice ok={searchParams.ok} error={searchParams.error} />

                <form action={updateMedia} className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <input type="hidden" name="image_id" value={image.id} />

                    <img src={image.image_url} alt="" className="max-h-96 w-full rounded-xl bg-slate-100 object-contain" />
                    {image.challenge_week && (
                        <p className="text-xs font-semibold text-orange-700">🎯 Challenge entry for the week of {String(image.challenge_week)}</p>
                    )}

                    <div>
                        <label className="mb-1 block text-sm font-semibold">Location</label>
                        <select name="neighborhood" defaultValue={image.neighborhood ?? ''} className={field}>
                            <option value="">No location</option>
                            {Object.entries(LOCATIONS).map(([borough, hoods]) => (
                                <optgroup key={borough} label={borough}>
                                    {hoods.map((h) => (
                                        <option key={h} value={h}>{h}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-4">
                        <p className="text-sm font-semibold">Captions</p>
                        {caps.map((c) => (
                            <div key={c.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3">
                                <input type="hidden" name="caption_id" value={c.id} />
                                <select name={`voice_${c.id}`} defaultValue={c.voice} className={field}>
                                    {ALL_VOICE_KEYS.map((key) => {
                                        const v = voiceInfo(key)
                                        return (
                                            <option key={key} value={key}>
                                                {v.emoji} {v.label}
                                                {v.retired ? ' (retired)' : ''}
                                            </option>
                                        )
                                    })}
                                </select>
                                <textarea name={`text_${c.id}`} defaultValue={c.text} rows={2} maxLength={280} className={field} />
                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                                    <span>
                                        Score {c.score} · {c.vote_count} {c.vote_count === 1 ? 'vote' : 'votes'} · model {c.model}
                                    </span>
                                    <ConfirmButton
                                        action={deleteCaption.bind(null, image.id, c.id)}
                                        message="Delete this caption and its votes?"
                                        className="rounded-full border border-red-200 px-3 py-1 font-semibold text-red-700 hover:bg-red-50"
                                    >
                                        Delete caption
                                    </ConfirmButton>
                                </div>
                            </div>
                        ))}
                        {caps.length === 0 && <p className="text-sm text-slate-500">This photo has no captions.</p>}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <button type="submit" className="rounded-full bg-indigo-600 px-6 py-2.5 font-semibold text-white hover:bg-indigo-500">
                            Save changes
                        </button>
                        <ConfirmButton
                            action={deleteImage}
                            message="Delete this photo with all of its captions and votes? This cannot be undone."
                            className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                        >
                            Delete photo
                        </ConfirmButton>
                    </div>
                </form>
            </main>
        </div>
    )
}
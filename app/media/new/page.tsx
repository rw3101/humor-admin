import { requireAdmin } from '@/lib/admin'
import { ACTIVE_VOICES } from '@/lib/voices'
import { LOCATIONS } from '@/lib/options'
import AdminHeader from '@/components/admin-header'
import Notice from '@/components/notice'
import { createMedia, createMediaWithAI } from '../actions'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export default async function NewMediaPage({ searchParams }: { searchParams: { error?: string } }) {
    const { user } = await requireAdmin()
    const field = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm'

    return (
        <div className="min-h-screen">
            <AdminHeader current="/media" email={user.email} />

            <main className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-8">
                <a href="/media" className="text-sm underline">← Back to media</a>
                <h1 className="text-3xl font-extrabold tracking-tight">New photo</h1>
                <Notice error={searchParams.error} />

                <form action={createMedia} className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div>
                        <label className="mb-1 block text-sm font-semibold">Photo (JPEG, PNG or WebP, up to 4MB)</label>
                        <input type="file" name="file" accept="image/jpeg,image/png,image/webp" required />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-semibold">Location (optional)</label>
                        <select name="neighborhood" defaultValue="" className={field}>
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
                        <p className="text-sm font-semibold">Captions (at least one)</p>
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3">
                                <select name={`voice_${i}`} defaultValue={ACTIVE_VOICES[i]?.key} className={field}>
                                    {ACTIVE_VOICES.map((v) => (
                                        <option key={v.key} value={v.key}>{v.emoji} {v.label}</option>
                                    ))}
                                </select>
                                <textarea name={`text_${i}`} rows={2} maxLength={280} placeholder={`Caption ${i + 1}`} className={field} />
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            type="submit"
                            formAction={createMediaWithAI}
                            className="rounded-full bg-indigo-600 px-6 py-2.5 font-semibold text-white hover:bg-indigo-500"
                        >
                            ✨ Generate captions with AI
                        </button>
                        <button
                            type="submit"
                            className="rounded-full border border-slate-300 px-6 py-2.5 font-semibold hover:bg-slate-100"
                        >
                            Create with my captions
                        </button>
                    </div>
                    <p className="text-xs text-slate-500">
                        AI mode ignores the text boxes and writes one caption for each of the three voices above (pick three different ones).
                        Manual mode saves what you typed.
                    </p>
                </form>
            </main>
        </div>
    )
}
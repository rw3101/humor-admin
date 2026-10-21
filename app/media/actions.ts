'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import { ALL_VOICE_KEYS } from '@/lib/voices'
import { findNeighborhood } from '@/lib/options'
import { ACTIVE_VOICES } from '@/lib/voices'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 4 * 1024 * 1024
const MAX_CAPTION = 280

function fail(path: string, message: string): never {
    redirect(`${path}${path.includes('?') ? '&' : '?'}error=${encodeURIComponent(message)}`)
}

function readPlace(formData: FormData, back: string) {
    const raw = String(formData.get('neighborhood') ?? '').trim()
    if (!raw) return null
    const place = findNeighborhood(raw)
    if (!place) fail(back, 'Unknown location.')
    return place
}

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

function readFile(formData: FormData, back: string): File {
    const file = formData.get('file')
    if (!(file instanceof File) || file.size === 0) fail(back, 'Choose a photo.')
    if (!ALLOWED_TYPES.includes(file.type)) fail(back, 'Use a JPEG, PNG or WebP image.')
    if (file.size > MAX_BYTES) fail(back, 'Image must be under 4MB.')
    return file
}

// Uploads the file, inserts the image row, then its captions. Rolls back on failure.
async function saveNewMedia(opts: {
    supabase: any // eslint-disable-line @typescript-eslint/no-explicit-any
    userId: string
    file: File
    place: { borough: string; neighborhood: string } | null
    captions: { text: string; voice: string }[]
    model: string
    prompt: string
    back: string
}) {
    const { supabase, userId, file, place, captions, model, prompt, back } = opts

    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const path = `${userId}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('photos').upload(path, file, { contentType: file.type })
    if (uploadError) fail(back, `Upload failed: ${uploadError.message}`)
    const { data: pub } = supabase.storage.from('photos').getPublicUrl(path)

    const { data: image, error: imageError } = await supabase
        .from('images')
        .insert({
            user_id: userId,
            image_url: pub.publicUrl,
            borough: place?.borough ?? null,
            neighborhood: place?.neighborhood ?? null,
        })
        .select('id')
        .single()
    if (imageError || !image) {
        await supabase.storage.from('photos').remove([path])
        fail(back, `Could not save the photo: ${imageError?.message}`)
    }

    const { error: captionError } = await supabase.from('captions').insert(
        captions.map((c) => ({ image_id: image.id, user_id: userId, text: c.text, prompt, model, voice: c.voice }))
    )
    if (captionError) {
        await supabase.from('images').delete().eq('id', image.id)
        await supabase.storage.from('photos').remove([path])
        fail(back, `Could not save the captions: ${captionError.message}`)
    }

    revalidatePath('/media')
    redirect('/media?ok=Photo created.')
}

// CREATE (manual): a new photo with captions typed by the admin
export async function createMedia(formData: FormData) {
    const { supabase, user } = await requireAdmin()
    const back = '/media/new'

    const file = readFile(formData, back)
    const place = readPlace(formData, back)

    const captions = [0, 1, 2]
        .map((i) => ({
            text: String(formData.get(`text_${i}`) ?? '').trim(),
            voice: String(formData.get(`voice_${i}`) ?? ''),
        }))
        .filter((c) => c.text)
    if (captions.length === 0) fail(back, 'Add at least one caption, or use "Generate with AI".')
    if (captions.some((c) => c.text.length > MAX_CAPTION)) fail(back, `Captions must be ${MAX_CAPTION} characters or less.`)
    if (captions.some((c) => !ALL_VOICE_KEYS.includes(c.voice))) fail(back, 'Pick a voice for every caption.')

    await saveNewMedia({
        supabase, userId: user.id, file, place, captions,
        model: 'admin', prompt: 'Added manually in the admin area', back,
    })
}

const FALLBACK_MODELS = [GEMINI_MODEL, 'gemini-2.5-flash-lite']

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Tries each model, retrying briefly when Gemini is overloaded (503) or hiccups (500/504).
async function callGemini(apiKey: string, prompt: string, mime: string, data: string) {
    let lastStatus = 0
    for (const model of FALLBACK_MODELS) {
        for (let attempt = 0; attempt < 3; attempt++) {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mime, data } }] }],
                        generationConfig: { responseMimeType: 'application/json' },
                    }),
                }
            )
            if (res.ok) return { json: await res.json(), model }
            lastStatus = res.status
            if (res.status === 429) return { json: null, model, status: 429 } // quota: retrying won't help
            if (![500, 503, 504].includes(res.status)) break // other errors: try next model
            await sleep(1500 * (attempt + 1))
        }
    }
    return { json: null, model: GEMINI_MODEL, status: lastStatus }
}

// CREATE (AI): upload a photo and have Gemini write one caption per chosen voice
export async function createMediaWithAI(formData: FormData) {
    const { supabase, user } = await requireAdmin()
    const back = '/media/new'

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) fail(back, 'GEMINI_API_KEY is not set for this app.')

    const file = readFile(formData, back)
    const place = readPlace(formData, back)

    const voiceKeys = [0, 1, 2].map((i) => String(formData.get(`voice_${i}`) ?? ''))
    if (new Set(voiceKeys).size !== 3) fail(back, 'Pick three different voices for AI captions.')
    const voices = voiceKeys.map((k) => ACTIVE_VOICES.find((v) => v.key === k))
    if (voices.some((v) => !v)) fail(back, 'Pick three current voices.')

    const where = place ? ` taken in ${place.neighborhood}, ${place.borough}, New York City` : ' taken in New York City'
    const prompt =
        `Look at this photo${where}. Write exactly 3 short, funny captions for it, one for each voice below, ` +
        `in this order. Each caption must be under 200 characters, in the style of its voice, and about what is actually in the photo.\n` +
        voices.map((v, i) => `${i + 1}. ${v!.label}`).join('\n') +
        `\nReturn only a JSON array of 3 strings.`

    const bytes = Buffer.from(await file.arrayBuffer()).toString('base64')
    let texts: string[]
    let usedModel = GEMINI_MODEL
    try {
        const result = await callGemini(apiKey, prompt, file.type, bytes)
        usedModel = result.model
        if (!result.json) {
            fail(
                back,
                result.status === 429
                    ? 'Gemini daily limit reached, try again later.'
                    : `Gemini is busy right now (error ${result.status}). Try again in a minute.`
            )
        }
        const raw = result.json?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed) || parsed.length !== 3 || parsed.some((t) => typeof t !== 'string' || !t.trim())) {
            throw new Error('bad shape')
        }
        texts = parsed.map((t: string) => t.trim().slice(0, MAX_CAPTION))
    } catch (e) {
        // fail() redirects by throwing; let that through
        if (e instanceof Error && 'digest' in e) throw e
        fail(back, 'Gemini did not return usable captions. Try again.')
    }
    await saveNewMedia({
        supabase, userId: user.id, file, place,
        captions: texts.map((text, i) => ({ text, voice: voiceKeys[i] })),
        model: usedModel, prompt, back,
    })
}

// UPDATE: location on the photo, and text/voice on its captions
export async function updateMedia(formData: FormData) {
    const { supabase } = await requireAdmin()
    const imageId = String(formData.get('image_id') ?? '')
    const back = `/media/${imageId}`
    if (!imageId) fail('/media', 'Missing photo.')

    const place = readPlace(formData, back)
    const { data: imgRows, error: imgError } = await supabase
        .from('images')
        .update({ borough: place?.borough ?? null, neighborhood: place?.neighborhood ?? null })
        .eq('id', imageId)
        .select('id')
    if (imgError) fail(back, imgError.message)
    if (!imgRows?.length) fail(back, 'Photo not found or not allowed.')

    for (const id of formData.getAll('caption_id').map(String)) {
        const text = String(formData.get(`text_${id}`) ?? '').trim()
        const voice = String(formData.get(`voice_${id}`) ?? '')
        if (!text || text.length > MAX_CAPTION) fail(back, `Captions must be 1 to ${MAX_CAPTION} characters.`)
        if (!ALL_VOICE_KEYS.includes(voice)) fail(back, 'Unknown voice.')

        const { data: rows, error } = await supabase
            .from('captions')
            .update({ text, voice })
            .eq('id', id)
            .eq('image_id', imageId)
            .select('id')
        if (error) fail(back, error.message)
        if (!rows?.length) fail(back, 'A caption was not found or not allowed.')
    }

    revalidatePath('/media')
    revalidatePath(back)
    redirect(`${back}?ok=Changes saved.`)
}

// DELETE one caption (its votes go with it)
export async function deleteCaption(imageId: string, captionId: string) {
    const { supabase } = await requireAdmin()
    const back = `/media/${imageId}`

    const { data: rows, error } = await supabase
        .from('captions')
        .delete()
        .eq('id', captionId)
        .eq('image_id', imageId)
        .select('id')
    if (error) fail(back, error.message)
    if (!rows?.length) fail(back, 'Caption not found or not allowed.')

    revalidatePath('/media')
    revalidatePath(back)
    redirect(`${back}?ok=Caption deleted.`)
}

// DELETE a photo (captions and votes cascade) and its file in storage
export async function deleteImage(formData: FormData) {
    const { supabase } = await requireAdmin()
    const imageId = String(formData.get('image_id') ?? '')
    if (!imageId) fail('/media', 'Missing photo.')

    const { data: img } = await supabase.from('images').select('image_url').eq('id', imageId).single()

    const { data: rows, error } = await supabase.from('images').delete().eq('id', imageId).select('id')
    if (error) fail('/media', error.message)
    if (!rows?.length) fail('/media', 'Photo not found or not allowed.')

    const marker = '/object/public/photos/'
    const url: string = img?.image_url ?? ''
    const at = url.indexOf(marker)
    if (at !== -1) {
        const path = decodeURIComponent(url.slice(at + marker.length))
        const { data: removed, error: removeError } = await supabase.storage.from('photos').remove([path])
        if (removeError || !removed?.length) {
            revalidatePath('/media')
            redirect('/media?error=' + encodeURIComponent('Photo deleted, but its file could not be removed from storage.'))
        }
    }

    revalidatePath('/media')
    redirect('/media?ok=Photo deleted.')
}
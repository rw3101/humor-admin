'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type Match = { id: string; name: string; email: string; photos: number }

export default function VoterPicker({ f, q }: { f: string; q: string }) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const term = text.trim()

  useEffect(() => {
    if (term.length < 2) {
      setMatches([])
      return
    }
    let cancelled = false
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/voters?q=${encodeURIComponent(term)}`)
        const json = res.ok ? await res.json() : []
        if (!cancelled) setMatches(json)
      } catch {
        if (!cancelled) setMatches([])
      }
      if (!cancelled) setLoading(false)
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [term])

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  function pick(m: Match) {
    const p = new URLSearchParams()
    if (f && f !== 'all') p.set('f', f)
    if (q) p.set('q', q)
    p.set('voter', m.id)
    setOpen(false)
    setText('')
    router.push(`/votes?${p.toString()}`)
  }

  return (
    <div ref={box} className="relative">
      <input
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder="Filter by voter (name or email)"
        className="w-72 rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm"
      />
      {open && term.length >= 2 && (
        <div className="absolute left-0 z-20 mt-2 w-96 max-w-[90vw] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {loading && matches.length === 0 && <p className="px-4 py-3 text-sm text-slate-500">Searching…</p>}
          {!loading && matches.length === 0 && <p className="px-4 py-3 text-sm text-slate-500">No matching profiles.</p>}
          {matches.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => pick(m)}
              className="flex w-full flex-col items-start border-b border-slate-100 px-4 py-2.5 text-left last:border-0 hover:bg-indigo-50"
            >
              <span className="text-sm font-semibold">
                {m.name || <span className="text-slate-400">Profile incomplete</span>}
              </span>
              <span className="text-xs text-slate-500">
                {m.email} · {m.photos} {m.photos === 1 ? 'photo' : 'photos'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
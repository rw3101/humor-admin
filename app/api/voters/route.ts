/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

export async function GET(req: Request) {
  const { supabase } = await requireAdmin()
  const q = (new URL(req.url).searchParams.get('q') ?? '').trim()
  if (q.length < 2) return NextResponse.json([])

  const { data } = await supabase.rpc('admin_list_profiles', { p_search: q })
  const matches = ((data ?? []) as any[]).slice(0, 8).map((p) => ({
    id: p.id,
    name: [p.first_name, p.last_name].filter(Boolean).join(' '),
    email: p.email,
    photos: p.photos ?? 0,
  }))
  return NextResponse.json(matches)
}
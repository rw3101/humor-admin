'use client'

import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <button
      onClick={signOut}
      className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-semibold hover:bg-slate-100"
    >
      Log out
    </button>
  )
}
'use client'

import { createClient } from '@/lib/supabase/client'

export default function LoginButton() {
  async function signIn() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <button
      onClick={signIn}
      className="rounded-full bg-slate-900 px-6 py-2.5 font-semibold text-white hover:bg-slate-700"
    >
      Sign in with Google
    </button>
  )
}
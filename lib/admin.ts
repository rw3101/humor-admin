import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Use at the top of every admin page and server action.
export async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: isAdmin } = await supabase.rpc('is_superadmin')
  if (isAdmin !== true) redirect('/denied')

  return { supabase, user }
}
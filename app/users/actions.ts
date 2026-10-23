'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'

export async function setSuperadmin(userId: string, makeAdmin: boolean) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase.rpc('admin_set_superadmin', {
    p_user_id: userId,
    p_make_admin: makeAdmin,
  })
  if (error) redirect(`/users?error=${encodeURIComponent(error.message)}`)

  revalidatePath('/users')
  redirect(`/users?ok=${encodeURIComponent(makeAdmin ? 'Admin access granted.' : 'Admin access removed.')}`)
}
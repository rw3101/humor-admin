import { requireAdmin } from '@/lib/admin'
import LogoutButton from '@/components/logout-button'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const { user } = await requireAdmin()

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-8">
      <h1 className="text-2xl font-extrabold">Admin dashboard</h1>
      <p className="text-slate-600">Signed in as {user.email}. Dashboard coming next.</p>
      <div>
        <LogoutButton />
      </div>
    </main>
  )
}
import ConfirmButton from '@/components/confirm-button'
import { setSuperadmin } from '@/app/users/actions'

export default function RoleControl({
  userId,
  name,
  isSuperadmin,
  isSelf,
}: {
  userId: string
  name: string
  isSuperadmin: boolean
  isSelf: boolean
}) {
  return (
    <form className="flex items-center gap-2">
      <span
        className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${
          isSuperadmin ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600'
        }`}
      >
        {isSuperadmin ? 'Admin' : 'User'}
      </span>
      {isSelf ? (
        <span className="text-xs text-slate-400">You</span>
      ) : (
        <ConfirmButton
          action={setSuperadmin.bind(null, userId, !isSuperadmin)}
          message={
            isSuperadmin
              ? `Remove admin access from ${name}?`
              : `Give ${name} full admin access? They will be able to view all users and votes and edit or delete media.`
          }
          className="whitespace-nowrap rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold hover:bg-slate-100"
        >
          {isSuperadmin ? 'Remove admin' : 'Make admin'}
        </ConfirmButton>
      )}
    </form>
  )
}
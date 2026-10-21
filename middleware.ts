import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // not logged in: only the login page and the OAuth callback are reachable
  if (!user) {
    if (path === '/login' || path.startsWith('/auth')) return response
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // the OAuth callback has to run for the session to be created
  if (path.startsWith('/auth')) return response

  // logged in but not a superadmin: only the "denied" page
  const { data: isAdmin } = await supabase.rpc('is_superadmin')
  if (isAdmin !== true) {
    if (path === '/denied') return response
    return NextResponse.redirect(new URL('/denied', request.url))
  }

  // superadmins don't need the login or denied pages
  if (path === '/login' || path === '/denied') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
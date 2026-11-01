import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { SUPABASE_KEY, SUPABASE_URL, supabaseConfigurado } from './config'

const PUBLICAS = ['/entrar', '/auth', '/configurar']

export async function atualizarSessao(request: NextRequest) {
  const caminho = request.nextUrl.pathname
  if (!supabaseConfigurado()) {
    if (caminho.startsWith('/configurar')) return NextResponse.next()
    return NextResponse.redirect(new URL('/configurar', request.url))
  }

  let resposta = NextResponse.next({ request })
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(lista) {
        lista.forEach(({ name, value }) => request.cookies.set(name, value))
        resposta = NextResponse.next({ request })
        lista.forEach(({ name, value, options }) => resposta.cookies.set(name, value, options))
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const publica = PUBLICAS.some((p) => caminho.startsWith(p))
  if (!user && !publica) {
    const url = request.nextUrl.clone()
    url.pathname = '/entrar'
    url.search = ''
    return NextResponse.redirect(url)
  }
  if (user && caminho === '/entrar') {
    const url = request.nextUrl.clone()
    url.pathname = '/hoje'
    url.search = ''
    return NextResponse.redirect(url)
  }
  return resposta
}

import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { criarClienteServidor } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const tokenHash = url.searchParams.get('token_hash')
  const tipo = url.searchParams.get('type') as EmailOtpType | null
  const proximo = url.searchParams.get('next') ?? '/hoje'
  const destino = proximo.startsWith('/') && !proximo.startsWith('//') ? proximo : '/hoje'
  const supabase = await criarClienteServidor()

  let ok = false
  if (code) ok = !(await supabase.auth.exchangeCodeForSession(code)).error
  else if (tokenHash && tipo) ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo })).error

  return NextResponse.redirect(new URL(ok ? destino : '/entrar?erro=link', url.origin))
}

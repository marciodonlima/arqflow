'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { criarClienteServidor } from '@/lib/supabase/server'

export type EstadoForm = { erro?: string; ok?: string; email?: string; nome?: string } | undefined

function traduzir(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'E-mail ou senha não conferem.'
  if (m.includes('not confirmed')) return 'Falta confirmar o e-mail: abra o link que enviamos para a sua caixa de entrada.'
  if (m.includes('already registered') || m.includes('already been registered')) return 'Já existe uma conta com este e-mail. Use "Entrar".'
  if (m.includes('password') && (m.includes('6') || m.includes('short') || m.includes('weak'))) return 'A senha precisa ter pelo menos 6 caracteres.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Muitas tentativas seguidas. Espere um minuto e tente de novo.'
  if (m.includes('invalid email') || m.includes('email address')) return 'Confira o e-mail digitado.'
  return 'Não deu certo agora. Tente de novo em instantes.'
}

async function origem() {
  const h = await headers()
  const o = h.get('origin')
  if (o) return o
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? 'https'
  return `${proto}://${host}`
}

async function gravarAparencia(estilo: string, esquema: string) {
  const c = await cookies()
  const opt = { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' as const }
  c.set('af_estilo', estilo, opt)
  c.set('af_esquema', esquema, opt)
}

export async function entrar(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const email = String(fd.get('email') ?? '').trim()
  const senha = String(fd.get('senha') ?? '')
  if (!email || !senha) return { erro: 'Preencha e-mail e senha.', email }
  const supabase = await criarClienteServidor()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
  if (error) return { erro: traduzir(error.message), email }
  const { data: perfil } = await supabase.from('perfis').select('estilo, esquema').eq('id', data.user.id).maybeSingle()
  if (perfil) await gravarAparencia(perfil.estilo, perfil.esquema)
  redirect('/hoje')
}

export async function criarConta(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const nome = String(fd.get('nome') ?? '').trim()
  const email = String(fd.get('email') ?? '').trim()
  const senha = String(fd.get('senha') ?? '')
  if (!nome || !email || !senha) return { erro: 'Preencha nome, e-mail e senha.', nome, email }
  if (senha.length < 6) return { erro: 'A senha precisa ter pelo menos 6 caracteres.', nome, email }
  const supabase = await criarClienteServidor()
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { nome }, emailRedirectTo: `${await origem()}/auth/callback?next=/hoje` },
  })
  if (error) return { erro: traduzir(error.message), nome, email }
  if (data.session) redirect('/hoje')
  return { ok: `Enviamos um link de confirmação para ${email}. Abra o e-mail para ativar a conta.` }
}

export async function recuperarSenha(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const email = String(fd.get('email') ?? '').trim()
  if (!email) return { erro: 'Digite o seu e-mail.' }
  const supabase = await criarClienteServidor()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await origem()}/auth/callback?next=/nova-senha`,
  })
  if (error) return { erro: traduzir(error.message) }
  return { ok: `Se houver uma conta para ${email}, um link para criar nova senha chega em instantes.` }
}

export async function novaSenha(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const senha = String(fd.get('senha') ?? '')
  if (senha.length < 6) return { erro: 'A senha precisa ter pelo menos 6 caracteres.' }
  const supabase = await criarClienteServidor()
  const { error } = await supabase.auth.updateUser({ password: senha })
  if (error) return { erro: traduzir(error.message) }
  redirect('/hoje')
}

export async function sair() {
  const supabase = await criarClienteServidor()
  await supabase.auth.signOut()
  redirect('/entrar')
}

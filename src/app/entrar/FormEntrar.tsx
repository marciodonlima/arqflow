'use client'

import { useActionState, useState } from 'react'
import { criarConta, entrar, recuperarSenha, type EstadoForm } from '@/acoes/auth'

type Modo = 'entrar' | 'criar' | 'recuperar'

export function FormEntrar() {
  const [modo, setModo] = useState<Modo>('entrar')
  const [estadoE, acaoE, carregandoE] = useActionState<EstadoForm, FormData>(entrar, undefined)
  const [estadoC, acaoC, carregandoC] = useActionState<EstadoForm, FormData>(criarConta, undefined)
  const [estadoR, acaoR, carregandoR] = useActionState<EstadoForm, FormData>(recuperarSenha, undefined)

  if (modo === 'criar')
    return (
      <form action={acaoC} className="pilha">
        <h1 className="titulo-secao">Criar conta</h1>
        <label className="campo">
          <span>Seu nome</span>
          <input name="nome" autoComplete="name" required defaultValue={estadoC?.nome} />
        </label>
        <label className="campo">
          <span>E-mail</span>
          <input name="email" type="email" autoComplete="email" required defaultValue={estadoC?.email} />
        </label>
        <label className="campo">
          <span>Senha</span>
          <input name="senha" type="password" autoComplete="new-password" minLength={6} required />
          <small>Pelo menos 6 caracteres.</small>
        </label>
        {estadoC?.erro && <p className="erro" role="alert">{estadoC.erro}</p>}
        {estadoC?.ok && <p className="aviso" role="status">{estadoC.ok}</p>}
        <button className="btn btn-largo" disabled={carregandoC}>{carregandoC ? 'Criando…' : 'Criar conta'}</button>
        <p className="apoio">
          Já tem conta?{' '}
          <button type="button" className="btn-texto" onClick={() => setModo('entrar')}>Entrar</button>
        </p>
      </form>
    )

  if (modo === 'recuperar')
    return (
      <form action={acaoR} className="pilha">
        <h1 className="titulo-secao">Criar nova senha</h1>
        <p className="apoio">Enviamos um link para o seu e-mail. Ao abrir, você escolhe a nova senha.</p>
        <label className="campo">
          <span>E-mail</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>
        {estadoR?.erro && <p className="erro" role="alert">{estadoR.erro}</p>}
        {estadoR?.ok && <p className="aviso" role="status">{estadoR.ok}</p>}
        <button className="btn btn-largo" disabled={carregandoR}>{carregandoR ? 'Enviando…' : 'Enviar link'}</button>
        <p className="apoio">
          <button type="button" className="btn-texto" onClick={() => setModo('entrar')}>Voltar para entrar</button>
        </p>
      </form>
    )

  return (
    <form action={acaoE} className="pilha">
      <h1 className="titulo-secao">Entrar</h1>
      <label className="campo">
        <span>E-mail</span>
        <input name="email" type="email" autoComplete="email" required defaultValue={estadoE?.email} />
      </label>
      <label className="campo">
        <span>Senha</span>
        <input name="senha" type="password" autoComplete="current-password" required />
      </label>
      {estadoE?.erro && <p className="erro" role="alert">{estadoE.erro}</p>}
      <button className="btn btn-largo" disabled={carregandoE}>{carregandoE ? 'Entrando…' : 'Entrar'}</button>
      <div className="botoes" style={{ justifyContent: 'space-between' }}>
        <button type="button" className="btn-texto" onClick={() => setModo('criar')}>Criar conta</button>
        <button type="button" className="btn-texto" style={{ color: 'var(--af-tert)' }} onClick={() => setModo('recuperar')}>Esqueci a senha</button>
      </div>
    </form>
  )
}

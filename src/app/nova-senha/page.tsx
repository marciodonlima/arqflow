'use client'

import { useActionState } from 'react'
import { novaSenha, type EstadoForm } from '@/acoes/auth'

export default function NovaSenha() {
  const [estado, acao, carregando] = useActionState<EstadoForm, FormData>(novaSenha, undefined)
  return (
    <main className="entrar">
      <div className="entrar-form">
        <p className="marca" style={{ paddingLeft: 0 }}>ARQFLOW</p>
        <form action={acao} className="pilha">
          <h1 className="titulo-secao">Escolha a nova senha</h1>
          <label className="campo">
            <span>Nova senha</span>
            <input name="senha" type="password" autoComplete="new-password" minLength={6} required />
          </label>
          {estado?.erro && <p className="erro" role="alert">{estado.erro}</p>}
          <button className="btn btn-largo" disabled={carregando}>{carregando ? 'Salvando…' : 'Salvar e entrar'}</button>
        </form>
      </div>
    </main>
  )
}

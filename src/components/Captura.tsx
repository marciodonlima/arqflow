'use client'

import { createContext, useContext, useEffect, useRef, useState, useTransition } from 'react'
import { capturar } from '@/acoes/dia'
import { ORIGENS } from '@/lib/biblioteca'
import { Icone } from './Icone'

type Ctx = { abrir: () => void }
const Contexto = createContext<Ctx>({ abrir: () => {} })

export function CapturaProvider({ projetos, children }: { projetos: { id: string; nome: string }[]; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  const form = useRef<HTMLFormElement>(null)
  const [aviso, setAviso] = useState('')
  const [salvando, iniciar] = useTransition()

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(''), 2600)
    return () => clearTimeout(t)
  }, [aviso])

  // Atalho: tecla C abre a captura (fora de campos de texto)
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement
      if (e.key.toLowerCase() === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey && !/input|textarea|select/i.test(alvo.tagName) && !alvo.isContentEditable) {
        e.preventDefault()
        ref.current?.showModal()
      }
    }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [])

  function enviar(fd: FormData) {
    iniciar(async () => {
      const r = await capturar(fd)
      if (r.ok) {
        form.current?.reset()
        ref.current?.close()
        setAviso('Guardado na caixa de captura.')
      } else setAviso('Escreva alguma coisa antes de guardar.')
    })
  }

  return (
    <Contexto.Provider value={{ abrir: () => ref.current?.showModal() }}>
      {children}
      <dialog ref={ref} className="dialogo" aria-labelledby="captura-titulo" onClick={(e) => e.target === ref.current && ref.current?.close()}>
        <form ref={form} action={enviar} className="dialogo-corpo">
          <div className="dialogo-topo">
            <div className="pilha" style={{ gap: 4 }}>
              <h2 id="captura-titulo" className="titulo-secao">Tirar da cabeça</h2>
              <p className="apoio">Anote e siga em frente. Você revisa a caixa no check-out.</p>
            </div>
            <button type="button" className="fechar" aria-label="Fechar" onClick={() => ref.current?.close()}>
              <Icone nome="fechar" />
            </button>
          </div>
          <label className="campo">
            <span className="sr">O que está na sua cabeça?</span>
            <textarea name="texto" placeholder="Ligar para o marceneiro sobre o painel da sala…" autoFocus required rows={3} />
          </label>
          <fieldset className="campo">
            <legend>De onde veio</legend>
            <div className="opcoes" style={{ marginTop: 6 }}>
              {ORIGENS.map((o, i) => (
                <label key={o.chave} className="opcao">
                  <input type="radio" name="origem" value={o.chave} defaultChecked={i === 0} />
                  <span>{o.nome}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {projetos.length > 0 && (
            <label className="campo">
              <span>Projeto (opcional)</span>
              <select name="projeto_id" defaultValue="">
                <option value="">Sem projeto</option>
                {projetos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </label>
          )}
          <button className="btn btn-largo" disabled={salvando}>{salvando ? 'Guardando…' : 'Guardar'}</button>
        </form>
      </dialog>
      {aviso && <div className="toast" role="status">{aviso}</div>}
    </Contexto.Provider>
  )
}

export function BotaoCapturar({ largo = false }: { largo?: boolean }) {
  const { abrir } = useContext(Contexto)
  if (largo)
    return (
      <button type="button" className="capturar-largo" onClick={abrir}>
        <Icone nome="mais" />
        <span>Capturar</span>
      </button>
    )
  return (
    <button type="button" className="capturar" onClick={abrir} aria-label="Capturar">
      <Icone nome="mais" />
    </button>
  )
}

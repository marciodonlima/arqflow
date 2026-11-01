'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { adiarParaAmanha, excluirTarefa, marcarStatus, salvarTarefa } from '@/acoes/tarefas'
import { FASES, MODELO_POR_CHAVE, MODOS_TAREFA, chaveBase, nomeFase } from '@/lib/biblioteca'
import { horas } from '@/lib/formato'
import type { Tarefa } from '@/lib/tipos'
import { Icone } from './Icone'

export function PainelTarefa({
  tarefa,
  projetoNome,
  projetoId,
  aoFechar,
}: {
  tarefa: Tarefa | null
  projetoNome?: string
  projetoId?: string
  aoFechar: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const [pendente, iniciar] = useTransition()
  const [confirmarExclusao, setConfirmar] = useState(false)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (tarefa && !d.open) d.showModal()
    if (!tarefa && d.open) d.close()
    setConfirmar(false)
  }, [tarefa])

  const modelo = tarefa ? MODELO_POR_CHAVE[chaveBase(tarefa.chave)] : undefined
  const feita = tarefa?.status === 'feita'

  function executar(fn: () => Promise<unknown>, fechar = true) {
    iniciar(async () => {
      await fn()
      if (fechar) aoFechar()
    })
  }

  return (
    <dialog ref={ref} className="dialogo lado" aria-labelledby="painel-titulo" onClose={aoFechar} onClick={(e) => e.target === ref.current && aoFechar()}>
      {tarefa && (
        <form key={tarefa.id} className="dialogo-corpo" action={(fd) => executar(() => salvarTarefa(tarefa.id, fd))}>
          <div className="dialogo-topo">
            <div className="pilha" style={{ gap: 4 }}>
              <span className="rotulo rotulo-acento">
                {nomeFase(tarefa.fase)}
                {projetoNome ? ` · ${projetoNome}` : ''}
              </span>
              <h2 id="painel-titulo" className="sr">Detalhes da tarefa</h2>
            </div>
            <button type="button" className="fechar" aria-label="Fechar" onClick={aoFechar}>
              <Icone nome="fechar" />
            </button>
          </div>

          <label className="campo">
            <span>Tarefa</span>
            <input name="titulo" defaultValue={tarefa.titulo} required />
          </label>

          {modelo?.porque && (
            <div className="porque">
              <span className="rotulo rotulo-acento">Por que importa</span>
              <p className="apoio">{modelo.porque}</p>
              {modelo.como && (
                <ol>
                  {modelo.como.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ol>
              )}
              {modelo.pagina && projetoId && (
                <a className="btn-texto" href={`/projetos/${projetoId}/${modelo.pagina}`}>
                  Abrir {modelo.pagina === 'briefing' ? 'o roteiro do briefing' : 'o programa de necessidades'} →
                </a>
              )}
            </div>
          )}

          <div className="grade-2">
            <label className="campo">
              <span>Horas estimadas</span>
              <input name="horas_estimadas" inputMode="decimal" defaultValue={String(tarefa.horas_estimadas).replace('.', ',')} />
            </label>
            <label className="campo">
              <span>Horas gastas</span>
              <input name="horas_reais" inputMode="decimal" placeholder="—" defaultValue={tarefa.horas_reais == null ? '' : String(tarefa.horas_reais).replace('.', ',')} />
            </label>
            <label className="campo">
              <span>Data prevista</span>
              <input name="data_prevista" type="date" defaultValue={tarefa.data_prevista ?? ''} />
            </label>
            <label className="campo">
              <span>Tipo de esforço</span>
              <select name="modo" defaultValue={tarefa.modo}>
                {Object.entries(MODOS_TAREFA).map(([k, v]) => (
                  <option key={k} value={k}>{v.nome}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="campo">
            <span>Fase</span>
            <select name="fase" defaultValue={tarefa.fase}>
              {FASES.map((f) => (
                <option key={f.chave} value={f.chave}>{f.nome}</option>
              ))}
            </select>
          </label>

          <label className="campo">
            <span>Arquivo no Drive</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <input name="link" className="entrada" placeholder="Cole o link do arquivo" defaultValue={tarefa.link ?? ''} />
              {tarefa.link && (
                <a className="btn btn-sec" href={tarefa.link} target="_blank" rel="noreferrer" aria-label="Abrir arquivo">
                  <Icone nome="link" />
                </a>
              )}
            </div>
          </label>

          {tarefa.tipo === 'exploracao' && (
            <label className="campo">
              <span>O que você descobriu</span>
              <textarea name="registro" defaultValue={tarefa.registro} placeholder="Uma tarefa de exploração fecha com um registro curto do que ficou claro." />
            </label>
          )}

          <label className="campo">
            <span>Anotações</span>
            <textarea name="notas" defaultValue={tarefa.notas} />
          </label>

          <p className="meta">
            {MODOS_TAREFA[tarefa.modo].nome} · {tarefa.tipo === 'exploracao' ? 'exploração' : 'execução'} · {horas(tarefa.horas_estimadas)} estimadas
          </p>

          <div className="botoes">
            <button className="btn" disabled={pendente}>Salvar</button>
            {!feita && tarefa.status !== 'fazendo' && (
              <button type="button" className="btn btn-sec" disabled={pendente} onClick={() => executar(() => marcarStatus(tarefa.id, 'fazendo'))}>
                Começar
              </button>
            )}
            <button type="button" className="btn btn-sec" disabled={pendente} onClick={() => executar(() => marcarStatus(tarefa.id, feita ? 'a_fazer' : 'feita'))}>
              {feita ? 'Reabrir' : 'Concluir'}
            </button>
          </div>
          <div className="botoes" style={{ justifyContent: 'space-between' }}>
            {!feita ? (
              <button type="button" className="btn-texto" disabled={pendente} onClick={() => executar(() => adiarParaAmanha(tarefa.id))}>
                Passar para amanhã
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              className="btn-texto"
              style={{ color: 'var(--af-tert)' }}
              disabled={pendente}
              onClick={() => (confirmarExclusao ? executar(() => excluirTarefa(tarefa.id)) : setConfirmar(true))}
            >
              {confirmarExclusao ? 'Confirmar exclusão' : 'Excluir tarefa'}
            </button>
          </div>
        </form>
      )}
    </dialog>
  )
}

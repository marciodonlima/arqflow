'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { adiarParaAmanha, excluirTarefa, marcarStatus, salvarChecklist, salvarTarefa } from '@/acoes/tarefas'
import { FASES, MODELO_POR_CHAVE, MODOS_TAREFA, chaveBase, nomeFase } from '@/lib/biblioteca'
import { horas } from '@/lib/formato'
import type { ItemChecklist, Tarefa } from '@/lib/tipos'
import { BotaoCronometro } from './Cronometro'
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
  const [itens, setItens] = useState<ItemChecklist[]>([])
  const [novoItem, setNovoItem] = useState('')

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (tarefa && !d.open) d.showModal()
    if (!tarefa && d.open) d.close()
    setConfirmar(false)
    setItens(tarefa?.checklist ?? [])
    setNovoItem('')
  }, [tarefa])

  const modelo = tarefa ? MODELO_POR_CHAVE[chaveBase(tarefa.chave)] : undefined
  const feita = tarefa?.status === 'feita'
  const rodando = !!tarefa?.timer_inicio

  function executar(fn: () => Promise<unknown>, fechar = true) {
    iniciar(async () => {
      await fn()
      if (fechar) aoFechar()
    })
  }

  function mudarChecklist(novos: ItemChecklist[]) {
    setItens(novos)
    if (tarefa) iniciar(() => salvarChecklist(tarefa.id, novos))
  }

  const feitosCheck = itens.filter((i) => i.feito).length

  return (
    <dialog ref={ref} className="dialogo lado" aria-labelledby="painel-titulo" onClose={aoFechar} onClick={(e) => e.target === ref.current && aoFechar()}>
      {tarefa && (
        <form key={tarefa.id} className="dialogo-corpo" action={(fd) => executar(() => salvarTarefa(tarefa.id, fd))}>
          <div className="dialogo-topo">
            <span className="rotulo rotulo-acento">
              {nomeFase(tarefa.fase)}
              {projetoNome ? ` · ${projetoNome}` : ''}
            </span>
            <button type="button" className="fechar" aria-label="Fechar" onClick={aoFechar}>
              <Icone nome="fechar" />
            </button>
          </div>
          <h2 id="painel-titulo" className="sr">Detalhes da tarefa</h2>

          <label className="campo">
            <span className="sr">Tarefa</span>
            <input name="titulo" className="titulo-editavel" defaultValue={tarefa.titulo} required />
          </label>

          {!feita && (
            <div className="painel-cronometro">
              <BotaoCronometro tarefaId={tarefa.id} rodando={rodando} inicio={tarefa.timer_inicio} grande />
              <p className="meta">
                {horas(tarefa.horas_reais ?? 0)} cronometradas de {horas(tarefa.horas_estimadas)} estimadas
                {tarefa.horas_reais && tarefa.horas_reais > tarefa.horas_estimadas ? ' · passou do estimado' : ''}
              </p>
            </div>
          )}

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

          <div className="campo">
            <span>
              Checklist{itens.length > 0 ? ` · ${feitosCheck} de ${itens.length}` : ''}
            </span>
            <div className="checklist">
              {itens.map((i) => (
                <div key={i.id} className={`checklist-item${i.feito ? ' feito' : ''}`}>
                  <button
                    type="button"
                    className="marcador"
                    aria-pressed={i.feito}
                    aria-label={i.feito ? `Desmarcar ${i.texto}` : `Marcar ${i.texto}`}
                    onClick={() => mudarChecklist(itens.map((x) => (x.id === i.id ? { ...x, feito: !x.feito } : x)))}
                  >
                    {i.feito && <Icone nome="check" />}
                  </button>
                  <span>{i.texto}</span>
                  <button type="button" className="fechar" aria-label={`Remover ${i.texto}`} onClick={() => mudarChecklist(itens.filter((x) => x.id !== i.id))}>
                    <Icone nome="fechar" />
                  </button>
                </div>
              ))}
              <div className="checklist-novo">
                <input
                  className="entrada"
                  value={novoItem}
                  placeholder="Adicionar item"
                  onChange={(e) => setNovoItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (novoItem.trim()) {
                        mudarChecklist([...itens, { id: `${Date.now()}`, texto: novoItem.trim(), feito: false }])
                        setNovoItem('')
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grade-2">
            <label className="campo">
              <span>Horas estimadas</span>
              <input name="horas_estimadas" inputMode="decimal" defaultValue={String(tarefa.horas_estimadas).replace('.', ',')} />
            </label>
            <label className="campo">
              <span>Horas gastas</span>
              <input name="horas_reais" inputMode="decimal" placeholder="—" defaultValue={tarefa.horas_reais == null ? '' : String(Math.round(tarefa.horas_reais * 100) / 100).replace('.', ',')} />
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

          <div className="botoes painel-rodape">
            <button className="btn" disabled={pendente}>Salvar</button>
            <button type="button" className="btn btn-sec" disabled={pendente} onClick={() => executar(() => marcarStatus(tarefa.id, feita ? 'a_fazer' : 'feita'))}>
              <Icone nome="check" />
              {feita ? 'Reabrir' : 'Concluir'}
            </button>
            {!feita && (
              <button type="button" className="btn-texto" disabled={pendente} onClick={() => executar(() => adiarParaAmanha(tarefa.id))}>
                Passar para amanhã
              </button>
            )}
            <button
              type="button"
              className="btn-texto"
              style={{ color: 'var(--af-tert)', marginLeft: 'auto' }}
              disabled={pendente}
              onClick={() => (confirmarExclusao ? executar(() => excluirTarefa(tarefa.id)) : setConfirmar(true))}
            >
              {confirmarExclusao ? 'Confirmar exclusão' : 'Excluir'}
            </button>
          </div>
        </form>
      )}
    </dialog>
  )
}

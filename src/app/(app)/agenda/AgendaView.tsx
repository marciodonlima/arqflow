'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Cabecalho } from '@/components/Cabecalho'
import { Check, useConcluir } from '@/components/Check'
import { Icone } from '@/components/Icone'
import { PainelTarefa } from '@/components/PainelTarefa'
import { estiloCor } from '@/lib/cores'
import { dataLonga, diaDoMes, nomeMes, somarMeses } from '@/lib/datas'
import { horas, horasTotais } from '@/lib/formato'
import type { StatusSaude } from '@/lib/saude'
import type { Tarefa } from '@/lib/tipos'

type P = { id: string; nome: string; cor: string | null; entrega: string | null; status: StatusSaude }
const SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export function AgendaView({ mes, hoje, semanas, tarefas, projetos }: { mes: string; hoje: string; semanas: string[][]; tarefas: Tarefa[]; projetos: P[] }) {
  const [abertaId, setAbertaId] = useState<string | null>(null)
  const [diaSel, setDiaSel] = useState<string>(hoje.slice(0, 7) === mes.slice(0, 7) ? hoje : mes)
  const aberta = tarefas.find((t) => t.id === abertaId) ?? null
  const proj = (id: string) => projetos.find((p) => p.id === id)
  const doDia = (d: string) => tarefas.filter((t) => t.data_prevista === d).sort((a, b) => a.ordem - b.ordem)
  const entregasDo = (d: string) => projetos.filter((p) => p.entrega === d)
  const anterior = somarMeses(mes, -1).slice(0, 7)
  const proximo = somarMeses(mes, 1).slice(0, 7)

  return (
    <>
      <Cabecalho
        titulo="Agenda"
        subtitulo="Tarefas e entregas de todos os projetos, nas datas do cronograma."
        acoes={
          <div className="botoes">
            <Link href={`/agenda?m=${anterior}`} className="btn btn-sec btn-pequeno" aria-label="Mês anterior">‹</Link>
            <span className="mes-atual">{nomeMes(mes)}</span>
            <Link href={`/agenda?m=${proximo}`} className="btn btn-sec btn-pequeno" aria-label="Próximo mês">›</Link>
            <Link href="/agenda" className="btn btn-sec btn-pequeno">Hoje</Link>
          </div>
        }
      />
      <div className="legenda">
        {projetos.map((p) => (
          <span key={p.id} className="cor-projeto legenda-item" style={estiloCor(p.cor)}>
            <i className="marcador-cor" aria-hidden="true" /> {p.nome}
          </span>
        ))}
      </div>
      <div className="calendario" role="grid" aria-label={nomeMes(mes)}>
        {SEMANA.map((d) => (
          <div key={d} className="cal-cabeca" role="columnheader">{d}</div>
        ))}
        {semanas.flat().map((d) => {
          const lista = doDia(d)
          const fora = d.slice(0, 7) !== mes.slice(0, 7)
          const total = lista.filter((t) => t.status !== 'feita').reduce((s, t) => s + t.horas_estimadas, 0)
          return (
            <div
              key={d}
              role="gridcell"
              className={`cal-dia${fora ? ' fora' : ''}${d === hoje ? ' hoje' : ''}${d === diaSel ? ' sel' : ''}`}
              onClick={() => setDiaSel(d)}
            >
              <div className="cal-dia-topo">
                <span className="cal-num">{diaDoMes(d)}</span>
                {total > 0 && <span className="meta numero">{horasTotais(total)}</span>}
              </div>
              {entregasDo(d).map((p) => (
                <span key={p.id} className="cal-entrega cor-projeto" style={estiloCor(p.cor)}>
                  <Icone nome="documento" /> Entrega {p.nome}
                </span>
              ))}
              {lista.slice(0, 4).map((t) => {
                const p = proj(t.projeto_id)
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`cal-tarefa cor-projeto${t.status === 'feita' ? ' feita' : ''}${t.status !== 'feita' && d < hoje ? ' atrasada' : ''}`}
                    style={estiloCor(p?.cor)}
                    onClick={(e) => {
                      e.stopPropagation()
                      setAbertaId(t.id)
                    }}
                    title={`${t.titulo} · ${p?.nome}`}
                  >
                    {t.titulo}
                  </button>
                )
              })}
              {lista.length > 4 && <span className="meta">+{lista.length - 4}</span>}
            </div>
          )
        })}
      </div>

      <section className="pilha agenda-dia" style={{ gap: 'var(--space-2)' }}>
        <div className="secao-topo">
          <span className="rotulo">{dataLonga(diaSel)}</span>
          <span className="meta numero">{horasTotais(doDia(diaSel).reduce((s, t) => s + t.horas_estimadas, 0))}</span>
        </div>
        {entregasDo(diaSel).map((p) => (
          <p key={p.id} className="aviso cor-projeto" style={estiloCor(p.cor)}>
            <Icone nome="documento" /> Entrega de {p.nome}
          </p>
        ))}
        {doDia(diaSel).length === 0 ? (
          <p className="apoio">Nada previsto neste dia.</p>
        ) : (
          <div className="tarefas">
            {doDia(diaSel).map((t) => (
              <ItemAgenda key={t.id} tarefa={t} projeto={proj(t.projeto_id)} aoAbrir={() => setAbertaId(t.id)} />
            ))}
          </div>
        )}
      </section>

      <PainelTarefa tarefa={aberta} projetoNome={aberta ? proj(aberta.projeto_id)?.nome : undefined} projetoId={aberta?.projeto_id} aoFechar={() => setAbertaId(null)} />
    </>
  )
}

function ItemAgenda({ tarefa, projeto, aoAbrir }: { tarefa: Tarefa; projeto?: P; aoAbrir: () => void }) {
  const { feita, alternar } = useConcluir(tarefa.id, tarefa.status === 'feita')
  return (
    <div className={`tarefa cor-projeto${feita ? ' feita' : ''}`} style={estiloCor(projeto?.cor)}>
      <Check feita={feita} aoAlternar={alternar} titulo={tarefa.titulo} />
      <button type="button" className="tarefa-abrir" onClick={aoAbrir}>
        <span className="tarefa-principal">
          <span className="tarefa-titulo">{tarefa.titulo}</span>
          <span className="tarefa-meta">
            <i className="marcador-cor" aria-hidden="true" />
            {projeto?.nome}
          </span>
        </span>
        <span className="tarefa-est">{horas(tarefa.horas_estimadas)}</span>
      </button>
    </div>
  )
}

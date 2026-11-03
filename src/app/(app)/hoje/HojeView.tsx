'use client'

import Link from 'next/link'
import { useOptimistic, useState, useTransition } from 'react'
import { escolherModo } from '@/acoes/dia'
import { pararCronometro } from '@/acoes/tarefas'
import { BotaoCronometro } from '@/components/Cronometro'
import { Icone, type NomeIcone } from '@/components/Icone'
import { LinhaTarefa } from '@/components/LinhaTarefa'
import { PainelTarefa } from '@/components/PainelTarefa'
import { SeloSaude } from '@/components/Saude'
import { MODOS_DIA, MODOS_TAREFA, nomeFase } from '@/lib/biblioteca'
import { estiloCor } from '@/lib/cores'
import { dataCurta, diaDaSemana, diaDoMes, mesLongo, quando } from '@/lib/datas'
import { horas, horasTotais, primeiroNome, reais } from '@/lib/formato'
import { fraseDoModo } from '@/lib/prioridade'
import type { StatusSaude } from '@/lib/saude'
import type { ModoDia, Tarefa } from '@/lib/tipos'

export type ItemHoje = { tarefa: Tarefa; projeto: string; projetoId: string; cor: string | null; motivo: string; combina: boolean; proposta: boolean }
type Alerta = { id: string; nome: string; cor: string | null; status: StatusSaude; manchete: string; motivos: string[]; impacto: number; diasAtraso: number }

export function HojeView(p: {
  nome: string
  hoje: string
  hora: string
  modo: ModoDia | null
  fechouDia: boolean
  horasDia: number
  checkout: string
  lista: ItemHoje[]
  extras: ItemHoje[]
  concluidas: ItemHoje[]
  alertas: Alerta[]
  entregas: { id: string; nome: string; cor: string | null; data: string; status: StatusSaude; diasAtraso: number }[]
  capturas: number
  temProjetos: boolean
  horasHoje: number
}) {
  const [modo, setModo] = useOptimistic(p.modo)
  const [reordenando, iniciar] = useTransition()
  const [abertaId, setAbertaId] = useState<string | null>(null)
  const aberta = [...p.lista, ...p.extras, ...p.concluidas].find((x) => x.tarefa.id === abertaId) ?? null
  const [verExtras, setVerExtras] = useState(false)

  const escolher = (m: ModoDia) =>
    iniciar(async () => {
      setModo(m)
      await escolherModo(m)
    })

  const [h] = p.hora.split(':').map(Number)
  const saudacao = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
  const nome = primeiroNome(p.nome)
  const modoAtual = MODOS_DIA.find((m) => m.chave === modo)
  const primeira = p.lista[0]
  const resto = p.lista.slice(1)
  const planejadas = p.lista.reduce((s, x) => s + Math.min(x.tarefa.horas_estimadas, p.horasDia), 0)
  const passouExpediente = p.hora >= p.checkout

  const meta = (x: ItemHoje) => `${x.projeto} · ${x.proposta ? 'proposta' : nomeFase(x.tarefa.fase)} · ${quando(x.tarefa.data_prevista, p.hoje)}`

  return (
    <div className="hoje">
      <section className="hoje-principal">
        <header className="hoje-topo">
          <div className="dia-topo">
            <span className="dia-numero">{diaDoMes(p.hoje)}</span>
            <span className="dia-texto">
              <span className="rotulo">{mesLongo(p.hoje)}</span>
              <span className="semana">{diaDaSemana(p.hoje)}</span>
            </span>
          </div>
          <div className="cabecalho-acoes">
            <Link href="/checkout" className={p.fechouDia ? 'btn btn-sec' : passouExpediente ? 'btn' : 'btn btn-sec'}>
              <Icone nome="lua" />
              {p.fechouDia ? 'Dia fechado' : 'Fechar o dia'}
            </Link>
          </div>
        </header>

        <p className="saudacao">
          {saudacao}
          {nome ? `, ${nome}` : ''}. {modoAtual ? <b>Hoje é um dia {modoAtual.nome.toLowerCase()}.</b> : <b>Como você chega hoje?</b>}
        </p>

        <div className="pilha" style={{ gap: 10 }}>
          <div className="modos" role="group" aria-label="Modo do dia">
            {MODOS_DIA.map((m) => (
              <button key={m.chave} type="button" className="modo" aria-pressed={modo === m.chave} onClick={() => escolher(m.chave)} disabled={reordenando}>
                <Icone nome={m.icone as NomeIcone} />
                <span>
                  <span className="modo-nome">{m.nome}</span>
                  <span className="modo-dica">{m.dica}</span>
                </span>
              </button>
            ))}
          </div>
          <p className="meta modo-frase" aria-live="polite">{reordenando ? 'Reorganizando o seu dia…' : fraseDoModo(modo)}</p>
        </div>

        {p.alertas.length > 0 && (
          <section className="pilha" style={{ gap: 'var(--space-3)' }} aria-label="Projetos que pedem atenção">
            <span className="rotulo">Pede atenção</span>
            <div className="alertas">
              {p.alertas.map((a) => (
                <Link key={a.id} href={`/projetos/${a.id}`} className={`alerta cor-projeto alerta-${a.status}`} style={estiloCor(a.cor)}>
                  <div className="alerta-topo">
                    <span className="alerta-nome">
                      <i className="marcador-cor" aria-hidden="true" />
                      {a.nome}
                    </span>
                    <SeloSaude status={a.status} pequeno />
                  </div>
                  <strong className="alerta-manchete">{a.manchete}</strong>
                  {a.motivos.map((m) => (
                    <span key={m} className="alerta-motivo">{m}</span>
                  ))}
                  {a.impacto < -1 && (
                    <span className="alerta-impacto numero">
                      {reais(a.impacto)} <span>na margem</span>
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {passouExpediente && !p.fechouDia && p.temProjetos && (
          <div className="aviso">
            <Icone nome="lua" />
            <span>
              O seu expediente terminou às {p.checkout}. <Link href="/checkout" className="btn-texto">Fechar o dia</Link> leva um minuto e deixa o resto anotado para amanhã.
            </span>
          </div>
        )}

        {!p.temProjetos ? (
          <div className="hero">
            <span className="hero-rotulo">Comece por aqui</span>
            <p className="hero-titulo">Cadastre o primeiro projeto</p>
            <p className="hero-motivo">
              Ele entra como proposta: o ARQFLOW estima as horas de cada fase e sugere um valor. Quando o contrato for assinado, as tarefas ganham datas e
              passam a aparecer aqui, priorizadas para o seu dia, com o prazo e a margem acompanhados de perto.
            </p>
            <Link href="/projetos/novo" className="btn btn-largo">
              Novo projeto
              <Icone nome="seta" />
            </Link>
          </div>
        ) : primeira ? (
          <Hero item={primeira} aoAbrir={() => setAbertaId(primeira.tarefa.id)} meta={meta(primeira)} />
        ) : (
          <div className="hero">
            <span className="hero-rotulo">Dia livre</span>
            <p className="hero-titulo">Nada previsto para hoje.</p>
            <p className="hero-motivo">Bom momento para revisar a caixa de entrada ou adiantar o planejamento de um projeto.</p>
          </div>
        )}

        {resto.length > 0 && (
          <section className="pilha" style={{ gap: 'var(--space-2)' }}>
            <div className="secao-topo">
              <span className="rotulo">Depois</span>
              <span className="meta numero">{resto.length} {resto.length === 1 ? 'tarefa' : 'tarefas'}</span>
            </div>
            <div className="tarefas">
              {resto.map((x) => (
                <LinhaTarefa key={x.tarefa.id} tarefa={x.tarefa} cor={x.cor} meta={meta(x)} destaque={x.combina && modoAtual ? `combina com o dia` : undefined} aoAbrir={() => setAbertaId(x.tarefa.id)} />
              ))}
            </div>
          </section>
        )}

        {p.extras.length > 0 && (
          <section className="pilha" style={{ gap: 'var(--space-2)' }}>
            <button type="button" className="btn-texto" onClick={() => setVerExtras(!verExtras)} aria-expanded={verExtras}>
              {verExtras ? 'Esconder' : `Se sobrar tempo (${p.extras.length})`}
            </button>
            {verExtras && (
              <div className="tarefas">
                {p.extras.map((x) => (
                  <LinhaTarefa key={x.tarefa.id} tarefa={x.tarefa} cor={x.cor} meta={meta(x)} aoAbrir={() => setAbertaId(x.tarefa.id)} />
                ))}
              </div>
            )}
          </section>
        )}

        {p.concluidas.length > 0 && (
          <section className="pilha" style={{ gap: 'var(--space-2)' }}>
            <span className="rotulo">Concluídas hoje · {p.concluidas.length}</span>
            <div className="tarefas">
              {p.concluidas.map((x) => (
                <LinhaTarefa key={x.tarefa.id} tarefa={x.tarefa} cor={x.cor} meta={`${x.projeto} · ${nomeFase(x.tarefa.fase)}`} aoAbrir={() => setAbertaId(x.tarefa.id)} comCronometro={false} />
              ))}
            </div>
          </section>
        )}
      </section>

      <aside className="trilho">
        <div className="placa">
          <span className="rotulo">Seu dia</span>
          <div className="carga">
            <b>{horasTotais(planejadas)}</b>
            <span className="meta">planejadas de {horasTotais(p.horasDia)}</span>
          </div>
          <div className="progresso" aria-hidden="true">
            <i style={{ width: `${Math.min(100, (planejadas / Math.max(1, p.horasDia)) * 100)}%` }} />
          </div>
          <div className="carga">
            <span className="meta">Cronometrado hoje</span>
            <span className="numero">{horas(p.horasHoje)}</span>
          </div>
          <p className="meta">
            {planejadas > p.horasDia ? 'O dia está cheio. O que não couber passa para amanhã no check-out.' : 'Há folga para imprevistos. Ela também faz parte do plano.'}
          </p>
        </div>
        {p.entregas.length > 0 && (
          <div className="placa">
            <span className="rotulo">Próximas entregas</span>
            <ul className="lista-simples">
              {p.entregas.map((e) => (
                <li key={e.id} className="cor-projeto" style={estiloCor(e.cor)}>
                  <Link href={`/projetos/${e.id}`} className="entrega-nome">
                    <i className="marcador-cor" aria-hidden="true" />
                    {e.nome}
                  </Link>
                  <span className="meta numero">
                    {dataCurta(e.data)}
                    {e.diasAtraso > 0 && <span className="atraso-mini"> +{e.diasAtraso}d</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="placa">
          <span className="rotulo">Caixa de entrada</span>
          <p className="apoio">
            {p.capturas === 0 ? 'Vazia. A cabeça agradece.' : `${p.capturas} ${p.capturas === 1 ? 'item espera' : 'itens esperam'} para virar tarefa ou sair da lista.`}
          </p>
          {p.capturas > 0 && <Link href="/captura" className="btn-texto">Revisar agora</Link>}
        </div>
        <div className="placa">
          <span className="rotulo">Check-out às {p.checkout}</span>
          <p className="apoio">{p.fechouDia ? 'Dia fechado. Até amanhã.' : 'Três passos: revisar o dia, esvaziar a cabeça e escolher por onde começar amanhã.'}</p>
          {!p.fechouDia && <Link href="/checkout" className="btn-texto">Fechar o dia</Link>}
        </div>
      </aside>

      <PainelTarefa tarefa={aberta?.tarefa ?? null} projetoNome={aberta?.projeto} projetoId={aberta?.projetoId} aoFechar={() => setAbertaId(null)} />
    </div>
  )
}

function Hero({ item, meta, aoAbrir }: { item: ItemHoje; meta: string; aoAbrir: () => void }) {
  const [pendente, iniciar] = useTransition()
  const t = item.tarefa
  const modo = MODOS_TAREFA[t.modo]
  const rodando = !!t.timer_inicio
  return (
    <div className="hero cor-projeto" style={estiloCor(item.cor)}>
      <div className="hero-topo">
        <span className="hero-rotulo">Comece por aqui</span>
        <span className="chip">
          <Icone nome={modo.icone as NomeIcone} />
          {modo.nome}
        </span>
      </div>
      <div className="hero-linha">
        <button type="button" className="hero-principal" onClick={aoAbrir}>
          <span className="hero-titulo">{t.titulo}</span>
          <span className="hero-meta">
            <i className="marcador-cor" aria-hidden="true" />
            {meta}
          </span>
        </button>
        <span className="hero-est">
          <b>{horas(t.horas_estimadas)}</b>
          <span>
            <Icone nome="relogio" />
            {t.horas_reais ? `${horas(t.horas_reais)} feitas` : 'estimado'}
          </span>
        </span>
      </div>
      <p className="hero-motivo">{item.motivo}</p>
      <div className="hero-acoes">
        <BotaoCronometro tarefaId={t.id} rodando={rodando} inicio={t.timer_inicio} grande />
        {rodando && (
          <button type="button" className="btn btn-sec" disabled={pendente} onClick={() => iniciar(() => pararCronometro(true))}>
            <Icone nome="check" />
            Concluir
          </button>
        )}
      </div>
    </div>
  )
}

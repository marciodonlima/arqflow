'use client'

import Link from 'next/link'
import { useOptimistic, useState, useTransition } from 'react'
import { escolherModo } from '@/acoes/dia'
import { marcarStatus } from '@/acoes/tarefas'
import { Icone, type NomeIcone } from '@/components/Icone'
import { LinhaTarefa } from '@/components/LinhaTarefa'
import { PainelTarefa } from '@/components/PainelTarefa'
import { MODOS_DIA, MODOS_TAREFA, nomeFase } from '@/lib/biblioteca'
import { dataCurta, diaDaSemana, diaDoMes, mesLongo, quando } from '@/lib/datas'
import { horas, horasTotais, primeiroNome } from '@/lib/formato'
import type { ModoDia, Tarefa } from '@/lib/tipos'

type Item = { tarefa: Tarefa; projeto: string; projetoId: string; motivo: string; proposta: boolean }

export function HojeView(p: {
  nome: string
  hoje: string
  hora: string
  modo: ModoDia | null
  fechouDia: boolean
  horasDia: number
  checkout: string
  lista: Item[]
  extras: Item[]
  concluidas: Item[]
  entregas: { id: string; nome: string; data: string }[]
  capturas: number
  temProjetos: boolean
}) {
  const [modo, setModo] = useOptimistic(p.modo)
  const [, iniciar] = useTransition()
  const [aberta, setAberta] = useState<Item | null>(null)
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

  const meta = (x: Item) => `${x.projeto} · ${x.proposta ? 'proposta' : nomeFase(x.tarefa.fase)} · ${quando(x.tarefa.data_prevista, p.hoje)}`

  return (
    <div className="hoje">
      <section className="pilha-g" style={{ gap: 'var(--space-8)' }}>
        <div>
          <div className="dia-topo">
            <span className="dia-numero">{diaDoMes(p.hoje)}</span>
            <span className="dia-texto">
              <span className="rotulo">{mesLongo(p.hoje)}</span>
              <span className="semana">{diaDaSemana(p.hoje)}</span>
            </span>
          </div>
          <p className="saudacao">
            {saudacao}{nome ? `, ${nome}` : ''}.{' '}
            {modoAtual ? <b>Hoje é um dia {modoAtual.nome.toLowerCase()}.</b> : <b>Como você chega hoje?</b>}
          </p>
          <div className="modos" role="group" aria-label="Modo do dia">
            {MODOS_DIA.map((m) => (
              <button key={m.chave} type="button" className="modo" aria-pressed={modo === m.chave} onClick={() => escolher(m.chave)}>
                <Icone nome={m.icone as NomeIcone} />
                <span>
                  <span className="modo-nome" style={{ display: 'block' }}>{m.nome}</span>
                  <span className="modo-dica">{m.dica}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {passouExpediente && !p.fechouDia && p.temProjetos && (
          <div className="aviso">
            <Icone nome="lua" />
            <span>
              O seu expediente terminou às {p.checkout}. <Link href="/checkout" className="btn-texto">Fechar o dia</Link> e deixar o resto para amanhã.
            </span>
          </div>
        )}

        {!p.temProjetos ? (
          <div className="hero">
            <span className="hero-rotulo">Comece por aqui</span>
            <p className="hero-titulo">Cadastre o primeiro projeto</p>
            <p className="hero-motivo">
              Ele entra como proposta: o ARQFLOW estima as horas de cada fase e sugere um valor. Quando o contrato for assinado,
              as tarefas ganham datas e passam a aparecer aqui, priorizadas para o seu dia.
            </p>
            <Link href="/projetos/novo" className="btn btn-largo">
              Novo projeto
              <Icone nome="seta" />
            </Link>
          </div>
        ) : primeira ? (
          <Hero item={primeira} aoAbrir={() => setAberta(primeira)} meta={meta(primeira)} />
        ) : (
          <div className="hero">
            <span className="hero-rotulo">Dia livre</span>
            <p className="hero-titulo">Nada previsto para hoje.</p>
            <p className="hero-motivo">Bom momento para revisar a caixa de captura ou adiantar o planejamento de um projeto.</p>
          </div>
        )}

        {resto.length > 0 && (
          <section className="pilha" style={{ gap: 'var(--space-3)' }}>
            <span className="rotulo">Depois</span>
            <div className="tarefas">
              {resto.map((x) => (
                <LinhaTarefa key={x.tarefa.id} tarefa={x.tarefa} meta={meta(x)} aoAbrir={() => setAberta(x)} />
              ))}
            </div>
          </section>
        )}

        {p.extras.length > 0 && (
          <section className="pilha" style={{ gap: 'var(--space-3)' }}>
            <button type="button" className="btn-texto" onClick={() => setVerExtras(!verExtras)} aria-expanded={verExtras}>
              {verExtras ? 'Esconder' : `Se sobrar tempo (${p.extras.length})`}
            </button>
            {verExtras && (
              <div className="tarefas">
                {p.extras.map((x) => (
                  <LinhaTarefa key={x.tarefa.id} tarefa={x.tarefa} meta={meta(x)} aoAbrir={() => setAberta(x)} />
                ))}
              </div>
            )}
          </section>
        )}

        {p.concluidas.length > 0 && (
          <section className="pilha" style={{ gap: 'var(--space-3)' }}>
            <span className="rotulo">Concluídas hoje · {p.concluidas.length}</span>
            <div className="tarefas">
              {p.concluidas.map((x) => (
                <LinhaTarefa key={x.tarefa.id} tarefa={x.tarefa} meta={`${x.projeto} · ${nomeFase(x.tarefa.fase)}`} aoAbrir={() => setAberta(x)} />
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
            <span className="meta">de {horasTotais(p.horasDia)} disponíveis</span>
          </div>
          <div className="progresso" aria-hidden="true">
            <i style={{ width: `${Math.min(100, (planejadas / Math.max(1, p.horasDia)) * 100)}%` }} />
          </div>
          <p className="meta">
            {planejadas > p.horasDia
              ? 'O dia está cheio. O que não couber passa para amanhã sem culpa.'
              : 'Há folga para imprevistos. Ela também faz parte do plano.'}
          </p>
        </div>
        {p.entregas.length > 0 && (
          <div className="placa">
            <span className="rotulo">Próximas entregas</span>
            <ul className="lista-simples">
              {p.entregas.map((e) => (
                <li key={e.id}>
                  <Link href={`/projetos/${e.id}`}>{e.nome}</Link>
                  <span className="meta numero">{dataCurta(e.data)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="placa">
          <span className="rotulo">Caixa de captura</span>
          <p className="apoio">
            {p.capturas === 0 ? 'Vazia. A cabeça agradece.' : `${p.capturas} ${p.capturas === 1 ? 'item espera' : 'itens esperam'} para virar tarefa ou sair da lista.`}
          </p>
          {p.capturas > 0 && <Link href="/captura" className="btn-texto">Revisar agora</Link>}
        </div>
        <div className="placa">
          <span className="rotulo">Check-out às {p.checkout}</span>
          <p className="apoio">{p.fechouDia ? 'Dia fechado. Até amanhã.' : 'Um minuto para fechar os loops do dia e escolher por onde começar amanhã.'}</p>
          {!p.fechouDia && <Link href="/checkout" className="btn-texto">Fazer check-out</Link>}
        </div>
      </aside>

      <PainelTarefa tarefa={aberta?.tarefa ?? null} projetoNome={aberta?.projeto} projetoId={aberta?.projetoId} aoFechar={() => setAberta(null)} />
    </div>
  )
}

function Hero({ item, meta, aoAbrir }: { item: Item; meta: string; aoAbrir: () => void }) {
  const [pendente, iniciar] = useTransition()
  const t = item.tarefa
  const modo = MODOS_TAREFA[t.modo]
  const fazendo = t.status === 'fazendo'
  return (
    <div className="hero">
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
          <span className="hero-meta">{meta}</span>
        </button>
        <span className="hero-est">
          <b>{horas(t.horas_estimadas)}</b>
          <span>
            <Icone nome="relogio" />
            estimado
          </span>
        </span>
      </div>
      <p className="hero-motivo">{item.motivo}</p>
      <button
        type="button"
        className="btn btn-largo"
        disabled={pendente}
        onClick={() => iniciar(() => marcarStatus(t.id, fazendo ? 'feita' : 'fazendo'))}
      >
        {fazendo ? 'Concluir' : 'Começar'}
        <Icone nome={fazendo ? 'check' : 'seta'} />
      </button>
    </div>
  )
}

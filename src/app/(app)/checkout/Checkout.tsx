'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { capturar, fazerCheckout, tratarCaptura } from '@/acoes/dia'
import { Icone } from '@/components/Icone'
import { ORIGENS } from '@/lib/biblioteca'
import { estiloCor } from '@/lib/cores'
import { horas } from '@/lib/formato'

export type ItemCheckout = {
  id: string
  titulo: string
  projeto: string
  cor: string | null
  feita: boolean
  horasHoje: number
  horasReais: number | null
  horasEstimadas: number
  atrasada: boolean
}

type Decisao = 'feita' | 'amanha' | 'manter'
const PASSOS = ['Revisar o dia', 'Esvaziar a cabeça', 'Preparar amanhã']

export function Checkout({
  itens,
  capturas,
  projetos,
  opcoesAmanha,
  fechado,
  abertoAnterior,
  escolhida,
}: {
  itens: ItemCheckout[]
  capturas: { id: string; texto: string; origem: string; projetoId: string | null }[]
  projetos: { id: string; nome: string }[]
  opcoesAmanha: { id: string; titulo: string; projeto: string; cor: string | null }[]
  fechado: boolean
  abertoAnterior: string
  escolhida: string | null
}) {
  const [passo, setPasso] = useState(fechado ? 3 : 0)
  const [decisoes, setDecisoes] = useState<Record<string, Decisao>>(() => Object.fromEntries(itens.map((i) => [i.id, i.feita ? 'feita' : 'amanha'])))
  const [horasInformadas, setHoras] = useState<Record<string, string>>(() =>
    Object.fromEntries(itens.map((i) => [i.id, i.horasReais != null ? fmt(i.horasReais) : i.feita ? fmt(i.horasEstimadas) : ''])),
  )
  const [tratadas, setTratadas] = useState<Record<string, string>>({})
  const [aberto, setAberto] = useState(abertoAnterior)
  const [amanha, setAmanha] = useState<string | null>(escolhida)
  const [novaCaptura, setNovaCaptura] = useState('')
  const [pendente, iniciar] = useTransition()

  const concluidas = itens.filter((i) => decisoes[i.id] === 'feita')
  const opcoes = useMemo(() => opcoesAmanha.filter((o) => decisoes[o.id] !== 'feita'), [opcoesAmanha, decisoes])
  const amanhaEscolhida = amanha ?? opcoes[0]?.id ?? null
  const horasDoDia = itens.reduce((s, i) => s + i.horasHoje, 0)
  const capturasRestantes = capturas.filter((c) => !tratadas[c.id])

  function finalizar() {
    iniciar(async () => {
      await fazerCheckout({
        concluidas: concluidas.map((i) => ({ id: i.id, horas: parse(horasInformadas[i.id]) })),
        adiar: itens.filter((i) => decisoes[i.id] === 'amanha').map((i) => i.id),
        aberto,
        amanha: amanhaEscolhida,
      })
      setPasso(3)
    })
  }

  function tratar(id: string, acao: 'tarefa' | 'resolvida' | 'descartada', projetoId?: string) {
    setTratadas((t) => ({ ...t, [id]: acao }))
    const fd = new FormData()
    if (projetoId) fd.set('projeto_id', projetoId)
    fd.set('quando', 'amanha')
    iniciar(() => tratarCaptura(id, acao, fd))
  }

  if (passo === 3)
    return (
      <div className="checkout">
        <div className="hero">
          <span className="hero-rotulo">Dia fechado</span>
          <p className="hero-titulo">Bom trabalho. Pode desligar.</p>
          <div className="resumo-dia">
            <div>
              <b className="numero">{concluidas.length}</b>
              <span>{concluidas.length === 1 ? 'tarefa concluída' : 'tarefas concluídas'}</span>
            </div>
            <div>
              <b className="numero">{horas(horasDoDia)}</b>
              <span>cronometradas</span>
            </div>
            <div>
              <b className="numero">{itens.filter((i) => decisoes[i.id] === 'amanha').length}</b>
              <span>para amanhã</span>
            </div>
          </div>
          {amanhaEscolhida && <p className="hero-motivo">Amanhã começa por: {opcoesAmanha.find((o) => o.id === amanhaEscolhida)?.titulo ?? 'a tarefa escolhida'}.</p>}
          <div className="botoes">
            <button type="button" className="btn btn-sec" onClick={() => setPasso(0)}>Revisar de novo</button>
            <Link href="/hoje" className="btn-texto">Voltar para Hoje</Link>
          </div>
        </div>
      </div>
    )

  return (
    <div className="checkout">
      <header className="cabecalho">
        <div className="cabecalho-texto">
          <h1 className="titulo-pagina">Fechar o dia</h1>
          <p className="apoio">Um minuto para fechar os loops. O que fica anotado aqui não precisa ficar na cabeça.</p>
        </div>
      </header>

      <ol className="passos" aria-label="Passos">
        {PASSOS.map((n, i) => (
          <li key={n} style={{ display: 'contents' }}>
            {i > 0 && <span className="passo-sep" aria-hidden="true" />}
            <button type="button" className={`passo${i < passo ? ' feito' : ''}`} aria-current={i === passo ? 'step' : undefined} onClick={() => setPasso(i)}>
              <b>{i < passo ? <Icone nome="check" /> : i + 1}</b>
              {n}
            </button>
          </li>
        ))}
      </ol>

      {passo === 0 && (
        <section className="pilha">
          <p className="apoio">Marque o que terminou e confira as horas. Elas alimentam o ritmo real e a margem de cada projeto.</p>
          {itens.length === 0 ? (
            <p className="aviso">Nenhuma tarefa passou pelo seu dia. Reunião, obra e imprevisto também são trabalho.</p>
          ) : (
            <div className="revisao">
              {itens.map((i) => (
                <div key={i.id} className={`revisao-item cor-projeto${decisoes[i.id] === 'feita' ? ' feita' : ''}`} style={estiloCor(i.cor)}>
                  <div className="revisao-texto">
                    <strong>{i.titulo}</strong>
                    <span className="meta">
                      <i className="marcador-cor" aria-hidden="true" />
                      {i.projeto}
                      {i.horasHoje > 0 && ` · ${horas(i.horasHoje)} cronometradas hoje`}
                      {i.atrasada && ' · atrasada'}
                    </span>
                  </div>
                  <div className="segmentado" role="group" aria-label={`O que fazer com ${i.titulo}`}>
                    <button type="button" aria-pressed={decisoes[i.id] === 'feita'} onClick={() => setDecisoes((d) => ({ ...d, [i.id]: 'feita' }))}>Concluí</button>
                    <button type="button" aria-pressed={decisoes[i.id] === 'amanha'} onClick={() => setDecisoes((d) => ({ ...d, [i.id]: 'amanha' }))}>Amanhã</button>
                    <button type="button" aria-pressed={decisoes[i.id] === 'manter'} onClick={() => setDecisoes((d) => ({ ...d, [i.id]: 'manter' }))}>Manter</button>
                  </div>
                  {decisoes[i.id] === 'feita' && (
                    <label className="revisao-horas">
                      <span className="meta">Horas no total</span>
                      <input
                        className="entrada"
                        inputMode="decimal"
                        value={horasInformadas[i.id] ?? ''}
                        placeholder={fmt(i.horasEstimadas)}
                        onChange={(e) => setHoras((h) => ({ ...h, [i.id]: e.target.value }))}
                      />
                      <span className="meta">est. {horas(i.horasEstimadas)}</span>
                    </label>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="rodape-acoes">
            <Link href="/hoje" className="btn btn-sec">Voltar</Link>
            <button type="button" className="btn" onClick={() => setPasso(1)}>
              Continuar
              <Icone nome="seta" />
            </button>
          </div>
        </section>
      )}

      {passo === 1 && (
        <section className="pilha">
          <p className="apoio">O que ficou na cabeça vira tarefa para amanhã, fica resolvido ou sai da lista.</p>
          {capturasRestantes.length === 0 && <p className="aviso">Caixa de entrada vazia.</p>}
          {capturasRestantes.map((c) => (
            <div key={c.id} className="captura-item">
              <p style={{ whiteSpace: 'pre-wrap' }}>{c.texto}</p>
              <span className="meta">{ORIGENS.find((o) => o.chave === c.origem)?.nome}</span>
              <CapturaAcoes projetos={projetos} padrao={c.projetoId} aoTarefa={(pid) => tratar(c.id, 'tarefa', pid)} aoResolver={() => tratar(c.id, 'resolvida')} aoDescartar={() => tratar(c.id, 'descartada')} />
            </div>
          ))}
          <label className="campo">
            <span>Mais alguma coisa na cabeça?</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="entrada" value={novaCaptura} onChange={(e) => setNovaCaptura(e.target.value)} placeholder="Anote e solte" />
              <button
                type="button"
                className="btn btn-sec"
                disabled={!novaCaptura.trim() || pendente}
                onClick={() => {
                  const fd = new FormData()
                  fd.set('texto', novaCaptura)
                  setNovaCaptura('')
                  iniciar(async () => {
                    await capturar(fd)
                  })
                }}
              >
                Guardar
              </button>
            </div>
          </label>
          <div className="rodape-acoes">
            <button type="button" className="btn btn-sec" onClick={() => setPasso(0)}>Voltar</button>
            <button type="button" className="btn" onClick={() => setPasso(2)}>
              Continuar
              <Icone nome="seta" />
            </button>
          </div>
        </section>
      )}

      {passo === 2 && (
        <section className="pilha">
          <fieldset className="campo">
            <legend>Por onde começar amanhã</legend>
            {opcoes.length === 0 ? (
              <p className="apoio" style={{ marginTop: 8 }}>Nada previsto. Amanhã é um bom dia para planejar.</p>
            ) : (
              <div className="pilha" style={{ gap: 8, marginTop: 8 }}>
                {opcoes.map((o) => (
                  <label key={o.id} className="cartao-opcao cor-projeto" style={estiloCor(o.cor)}>
                    <input type="radio" name="amanha" checked={amanhaEscolhida === o.id} onChange={() => setAmanha(o.id)} />
                    <div>
                      <strong>{o.titulo}</strong>
                      <small>
                        <i className="marcador-cor" aria-hidden="true" /> {o.projeto}
                      </small>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </fieldset>
          <label className="campo">
            <span>O que ficou aberto</span>
            <textarea value={aberto} onChange={(e) => setAberto(e.target.value)} placeholder="Pendências, decisões, o que você precisa lembrar amanhã." rows={3} />
          </label>
          <div className="rodape-acoes">
            <button type="button" className="btn btn-sec" onClick={() => setPasso(1)}>Voltar</button>
            <button type="button" className="btn" disabled={pendente} onClick={finalizar}>
              <Icone nome="lua" />
              {pendente ? 'Fechando…' : 'Fechar o dia'}
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

function CapturaAcoes({
  projetos,
  padrao,
  aoTarefa,
  aoResolver,
  aoDescartar,
}: {
  projetos: { id: string; nome: string }[]
  padrao: string | null
  aoTarefa: (id: string) => void
  aoResolver: () => void
  aoDescartar: () => void
}) {
  const [pid, setPid] = useState(padrao ?? projetos[0]?.id ?? '')
  return (
    <div className="captura-acoes">
      {projetos.length > 0 && (
        <>
          <select value={pid} onChange={(e) => setPid(e.target.value)} aria-label="Projeto">
            {projetos.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
          <button type="button" className="btn btn-pequeno" onClick={() => aoTarefa(pid)}>Tarefa para amanhã</button>
        </>
      )}
      <button type="button" className="btn btn-sec btn-pequeno" onClick={aoResolver}>Já resolvi</button>
      <button type="button" className="btn-texto" style={{ color: 'var(--af-tert)', fontSize: 13 }} onClick={aoDescartar}>Descartar</button>
    </div>
  )
}

function fmt(n: number) {
  return String(Math.round(n * 100) / 100).replace('.', ',')
}
function parse(s: string | undefined): number | null {
  if (!s) return null
  const n = Number(s.replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : null
}

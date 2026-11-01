'use client'

import Link from 'next/link'
import { startTransition, useActionState, useMemo, useState } from 'react'
import { criarProjeto, type EstadoProjeto } from '@/acoes/projetos'
import { Icone } from '@/components/Icone'
import { ESCOPOS, FASES, GRUPOS_AMBIENTES, TIPOLOGIAS, escoposPadrao, ehResidencial } from '@/lib/biblioteca'
import { horasTotais, reais } from '@/lib/formato'
import { gerarTarefas, montarContexto, resumirPorFase, valorSugerido } from '@/lib/motor'
import type { Escopo, Tipologia } from '@/lib/tipos'

const PASSOS = ['Dados', 'Escopo', 'Ambientes', 'Revisão']

export function NovoProjeto({ custoHora, margem, hoje }: { custoHora: number; margem: number; hoje: string }) {
  const [estado, acao, enviando] = useActionState<EstadoProjeto, FormData>(criarProjeto, undefined)
  const [passo, setPasso] = useState(0)
  const [nome, setNome] = useState('')
  const [situacao, setSituacao] = useState<'proposta' | 'contratado'>('proposta')
  const [tipologia, setTipologia] = useState<Tipologia>('res_int')
  const [escopos, setEscopos] = useState<Escopo[]>(escoposPadrao('res_int'))
  const [area, setArea] = useState('')
  const [qtd, setQtd] = useState<Record<string, number>>({})
  const [extras, setExtras] = useState<{ chave: string; nome: string }[]>([])
  const [novoAmbiente, setNovoAmbiente] = useState('')

  const grupos = GRUPOS_AMBIENTES[ehResidencial(tipologia) ? 'res' : 'com']
  const nomes = useMemo(() => {
    const m: Record<string, string> = {}
    for (const g of [...GRUPOS_AMBIENTES.res, ...GRUPOS_AMBIENTES.com]) for (const a of g.ambientes) m[a.chave] = a.nome
    for (const e of extras) m[e.chave] = e.nome
    return m
  }, [extras])
  const escolhidos = Object.entries(qtd)
    .filter(([, n]) => n > 0)
    .map(([chave, n]) => ({ chave, nome: nomes[chave] ?? chave, qtd: n }))

  const previa = useMemo(() => {
    const ctx = montarContexto(tipologia, escopos, escolhidos, Number(area.replace(',', '.')) || null)
    const t = gerarTarefas(ctx)
    const total = t.reduce((s, x) => s + x.horas_estimadas, 0)
    return { fases: resumirPorFase(t), total, valor: valorSugerido(total, custoHora, margem), quantidade: t.length }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipologia, escopos, JSON.stringify(escolhidos), area, custoHora, margem])

  function trocarTipologia(t: Tipologia) {
    if (ehResidencial(t) !== ehResidencial(tipologia)) setQtd({})
    setTipologia(t)
    setEscopos(escoposPadrao(t))
  }

  const alternarAmbiente = (chave: string) => setQtd((q) => ({ ...q, [chave]: q[chave] ? 0 : 1 }))
  const mudarQtd = (chave: string, d: number) => setQtd((q) => ({ ...q, [chave]: Math.max(0, Math.min(20, (q[chave] ?? 0) + d)) }))

  function adicionarAmbiente() {
    const n = novoAmbiente.trim()
    if (!n) return
    const chave = 'extra_' + n.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '_').slice(0, 30)
    setExtras((e) => (e.some((x) => x.chave === chave) ? e : [...e, { chave, nome: n }]))
    setQtd((q) => ({ ...q, [chave]: 1 }))
    setNovoAmbiente('')
  }

  const podeAvancar = passo === 0 ? nome.trim().length > 0 : passo === 2 ? escolhidos.length > 0 : true
  const planejamento = previa.fases.find((f) => f.fase === 'planejamento')

  return (
    <form
      onSubmit={(e) => {
        // Envio manual: assim o formulário não é limpo se o servidor devolver um erro
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        startTransition(() => acao(fd))
      }}
    >
      <Link href="/projetos" className="voltar">
        <Icone nome="seta" />
        Projetos
      </Link>
      <header className="cabecalho" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 className="titulo-pagina">Novo projeto</h1>
          <p className="apoio">Quatro passos. No fim, o ARQFLOW monta o fluxo de tarefas com as horas de cada fase.</p>
        </div>
      </header>

      <ol className="passos" aria-label="Passos">
        {PASSOS.map((n, i) => (
          <li key={n} style={{ display: 'contents' }}>
            {i > 0 && <span className="passo-sep" aria-hidden="true" />}
            <span className={`passo${i < passo ? ' feito' : ''}`} aria-current={i === passo ? 'step' : undefined}>
              <b>{i < passo ? <Icone nome="check" /> : i + 1}</b>
              {n}
            </span>
          </li>
        ))}
      </ol>

      <input type="hidden" name="ambientes" value={JSON.stringify(escolhidos)} />

      {/* Passo 1 · Dados */}
      <div className="pilha" hidden={passo !== 0} style={{ maxWidth: 720 }}>
        <div className="grade-2">
          <label className="campo">
            <span>Nome do projeto</span>
            <input name="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Apartamento Leblon" required />
          </label>
          <label className="campo">
            <span>Cliente</span>
            <input name="cliente" placeholder="Nome do cliente" />
          </label>
        </div>
        <fieldset className="campo">
          <legend>Situação</legend>
          <div className="cartoes-opcao" style={{ marginTop: 6 }}>
            <label className="cartao-opcao">
              <input type="radio" name="situacao" value="proposta" checked={situacao === 'proposta'} onChange={() => setSituacao('proposta')} />
              <div>
                <strong>Em proposta</strong>
                <small>Ainda vou orçar e enviar a proposta. O projeto vira ativo quando o contrato for assinado.</small>
              </div>
            </label>
            <label className="cartao-opcao">
              <input type="radio" name="situacao" value="contratado" checked={situacao === 'contratado'} onChange={() => setSituacao('contratado')} />
              <div>
                <strong>Já contratado</strong>
                <small>O contrato está assinado. As tarefas ganham datas a partir do início.</small>
              </div>
            </label>
          </div>
        </fieldset>
        {situacao === 'proposta' ? (
          <label className="campo" style={{ maxWidth: 340 }}>
            <span>Prazo desejado pelo cliente (opcional)</span>
            <input name="data_entrega" type="date" min={hoje} />
          </label>
        ) : (
          <>
            <div className="grade-3">
              <label className="campo">
                <span>Início</span>
                <input name="data_inicio" type="date" defaultValue={hoje} />
              </label>
              <label className="campo">
                <span>Entrega combinada</span>
                <input name="data_entrega" type="date" />
                <small>Sem data, o ARQFLOW sugere uma.</small>
              </label>
              <label className="campo">
                <span>Valor do contrato (R$)</span>
                <input name="valor_contrato" inputMode="decimal" placeholder="Opcional" />
              </label>
            </div>
            <label className="campo" style={{ maxWidth: 340 }}>
              <span>Em que fase o projeto está?</span>
              <select name="fase_atual" defaultValue="planejamento">
                {FASES.map((f) => (
                  <option key={f.chave} value={f.chave}>{f.nome}</option>
                ))}
              </select>
              <small>As fases anteriores entram como concluídas.</small>
            </label>
          </>
        )}
        <label className="campo">
          <span>Observações iniciais</span>
          <textarea name="notas" placeholder="O que você já sabe sobre o cliente e o projeto." />
        </label>
      </div>

      {/* Passo 2 · Escopo */}
      <div className="pilha-g" hidden={passo !== 1} style={{ maxWidth: 820 }}>
        <fieldset className="campo">
          <legend>Tipologia</legend>
          <div className="cartoes-opcao" style={{ marginTop: 6 }}>
            {TIPOLOGIAS.map((t) => (
              <label key={t.chave} className="cartao-opcao">
                <input type="radio" name="tipologia" value={t.chave} checked={tipologia === t.chave} onChange={() => trocarTipologia(t.chave)} />
                <div>
                  <strong>{t.nome}</strong>
                  <small>{t.descricao}</small>
                </div>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="campo">
          <legend>Escopo dos serviços</legend>
          <div className="opcoes" style={{ marginTop: 6 }}>
            {ESCOPOS.map((e) => (
              <label key={e.chave} className="opcao">
                <input
                  type="checkbox"
                  name="escopos"
                  value={e.chave}
                  checked={escopos.includes(e.chave)}
                  onChange={(ev) => setEscopos((s) => (ev.target.checked ? [...s, e.chave] : s.filter((x) => x !== e.chave)))}
                />
                <span>{e.nome}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="campo" style={{ maxWidth: 260 }}>
          <span>Área aproximada (m²)</span>
          <input name="area_m2" inputMode="decimal" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Opcional" />
          <small>Ajusta as horas das tarefas que crescem com a área.</small>
        </label>
      </div>

      {/* Passo 3 · Ambientes */}
      <div className="ambientes" hidden={passo !== 2}>
        <p className="apoio" style={{ maxWidth: 640 }}>
          Escolha os ambientes do projeto. Use + e − para ambientes repetidos: cada dormitório ou banheiro ganha as próprias tarefas de
          detalhamento. Esta lista também vira o ponto de partida do programa de necessidades.
        </p>
        {grupos.map((g) => (
          <div key={g.grupo} className="ambientes-grupo">
            <span className="rotulo">{g.grupo}</span>
            <div className="opcoes">
              {g.ambientes.map((a) => (
                <Ambiente key={a.chave} nome={a.nome} qtd={qtd[a.chave] ?? 0} aoAlternar={() => alternarAmbiente(a.chave)} aoMudar={(d) => mudarQtd(a.chave, d)} />
              ))}
            </div>
          </div>
        ))}
        <div className="ambientes-grupo">
          <span className="rotulo">Outros</span>
          <div className="opcoes">
            {extras.map((a) => (
              <Ambiente key={a.chave} nome={a.nome} qtd={qtd[a.chave] ?? 0} aoAlternar={() => alternarAmbiente(a.chave)} aoMudar={(d) => mudarQtd(a.chave, d)} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, maxWidth: 420 }}>
            <input
              className="entrada"
              value={novoAmbiente}
              onChange={(e) => setNovoAmbiente(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  adicionarAmbiente()
                }
              }}
              placeholder="Outro ambiente"
            />
            <button type="button" className="btn btn-sec" onClick={adicionarAmbiente}>Adicionar</button>
          </div>
        </div>
      </div>

      {/* Passo 4 · Revisão */}
      <div className="pilha-g" hidden={passo !== 3} style={{ maxWidth: 720 }}>
        <div className="placa pilha">
          <span className="rotulo rotulo-acento">Fluxo gerado</span>
          <div className="previa">
            <div className="previa-linha meta">
              <span>Fase</span>
              <span>Tarefas</span>
              <span>Horas</span>
            </div>
            {previa.fases.map((f) => (
              <div key={f.fase} className="previa-linha">
                <span>{FASES.find((x) => x.chave === f.fase)?.nome}</span>
                <span>{f.tarefas}</span>
                <span>{horasTotais(f.horas)}</span>
              </div>
            ))}
            <div className="previa-linha total">
              <span>Total</span>
              <span>{previa.quantidade}</span>
              <span>{horasTotais(previa.total)}</span>
            </div>
          </div>
        </div>
        <div className="numeros">
          <div className="numero-bloco">
            <b>{reais(previa.valor)}</b>
            <span>valor sugerido</span>
          </div>
          <div className="numero-bloco">
            <b>{reais(custoHora)}</b>
            <span>seu custo por hora</span>
          </div>
          <div className="numero-bloco">
            <b>{margem}%</b>
            <span>margem</span>
          </div>
          <div className="numero-bloco">
            <b>{horasTotais(planejamento?.horas ?? 0)}</b>
            <span>de planejamento</span>
          </div>
        </div>
        <div className="aviso">
          <Icone nome="ampulheta" />
          <span>
            Cerca de {Math.round(((planejamento?.horas ?? 0) / Math.max(1, previa.total)) * 100)}% das horas estão no planejamento: orçamento,
            proposta, contrato, briefing, programa, setorização, fluxos e conceito. Não é tempo perdido. É o que evita retrabalho nas fases
            seguintes. O ARQFLOW vai guiar cada etapa.
          </span>
        </div>
        <p className="meta">O custo por hora e a margem são os do seu Perfil. Você ajusta as horas de cada tarefa depois.</p>
      </div>

      {estado?.erro && (
        <p className="erro" role="alert" style={{ marginTop: 'var(--space-6)' }}>
          {estado.erro}
        </p>
      )}

      <div className="rodape-acoes">
        {passo > 0 ? (
          <button key="voltar" type="button" className="btn btn-sec" onClick={() => setPasso(passo - 1)}>Voltar</button>
        ) : (
          <Link href="/projetos" className="btn btn-sec">Cancelar</Link>
        )}
        {passo < PASSOS.length - 1 ? (
          <button key={`continuar-${passo}`} type="button" className="btn" disabled={!podeAvancar} onClick={() => setPasso(passo + 1)}>
            Continuar
            <Icone nome="seta" />
          </button>
        ) : (
          <button key="criar" type="submit" className="btn" disabled={enviando || escolhidos.length === 0}>
            {enviando ? 'Criando…' : situacao === 'proposta' ? 'Criar proposta' : 'Criar projeto'}
          </button>
        )}
      </div>
    </form>
  )
}

function Ambiente({ nome, qtd, aoAlternar, aoMudar }: { nome: string; qtd: number; aoAlternar: () => void; aoMudar: (d: number) => void }) {
  return (
    <span className={`ambiente${qtd > 0 ? ' ativo' : ''}`}>
      <button type="button" onClick={aoAlternar} aria-pressed={qtd > 0}>{nome}</button>
      {qtd > 0 && (
        <span className="qtd">
          <button type="button" aria-label={`Menos ${nome}`} onClick={() => aoMudar(-1)}>−</button>
          <span>{qtd}</span>
          <button type="button" aria-label={`Mais ${nome}`} onClick={() => aoMudar(1)}>+</button>
        </span>
      )}
    </span>
  )
}

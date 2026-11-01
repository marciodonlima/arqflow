import type { Metadata } from 'next'
import Link from 'next/link'
import { ESSENCIAIS_PLANEJAMENTO } from '@/lib/biblioteca'
import { projetosDe, sessao, tarefasDe } from '@/lib/dados'
import { dataCurta, hojeEm, somarDias } from '@/lib/datas'
import { horasTotais, reais } from '@/lib/formato'

export const metadata: Metadata = { title: 'Painel' }

export default async function Painel() {
  const { supabase, perfil } = await sessao()
  const hoje = hojeEm(perfil.fuso)
  const projetos = await projetosDe(supabase, ['andamento', 'proposta', 'pausado'])
  const tarefas = await tarefasDe(supabase, projetos.map((p) => p.id))
  const ativos = projetos.filter((p) => p.status === 'andamento')
  const propostas = projetos.filter((p) => p.status === 'proposta')
  const doProjeto = (id: string) => tarefas.filter((t) => t.projeto_id === id)
  const restantes = ativos.reduce((s, p) => s + doProjeto(p.id).filter((t) => t.status !== 'feita').reduce((a, t) => a + t.horas_estimadas, 0), 0)
  const semana = somarDias(hoje, -7)
  const feitasSemana = tarefas.filter((t) => t.status === 'feita' && t.concluida_em && hojeEm(perfil.fuso, new Date(t.concluida_em)) > semana)
  const atrasadas = tarefas.filter((t) => t.status !== 'feita' && t.data_prevista && t.data_prevista < hoje && ativos.some((p) => p.id === t.projeto_id))

  return (
    <>
      <header className="cabecalho">
        <div>
          <h1 className="titulo-pagina">Painel</h1>
          <p className="apoio">Uma visão do conjunto, para decidir com calma.</p>
        </div>
      </header>
      <div className="pilha-g">
        <div className="numeros placa">
          <div className="numero-bloco">
            <b>{ativos.length}<span className="meta"> / 5</span></b>
            <span>projetos ativos</span>
          </div>
          <div className="numero-bloco">
            <b>{reais(propostas.reduce((s, p) => s + (p.valor_proposta ?? 0), 0))}</b>
            <span>{propostas.length} {propostas.length === 1 ? 'proposta em aberto' : 'propostas em aberto'}</span>
          </div>
          <div className="numero-bloco">
            <b>{horasTotais(restantes)}</b>
            <span>de trabalho contratado pela frente</span>
          </div>
          <div className="numero-bloco">
            <b>{horasTotais(feitasSemana.reduce((s, t) => s + (t.horas_reais ?? t.horas_estimadas), 0))}</b>
            <span>concluídas nos últimos 7 dias</span>
          </div>
        </div>

        {atrasadas.length > 0 && (
          <p className="aviso">
            {atrasadas.length} {atrasadas.length === 1 ? 'tarefa passou' : 'tarefas passaram'} da data em projetos ativos. Em cada projeto, “Redistribuir datas” refaz o cronograma a partir de hoje.
          </p>
        )}

        <section className="pilha">
          <h2 className="titulo-secao">Projetos</h2>
          <div className="tabela-rolagem">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Projeto</th>
                  <th>Planejamento</th>
                  <th>Progresso</th>
                  <th className="num">Horas</th>
                  <th className="num">Valor</th>
                  <th className="num">Entrega</th>
                </tr>
              </thead>
              <tbody>
                {projetos.map((p) => {
                  const t = doProjeto(p.id)
                  const total = t.reduce((s, x) => s + x.horas_estimadas, 0)
                  const feitas = t.filter((x) => x.status === 'feita').reduce((s, x) => s + x.horas_estimadas, 0)
                  const ess = t.filter((x) => ESSENCIAIS_PLANEJAMENTO.includes(x.chave ?? ''))
                  const essOk = ess.filter((x) => x.status === 'feita').length
                  const pct = total ? Math.round((feitas / total) * 100) : 0
                  return (
                    <tr key={p.id}>
                      <td style={{ padding: '12px 8px 12px 0' }}>
                        <Link href={`/projetos/${p.id}`}>{p.nome}</Link>
                        <div className="meta">{p.status === 'proposta' ? 'proposta' : p.status === 'pausado' ? 'pausado' : p.cliente}</div>
                      </td>
                      <td className="meta numero">{essOk}/{ess.length}</td>
                      <td style={{ minWidth: 120 }}>
                        <div className="progresso"><i style={{ width: `${pct}%` }} /></div>
                        <span className="meta numero">{pct}%</span>
                      </td>
                      <td className="num numero">{horasTotais(total - feitas)}</td>
                      <td className="num numero">{reais(p.valor_contrato ?? p.valor_proposta)}</td>
                      <td className="num numero">{p.data_entrega ? dataCurta(p.data_entrega) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  )
}

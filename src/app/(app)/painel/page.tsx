import type { Metadata } from 'next'
import Link from 'next/link'
import { Cabecalho } from '@/components/Cabecalho'
import { Kpi } from '@/components/Kpi'
import { SeloSaude } from '@/components/Saude'
import { ESSENCIAIS_PLANEJAMENTO } from '@/lib/biblioteca'
import { estiloCor } from '@/lib/cores'
import { apontamentosDesde, carregarCarteira, sessao } from '@/lib/dados'
import { dataCurta, hojeEm, inicioDaSemana } from '@/lib/datas'
import { horas, horasTotais, reais } from '@/lib/formato'

export const metadata: Metadata = { title: 'Painel' }

export default async function Painel() {
  const { supabase, perfil, hoje } = await sessao()
  const [{ projetos, tarefas, parcelas, saudes }, apontamentos] = await Promise.all([
    carregarCarteira(supabase, perfil, hoje),
    apontamentosDesde(supabase, new Date(Date.now() - 9 * 86400000).toISOString()),
  ])
  const ativos = projetos.filter((p) => p.status === 'andamento')
  const propostas = projetos.filter((p) => p.status === 'proposta')
  const semana = inicioDaSemana(hoje)
  const horasSemana = apontamentos.filter((a) => hojeEm(perfil.fuso, new Date(a.inicio)) >= semana).reduce((s, a) => s + (a.horas ?? 0), 0)
  const contratado = ativos.reduce((s, p) => s + saudes[p.id].valor, 0)
  const margemPrevista = ativos.reduce((s, p) => s + saudes[p.id].margemPrevista, 0)
  const margemProjetada = ativos.reduce((s, p) => s + saudes[p.id].margemProjetada, 0)
  const horasProj = ativos.reduce((s, p) => s + saudes[p.id].horasProjetadas, 0)
  const valorHora = horasProj > 0 ? contratado / horasProj : null
  const aReceber = parcelas.filter((x) => x.status === 'a_receber' && ativos.some((p) => p.id === x.projeto_id)).reduce((s, x) => s + x.valor, 0)
  const atrasados = ativos.filter((p) => saudes[p.id].status === 'atrasado').length
  const atencao = ativos.filter((p) => saudes[p.id].status === 'atencao').length
  const restantes = ativos.reduce((s, p) => s + saudes[p.id].horasRestantes, 0)

  return (
    <>
      <Cabecalho titulo="Painel" subtitulo="O conjunto dos projetos: prazo, horas e dinheiro, para decidir com calma." />
      <div className="pilha-g">
        <div className="kpis kpis-4">
          <Kpi rotulo="Projetos ativos" valor={`${ativos.length}`} detalhe={atrasados || atencao ? `${atrasados} atrasados · ${atencao} pedem atenção` : 'todos no prazo'} destaque={atrasados ? 'ruim' : undefined} />
          <Kpi rotulo="Margem projetada" valor={reais(margemProjetada)} detalhe={`prevista ${reais(margemPrevista)}`} destaque={margemProjetada < margemPrevista - 1 ? 'ruim' : undefined} />
          <Kpi rotulo="Você ganha por hora" valor={valorHora ? reais(valorHora) : '—'} detalhe={`custo ${reais(perfil.custo_hora)}/h · meta ${reais(perfil.custo_hora * (1 + perfil.margem / 100))}/h`} destaque={valorHora && valorHora < perfil.custo_hora ? 'ruim' : undefined} />
          <Kpi rotulo="A receber agora" valor={reais(aReceber)} detalhe={`${propostas.length} propostas em aberto (${reais(propostas.reduce((s, p) => s + (p.valor_proposta ?? 0), 0))})`} />
        </div>
        <div className="kpis">
          <Kpi rotulo="Trabalho contratado pela frente" valor={horasTotais(restantes)} detalhe={`≈ ${Math.ceil(restantes / Math.max(1, perfil.horas_dia))} dias de ${horasTotais(perfil.horas_dia)}`} />
          <Kpi rotulo="Cronometrado nesta semana" valor={horas(horasSemana)} />
          <Kpi rotulo="Contratado em andamento" valor={reais(contratado)} />
        </div>

        <section className="pilha">
          <h2 className="titulo-secao">Projetos</h2>
          <div className="tabela-rolagem">
            <table className="tabela tabela-painel">
              <thead>
                <tr>
                  <th>Projeto</th>
                  <th>Saúde</th>
                  <th>Progresso</th>
                  <th className="num">Entrega</th>
                  <th className="num">Ritmo</th>
                  <th className="num">Margem prevista</th>
                  <th className="num">Margem projetada</th>
                  <th className="num">R$/hora</th>
                  <th className="num">Planejamento</th>
                </tr>
              </thead>
              <tbody>
                {[...ativos, ...propostas].map((p) => {
                  const s = saudes[p.id]
                  const t = tarefas.filter((x) => x.projeto_id === p.id)
                  const ess = t.filter((x) => ESSENCIAIS_PLANEJAMENTO.includes(x.chave ?? ''))
                  return (
                    <tr key={p.id} className="cor-projeto" style={estiloCor(p.cor)}>
                      <td>
                        <Link href={`/projetos/${p.id}`} className="nome-projeto">
                          <i className="marcador-cor" aria-hidden="true" />
                          {p.nome}
                        </Link>
                      </td>
                      <td><SeloSaude status={s.status} pequeno /></td>
                      <td style={{ minWidth: 110 }}>
                        <div className="progresso"><i style={{ width: `${Math.round(s.progresso * 100)}%` }} /></div>
                        <span className="meta numero">{Math.round(s.progresso * 100)}%{s.progressoEsperado != null ? ` de ${Math.round(s.progressoEsperado * 100)}% previsto` : ''}</span>
                      </td>
                      <td className="num numero">
                        {p.data_entrega ? dataCurta(p.data_entrega) : '—'}
                        {s.diasAtraso > 0 && <div className="atraso-mini">+{s.diasAtraso} dias</div>}
                      </td>
                      <td className="num numero">{s.ritmo != null ? `${Math.round(s.ritmo * 100)}%` : '—'}</td>
                      <td className="num numero">{s.valor ? reais(s.margemPrevista) : '—'}</td>
                      <td className={`num numero${s.impactoMargem < -1 ? ' estouro' : ''}`}>{s.valor ? reais(s.margemProjetada) : '—'}</td>
                      <td className="num numero">{s.valorHoraProjetado ? reais(s.valorHoraProjetado) : '—'}</td>
                      <td className="num numero">{ess.filter((x) => x.status === 'feita').length}/{ess.length}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="meta">Ritmo é o tempo real dividido pelo estimado nas tarefas concluídas com horas registradas. Acima de 100%, o projeto está custando mais do que o orçado.</p>
        </section>
      </div>
    </>
  )
}

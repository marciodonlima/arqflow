import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Icone } from '@/components/Icone'
import { Kpi } from '@/components/Kpi'
import { BarrasProgresso } from '@/components/Saude'
import { ESSENCIAIS_PLANEJAMENTO } from '@/lib/biblioteca'
import { carregarProjeto, sessao } from '@/lib/dados'
import { dataCurta } from '@/lib/datas'
import { horas, horasTotais, reais } from '@/lib/formato'
import { valorSugerido } from '@/lib/motor'
import { Planejamento } from './Planejamento'
import { ProximasTarefas } from './ProximasTarefas'
import { Redistribuir } from './Redistribuir'

export default async function VisaoGeral({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, perfil, hoje } = await sessao()
  const dados = await carregarProjeto(supabase, perfil, hoje, id)
  if (!dados) notFound()
  const { projeto, tarefas, parcelas, saude: s } = dados
  const essenciais = ESSENCIAIS_PLANEJAMENTO.map((chave) => tarefas.find((t) => t.chave === chave)).filter((t) => !!t)
  const proximas = tarefas.filter((t) => t.status !== 'feita').sort((a, b) => a.ordem - b.ordem).slice(0, 5)
  const aReceber = parcelas.filter((x) => x.status === 'a_receber').reduce((a, x) => a + x.valor, 0)
  const recebido = parcelas.filter((x) => x.status === 'recebida').reduce((a, x) => a + x.valor, 0)
  const metaHora = perfil.custo_hora * (1 + perfil.margem / 100)

  if (projeto.status === 'proposta' || projeto.status === 'arquivado') {
    const sugerido = valorSugerido(s.horasTotais, perfil.custo_hora, perfil.margem)
    return (
      <div className="grade-visao">
        <div className="pilha-g">
          <div className="placa pilha">
            <span className="rotulo rotulo-acento">{projeto.status === 'arquivado' ? 'Proposta arquivada' : 'Proposta em aberto'}</span>
            <div className="kpis">
              <Kpi rotulo="Horas estimadas" valor={horasTotais(s.horasTotais)} detalhe={`${tarefas.length} tarefas em 5 fases`} />
              <Kpi rotulo="Valor sugerido" valor={reais(sugerido)} detalhe={`${reais(perfil.custo_hora)}/h + ${perfil.margem}%`} />
              <Kpi rotulo="Valor proposto" valor={reais(projeto.valor_proposta)} detalhe={projeto.valor_proposta && s.horasTotais ? `${reais(projeto.valor_proposta / s.horasTotais)} por hora` : undefined} />
            </div>
            <p className="apoio">
              Enquanto o cliente decide, o ARQFLOW coloca o orçamento e a proposta no seu dia. Quando o contrato for assinado, as tarefas ganham datas e o
              projeto passa a ter prazo e margem acompanhados.
            </p>
            <div className="botoes">
              <Link href={`/projetos/${id}/proposta`} className="btn">
                Proposta e contrato
                <Icone nome="seta" />
              </Link>
            </div>
          </div>
          <ProximasTarefas tarefas={proximas} projetoId={id} projetoNome={projeto.nome} cor={projeto.cor} hoje={hoje} />
        </div>
        <Planejamento projetoId={id} essenciais={essenciais} partido={projeto.partido} />
      </div>
    )
  }

  const sinal = (n: number) => (n > 0 ? 'bom' : n < 0 ? 'ruim' : undefined)
  return (
    <div className="grade-visao">
      <div className="pilha-g">
        <section className={`saude-painel saude-${s.status}`}>
          <div className="saude-topo">
            <div>
              <span className="rotulo">Saúde do projeto</span>
              <p className="saude-manchete">{s.manchete}</p>
            </div>
            {projeto.status === 'andamento' && <Redistribuir projetoId={id} entrega={projeto.data_entrega} />}
          </div>
          {s.motivos.length > 0 ? (
            <ul className="saude-motivos">
              {s.motivos.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          ) : (
            <p className="apoio">Cronograma, horas e margem dentro do previsto. Siga no ritmo.</p>
          )}
          <BarrasProgresso saude={s} />
        </section>

        <div className="kpis kpis-4">
          <Kpi
            rotulo="Prazo"
            valor={projeto.data_entrega ? dataCurta(projeto.data_entrega) : '—'}
            detalhe={
              s.diasAtraso > 0
                ? `projeção: ${s.conclusaoProjetada ? dataCurta(s.conclusaoProjetada) : ''} (+${s.diasAtraso} ${s.diasAtraso === 1 ? 'dia útil' : 'dias úteis'})`
                : s.diasUteisRestantes != null
                  ? `${Math.max(0, s.diasUteisRestantes)} dias úteis restantes`
                  : undefined
            }
            destaque={s.diasAtraso > 0 ? 'ruim' : undefined}
          />
          <Kpi
            rotulo="Horas"
            valor={`${horasTotais(s.horasFeitas)} de ${horasTotais(s.horasTotais)}`}
            detalhe={
              s.ritmo != null
                ? `ritmo real: ${Math.round(s.ritmo * 100)}% do estimado · ${horas(s.horasReais)} cronometradas`
                : `${horas(s.horasReais)} cronometradas · ritmo aparece após 3 tarefas`
            }
            destaque={s.ritmo != null && s.ritmo > 1.08 ? 'ruim' : s.ritmo != null && s.ritmo < 0.95 ? 'bom' : undefined}
          />
          <Kpi
            rotulo="Margem projetada"
            valor={s.valor ? reais(s.margemProjetada) : '—'}
            detalhe={s.valor ? `prevista ${reais(s.margemPrevista)}${Math.abs(s.impactoMargem) >= 1 ? ` · ${s.impactoMargem > 0 ? '+' : ''}${reais(s.impactoMargem)}` : ''}` : 'informe o valor do contrato'}
            destaque={s.valor ? sinal(Math.round(s.impactoMargem)) : undefined}
          />
          <Kpi
            rotulo="Você ganha por hora"
            valor={s.valorHoraProjetado ? reais(s.valorHoraProjetado) : '—'}
            detalhe={`meta ${reais(metaHora)}/h · custo ${reais(perfil.custo_hora)}/h`}
            destaque={s.valorHoraProjetado ? (s.valorHoraProjetado < perfil.custo_hora ? 'ruim' : s.valorHoraProjetado >= metaHora ? 'bom' : undefined) : undefined}
          />
        </div>

        <ProximasTarefas tarefas={proximas} projetoId={id} projetoNome={projeto.nome} cor={projeto.cor} hoje={hoje} />

        <div className="placa pilha">
          <div className="secao-topo">
            <span className="rotulo rotulo-acento">Recebimentos</span>
            <Link href={`/projetos/${id}/financeiro`} className="btn-texto">Ver parcelas</Link>
          </div>
          <div className="kpis">
            <Kpi rotulo="Contrato" valor={reais(s.valor)} />
            <Kpi rotulo="Recebido" valor={reais(recebido)} />
            <Kpi rotulo="A receber agora" valor={reais(aReceber)} detalhe={s.parcelasAtrasadas > 0 ? `${reais(s.parcelasAtrasadas)} presos a fases atrasadas` : undefined} destaque={s.parcelasAtrasadas > 0 ? 'ruim' : undefined} />
          </div>
        </div>
      </div>
      <Planejamento projetoId={id} essenciais={essenciais} partido={projeto.partido} />
    </div>
  )
}

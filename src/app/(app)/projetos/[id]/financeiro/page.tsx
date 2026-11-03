import { notFound } from 'next/navigation'
import { Kpi } from '@/components/Kpi'
import { carregarProjeto, sessao } from '@/lib/dados'
import { horas, reais } from '@/lib/formato'
import { Parcelas } from './Parcelas'

export default async function Financeiro({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, perfil, hoje } = await sessao()
  const dados = await carregarProjeto(supabase, perfil, hoje, id)
  if (!dados) notFound()
  const { projeto, parcelas, saude: s, tarefas } = dados
  const recebido = parcelas.filter((x) => x.status === 'recebida').reduce((a, x) => a + x.valor, 0)
  const aReceber = parcelas.filter((x) => x.status === 'a_receber').reduce((a, x) => a + x.valor, 0)
  const previsto = parcelas.filter((x) => x.status === 'prevista').reduce((a, x) => a + x.valor, 0)
  const somaParcelas = recebido + aReceber + previsto
  const gasto = tarefas.reduce((a, t) => a + (t.horas_reais ?? (t.status === 'feita' ? t.horas_estimadas : 0)), 0) * perfil.custo_hora

  return (
    <div className="pilha-g">
      <div className="kpis kpis-4">
        <Kpi rotulo="Contrato" valor={reais(s.valor)} detalhe={somaParcelas && Math.abs(somaParcelas - s.valor) > 1 ? `parcelas somam ${reais(somaParcelas)}` : undefined} destaque={somaParcelas && Math.abs(somaParcelas - s.valor) > 1 ? 'ruim' : undefined} />
        <Kpi rotulo="Recebido" valor={reais(recebido)} detalhe={s.valor ? `${Math.round((recebido / s.valor) * 100)}% do contrato` : undefined} />
        <Kpi rotulo="A receber agora" valor={reais(aReceber)} detalhe={s.parcelasAtrasadas > 0 ? `${reais(s.parcelasAtrasadas)} dependem de fases atrasadas` : 'fases concluídas'} destaque={s.parcelasAtrasadas > 0 ? 'ruim' : undefined} />
        <Kpi rotulo="Resultado até aqui" valor={reais(recebido - gasto)} detalhe={`recebido − ${horas(gasto / Math.max(1, perfil.custo_hora))} de trabalho a ${reais(perfil.custo_hora)}/h`} destaque={recebido - gasto < 0 ? 'ruim' : 'bom'} />
      </div>
      <div className="kpis">
        <Kpi rotulo="Margem prevista" valor={reais(s.margemPrevista)} />
        <Kpi rotulo="Margem projetada" valor={reais(s.margemProjetada)} detalhe={Math.abs(s.impactoMargem) >= 1 ? `${s.impactoMargem > 0 ? '+' : ''}${reais(s.impactoMargem)} pelo ritmo real` : 'no ritmo do estimado'} destaque={s.impactoMargem < -1 ? 'ruim' : s.impactoMargem > 1 ? 'bom' : undefined} />
        <Kpi rotulo="Valor por hora" valor={s.valorHoraProjetado ? reais(s.valorHoraProjetado) : '—'} detalhe={`custo ${reais(perfil.custo_hora)}/h`} />
      </div>
      <Parcelas projetoId={id} parcelas={parcelas} temValor={!!s.valor} contratado={projeto.status !== 'proposta'} hoje={hoje} />
    </div>
  )
}

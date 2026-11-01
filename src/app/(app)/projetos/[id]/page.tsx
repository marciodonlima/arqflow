import { notFound } from 'next/navigation'
import { ESSENCIAIS_PLANEJAMENTO } from '@/lib/biblioteca'
import { projetoPorId, projetosDe, sessao, tarefasDe } from '@/lib/dados'
import { diasUteisEntre, hojeEm, proximoDiaUtil } from '@/lib/datas'
import { valorSugerido } from '@/lib/motor'
import { Kanban } from './Kanban'
import { PainelFinanceiro, PainelProposta } from './Paineis'
import { Planejamento } from './Planejamento'

export default async function PaginaProjeto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, perfil } = await sessao()
  const projeto = await projetoPorId(supabase, id)
  if (!projeto) notFound()
  const [tarefas, ativos] = await Promise.all([tarefasDe(supabase, [id]), projetosDe(supabase, ['andamento'])])
  const hoje = hojeEm(perfil.fuso)

  const total = tarefas.reduce((s, t) => s + t.horas_estimadas, 0)
  const feitas = tarefas.filter((t) => t.status === 'feita')
  const horasFeitas = feitas.reduce((s, t) => s + t.horas_estimadas, 0)
  const comReal = feitas.filter((t) => t.horas_reais != null)
  const ritmo = comReal.length >= 3 ? comReal.reduce((s, t) => s + (t.horas_reais ?? 0), 0) / comReal.reduce((s, t) => s + t.horas_estimadas, 0) : null
  const restantes = tarefas.filter((t) => t.status !== 'feita').reduce((s, t) => s + t.horas_estimadas, 0)
  const diasRestantes = projeto.data_entrega ? diasUteisEntre(proximoDiaUtil(hoje), projeto.data_entrega) : 0
  const atrasadas = tarefas.filter((t) => t.status !== 'feita' && t.data_prevista && t.data_prevista < hoje).length

  const essenciais = ESSENCIAIS_PLANEJAMENTO.map((chave) => tarefas.find((t) => t.chave === chave)).filter((t) => !!t)

  return (
    <div className="pilha-g">
      <div className="projeto-topo">
        {projeto.status === 'proposta' || projeto.status === 'arquivado' ? (
          <PainelProposta
            projeto={projeto}
            horas={total}
            sugerido={valorSugerido(total, perfil.custo_hora, perfil.margem)}
            custoHora={perfil.custo_hora}
            margem={perfil.margem}
            hoje={hoje}
            ativos={ativos.length}
          />
        ) : (
          <PainelFinanceiro
            projeto={projeto}
            total={total}
            horasFeitas={horasFeitas}
            restantes={restantes}
            diasRestantes={diasRestantes}
            custoHora={perfil.custo_hora}
            horasDia={perfil.horas_dia}
            ritmo={ritmo}
            atrasadas={atrasadas}
          />
        )}
        <Planejamento projetoId={projeto.id} essenciais={essenciais} partido={projeto.partido} />
      </div>
      <Kanban projetoId={projeto.id} projetoNome={projeto.nome} tarefas={tarefas} hoje={hoje} planejamentoAberto={essenciais.filter((t) => t.status !== 'feita').length} />
    </div>
  )
}

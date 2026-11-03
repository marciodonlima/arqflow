import { notFound } from 'next/navigation'
import { Kpi } from '@/components/Kpi'
import { FASES } from '@/lib/biblioteca'
import { carregarProjeto, projetosDe, sessao } from '@/lib/dados'
import { dataCurta } from '@/lib/datas'
import { horasTotais, reais } from '@/lib/formato'
import { valorSugerido } from '@/lib/motor'
import { FormProposta } from './FormProposta'

export default async function Proposta({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, perfil, hoje } = await sessao()
  const dados = await carregarProjeto(supabase, perfil, hoje, id)
  if (!dados) notFound()
  const { projeto, tarefas, saude } = dados
  const ativos = (await projetosDe(supabase, ['andamento'])).length
  const total = saude.horasTotais
  const sugerido = valorSugerido(total, perfil.custo_hora, perfil.margem)
  const valor = projeto.valor_contrato ?? projeto.valor_proposta ?? sugerido
  const porFase = FASES.map((f) => {
    const h = tarefas.filter((t) => t.fase === f.chave).reduce((s, t) => s + t.horas_estimadas, 0)
    return { fase: f.nome, tarefas: tarefas.filter((t) => t.fase === f.chave).length, horas: h, valor: total ? (valor * h) / total : 0 }
  }).filter((x) => x.tarefas > 0)

  return (
    <div className="grade-visao">
      <div className="pilha-g">
        <div className="placa pilha">
          <span className="rotulo rotulo-acento">Composição do valor</span>
          <div className="kpis">
            <Kpi rotulo="Horas estimadas" valor={horasTotais(total)} />
            <Kpi rotulo="Seu custo" valor={reais(total * perfil.custo_hora)} detalhe={`${reais(perfil.custo_hora)} por hora`} />
            <Kpi rotulo="Valor sugerido" valor={reais(sugerido)} detalhe={`custo + ${perfil.margem}% de margem`} />
          </div>
          <div className="tabela-rolagem">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Fase</th>
                  <th className="num">Tarefas</th>
                  <th className="num">Horas</th>
                  <th className="num">Valor da fase</th>
                </tr>
              </thead>
              <tbody>
                {porFase.map((f) => (
                  <tr key={f.fase}>
                    <td>{f.fase}</td>
                    <td className="num numero">{f.tarefas}</td>
                    <td className="num numero">{horasTotais(f.horas)}</td>
                    <td className="num numero">{reais(f.valor)}</td>
                  </tr>
                ))}
                <tr className="total">
                  <td>Total</td>
                  <td className="num numero">{tarefas.length}</td>
                  <td className="num numero">{horasTotais(total)}</td>
                  <td className="num numero">{reais(valor)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="meta">
            O valor de cada fase segue a proporção das horas. Use essa tabela para montar as parcelas e a descrição da proposta. O custo por hora e a margem
            vêm do seu Perfil; na próxima etapa, eles nascem de um perfil de custos completo e ganham comparação com a tabela do CAU e o mercado.
          </p>
        </div>
      </div>
      <div className="pilha-g">
        {projeto.status === 'proposta' || projeto.status === 'arquivado' ? (
          <FormProposta
            projetoId={id}
            arquivada={projeto.status === 'arquivado'}
            valorProposta={projeto.valor_proposta}
            prazoDias={projeto.prazo_dias}
            prazoTipo={projeto.prazo_tipo}
            hoje={hoje}
            ativos={ativos}
          />
        ) : (
          <div className="placa pilha">
            <span className="rotulo rotulo-acento">Contrato</span>
            <div className="kpis">
              <Kpi rotulo="Valor" valor={reais(projeto.valor_contrato ?? projeto.valor_proposta)} />
              <Kpi rotulo="Início" valor={projeto.data_inicio ? dataCurta(projeto.data_inicio) : '—'} />
              <Kpi
                rotulo="Entrega"
                valor={projeto.data_entrega ? dataCurta(projeto.data_entrega) : '—'}
                detalhe={projeto.prazo_dias ? `${projeto.prazo_dias} dias ${projeto.prazo_tipo === 'uteis' ? 'úteis' : 'corridos'}` : undefined}
              />
            </div>
            <p className="meta">A geração da proposta e da minuta do contrato com o assistente de IA entra na etapa 3.</p>
          </div>
        )}
      </div>
    </div>
  )
}

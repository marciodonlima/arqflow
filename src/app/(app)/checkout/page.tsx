import type { Metadata } from 'next'
import Link from 'next/link'
import { capturasAbertas, diaDe, projetosDe, sessao, tarefasDe } from '@/lib/dados'
import { hojeEm, somarDiasUteis } from '@/lib/datas'
import { montarDia } from '@/lib/prioridade'
import { FormCheckout } from './FormCheckout'

export const metadata: Metadata = { title: 'Check-out' }

export default async function Checkout() {
  const { supabase, perfil } = await sessao()
  const hoje = hojeEm(perfil.fuso)
  const amanha = somarDiasUteis(hoje, 1)
  const [projetos, dia, capturas] = await Promise.all([projetosDe(supabase, ['andamento', 'proposta']), diaDe(supabase, hoje), capturasAbertas(supabase)])
  const tarefas = await tarefasDe(supabase, projetos.map((p) => p.id))
  const nome = (id: string) => projetos.find((p) => p.id === id)?.nome ?? ''
  const concluidas = tarefas.filter((t) => t.status === 'feita' && t.concluida_em && hojeEm(perfil.fuso, new Date(t.concluida_em)) === hoje)
  const { lista } = montarDia(tarefas, projetos, amanha, null, perfil.horas_dia)
  const opcoes = lista.slice(0, 6).map((x) => ({ id: x.tarefa.id, titulo: x.tarefa.titulo, projeto: x.projeto.nome }))

  return (
    <div style={{ maxWidth: 680 }}>
      <header className="cabecalho">
        <div>
          <h1 className="titulo-pagina">Check-out</h1>
          <p className="apoio">Um minuto para fechar os loops do dia. O que fica anotado aqui não precisa ficar na cabeça.</p>
        </div>
      </header>
      <div className="pilha-g">
        <section className="pilha" style={{ gap: 'var(--space-3)' }}>
          <span className="rotulo">1 · O que você concluiu hoje</span>
          {concluidas.length === 0 ? (
            <p className="apoio">Nenhuma tarefa marcada como concluída hoje. Tudo bem: dias de reunião, obra e imprevisto também são trabalho.</p>
          ) : (
            <ul className="lista-simples">
              {concluidas.map((t) => (
                <li key={t.id}>
                  <span>{t.titulo}</span>
                  <span className="meta">{nome(t.projeto_id)}</span>
                </li>
              ))}
            </ul>
          )}
          {capturas.length > 0 && (
            <p className="aviso">
              <span>
                {capturas.length} {capturas.length === 1 ? 'item espera' : 'itens esperam'} na caixa de captura. <Link href="/captura" className="btn-texto">Revisar antes de fechar</Link>
              </span>
            </p>
          )}
        </section>
        <FormCheckout opcoes={opcoes} fechado={!!dia?.checkout_em} abertoAnterior={dia?.aberto ?? ''} escolhida={dia?.amanha_tarefa ?? null} />
      </div>
    </div>
  )
}

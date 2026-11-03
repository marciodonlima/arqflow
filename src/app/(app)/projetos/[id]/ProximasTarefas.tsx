'use client'

import Link from 'next/link'
import { useState } from 'react'
import { LinhaTarefa } from '@/components/LinhaTarefa'
import { PainelTarefa } from '@/components/PainelTarefa'
import { nomeFase } from '@/lib/biblioteca'
import { quando } from '@/lib/datas'
import type { Tarefa } from '@/lib/tipos'

export function ProximasTarefas({ tarefas, projetoId, projetoNome, cor, hoje }: { tarefas: Tarefa[]; projetoId: string; projetoNome: string; cor: string | null; hoje: string }) {
  const [abertaId, setAbertaId] = useState<string | null>(null)
  const aberta = tarefas.find((t) => t.id === abertaId) ?? null
  return (
    <section className="pilha" style={{ gap: 'var(--space-2)' }}>
      <div className="secao-topo">
        <span className="rotulo">Próximas tarefas</span>
        <Link href={`/projetos/${projetoId}/tarefas`} className="btn-texto">Ver todas</Link>
      </div>
      {tarefas.length === 0 ? (
        <p className="apoio">Nenhuma tarefa pendente.</p>
      ) : (
        <div className="tarefas">
          {tarefas.map((t) => (
            <LinhaTarefa key={t.id} tarefa={t} cor={cor} meta={`${nomeFase(t.fase)} · ${quando(t.data_prevista, hoje)}`} aoAbrir={() => setAbertaId(t.id)} />
          ))}
        </div>
      )}
      <PainelTarefa tarefa={aberta} projetoNome={projetoNome} projetoId={projetoId} aoFechar={() => setAbertaId(null)} />
    </section>
  )
}

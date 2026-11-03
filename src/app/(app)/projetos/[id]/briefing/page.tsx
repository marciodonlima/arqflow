import { notFound } from 'next/navigation'
import { BRIEFING, MODELO_POR_CHAVE, ehResidencial } from '@/lib/biblioteca'
import { projetoPorId, sessao } from '@/lib/dados'
import { FormBriefing } from './FormBriefing'

export default async function Briefing({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await sessao()
  const projeto = await projetoPorId(supabase, id)
  if (!projeto) notFound()
  const { data: tarefa } = await supabase.from('tarefas').select('status').eq('projeto_id', id).eq('chave', 'briefing').maybeSingle()
  const modelo = MODELO_POR_CHAVE.briefing
  return (
    <div className="pilha-g" style={{ maxWidth: 760 }}>
      <div className="porque">
        <span className="rotulo rotulo-acento">Por que importa</span>
        <p className="apoio">{modelo.porque}</p>
        <ol>
          {modelo.como?.map((c) => <li key={c}>{c}</li>)}
        </ol>
      </div>
      <FormBriefing
        projetoId={id}
        perguntas={[...BRIEFING[ehResidencial(projeto.tipologia) ? 'res' : 'com'], { chave: 'adicionais', pergunta: 'Informações adicionais', dica: 'Tudo o que não coube nas perguntas acima: impressões da reunião, pedidos soltos, alertas.' }]}
        respostas={projeto.briefing}
        concluido={tarefa?.status === 'feita'}
      />
    </div>
  )
}

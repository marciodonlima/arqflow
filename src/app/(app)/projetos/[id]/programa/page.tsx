import { notFound } from 'next/navigation'
import { MODELO_POR_CHAVE, SETORES, ehResidencial, modeloAmbiente } from '@/lib/biblioteca'
import { projetoPorId, sessao } from '@/lib/dados'
import { EditorPrograma } from './EditorPrograma'

export default async function Programa({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await sessao()
  const projeto = await projetoPorId(supabase, id)
  if (!projeto) notFound()
  const { data: etapas } = await supabase.from('tarefas').select('chave, status').eq('projeto_id', id).in('chave', ['programa', 'setorizacao'])
  const feita = (c: string) => etapas?.some((e) => e.chave === c && e.status === 'feita') ?? false
  const referencias: Record<string, [number, number]> = {}
  for (const l of projeto.programa) referencias[l.id] = modeloAmbiente(l.id.replace(/-\d+$/, '')).area

  return (
    <div className="pilha-g">
      <div className="grade-2" style={{ gap: 'var(--space-8)' }}>
        <div className="porque">
          <span className="rotulo rotulo-acento">Programa de necessidades</span>
          <p className="apoio">{MODELO_POR_CHAVE.programa.porque}</p>
        </div>
        <div className="porque">
          <span className="rotulo rotulo-acento">Setorização</span>
          <p className="apoio">{MODELO_POR_CHAVE.setorizacao.porque}</p>
        </div>
      </div>
      <EditorPrograma
        projetoId={id}
        linhasIniciais={projeto.programa}
        setores={SETORES[ehResidencial(projeto.tipologia) ? 'res' : 'com']}
        referencias={referencias}
        programaFeito={feita('programa')}
        setorizacaoFeita={feita('setorizacao')}
      />
    </div>
  )
}

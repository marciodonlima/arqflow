import type { Metadata } from 'next'
import { Cabecalho } from '@/components/Cabecalho'
import { ORIGENS } from '@/lib/biblioteca'
import { capturasAbertas, projetosDe, sessao } from '@/lib/dados'
import { dataCurta, hojeEm } from '@/lib/datas'
import { ItemCaptura } from './ItemCaptura'

export const metadata: Metadata = { title: 'Caixa de entrada' }

export default async function Captura() {
  const { supabase, perfil } = await sessao()
  const [capturas, projetos] = await Promise.all([capturasAbertas(supabase), projetosDe(supabase, ['andamento', 'proposta'])])
  const hoje = hojeEm(perfil.fuso)
  return (
    <div style={{ maxWidth: 760 }}>
      <Cabecalho titulo="Caixa de entrada" subtitulo="O que saiu da cabeça durante o dia. Cada item vira tarefa, fica resolvido ou sai da lista." />
      {capturas.length === 0 ? (
        <div className="vazio">
          <h2 className="titulo-secao">Caixa vazia</h2>
          <p className="apoio">Use o botão Capturar no topo (ou a tecla C no computador) sempre que algo aparecer: um recado do cliente, uma ideia, uma pendência. Anotar já tira o peso.</p>
        </div>
      ) : (
        <div>
          {capturas.map((c) => {
            const d = hojeEm(perfil.fuso, new Date(c.criado_em))
            return (
              <ItemCaptura
                key={c.id}
                id={c.id}
                texto={c.texto}
                meta={`${ORIGENS.find((o) => o.chave === c.origem)?.nome ?? ''} · ${d === hoje ? 'hoje' : dataCurta(d)}`}
                projetoId={c.projeto_id}
                projetos={projetos.map((p) => ({ id: p.id, nome: p.nome }))}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

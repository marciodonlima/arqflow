import type { Metadata } from 'next'
import Link from 'next/link'
import { Cabecalho } from '@/components/Cabecalho'
import { Icone } from '@/components/Icone'
import { SeloSaude } from '@/components/Saude'
import { TIPOLOGIAS, nomeFase } from '@/lib/biblioteca'
import { estiloCor } from '@/lib/cores'
import { carregarCarteira, sessao } from '@/lib/dados'
import { dataCurta } from '@/lib/datas'
import { horasTotais, reais } from '@/lib/formato'
import { faseAtual, type Saude } from '@/lib/saude'
import type { Projeto, Tarefa } from '@/lib/tipos'

export const metadata: Metadata = { title: 'Projetos' }

const LIMITE_SOLO = 5

export default async function Projetos() {
  const { supabase, perfil, hoje } = await sessao()
  const { projetos, tarefas, saudes } = await carregarCarteira(supabase, perfil, hoje, ['andamento', 'proposta', 'pausado', 'concluido', 'arquivado'])
  const grupo = (s: Projeto['status'][]) => projetos.filter((p) => s.includes(p.status))
  const andamento = grupo(['andamento']).sort((a, b) => ordemSaude(saudes[a.id]) - ordemSaude(saudes[b.id]))
  const propostas = grupo(['proposta'])
  const pausados = grupo(['pausado'])
  const encerrados = grupo(['concluido', 'arquivado'])
  const valorPropostas = propostas.reduce((s, p) => s + (p.valor_proposta ?? 0), 0)

  return (
    <>
      <Cabecalho
        titulo="Projetos"
        subtitulo={`${andamento.length} de ${LIMITE_SOLO} ativos no plano Solo · ${propostas.length} ${propostas.length === 1 ? 'proposta' : 'propostas'} em aberto${valorPropostas ? ` (${reais(valorPropostas)})` : ''}`}
        acoes={
          <Link href="/projetos/novo" className="btn">
            <Icone nome="mais" />
            Novo projeto
          </Link>
        }
      />

      {projetos.length === 0 ? (
        <div className="vazio">
          <h2 className="titulo-secao">Nenhum projeto ainda</h2>
          <p className="apoio">
            Todo projeto entra no ARQFLOW como proposta. Você informa a tipologia, o escopo e os ambientes, e o app estima as horas de cada fase e sugere um valor.
            Se o projeto já estiver contratado, é só marcar na hora de cadastrar.
          </p>
          <Link href="/projetos/novo" className="btn">Cadastrar o primeiro projeto</Link>
        </div>
      ) : (
        <div className="pilha-g">
          {andamento.length > 0 && <Grupo titulo="Em andamento" lista={andamento} tarefas={tarefas} saudes={saudes} />}
          {propostas.length > 0 && <Grupo titulo="Em proposta" lista={propostas} tarefas={tarefas} saudes={saudes} />}
          {pausados.length > 0 && <Grupo titulo="Pausados" lista={pausados} tarefas={tarefas} saudes={saudes} />}
          {encerrados.length > 0 && (
            <details>
              <summary className="rotulo" style={{ cursor: 'pointer', marginBottom: 12 }}>Concluídos e arquivados ({encerrados.length})</summary>
              <Grupo titulo="" lista={encerrados} tarefas={tarefas} saudes={saudes} />
            </details>
          )}
        </div>
      )}
    </>
  )
}

function ordemSaude(s?: Saude) {
  return s?.status === 'atrasado' ? 0 : s?.status === 'atencao' ? 1 : 2
}

function Grupo({ titulo, lista, tarefas, saudes }: { titulo: string; lista: Projeto[]; tarefas: Tarefa[]; saudes: Record<string, Saude> }) {
  return (
    <section className="pilha" style={{ gap: 'var(--space-3)' }}>
      {titulo && <h2 className="rotulo">{titulo}</h2>}
      <div className="cartoes-projeto">
        {lista.map((p) => {
          const s = saudes[p.id]
          const tip = TIPOLOGIAS.find((x) => x.chave === p.tipologia)?.nome
          const fase = faseAtual(tarefas.filter((t) => t.projeto_id === p.id))
          return (
            <Link key={p.id} href={`/projetos/${p.id}`} className="cartao-projeto cor-projeto" style={estiloCor(p.cor)}>
              <div className="cartao-projeto-topo">
                <div>
                  <h3>{p.nome}</h3>
                  <p className="meta">{[p.cliente, tip].filter(Boolean).join(' · ')}</p>
                </div>
                {s && <SeloSaude status={s.status} texto={s.status === 'em_dia' || s.status === 'proposta' || s.status === 'parado' ? undefined : s.manchete} pequeno />}
              </div>
              {p.status === 'proposta' ? (
                <div className="cartao-projeto-numeros">
                  <span><b className="numero">{reais(p.valor_proposta)}</b> proposta</span>
                  <span><b className="numero">{horasTotais(s?.horasTotais ?? 0)}</b> estimadas</span>
                </div>
              ) : (
                <>
                  <div className="progresso" aria-hidden="true"><i style={{ width: `${Math.round((s?.progresso ?? 0) * 100)}%` }} /></div>
                  <div className="cartao-projeto-numeros">
                    <span><b className="numero">{Math.round((s?.progresso ?? 0) * 100)}%</b> {fase ? nomeFase(fase).toLowerCase() : 'concluído'}</span>
                    {p.data_entrega && <span><b className="numero">{dataCurta(p.data_entrega)}</b> entrega</span>}
                    {s && s.valor > 0 && (
                      <span>
                        <b className="numero">{reais(s.margemProjetada)}</b> margem
                        {s.impactoMargem < -1 && <em className="numero"> ({reais(s.impactoMargem)})</em>}
                      </span>
                    )}
                  </div>
                </>
              )}
            </Link>
          )
        })}
      </div>
    </section>
  )
}

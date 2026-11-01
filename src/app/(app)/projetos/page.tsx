import type { Metadata } from 'next'
import Link from 'next/link'
import { Icone } from '@/components/Icone'
import { TIPOLOGIAS } from '@/lib/biblioteca'
import { projetosDe, sessao, tarefasDe } from '@/lib/dados'
import { dataCurta } from '@/lib/datas'
import { reais } from '@/lib/formato'
import type { Projeto, Tarefa } from '@/lib/tipos'

export const metadata: Metadata = { title: 'Projetos' }

const LIMITE_SOLO = 5

export default async function Projetos() {
  const { supabase } = await sessao()
  const projetos = await projetosDe(supabase)
  const tarefas = await tarefasDe(supabase, projetos.map((p) => p.id))
  const grupo = (s: Projeto['status'][]) => projetos.filter((p) => s.includes(p.status))
  const andamento = grupo(['andamento'])
  const propostas = grupo(['proposta'])
  const pausados = grupo(['pausado'])
  const encerrados = grupo(['concluido', 'arquivado'])

  return (
    <>
      <header className="cabecalho">
        <div>
          <h1 className="titulo-pagina">Projetos</h1>
          <p className="apoio">
            {andamento.length} de {LIMITE_SOLO} projetos ativos no plano Solo. Propostas não contam.
          </p>
        </div>
        <Link href="/projetos/novo" className="btn">
          <Icone nome="mais" />
          Novo projeto
        </Link>
      </header>

      {projetos.length === 0 ? (
        <div className="vazio">
          <h2 className="titulo-secao">Nenhum projeto ainda</h2>
          <p className="apoio">
            Todo projeto entra no ARQFLOW como proposta. Você informa a tipologia, o escopo e os ambientes, e o app estima as horas de cada fase e
            sugere um valor. Se o projeto já estiver contratado, é só marcar na hora de cadastrar.
          </p>
          <Link href="/projetos/novo" className="btn">Cadastrar o primeiro projeto</Link>
        </div>
      ) : (
        <div className="pilha-g">
          {andamento.length > 0 && <Grupo titulo="Em andamento" lista={andamento} tarefas={tarefas} />}
          {propostas.length > 0 && <Grupo titulo="Em proposta" lista={propostas} tarefas={tarefas} />}
          {pausados.length > 0 && <Grupo titulo="Pausados" lista={pausados} tarefas={tarefas} />}
          {encerrados.length > 0 && (
            <details>
              <summary className="rotulo" style={{ cursor: 'pointer', marginBottom: 12 }}>Concluídos e arquivados ({encerrados.length})</summary>
              <Grupo titulo="" lista={encerrados} tarefas={tarefas} />
            </details>
          )}
        </div>
      )}
    </>
  )
}

function Grupo({ titulo, lista, tarefas }: { titulo: string; lista: Projeto[]; tarefas: Tarefa[] }) {
  return (
    <section className="pilha" style={{ gap: 'var(--space-2)' }}>
      {titulo && <h2 className="rotulo">{titulo}</h2>}
      <div className="projetos">
        {lista.map((p) => {
          const t = tarefas.filter((x) => x.projeto_id === p.id)
          const total = t.reduce((s, x) => s + x.horas_estimadas, 0)
          const feitas = t.filter((x) => x.status === 'feita').reduce((s, x) => s + x.horas_estimadas, 0)
          const pct = total ? Math.round((feitas / total) * 100) : 0
          const tip = TIPOLOGIAS.find((x) => x.chave === p.tipologia)?.nome
          return (
            <Link key={p.id} href={`/projetos/${p.id}`} className="projeto-linha">
              <div>
                <h3>{p.nome}</h3>
                <p className="apoio">{[p.cliente, tip].filter(Boolean).join(' · ')}</p>
              </div>
              <div className="projeto-dir">
                {p.status === 'proposta' ? (
                  <>
                    <span className="numero">{reais(p.valor_proposta)}</span>
                    <span className="meta">proposta</span>
                  </>
                ) : (
                  <>
                    <span className="meta numero">{pct}%{p.data_entrega ? ` · entrega ${dataCurta(p.data_entrega)}` : ''}</span>
                    <div className="progresso" aria-hidden="true"><i style={{ width: `${pct}%` }} /></div>
                  </>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

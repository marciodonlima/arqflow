import { notFound } from 'next/navigation'
import { Cabecalho } from '@/components/Cabecalho'
import { SeloSaude } from '@/components/Saude'
import { TIPOLOGIAS } from '@/lib/biblioteca'
import { estiloCor } from '@/lib/cores'
import { carregarProjeto, sessao } from '@/lib/dados'
import { dataCurta } from '@/lib/datas'
import { AbasProjeto } from './AbasProjeto'
import { AcoesProjeto } from './AcoesProjeto'

export default async function LayoutProjeto({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, perfil, hoje } = await sessao()
  const dados = await carregarProjeto(supabase, perfil, hoje, id)
  if (!dados) notFound()
  const { projeto, saude } = dados
  const tip = TIPOLOGIAS.find((t) => t.chave === projeto.tipologia)?.nome
  return (
    <div className="cor-projeto projeto-espaco" style={estiloCor(projeto.cor)}>
      <Cabecalho
        voltar={{ href: '/projetos', rotulo: 'Projetos' }}
        antesDoTitulo={<i className="marcador-cor marcador-grande" aria-hidden="true" />}
        titulo={projeto.nome}
        subtitulo={
          <span className="subtitulo-projeto">
            <SeloSaude status={saude.status} texto={saude.manchete} />
            <span>{[projeto.cliente, tip, projeto.data_entrega ? `entrega ${dataCurta(projeto.data_entrega)}` : null].filter(Boolean).join(' · ')}</span>
          </span>
        }
        acoes={<AcoesProjeto id={projeto.id} status={projeto.status} cor={projeto.cor} />}
      />
      <AbasProjeto id={projeto.id} proposta={projeto.status === 'proposta'} />
      {children}
    </div>
  )
}

import type { Metadata } from 'next'
import { proximaCor } from '@/lib/cores'
import { projetosDe, sessao } from '@/lib/dados'
import { hojeEm } from '@/lib/datas'
import { NovoProjeto } from './NovoProjeto'

export const metadata: Metadata = { title: 'Novo projeto' }

export default async function Pagina() {
  const { perfil, supabase } = await sessao()
  const ativos = await projetosDe(supabase, ['andamento', 'proposta'])
  return <NovoProjeto custoHora={perfil.custo_hora} margem={perfil.margem} hoje={hojeEm(perfil.fuso)} corSugerida={proximaCor(ativos.map((p) => p.cor))} />
}

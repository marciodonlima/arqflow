import type { Metadata } from 'next'
import { sessao } from '@/lib/dados'
import { hojeEm } from '@/lib/datas'
import { NovoProjeto } from './NovoProjeto'

export const metadata: Metadata = { title: 'Novo projeto' }

export default async function Pagina() {
  const { perfil } = await sessao()
  return <NovoProjeto custoHora={perfil.custo_hora} margem={perfil.margem} hoje={hojeEm(perfil.fuso)} />
}

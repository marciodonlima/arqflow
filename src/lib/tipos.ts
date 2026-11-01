export type Estilo = 'basalto' | 'calcario' | 'concreto' | 'musgo' | 'nanquim'
export type Esquema = 'claro' | 'escuro'

export type Fase = 'planejamento' | 'estudo' | 'anteprojeto' | 'executivo' | 'entrega'
export type ModoTarefa = 'analitico' | 'criativo' | 'operacional' | 'relacional'
export type TipoTarefa = 'execucao' | 'exploracao'
export type StatusTarefa = 'a_fazer' | 'fazendo' | 'feita'
export type ModoDia = 'afiado' | 'criativo' | 'mecanico' | 'nebuloso'
export type StatusProjeto = 'proposta' | 'andamento' | 'pausado' | 'concluido' | 'arquivado'
export type Origem = 'ideia' | 'whatsapp' | 'email' | 'ligacao' | 'pessoalmente'

export type Tipologia = 'res_int' | 'res_arq' | 'com_int' | 'com_arq'
export type Escopo = 'executivo' | 'interiores' | 'compatibilizacao' | 'aprovacao' | 'obra' | 'render'

export interface AmbienteEscolhido {
  chave: string
  nome: string
  qtd: number
}

export interface LinhaPrograma {
  id: string
  ambiente: string
  setor: string
  area: number | null
  requisitos: string
}

export interface Perfil {
  id: string
  nome: string
  custo_hora: number
  margem: number
  horas_dia: number
  checkout_hora: string
  estilo: Estilo
  esquema: Esquema
  fuso: string
  plano: string
}

export interface Projeto {
  id: string
  user_id: string
  nome: string
  cliente: string
  tipologia: Tipologia
  escopos: Escopo[]
  ambientes: AmbienteEscolhido[]
  area_m2: number | null
  status: StatusProjeto
  data_inicio: string | null
  data_entrega: string | null
  valor_proposta: number | null
  valor_contrato: number | null
  briefing: Record<string, string>
  programa: LinhaPrograma[]
  partido: string
  notas: string
  criado_em: string
  atualizado_em: string
}

export interface Tarefa {
  id: string
  user_id: string
  projeto_id: string
  chave: string | null
  fase: Fase
  etapa: string | null
  titulo: string
  modo: ModoTarefa
  tipo: TipoTarefa
  essencial: boolean
  horas_estimadas: number
  horas_reais: number | null
  ordem: number
  data_prevista: string | null
  depende_de: string[]
  status: StatusTarefa
  concluida_em: string | null
  link: string | null
  notas: string
  registro: string
  criado_em: string
}

export interface Captura {
  id: string
  texto: string
  origem: Origem
  projeto_id: string | null
  status: 'aberta' | 'virou_tarefa' | 'resolvida' | 'descartada'
  criado_em: string
}

export interface Dia {
  user_id: string
  data: string
  modo: ModoDia | null
  checkout_em: string | null
  aberto: string
  amanha_tarefa: string | null
}

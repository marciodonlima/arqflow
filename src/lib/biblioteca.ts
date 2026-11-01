// Biblioteca de tarefas do ARQFLOW.
// É o know-how do produto: cada tarefa sabe a fase, o modo cognitivo, o tipo
// (execução ou exploração), as horas estimadas e quando deve entrar no projeto.
// Os textos de "por que importa" estão aqui para revisão do Márcio.

import type { Escopo, Fase, ModoDia, ModoTarefa, Tipologia, TipoTarefa } from './tipos'

// ------------------------------------------------------------------
// Tipologias e escopos
// ------------------------------------------------------------------

export const TIPOLOGIAS: { chave: Tipologia; nome: string; descricao: string }[] = [
  { chave: 'res_int', nome: 'Residencial · interiores', descricao: 'Layout, acabamentos, marcenaria e iluminação de residências.' },
  { chave: 'res_arq', nome: 'Residencial · arquitetura', descricao: 'Projeto completo da edificação: plantas, cortes, fachadas e detalhes.' },
  { chave: 'com_int', nome: 'Comercial · interiores', descricao: 'Lojas, escritórios, consultórios e espaços de trabalho.' },
  { chave: 'com_arq', nome: 'Comercial · arquitetura', descricao: 'Edificações comerciais, corporativas e de serviços.' },
]

export const ESCOPOS: { chave: Escopo; nome: string }[] = [
  { chave: 'executivo', nome: 'Projeto executivo (plantas, cortes, fachadas)' },
  { chave: 'interiores', nome: 'Projeto de interiores (layout, revestimentos, marcenaria)' },
  { chave: 'compatibilizacao', nome: 'Compatibilização com estrutura e instalações' },
  { chave: 'aprovacao', nome: 'Aprovação na prefeitura / regularização' },
  { chave: 'obra', nome: 'Acompanhamento de obra' },
  { chave: 'render', nome: '3D e imagens de apresentação' },
]

export function escoposPadrao(t: Tipologia): Escopo[] {
  return t.endsWith('arq') ? ['executivo'] : ['interiores']
}

export const ehArquitetura = (t: Tipologia) => t.endsWith('arq')
export const ehResidencial = (t: Tipologia) => t.startsWith('res')

// ------------------------------------------------------------------
// Ambientes
// ------------------------------------------------------------------

export interface ModeloAmbiente {
  chave: string
  nome: string
  setor: string
  peso: number // complexidade relativa: 1 = uma sala de estar comum
  molhada?: boolean
  marcenaria?: boolean
  area: [number, number] // faixa de referência em m², para o programa
}

export const SETORES: Record<'res' | 'com', { chave: string; nome: string }[]> = {
  res: [
    { chave: 'social', nome: 'Social' },
    { chave: 'intimo', nome: 'Íntimo' },
    { chave: 'servico', nome: 'Serviço' },
  ],
  com: [
    { chave: 'publico', nome: 'Público' },
    { chave: 'trabalho', nome: 'Trabalho' },
    { chave: 'apoio', nome: 'Apoio' },
  ],
}

export const GRUPOS_AMBIENTES: Record<'res' | 'com', { grupo: string; ambientes: ModeloAmbiente[] }[]> = {
  res: [
    {
      grupo: 'Áreas sociais',
      ambientes: [
        { chave: 'sala_estar', nome: 'Sala de estar', setor: 'social', peso: 1, marcenaria: true, area: [16, 30] },
        { chave: 'sala_jantar', nome: 'Sala de jantar', setor: 'social', peso: 0.8, marcenaria: true, area: [10, 16] },
        { chave: 'varanda', nome: 'Varanda / terraço', setor: 'social', peso: 0.7, area: [6, 15] },
        { chave: 'gourmet', nome: 'Espaço gourmet', setor: 'social', peso: 1, molhada: true, marcenaria: true, area: [10, 20] },
        { chave: 'lavabo', nome: 'Lavabo', setor: 'social', peso: 0.5, molhada: true, marcenaria: true, area: [1.5, 2.5] },
        { chave: 'lazer', nome: 'Área de lazer', setor: 'social', peso: 1, area: [15, 40] },
        { chave: 'piscina', nome: 'Piscina', setor: 'social', peso: 0.8, area: [15, 40] },
      ],
    },
    {
      grupo: 'Quartos e banheiros',
      ambientes: [
        { chave: 'suite', nome: 'Suíte principal', setor: 'intimo', peso: 1.2, marcenaria: true, area: [14, 20] },
        { chave: 'dormitorio', nome: 'Dormitório', setor: 'intimo', peso: 0.9, marcenaria: true, area: [9, 12] },
        { chave: 'hospedes', nome: 'Quarto de hóspedes', setor: 'intimo', peso: 0.8, marcenaria: true, area: [9, 12] },
        { chave: 'closet', nome: 'Closet', setor: 'intimo', peso: 0.8, marcenaria: true, area: [4, 8] },
        { chave: 'banheiro', nome: 'Banheiro', setor: 'intimo', peso: 1, molhada: true, marcenaria: true, area: [3, 5] },
        { chave: 'home_office', nome: 'Home office', setor: 'intimo', peso: 0.8, marcenaria: true, area: [6, 10] },
      ],
    },
    {
      grupo: 'Cozinha e serviço',
      ambientes: [
        { chave: 'cozinha', nome: 'Cozinha', setor: 'servico', peso: 1.5, molhada: true, marcenaria: true, area: [8, 14] },
        { chave: 'copa', nome: 'Copa', setor: 'servico', peso: 0.6, marcenaria: true, area: [5, 9] },
        { chave: 'area_servico', nome: 'Área de serviço', setor: 'servico', peso: 0.6, molhada: true, marcenaria: true, area: [3, 6] },
        { chave: 'deposito', nome: 'Depósito', setor: 'servico', peso: 0.3, area: [2, 5] },
        { chave: 'garagem', nome: 'Garagem', setor: 'servico', peso: 0.4, area: [12.5, 30] },
        { chave: 'edicula', nome: 'Edícula', setor: 'servico', peso: 0.8, area: [15, 30] },
      ],
    },
  ],
  com: [
    {
      grupo: 'Atendimento',
      ambientes: [
        { chave: 'recepcao', nome: 'Recepção', setor: 'publico', peso: 1, marcenaria: true, area: [8, 20] },
        { chave: 'espera', nome: 'Sala de espera', setor: 'publico', peso: 0.6, area: [6, 15] },
        { chave: 'loja', nome: 'Salão de vendas', setor: 'publico', peso: 1.4, marcenaria: true, area: [30, 120] },
        { chave: 'vitrine', nome: 'Vitrine / fachada', setor: 'publico', peso: 0.8, marcenaria: true, area: [3, 10] },
        { chave: 'caixa', nome: 'Caixa e balcão', setor: 'publico', peso: 0.8, marcenaria: true, area: [3, 8] },
      ],
    },
    {
      grupo: 'Trabalho',
      ambientes: [
        { chave: 'estacoes', nome: 'Estações de trabalho', setor: 'trabalho', peso: 1.2, marcenaria: true, area: [20, 80] },
        { chave: 'diretoria', nome: 'Sala de diretoria', setor: 'trabalho', peso: 1, marcenaria: true, area: [12, 20] },
        { chave: 'reuniao', nome: 'Sala de reunião', setor: 'trabalho', peso: 0.9, marcenaria: true, area: [10, 20] },
        { chave: 'consultorio', nome: 'Sala de atendimento', setor: 'trabalho', peso: 0.8, marcenaria: true, area: [8, 14] },
        { chave: 'producao', nome: 'Área de produção', setor: 'trabalho', peso: 1.2, area: [20, 80] },
      ],
    },
    {
      grupo: 'Apoio',
      ambientes: [
        { chave: 'copa_com', nome: 'Copa', setor: 'apoio', peso: 0.8, molhada: true, marcenaria: true, area: [6, 12] },
        { chave: 'sanitarios', nome: 'Sanitários', setor: 'apoio', peso: 0.9, molhada: true, area: [3, 8] },
        { chave: 'vestiario', nome: 'Vestiário', setor: 'apoio', peso: 0.7, molhada: true, area: [6, 15] },
        { chave: 'estoque', nome: 'Estoque / depósito', setor: 'apoio', peso: 0.4, area: [6, 30] },
        { chave: 'tecnica', nome: 'Área técnica', setor: 'apoio', peso: 0.4, area: [2, 6] },
      ],
    },
  ],
}

const TODOS_AMBIENTES: Record<string, ModeloAmbiente> = Object.fromEntries(
  [...GRUPOS_AMBIENTES.res, ...GRUPOS_AMBIENTES.com].flatMap((g) => g.ambientes).map((a) => [a.chave, a]),
)

export function modeloAmbiente(chave: string, nome?: string): ModeloAmbiente {
  return TODOS_AMBIENTES[chave] ?? { chave, nome: nome ?? chave, setor: 'social', peso: 0.8, area: [6, 15] }
}

// ------------------------------------------------------------------
// Fases, etapas e modos
// ------------------------------------------------------------------

export const FASES: { chave: Fase; nome: string; curto: string }[] = [
  { chave: 'planejamento', nome: 'Planejamento', curto: 'Planejamento' },
  { chave: 'estudo', nome: 'Estudo preliminar', curto: 'Estudo' },
  { chave: 'anteprojeto', nome: 'Anteprojeto', curto: 'Anteprojeto' },
  { chave: 'executivo', nome: 'Executivo', curto: 'Executivo' },
  { chave: 'entrega', nome: 'Entrega', curto: 'Entrega' },
]

export const nomeFase = (f: Fase) => FASES.find((x) => x.chave === f)?.nome ?? f

export const ETAPAS_PLANEJAMENTO: { chave: string; nome: string; resumo: string }[] = [
  { chave: 'comercial', nome: 'Comercial', resumo: 'Orçamento, proposta e contrato: o combinado antes do desenho.' },
  { chave: 'programa', nome: 'Programa', resumo: 'Briefing, levantamento, programa, setorização e fluxos: o problema bem formulado.' },
  { chave: 'conceituacao', nome: 'Conceituação', resumo: 'Referências e partido: a ideia que guia todas as decisões.' },
]

export const MODOS_TAREFA: Record<ModoTarefa, { nome: string; icone: string }> = {
  analitico: { nome: 'Analítica', icone: 'foco' },
  criativo: { nome: 'Criativa', icone: 'espiral' },
  operacional: { nome: 'Operacional', icone: 'hex' },
  relacional: { nome: 'Relacional', icone: 'par' },
}

export const MODOS_DIA: { chave: ModoDia; nome: string; dica: string; icone: string; frase: string }[] = [
  { chave: 'afiado', nome: 'Afiado', dica: 'Foco e precisão', icone: 'foco', frase: 'Dia afiado pede o que exige precisão.' },
  { chave: 'criativo', nome: 'Criativo', dica: 'Ideias soltas', icone: 'espiral', frase: 'Em dia criativo, o que é de ideia avança.' },
  { chave: 'mecanico', nome: 'Mecânico', dica: 'Repetitivo e claro', icone: 'hex', frase: 'Dia mecânico é bom para o que é claro e repetitivo.' },
  { chave: 'nebuloso', nome: 'Nebuloso', dica: 'Pouca energia', icone: 'nevoa', frase: 'Num dia nebuloso, comece pelo que é curto e concreto.' },
]

// ------------------------------------------------------------------
// Modelos de tarefa
// ------------------------------------------------------------------

export interface Contexto {
  tipologia: Tipologia
  escopos: Escopo[]
  arq: boolean
  res: boolean
  // ambientes já expandidos pela quantidade (Dormitório 1, Dormitório 2...)
  unidades: { chave: string; nome: string; setor: string; peso: number; molhada: boolean; marcenaria: boolean }[]
  somaPesos: number
  somaMolhadas: number
  fatorArea: number
}

export interface ModeloTarefa {
  chave: string
  fase: Fase
  etapa?: 'comercial' | 'programa' | 'conceituacao'
  titulo: string | ((c: Contexto) => string)
  modo: ModoTarefa
  tipo: TipoTarefa
  horas: number
  porPeso?: number // horas somadas por unidade de peso dos ambientes
  porMolhada?: number // horas somadas por área molhada
  escalaArea?: boolean
  quando?: (c: Contexto) => boolean
  depende?: string[]
  essencial?: boolean
  repetir?: 'setor' | 'marcenaria' | 'visitas'
  porque?: string
  como?: string[]
  pagina?: 'briefing' | 'programa'
}

const tem = (c: Contexto, e: Escopo) => c.escopos.includes(e)
const detalhaInteriores = (c: Contexto) => !c.arq || tem(c, 'interiores')
const executivoArq = (c: Contexto) => c.arq && tem(c, 'executivo')

export const MODELOS: ModeloTarefa[] = [
  // ---------------- PLANEJAMENTO · Comercial ----------------
  {
    chave: 'orcamento', fase: 'planejamento', etapa: 'comercial', essencial: true,
    titulo: 'Orçamento por horas', modo: 'analitico', tipo: 'execucao', horas: 1.5,
    porque: 'O preço justo nasce das horas, não do palpite. Estimar cada fase antes de dar o valor é o que protege a sua margem quando o projeto pedir mais do que parecia.',
    como: [
      'Confira as horas que o ARQFLOW estimou para cada fase e ajuste ao seu ritmo real.',
      'Revise o seu custo por hora e a margem no Perfil.',
      'Use o valor sugerido como piso da negociação, não como teto.',
    ],
  },
  {
    chave: 'proposta', fase: 'planejamento', etapa: 'comercial', essencial: true,
    titulo: 'Proposta comercial', modo: 'analitico', tipo: 'execucao', horas: 2, depende: ['orcamento'],
    porque: 'Uma proposta clara diz o que está incluído e, principalmente, o que não está. É o primeiro documento que evita retrabalho e conversa difícil mais adiante.',
    como: [
      'Descreva o escopo fase por fase, com os entregáveis de cada uma.',
      'Defina quantas rodadas de revisão estão incluídas e como as extras são cobradas.',
      'Inclua prazos, forma de pagamento por etapa e validade da proposta.',
    ],
  },
  {
    chave: 'contrato', fase: 'planejamento', etapa: 'comercial', essencial: true,
    titulo: 'Contrato assinado', modo: 'relacional', tipo: 'execucao', horas: 1, depende: ['proposta'],
    porque: 'O contrato transforma o combinado em compromisso dos dois lados. Ele protege o seu tempo tanto quanto o investimento do cliente.',
    como: [
      'Repita no contrato o escopo, as revisões incluídas e o cronograma da proposta.',
      'Combine o prazo de resposta do cliente em cada aprovação: o seu prazo depende dele.',
      'Vincule cada parcela de pagamento à entrega de uma fase.',
    ],
  },

  // ---------------- PLANEJAMENTO · Programa ----------------
  {
    chave: 'briefing', fase: 'planejamento', etapa: 'programa', essencial: true, pagina: 'briefing',
    titulo: 'Reunião de briefing', modo: 'relacional', tipo: 'exploracao', horas: 2, depende: ['contrato'],
    porque: 'No briefing você descobre como o cliente vive ou trabalha: rotina, hábitos, desejos e restrições. Cada pergunta feita agora é uma revisão a menos depois.',
    como: [
      'Use o roteiro de perguntas do ARQFLOW e anote as respostas na própria tela.',
      'Pergunte também o que incomoda no espaço atual: o problema costuma estar ali.',
      'Saia da reunião sabendo quem decide e quem aprova o projeto.',
    ],
  },
  {
    chave: 'levantamento', fase: 'planejamento', etapa: 'programa',
    titulo: (c) => (c.arq ? 'Levantamento do terreno' : 'Levantamento de medidas no local'),
    modo: 'operacional', tipo: 'execucao', horas: 2.5, porPeso: 0.3, escalaArea: true, depende: ['contrato'],
    porque: 'Medidas, fotos e documentos confiáveis evitam o erro mais caro do projeto: desenhar sobre uma base errada.',
    como: [
      'Fotografe cada ambiente de frente para cada parede, antes de medir.',
      'Registre pé-direito, vigas, pilares, janelas, pontos elétricos e hidráulicos existentes.',
      'Peça plantas, matrícula ou convenção do condomínio, se houver.',
    ],
  },
  {
    chave: 'legislacao', fase: 'planejamento', etapa: 'programa', quando: (c) => c.arq,
    titulo: 'Legislação e viabilidade', modo: 'analitico', tipo: 'exploracao', horas: 3, depende: ['levantamento'],
    porque: 'Zoneamento, taxa de ocupação, gabarito e afastamentos definem o espaço real disponível antes de qualquer traço.',
    como: [
      'Consulte o zoneamento e os parâmetros urbanísticos do lote.',
      'Anote as restrições que vão desenhar o volume: recuos, altura máxima, áreas permeáveis.',
    ],
  },
  {
    chave: 'programa', fase: 'planejamento', etapa: 'programa', essencial: true, pagina: 'programa',
    titulo: 'Programa de necessidades', modo: 'analitico', tipo: 'execucao', horas: 1.5, porPeso: 0.2, depende: ['briefing'],
    porque: 'O programa traduz o briefing em ambientes, áreas e requisitos. É a lista que vai orientar cada decisão de layout, e o documento que o cliente aprova antes do desenho.',
    como: [
      'Comece pela lista que o ARQFLOW montou a partir dos ambientes do projeto.',
      'Para cada ambiente, anote a área desejada, o mobiliário e o que precisa acontecer ali.',
      'Mostre o programa ao cliente e registre a concordância.',
    ],
  },
  {
    chave: 'setorizacao', fase: 'planejamento', etapa: 'programa', essencial: true, pagina: 'programa',
    titulo: 'Setorização', modo: 'analitico', tipo: 'exploracao', horas: 1.5, porPeso: 0.1, depende: ['programa'],
    porque: 'Agrupar os ambientes em setores dá a lógica do espaço antes do desenho. Com os setores claros, o layout deixa de ser tentativa e erro.',
    como: [
      'Distribua cada ambiente do programa num setor (social, íntimo e serviço; ou público, trabalho e apoio).',
      'Confira a área total de cada setor e a proporção entre eles.',
      'Decida quais setores precisam ficar juntos e quais devem se separar.',
    ],
  },
  {
    chave: 'fluxos', fase: 'planejamento', etapa: 'programa', essencial: true,
    titulo: 'Fluxos e relações', modo: 'analitico', tipo: 'exploracao', horas: 1.5, porPeso: 0.1, depende: ['setorizacao'],
    porque: 'Entender quem circula, por onde e com que frequência evita cruzamentos ruins e corredores desnecessários. É aqui que o layout começa a se desenhar sozinho.',
    como: [
      'Liste os percursos do dia a dia: chegada, compras, serviço, visitas, clientes, funcionários.',
      'Marque as relações obrigatórias, desejáveis e indesejáveis entre ambientes.',
      'Esboce um diagrama de bolhas à mão e fotografe para o registro.',
    ],
  },

  // ---------------- PLANEJAMENTO · Conceituação ----------------
  {
    chave: 'referencias', fase: 'planejamento', etapa: 'conceituacao',
    titulo: 'Pesquisa de referências', modo: 'criativo', tipo: 'exploracao', horas: 2.5, depende: ['briefing'],
    porque: 'Referências bem escolhidas viram vocabulário comum com o cliente e encurtam a distância entre o que ele imagina e o que você propõe.',
    como: [
      'Reúna obras, materiais e atmosferas que respondam ao briefing, não só ao gosto.',
      'Para cada referência, anote o que interessa nela: a luz, o material, a proporção.',
    ],
  },
  {
    chave: 'conceito', fase: 'planejamento', etapa: 'conceituacao', essencial: true,
    titulo: 'Conceito e partido', modo: 'criativo', tipo: 'exploracao', horas: 3, porPeso: 0.15, depende: ['fluxos', 'referencias'],
    porque: 'O partido é a ideia que vai guiar todas as decisões seguintes. Com ele claro, as escolhas de forma, material e layout ficam mais rápidas e coerentes.',
    como: [
      'Escreva o partido em uma ou duas frases. Se não couber, ainda não está claro.',
      'Teste o partido contra o programa e os fluxos: ele resolve o problema?',
      'Registre o partido no projeto: ele acompanha todas as fases seguintes.',
    ],
  },

  // ---------------- ESTUDO PRELIMINAR ----------------
  {
    chave: 'implantacao', fase: 'estudo', quando: (c) => c.arq,
    titulo: 'Implantação no terreno', modo: 'analitico', tipo: 'exploracao', horas: 3, escalaArea: true, depende: ['conceito'],
  },
  {
    chave: 'layout', fase: 'estudo', repetir: 'setor',
    titulo: 'Estudo de layout', modo: 'criativo', tipo: 'exploracao', horas: 1.5, porPeso: 1.5, depende: ['conceito'],
  },
  {
    chave: 'volumetria', fase: 'estudo', quando: (c) => c.arq,
    titulo: 'Estudo de volumetria', modo: 'criativo', tipo: 'exploracao', horas: 6, escalaArea: true, depende: ['layout'],
  },
  {
    chave: 'moodboard', fase: 'estudo', quando: detalhaInteriores,
    titulo: 'Moodboard e paleta de materiais', modo: 'criativo', tipo: 'exploracao', horas: 2, porPeso: 0.4, depende: ['conceito'],
  },
  {
    chave: 'maquete_estudo', fase: 'estudo', quando: (c) => tem(c, 'render'),
    titulo: 'Modelo 3D de estudo', modo: 'operacional', tipo: 'execucao', horas: 3, porPeso: 0.8, depende: ['layout'],
  },
  {
    chave: 'apres_estudo', fase: 'estudo',
    titulo: 'Apresentação do estudo ao cliente', modo: 'relacional', tipo: 'execucao', horas: 2, depende: ['layout'],
  },
  {
    chave: 'revisao_estudo', fase: 'estudo',
    titulo: 'Ajustes do estudo após a apresentação', modo: 'operacional', tipo: 'execucao', horas: 2, porPeso: 0.4, depende: ['apres_estudo'],
  },

  // ---------------- ANTEPROJETO ----------------
  {
    chave: 'plantas_ante', fase: 'anteprojeto',
    titulo: (c) => (c.arq ? 'Plantas do anteprojeto' : 'Planta de layout com mobiliário'),
    modo: 'analitico', tipo: 'execucao', horas: 3, porPeso: 1, escalaArea: true, depende: ['revisao_estudo'],
  },
  {
    chave: 'cortes_fachadas', fase: 'anteprojeto', quando: (c) => c.arq,
    titulo: 'Cortes e fachadas', modo: 'analitico', tipo: 'execucao', horas: 10, escalaArea: true, depende: ['plantas_ante'],
  },
  {
    chave: 'piso_forro', fase: 'anteprojeto', quando: detalhaInteriores,
    titulo: 'Planos de piso e forro', modo: 'operacional', tipo: 'execucao', horas: 2, porPeso: 0.4, depende: ['plantas_ante'],
  },
  {
    chave: 'materiais', fase: 'anteprojeto',
    titulo: 'Seleção de materiais e acabamentos', modo: 'criativo', tipo: 'exploracao', horas: 2.5, porPeso: 0.4, depende: ['plantas_ante'],
  },
  {
    chave: 'renders', fase: 'anteprojeto', quando: (c) => tem(c, 'render'),
    titulo: 'Imagens 3D de apresentação', modo: 'criativo', tipo: 'execucao', horas: 4, porPeso: 1.2, depende: ['materiais'],
  },
  {
    chave: 'pre_compat', fase: 'anteprojeto', quando: (c) => tem(c, 'compatibilizacao'),
    titulo: 'Pré-compatibilização com estrutura e instalações', modo: 'analitico', tipo: 'execucao', horas: 4, escalaArea: true, depende: ['plantas_ante'],
  },
  {
    chave: 'projeto_legal', fase: 'anteprojeto', quando: (c) => tem(c, 'aprovacao'),
    titulo: 'Projeto legal para a prefeitura', modo: 'operacional', tipo: 'execucao', horas: 8, escalaArea: true, depende: ['plantas_ante'],
  },
  {
    chave: 'apres_ante', fase: 'anteprojeto',
    titulo: 'Apresentação do anteprojeto', modo: 'relacional', tipo: 'execucao', horas: 2, depende: ['materiais'],
  },
  {
    chave: 'aprov_ante', fase: 'anteprojeto',
    titulo: 'Aprovação do anteprojeto por escrito', modo: 'relacional', tipo: 'execucao', horas: 0.5, depende: ['apres_ante'],
  },

  // ---------------- EXECUTIVO ----------------
  {
    chave: 'plantas_exec', fase: 'executivo', quando: executivoArq,
    titulo: 'Plantas executivas', modo: 'analitico', tipo: 'execucao', horas: 10, porPeso: 1, escalaArea: true, depende: ['aprov_ante'],
  },
  {
    chave: 'cortes_exec', fase: 'executivo', quando: executivoArq,
    titulo: 'Cortes e fachadas executivos', modo: 'analitico', tipo: 'execucao', horas: 10, escalaArea: true, depende: ['plantas_exec'],
  },
  {
    chave: 'detalhes', fase: 'executivo', quando: executivoArq,
    titulo: 'Detalhamentos construtivos', modo: 'analitico', tipo: 'execucao', horas: 8, porPeso: 0.6, depende: ['plantas_exec'],
  },
  {
    chave: 'layout_exec', fase: 'executivo', quando: (c) => !c.arq,
    titulo: 'Planta de layout executiva e demolir/construir', modo: 'analitico', tipo: 'execucao', horas: 3, porPeso: 0.5, depende: ['aprov_ante'],
  },
  {
    chave: 'marcenaria', fase: 'executivo', quando: detalhaInteriores, repetir: 'marcenaria',
    titulo: 'Detalhamento de marcenaria', modo: 'analitico', tipo: 'execucao', horas: 3, depende: ['aprov_ante'],
  },
  {
    chave: 'paginacao', fase: 'executivo', quando: detalhaInteriores,
    titulo: 'Paginação de pisos e revestimentos', modo: 'operacional', tipo: 'execucao', horas: 1.5, porMolhada: 0.8, depende: ['aprov_ante'],
  },
  {
    chave: 'iluminacao', fase: 'executivo', quando: detalhaInteriores,
    titulo: 'Projeto de iluminação', modo: 'analitico', tipo: 'execucao', horas: 3, porPeso: 0.4, depende: ['aprov_ante'],
  },
  {
    chave: 'pontos_eletricos', fase: 'executivo', quando: detalhaInteriores,
    titulo: 'Pontos elétricos e de dados', modo: 'operacional', tipo: 'execucao', horas: 2, porPeso: 0.3, depende: ['aprov_ante'],
  },
  {
    chave: 'pontos_hidraulicos', fase: 'executivo', quando: (c) => detalhaInteriores(c) && c.somaMolhadas > 0,
    titulo: 'Pontos hidráulicos das áreas molhadas', modo: 'operacional', tipo: 'execucao', horas: 1, porMolhada: 1, depende: ['aprov_ante'],
  },
  {
    chave: 'compat', fase: 'executivo', quando: (c) => tem(c, 'compatibilizacao'),
    titulo: 'Compatibilização dos projetos complementares', modo: 'analitico', tipo: 'execucao', horas: 6, escalaArea: true, depende: ['aprov_ante'],
  },
  {
    chave: 'memorial', fase: 'executivo',
    titulo: 'Memorial descritivo e especificações', modo: 'analitico', tipo: 'execucao', horas: 3, porPeso: 0.3, depende: ['aprov_ante'],
  },
  {
    chave: 'quantitativos', fase: 'executivo', quando: detalhaInteriores,
    titulo: 'Lista de materiais e quantitativos', modo: 'operacional', tipo: 'execucao', horas: 2, porPeso: 0.3, depende: ['memorial'],
  },

  // ---------------- ENTREGA ----------------
  {
    chave: 'revisao_pranchas', fase: 'entrega',
    titulo: 'Revisão final do conjunto de pranchas', modo: 'analitico', tipo: 'execucao', horas: 2.5, porPeso: 0.2, depende: ['memorial'],
  },
  {
    chave: 'pacote', fase: 'entrega',
    titulo: 'Organização do pacote de entrega', modo: 'operacional', tipo: 'execucao', horas: 1.5, depende: ['revisao_pranchas'],
  },
  {
    chave: 'apres_final', fase: 'entrega',
    titulo: 'Apresentação final ao cliente', modo: 'relacional', tipo: 'execucao', horas: 2, depende: ['pacote'],
  },
  {
    chave: 'protocolo', fase: 'entrega', quando: (c) => tem(c, 'aprovacao'),
    titulo: 'Protocolo e acompanhamento da aprovação', modo: 'relacional', tipo: 'execucao', horas: 3, depende: ['pacote'],
  },
  {
    chave: 'visita_obra', fase: 'entrega', quando: (c) => tem(c, 'obra'), repetir: 'visitas',
    titulo: 'Visita de obra', modo: 'relacional', tipo: 'execucao', horas: 2.5, depende: ['apres_final'],
  },
  {
    chave: 'aceite', fase: 'entrega',
    titulo: 'Termo de aceite e encerramento', modo: 'relacional', tipo: 'execucao', horas: 0.5, depende: ['apres_final'],
  },
]

export const MODELO_POR_CHAVE: Record<string, ModeloTarefa> = Object.fromEntries(MODELOS.map((m) => [m.chave, m]))

// Chave-base de uma tarefa repetida: "marcenaria:cozinha-1" → "marcenaria"
export const chaveBase = (chave: string | null) => (chave ?? '').split(':')[0]

export const ESSENCIAIS_PLANEJAMENTO = MODELOS.filter((m) => m.essencial).map((m) => m.chave)

// ------------------------------------------------------------------
// Roteiro do briefing
// ------------------------------------------------------------------

export const BRIEFING: Record<'res' | 'com', { chave: string; pergunta: string; dica?: string }[]> = {
  res: [
    { chave: 'moradores', pergunta: 'Quem vai viver neste espaço?', dica: 'Pessoas, idades, animais, visitas frequentes.' },
    { chave: 'rotina', pergunta: 'Como é um dia comum na casa?', dica: 'Horários, quem sai e quem fica, onde cada um passa mais tempo.' },
    { chave: 'cozinha', pergunta: 'Quem cozinha, com que frequência, e como gostam de receber?' },
    { chave: 'trabalho', pergunta: 'Alguém trabalha ou estuda em casa?', dica: 'Precisa de silêncio, de chamadas de vídeo, de espaço para guardar material?' },
    { chave: 'objetos', pergunta: 'Hobbies, coleções ou objetos que precisam de lugar?' },
    { chave: 'incomoda', pergunta: 'O que funciona bem hoje e o que incomoda no espaço atual?' },
    { chave: 'estilo', pergunta: 'Que atmosferas e referências agradam, e quais não agradam?' },
    { chave: 'manter', pergunta: 'Quais móveis e objetos serão mantidos?' },
    { chave: 'orcamento_obra', pergunta: 'Qual o investimento previsto para a obra e o que é prioridade?' },
    { chave: 'prazo', pergunta: 'Qual o prazo desejado? Há alguma data importante?' },
    { chave: 'restricoes', pergunta: 'Restrições do condomínio, de acessibilidade ou de manutenção?' },
    { chave: 'decisao', pergunta: 'Quem decide e quem aprova o projeto?' },
  ],
  com: [
    { chave: 'negocio', pergunta: 'Qual é o negócio e quem é o público?' },
    { chave: 'equipe', pergunta: 'Quantas pessoas trabalham no espaço, em que turnos?' },
    { chave: 'operacao', pergunta: 'Como funciona a operação?', dica: 'Atendimento, estoque, produção, entregas, horários de pico.' },
    { chave: 'marca', pergunta: 'Como é a identidade da marca e o posicionamento?' },
    { chave: 'equipamentos', pergunta: 'Que equipamentos e requisitos técnicos o espaço precisa receber?' },
    { chave: 'normas', pergunta: 'Que exigências legais se aplicam?', dica: 'Vigilância sanitária, bombeiros, acessibilidade, condomínio.' },
    { chave: 'referencias', pergunta: 'Que espaços ou concorrentes servem de referência?' },
    { chave: 'incomoda', pergunta: 'O que funciona bem hoje e o que atrapalha a operação?' },
    { chave: 'orcamento_obra', pergunta: 'Qual o investimento previsto e o que é prioridade?' },
    { chave: 'prazo', pergunta: 'Qual o prazo de inauguração ou de mudança?' },
    { chave: 'decisao', pergunta: 'Quem decide e quem aprova o projeto?' },
  ],
}

export const ORIGENS: { chave: string; nome: string }[] = [
  { chave: 'ideia', nome: 'Ideia' },
  { chave: 'whatsapp', nome: 'WhatsApp' },
  { chave: 'email', nome: 'E-mail' },
  { chave: 'ligacao', nome: 'Ligação' },
  { chave: 'pessoalmente', nome: 'Pessoalmente' },
]

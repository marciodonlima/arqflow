// Datas no formato AAAA-MM-DD, sempre calculadas em UTC para não escorregar de fuso.

export function hojeEm(fuso = 'America/Sao_Paulo', agora = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: fuso, year: 'numeric', month: '2-digit', day: '2-digit' }).format(agora)
}

export function horaEm(fuso = 'America/Sao_Paulo', agora = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: fuso, hour: '2-digit', minute: '2-digit', hour12: false }).format(agora)
}

const paraData = (d: string) => new Date(d + 'T00:00:00Z')
const paraTexto = (d: Date) => d.toISOString().slice(0, 10)

export function somarDias(d: string, n: number): string {
  const x = paraData(d)
  x.setUTCDate(x.getUTCDate() + n)
  return paraTexto(x)
}

export function diferencaDias(a: string, b: string): number {
  return Math.round((paraData(a).getTime() - paraData(b).getTime()) / 86400000)
}

export const ehDiaUtil = (d: string) => {
  const w = paraData(d).getUTCDay()
  return w !== 0 && w !== 6
}

export function proximoDiaUtil(d: string): string {
  let x = d
  while (!ehDiaUtil(x)) x = somarDias(x, 1)
  return x
}

// Soma n dias úteis a partir de d (d já ajustado para dia útil conta como o dia 0)
export function somarDiasUteis(d: string, n: number): string {
  let x = proximoDiaUtil(d)
  let restam = n
  while (restam > 0) {
    x = somarDias(x, 1)
    if (ehDiaUtil(x)) restam--
  }
  return x
}

// Quantidade de dias úteis entre a e b, contando os dois extremos
export function diasUteisEntre(a: string, b: string): number {
  if (b < a) return 0
  let n = 0
  let x = a
  while (x <= b) {
    if (ehDiaUtil(x)) n++
    x = somarDias(x, 1)
  }
  return n
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const MESES_LONGOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export function dataCurta(d: string | null): string {
  if (!d) return ''
  const x = paraData(d)
  return `${x.getUTCDate()} ${MESES[x.getUTCMonth()]}`
}

export function dataLonga(d: string): string {
  const x = paraData(d)
  return `${SEMANA[x.getUTCDay()]}, ${x.getUTCDate()} de ${MESES_LONGOS[x.getUTCMonth()]}`
}

export const diaDaSemana = (d: string) => SEMANA[paraData(d).getUTCDay()]
export const diaDoMes = (d: string) => paraData(d).getUTCDate()
export const mesLongo = (d: string) => MESES_LONGOS[paraData(d).getUTCMonth()]

export function quando(d: string | null, hoje: string): string {
  if (!d) return 'sem data'
  const n = diferencaDias(d, hoje)
  if (n < -1) return `prevista para ${dataCurta(d)}`
  if (n === -1) return 'prevista para ontem'
  if (n === 0) return 'hoje'
  if (n === 1) return 'amanhã'
  if (n < 7) return diaDaSemana(d).toLowerCase()
  return dataCurta(d)
}

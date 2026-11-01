export function reais(v: number | null | undefined): string {
  if (v == null || Number.isNaN(Number(v))) return '—'
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

export function horas(v: number | null | undefined): string {
  const n = Number(v ?? 0)
  const h = Math.floor(n)
  const m = Math.round((n - h) * 60)
  if (h === 0) return `${m}min`
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
}

export function horasTotais(v: number): string {
  return `${Math.round(v * 10) / 10}h`.replace('.', ',')
}

export function iniciais(nome: string): string {
  const p = nome.trim().split(/\s+/).filter(Boolean)
  if (p.length === 0) return 'A'
  return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase()
}

export const primeiroNome = (nome: string) => nome.trim().split(/\s+/)[0] ?? ''

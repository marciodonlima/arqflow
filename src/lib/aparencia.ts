import type { Esquema, Estilo, PreferenciaEsquema } from './tipos'

export const ESTILOS: { chave: Estilo; nome: string }[] = [
  { chave: 'basalto', nome: 'Basalto' },
  { chave: 'calcario', nome: 'Calcário' },
  { chave: 'concreto', nome: 'Concreto' },
  { chave: 'musgo', nome: 'Musgo' },
  { chave: 'nanquim', nome: 'Nanquim' },
]

export const FONTE_URL: Record<Estilo, string> = {
  basalto: 'https://fonts.googleapis.com/css2?family=Jost:wght@200;300;400;500;600&display=swap',
  calcario: 'https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@300;400;500;600&display=swap',
  concreto: 'https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&display=swap',
  musgo: 'https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600&display=swap',
  nanquim: 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&display=swap',
}

export const estiloValido = (v?: string): Estilo => (ESTILOS.some((e) => e.chave === v) ? v : 'calcario') as Estilo
export const preferenciaValida = (v?: string): PreferenciaEsquema => (v === 'escuro' ? 'escuro' : v === 'auto' ? 'auto' : 'claro')

// Automático: claro das 6h às 18h, escuro no resto do dia
export const esquemaPorHora = (hora: number): Esquema => (hora >= 6 && hora < 18 ? 'claro' : 'escuro')

export function resolverEsquema(pref: PreferenciaEsquema, fuso = 'America/Sao_Paulo', agora = new Date()): Esquema {
  if (pref !== 'auto') return pref
  const h = Number(new Intl.DateTimeFormat('en-GB', { timeZone: fuso, hour: '2-digit', hour12: false }).format(agora))
  return esquemaPorHora(h % 24)
}

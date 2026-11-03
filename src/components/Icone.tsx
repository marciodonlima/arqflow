const CAMINHOS = {
  foco: 'M12 4.5a7.5 7.5 0 1 1 0 15a7.5 7.5 0 1 1 0-15z M12 10.6a1.4 1.4 0 1 1 0 2.8a1.4 1.4 0 1 1 0-2.8z',
  espiral: 'M12 11.5a1.5 1.5 0 0 1 3 0a3 3 0 0 1-6 0a4.5 4.5 0 0 1 9 0a6 6 0 0 1-12 0',
  hex: 'M12 4l6.9 4v8L12 20l-6.9-4V8z M12 9.2a2.8 2.8 0 1 1 0 5.6a2.8 2.8 0 1 1 0-5.6z',
  nevoa: 'M4 8.5h11 M7 12.5h13 M4 16.5h9',
  par: 'M9.5 7a5 5 0 1 1 0 10a5 5 0 1 1 0-10z M14.5 7a5 5 0 1 1 0 10a5 5 0 1 1 0-10z',
  relogio: 'M12 4.5a7.5 7.5 0 1 1 0 15a7.5 7.5 0 1 1 0-15z M12 8.2v4l2.6 1.6',
  ampulheta: 'M6.5 4.5h11 M6.5 19.5h11 M8 4.5v1.8c0 2.6 3.2 3.6 3.2 5.7s-3.2 3.1-3.2 5.7v1.8 M16 4.5v1.8c0 2.6-3.2 3.6-3.2 5.7s3.2 3.1 3.2 5.7v1.8',
  seta: 'M5 12h14 M13.5 6.5L19 12l-5.5 5.5',
  mais: 'M12 5v14 M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  hoje: 'M3 17h18 M7 17a5 5 0 0 1 10 0 M12 7v2 M5.8 10.3l1.4 1.4 M18.2 10.3l-1.4 1.4',
  projetos: 'M4 8h16v12H4z M7 5h10',
  painel: 'M5 19v-7 M12 19V5 M19 19v-10',
  agenda: 'M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4',
  perfil: 'M12 4.8a3.6 3.6 0 1 1 0 7.2a3.6 3.6 0 1 1 0-7.2z M5 19.5c1.4-3.2 4-4.8 7-4.8s5.6 1.6 7 4.8',
  claro: 'M12 8.5a3.5 3.5 0 1 1 0 7a3.5 3.5 0 1 1 0-7z M12 3v2 M12 19v2 M3 12h2 M19 12h2 M5.6 5.6l1.4 1.4 M17 17l1.4 1.4 M5.6 18.4L7 17 M17 7l1.4-1.4',
  escuro: 'M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z',
  caixa: 'M4 13l2.5-7.5h11L20 13v6H4z M4 13h4.5l1 2h5l1-2H20',
  fechar: 'M6.5 6.5l11 11 M17.5 6.5l-11 11',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1 M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  lua: 'M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z',
  folha: 'M7 4h7l4 4v12H7z M14 4v4h4 M10 12h5 M10 15.5h5',
  sair: 'M10 5H5v14h5 M14 8l4 4-4 4 M18 12H9',
  play: 'M8 5.5v13l10.5-6.5z',
  pausa: 'M8.5 5.5v13 M15.5 5.5v13',
  alerta: 'M12 4.5l8 14H4z M12 10v4 M12 16.6v.4',
  lista: 'M9 6.5h11 M9 12h11 M9 17.5h11 M4.5 6.5h.5 M4.5 12h.5 M4.5 17.5h.5',
  quadro: 'M4 5h4.5v14H4z M9.75 5h4.5v9h-4.5z M15.5 5H20v11h-4.5z',
  gantt: 'M4 6.5h9 M8 12h10 M6 17.5h7',
  dinheiro: 'M4 7h16v10H4z M12 9.6a2.4 2.4 0 1 1 0 4.8a2.4 2.4 0 1 1 0-4.8z M7 7v10 M17 7v10',
  documento: 'M7 4h7l4 4v12H7z M14 4v4h4 M10 12h5 M10 15.5h5',
  pessoa: 'M12 4.8a3.6 3.6 0 1 1 0 7.2a3.6 3.6 0 1 1 0-7.2z M5 19.5c1.4-3.2 4-4.8 7-4.8s5.6 1.6 7 4.8',
  chevron: 'M9.5 6l6 6-6 6',
  sol: 'M12 8.5a3.5 3.5 0 1 1 0 7a3.5 3.5 0 1 1 0-7z M12 3v2 M12 19v2 M3 12h2 M19 12h2',
  arrastar: 'M9 6h.01 M15 6h.01 M9 12h.01 M15 12h.01 M9 18h.01 M15 18h.01',
} as const

export type NomeIcone = keyof typeof CAMINHOS

export function Icone({ nome, className, titulo }: { nome: NomeIcone; className?: string; titulo?: string }) {
  return (
    <svg
      className={className ? `af-icon ${className}` : 'af-icon'}
      viewBox="0 0 24 24"
      aria-hidden={titulo ? undefined : true}
      role={titulo ? 'img' : undefined}
      aria-label={titulo}
    >
      <path d={CAMINHOS[nome]} />
    </svg>
  )
}

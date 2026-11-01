// Faixas desiguais empilhadas como pavimentos: o desenho técnico fica no método, sem desenhar a régua.
export function Arte() {
  return (
    <svg viewBox="0 0 480 288" aria-hidden="true">
      <rect x="48" y="24" width="440" height="96" rx="3" fill="var(--af-ink)" />
      <rect x="96" y="128" width="392" height="48" rx="3" fill="var(--af-accent)" />
      <rect x="144" y="184" width="344" height="32" rx="3" fill="var(--af-sec)" opacity=".55" />
      <rect x="192" y="224" width="296" height="40" rx="3" fill="var(--af-tert)" opacity=".35" />
      <line x1="240" y1="24" x2="240" y2="264" stroke="var(--af-plate)" strokeWidth="2" />
      <line x1="336" y1="24" x2="336" y2="264" stroke="var(--af-plate)" strokeWidth="2" />
      <line x1="432" y1="24" x2="432" y2="264" stroke="var(--af-plate)" strokeWidth="2" />
    </svg>
  )
}

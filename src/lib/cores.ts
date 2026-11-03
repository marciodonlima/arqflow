// Cores dos projetos: tons sóbrios, cada um com uma versão para o esquema claro e outra para o escuro.
// São marcadores de identificação, nunca alerta.

export const CORES_PROJETO: { chave: string; nome: string; claro: string; escuro: string }[] = [
  { chave: 'petroleo', nome: 'Petróleo', claro: '#2f6670', escuro: '#7db4bd' },
  { chave: 'terracota', nome: 'Terracota', claro: '#a85a40', escuro: '#d99a82' },
  { chave: 'oliva', nome: 'Oliva', claro: '#66753a', escuro: '#a8b878' },
  { chave: 'ardosia', nome: 'Ardósia', claro: '#46628f', escuro: '#94aed6' },
  { chave: 'ocre', nome: 'Ocre', claro: '#9a7425', escuro: '#d9b868' },
  { chave: 'ameixa', nome: 'Ameixa', claro: '#74507a', escuro: '#be95c2' },
  { chave: 'musgo', nome: 'Musgo', claro: '#3f6b4f', escuro: '#82b095' },
  { chave: 'rosa', nome: 'Rosa antigo', claro: '#9c5a6c', escuro: '#d697a8' },
  { chave: 'areia', nome: 'Areia', claro: '#857154', escuro: '#cdb892' },
  { chave: 'grafite', nome: 'Grafite', claro: '#565a5e', escuro: '#a7abaf' },
]

export function corDe(chave: string | null | undefined, indiceReserva = 0) {
  return CORES_PROJETO.find((c) => c.chave === chave) ?? CORES_PROJETO[indiceReserva % CORES_PROJETO.length]
}

// Variáveis CSS para aplicar a cor de um projeto num elemento (.cor-projeto)
export function estiloCor(chave: string | null | undefined, indiceReserva = 0): Record<string, string> {
  const c = corDe(chave, indiceReserva)
  return { '--pc': c.claro, '--pe': c.escuro } as Record<string, string>
}

// Próxima cor livre para um projeto novo
export function proximaCor(usadas: (string | null)[]): string {
  const livre = CORES_PROJETO.find((c) => !usadas.includes(c.chave))
  return (livre ?? CORES_PROJETO[usadas.length % CORES_PROJETO.length]).chave
}

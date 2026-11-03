'use client'

import { useEffect } from 'react'
import { esquemaPorHora } from '@/lib/aparencia'

// Quando a preferência é "automático", troca claro/escuro sozinho ao longo do dia
export function TemaAutomatico() {
  useEffect(() => {
    const aplicar = () => {
      const raiz = document.documentElement
      if (raiz.dataset.pref !== 'auto') return
      const novo = esquemaPorHora(new Date().getHours())
      if (raiz.dataset.theme !== novo) raiz.dataset.theme = novo
    }
    aplicar()
    const t = setInterval(aplicar, 60_000)
    return () => clearInterval(t)
  }, [])
  return null
}

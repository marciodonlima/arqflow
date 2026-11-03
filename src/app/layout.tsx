import type { Metadata, Viewport } from 'next'
import { cookies } from 'next/headers'
import { TemaAutomatico } from '@/components/TemaAutomatico'
import { FONTE_URL, estiloValido, preferenciaValida, resolverEsquema } from '@/lib/aparencia'
import './tema.css'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'ARQFLOW', template: '%s · ARQFLOW' },
  description: 'Organiza o trabalho e alivia o peso que ele deixa na cabeça.',
  appleWebApp: { capable: true, title: 'ARQFLOW', statusBarStyle: 'default' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const c = await cookies()
  const estilo = estiloValido(c.get('af_estilo')?.value)
  const pref = preferenciaValida(c.get('af_esquema')?.value)
  return (
    <html lang="pt-BR" data-estilo={estilo} data-theme={resolverEsquema(pref)} data-pref={pref} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link id="af-fonte" rel="stylesheet" href={FONTE_URL[estilo]} />
      </head>
      <body>
        <TemaAutomatico />
        {children}
      </body>
    </html>
  )
}

import type { Metadata, Viewport } from 'next'
import { cookies } from 'next/headers'
import { FONTE_URL, esquemaValido, estiloValido } from '@/lib/aparencia'
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
  const esquema = esquemaValido(c.get('af_esquema')?.value)
  return (
    <html lang="pt-BR" data-estilo={estilo} data-theme={esquema}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link id="af-fonte" rel="stylesheet" href={FONTE_URL[estilo]} />
      </head>
      <body>{children}</body>
    </html>
  )
}

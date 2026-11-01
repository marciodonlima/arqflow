import { supabaseConfigurado } from '@/lib/supabase/config'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function Configurar() {
  if (supabaseConfigurado()) redirect('/entrar')
  return (
    <main className="entrar">
      <div className="entrar-form" style={{ maxWidth: 560 }}>
        <p className="marca" style={{ paddingLeft: 0 }}>ARQFLOW</p>
        <div className="pilha">
          <h1 className="titulo-secao">Falta ligar o banco de dados</h1>
          <p className="apoio">
            O app está no ar, mas ainda não sabe qual é o seu Supabase. No Vercel, abra o projeto → Settings →
            Environment Variables e cadastre as duas variáveis abaixo. Depois, em Deployments, use “Redeploy”.
          </p>
          <div className="placa-fina pilha" style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13 }}>
            <span>NEXT_PUBLIC_SUPABASE_URL</span>
            <span>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</span>
          </div>
          <p className="meta">Os dois valores ficam no Supabase, em Project Settings → API Keys e Data API.</p>
        </div>
      </div>
    </main>
  )
}

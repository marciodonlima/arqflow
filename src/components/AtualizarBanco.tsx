// Aparece quando o código novo chegou ao ar antes do script do banco
export function AtualizarBanco() {
  return (
    <main className="entrar">
      <div className="entrar-form" style={{ maxWidth: 600 }}>
        <p className="marca" style={{ paddingLeft: 0 }}>ARQFLOW</p>
        <div className="pilha">
          <h1 className="titulo-secao">Falta atualizar o banco de dados</h1>
          <p className="apoio">
            Esta versão do ARQFLOW traz cronômetro, parcelas e outras novidades que precisam de tabelas novas no Supabase. É um passo só, e os seus projetos
            continuam onde estão.
          </p>
          <ol className="apoio" style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>
              Abra o arquivo{' '}
              <a className="btn-texto" href="https://github.com/marciodonlima/arqflow/blob/main/supabase/schema.sql" target="_blank" rel="noreferrer">
                supabase/schema.sql
              </a>{' '}
              no GitHub e copie o conteúdo (botão de copiar no canto do arquivo).
            </li>
            <li>No Supabase, abra SQL Editor → New query, cole e clique em Run. Se aparecer um aviso de “destructive operations”, confirme em Run query.</li>
            <li>Volte aqui e recarregue a página.</li>
          </ol>
        </div>
      </div>
    </main>
  )
}

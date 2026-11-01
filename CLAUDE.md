# ARQFLOW · notas para quem mexe no código

- Produto do Márcio (SPACIO), arquiteto e professor, não programador. Toda a interface e os textos são em português do Brasil; tom calmo: "oriente, não cobre".
- Next.js 16: o antigo `middleware` agora é `src/proxy.ts`; `params`, `searchParams` e `cookies()` são assíncronos; não há `next lint`.
- Supabase via `@supabase/ssr`. Variáveis: `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (ou `..._ANON_KEY`). Sem elas, o app mostra `/configurar`.
- Banco: `supabase/schema.sql` precisa continuar idempotente (pode ser rodado de novo). Toda tabela tem RLS por `user_id = auth.uid()`.
- Estilos: cores vêm de `scripts/gerar-tema.py` → `src/app/tema.css` (atributos `data-estilo` e `data-theme` no `<html>`). Use só as variáveis `--af-*`; sem vermelho, um único acento por estilo.
- Domínio (tarefas, horas, textos didáticos): `src/lib/biblioteca.ts`. Motor: `src/lib/motor.ts`. Priorização: `src/lib/prioridade.ts`.

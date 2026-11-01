# ARQFLOW

Organiza o trabalho e alivia o peso que ele deixa na cabeça.

App de fluxo de trabalho para projetos de arquitetura e interiores. Esta é a **versão 0.1**: o essencial para começar a usar no dia a dia.

## O que já funciona

- **Conta**: criar conta, entrar, sair e recuperar a senha.
- **Novo projeto**: tipologia, escopo, ambientes e área. O motor gera as tarefas de todas as fases, com horas estimadas, e sugere o valor da proposta (horas × custo por hora + margem).
- **Proposta → contrato**: o projeto entra "em proposta". Em "Contrato assinado", as tarefas ganham datas até a entrega e o projeto passa a contar como ativo. Projetos que já estão contratados podem entrar direto, na fase em que estão.
- **Planejamento guiado**: as 8 etapas essenciais (orçamento, proposta, contrato, briefing, programa, setorização, fluxos e conceito), cada uma com "por que importa" e "como fazer". Roteiro de briefing, programa de necessidades gerado a partir dos ambientes, setorização com áreas por setor e campo de partido.
- **Hoje**: modo do dia (Afiado, Criativo, Mecânico, Nebuloso), priorização entre todos os projetos (urgência 40%, dependências 30%, risco financeiro 20%, modo do dia 10%), "Comece por aqui", carga do dia e próximas entregas.
- **Fluxo do projeto**: quadro por fase, painel da tarefa (horas, data, link do Drive, anotações, registro de exploração), adicionar e excluir tarefas, redistribuir datas.
- **Captura rápida**: botão central (ou tecla C no computador), com a origem (WhatsApp, e-mail, ligação...). A caixa de captura transforma cada item em tarefa.
- **Check-out**: o que concluí, o que ficou aberto, por onde começo amanhã. A tarefa escolhida abre o dia seguinte.
- **Painel**: projetos ativos, propostas em aberto, horas pela frente e planejamento de cada projeto.
- **Aparência**: cinco estilos (Basalto, Calcário, Concreto, Musgo, Nanquim), claro e escuro, salvos na conta.

## Tecnologia

Next.js 16 (App Router) · Supabase (banco Postgres e login) · Vercel (hospedagem).

## Colocar no ar

1. **Banco**: no Supabase, abra *SQL Editor → New query*, cole o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e clique em *Run*. Pode rodar de novo sem problema.
2. **Variáveis**: no Vercel, em *Settings → Environment Variables*, cadastre:
   - `NEXT_PUBLIC_SUPABASE_URL`: o *Project URL* do Supabase
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: a *Publishable key* do Supabase (também aceita a antiga *anon key* no nome `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
3. **Publicar**: em *Deployments*, use *Redeploy*.
4. **Endereço do app no login**: no Supabase, em *Authentication → URL Configuration*, coloque o endereço do Vercel em *Site URL* e adicione `https://SEU-ENDERECO.vercel.app/**` em *Redirect URLs*.

## Onde mexer

| O quê | Arquivo |
| --- | --- |
| Tarefas, horas, textos de "por que importa", ambientes, roteiro de briefing | `src/lib/biblioteca.ts` |
| Geração de tarefas e distribuição no calendário | `src/lib/motor.ts` |
| Priorização do dia | `src/lib/prioridade.ts` |
| Cores dos cinco estilos | `scripts/gerar-tema.py` (gera `src/app/tema.css`) |
| Estrutura do banco e regras de segurança | `supabase/schema.sql` |

## Rodar no computador (opcional)

```bash
npm install
cp .env.example .env.local   # e preencha os dois valores
npm run dev
```

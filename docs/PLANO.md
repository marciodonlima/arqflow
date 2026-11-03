# ARQFLOW · plano de reconstrução (v0.2)

Decidido em 2 nov 2026, depois da revisão da v0.1 (feedback completo no Project ARQFLOW: claude/feedback-v0.1.md).
Uso pessoal do Márcio por enquanto. Meta: central de trabalho diária, não agenda.

## Princípios
- O que diferencia aparece em toda tela: atraso, horas estouradas, margem, valor-hora real, ritmo.
- Lugares na barra lateral (Hoje, Projetos, Agenda, Painel, Caixa); momentos dentro de Hoje (abertura, check-out); ação principal no canto superior direito; captura discreta (ícone no cabeçalho + tecla C).
- Identidade visual mantida (5 estilos × claro/escuro/automático, sem vermelho, um acento).
- Tom didático, "oriente, não cobre".

## Etapa 1 · Estrutura e produtividade
- Banco: projetos.cor, prazo_dias, prazo_tipo (corridos|uteis); tarefas.checklist, timer_inicio; tabela apontamentos (horas reais por sessão); parcelas; documentos; mensagens (IA); perfis.esquema aceita 'auto'.
- src/lib/saude.ts: por projeto ativo → horas restantes, ritmo real (real/estimado), horas projetadas, conclusão projetada × entrega (dias de atraso), tarefas atrasadas, margem prevista × projetada, valor-hora real × custo/hora, status em_dia|atencao|atrasado com motivos.
- Priorização: leque maior (fase em andamento + próximas da fila), modo do dia com peso real (0,30), atrasadas no topo; explicação visível.
- Cronômetro: Começar/Parar na tarefa e no Hoje; indicador global no cabeçalho.
- Projeto com abas: Visão geral · Tarefas (Quadro arrastável / Lista / Cronograma) · Briefing · Programa · Proposta · Financeiro.
- Hoje: alertas de saúde no topo, modo do dia, Comece por aqui com cronômetro, lista, carga; check-out guiado em 3 passos (revisar o dia → esvaziar a caixa → preparar amanhã) e resumo.
- Agenda (mês/semana) com tarefas e entregas coloridas por projeto.
- Painel: lucratividade e prazo de todos os projetos.
- Ajustes: criar conta mostra só a confirmação; tema automático por horário; "Informações adicionais" no briefing; prazo de entrega em dias.

## Etapa 2 · Orçamento confiável
- Onboarding com perfil de custos → custo/hora real.
- Tipologias em 3 níveis com ambientes próprios e comuns; distribuição de áreas por tipologia.
- Escopo Fase > Serviço > Entregável com pacotes; horas por entregável.
- Valor: custo real × tabela CAU (CUB, complexidade) × mercado.

## Etapa 3 · Assistente de IA (API da Anthropic, chave do Márcio no Vercel)
- Painel lateral em todas as telas com o contexto da tela; ações com confirmação (criar tarefas, preencher programa, revisar horas, resumo do dia).
- Proposta e minuta de contrato a partir de template ou modelo do usuário; editar, imprimir/PDF; aviso de revisão jurídica.

## Etapa 4 · Financeiro e obra
- Parcelas ligadas às fases (fase concluída → parcela a receber), fluxo do mês.
- Agenda com Google Calendar; diário com áudio transcrito; funil de propostas com aviso de proposta parada.

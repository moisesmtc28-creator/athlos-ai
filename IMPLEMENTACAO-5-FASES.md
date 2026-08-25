# Athlos AI — Implementação das 5 fases

Esta versão adiciona, de uma vez, a base das cinco fases solicitadas.

## 1. Musculação estruturada
- Nova ficha de academia com exercícios, séries, repetições, carga, RPE, RIR e descanso.
- Cada série realizada é salva individualmente.
- Histórico por exercício e cálculo de volume/carga.
- A geração semanal por IA passa a retornar exercícios estruturados e persisti-los no Supabase.

## 2. Calendário com reagendamento
- Nova visão semanal.
- Arrastar e soltar treinos entre dias usando `@dnd-kit`.
- Data original e motivo de reagendamento são preservados.
- Botão **Reorganizar com IA** redistribui a semana considerando ciclismo, musculação, recuperação e check-ins.

## 3. IA adaptativa / prontidão
- Check-in diário de sono, fadiga, dor muscular e motivação.
- Cálculo de prontidão.
- Check-ins entram no contexto da geração de plano e do Coach.
- Histórico de reagendamentos e não realização também pode ser usado no planejamento seguinte.

## 4. Performance
- Página Evolução agora separa ciclismo e musculação.
- Aderência calculada com sessões concluídas/finalizadas.
- Prontidão média recente.
- Evolução de carga e volume na musculação.

## 5. Coach com memória esportiva
- Coach consulta sessões recentes, check-ins, musculação estruturada e memória esportiva.
- `athlete_memory` guarda fatos consolidados, começando por aderência recente.
- Geração semanal também consulta a memória e o histórico estruturado para continuar o treino, em vez de criar semanas isoladas.

## PASSO OBRIGATÓRIO NO SUPABASE
Antes de publicar esta versão, execute no SQL Editor do Supabase o arquivo:

`supabase/migrations/20260825103000_full_ai_training_platform.sql`

Sem essa migração as novas telas não conseguirão acessar as tabelas/colunas novas.

## Publicação
1. Execute a migração no Supabase.
2. Suba este código para o GitHub.
3. Aguarde o novo deployment da Vercel.
4. Gere uma nova semana para que as novas fichas estruturadas de musculação sejam criadas.

Treinos de musculação antigos, que foram salvos apenas como texto, continuam visíveis no histórico de sessões, mas não terão séries estruturadas retroativamente.

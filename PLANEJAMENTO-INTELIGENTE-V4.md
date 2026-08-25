# Athlos AI v4 — integração real entre Coach, calendário e musculação

## O que mudou

- Motor determinístico de periodização em `services/planning-engine.ts`.
- A IA cria o conteúdo dos treinos; o motor escolhe os dias com base na disponibilidade e recuperação.
- Longão prioriza a maior janela disponível e evita musculação pesada de pernas.
- Tiros, limiar, VO2 e sessões Z4-Z6 ficam protegidos de musculação pesada de membros inferiores.
- Musculação de superiores/core pode compartilhar dia com ciclismo quando o conflito é baixo.
- O calendário móvel permite mover treino por seletor nativo; no desktop continua com arrastar e soltar.
- Ao mover um treino, o Athlos preserva essa escolha e reorganiza os demais ao redor dela.
- O Coach pode interpretar pedidos explícitos de mudança e atualizar o calendário automaticamente.
- Menu móvel ganhou “Mais” com Academia, Evolução, Nutrição, Perfil e Configurações.
- Academia ganhou seletor de fichas da semana, execução série a série otimizada para celular e histórico de fichas concluídas.

## Regras principais do motor

1. Respeitar `available_days` para ciclismo e `gym_days` para musculação.
2. Respeitar `available_minutes_by_day` quando informado.
3. Evitar dois treinos-chave intensos consecutivos.
4. Proibir na prática tiros/limiar/VO2 no mesmo dia ou muito perto de musculação pesada de pernas.
5. Proteger o longão de musculação pesada antes, no mesmo dia ou logo depois.
6. Permitir combinações de baixo conflito, como endurance leve + superiores/core.
7. Se o atleta mover manualmente um treino, essa data vira fixa e os demais são reorganizados.

## Banco de dados

Esta versão não exige nova migração além da `20260825103000_full_ai_training_platform.sql`, que já cria as tabelas de musculação, check-in, memória e campos de reagendamento.

# Athlos AI — versão finalizada

## O que foi concluído

- Perfil do atleta com correção do tempo padrão de 60 minutos.
- Coach IA funcional, conectado à rota de geração de plano.
- Treinos com consulta ao Supabase e tela de detalhes.
- Calendário mensal com os treinos cadastrados.
- Evolução com indicadores de aderência e volume.
- Nutrição com orientações gerais baseadas no perfil.
- Academia integrada aos dados de musculação do perfil.
- Configurações com encerramento de sessão.
- Remoção das mensagens "Em desenvolvimento".

## Como instalar

1. Copie `.env.example` para `.env.local`.
2. Preencha as mesmas chaves usadas no projeto original.
3. Execute:

```bash
npm install
npm run dev
```

## Verificação recomendada

```bash
npm run lint
npm run build
```

O pacote entregue não contém `node_modules`, `.next`, credenciais do `.env.local` ou arquivos temporários do Supabase.

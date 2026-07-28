# Correções realizadas

1. Login agora verifica `onboarding_completed`:
   - perfil concluído → Dashboard;
   - perfil ausente/incompleto → Perfil.
2. Tela de cadastro criada em `/register`.
3. Recuperação de senha criada em `/forgot-password` e `/reset-password`.
4. Consulta de treinos agora usa o perfil do usuário autenticado.
5. Geração de plano:
   - reutiliza corretamente um plano já criado;
   - remove plano incompleto sem sessões e gera novamente;
   - atualiza imediatamente a lista de treinos no React Query.
6. Dashboard passou a ler `athlete_profiles`, em vez da antiga tabela genérica `profiles`.
7. Perfil salvo redireciona ao Dashboard.
8. Hook do Husky corrigido para executar lint; script `test` também foi adicionado.
9. Migração SQL adicionada com tabelas, colunas, relacionamentos, índices, RLS e criação automática do perfil inicial.

## Passo obrigatório no Supabase

Execute no SQL Editor o arquivo:

`supabase/migrations/20260728230000_fix_auth_profiles_and_training.sql`

Sem essa etapa, as políticas e colunas do banco remoto podem continuar impedindo a leitura/gravação dos treinos.

# Athlos AI — revisão final

Correções desta revisão:

- Motor de periodização preservado e validado com cenário de longão, tiros e musculação de pernas.
- Movimentação de treino agora restaura corretamente data original e motivo se a reorganização falhar.
- Coach consegue aplicar movimentos entre semanas e depois reorganiza semana de origem e destino.
- Geração de plano reutilizado retorna também o tipo da sessão (bike/strength/recovery).
- Se falhar a criação de ficha/exercícios/séries após criar o plano, o plano incompleto é removido para permitir nova tentativa limpa.
- Arquivo antigo de conflito de merge removido.
- Imports locais validados.
- Sintaxe de todos os arquivos TS/TSX validada com TypeScript.

Observação: o build completo do Next.js exige `npm install` no ambiente com acesso às dependências.

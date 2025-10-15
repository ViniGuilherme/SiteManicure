# 📝 Como Configurar Serviços e Horários

Este guia explica como a manicure pode modificar os serviços, preços e horários disponíveis para agendamento.

## 🎯 Funcionalidade Implementada

A manicure agora pode gerenciar completamente:
- ✅ **Serviços** (nome, ícone, preço, duração e descrição)
- ✅ **Horários de atendimento**
- ✅ Adicionar, editar e remover itens
- ✅ As alterações aparecem automaticamente na tela do cliente

## 🔐 Como Acessar

1. Abra a **Área da Manicure** (botão no menu ou arquivo `admin.html`)
2. Faça login com a senha: `admin123`
3. No painel administrativo, clique no botão **"⚙️ Configurações"**

## 💅 Gerenciar Serviços

### Visualizar Serviços
Na aba **"💅 Serviços"**, você verá todos os serviços cadastrados com:
- Nome do serviço
- Preço
- Duração
- Descrição
- Ícone (emoji)

### Adicionar Novo Serviço
1. Clique em **"➕ Adicionar Serviço"**
2. Preencha os campos:
   - **Nome**: Ex: "Manicure Premium"
   - **Ícone**: Escolha um emoji (Ex: 💎)
   - **Preço**: Digite o valor em reais (Ex: 80.00)
   - **Duração**: Tempo em minutos (Ex: 60)
   - **Descrição**: Explique o que inclui no serviço
3. Clique em **"Salvar Serviço"**

### Editar Serviço Existente
1. Clique no botão **"✏️ Editar"** ao lado do serviço
2. Modifique os campos desejados
3. Clique em **"Salvar Serviço"**

### Excluir Serviço
1. Clique no botão **"🗑️ Excluir"** ao lado do serviço
2. Confirme a exclusão

⚠️ **Importante**: A exclusão de serviços não pode ser desfeita!

## 🕒 Gerenciar Horários

### Visualizar Horários
Na aba **"🕒 Horários"**, você verá todos os horários de atendimento disponíveis.

### Adicionar Novo Horário
1. Clique em **"➕ Adicionar Horário"**
2. Selecione o horário desejado (Ex: 13:00)
3. Clique em **"Adicionar Horário"**

### Remover Horário
1. Clique no botão **"🗑️ Remover"** no card do horário
2. Confirme a remoção

## 💡 Dicas Importantes

### Preços
- Use ponto (.) para separar centavos (Ex: 35.50)
- Não use símbolos como R$ ou vírgulas

### Ícones
- Use emojis diretamente no campo
- No Windows: tecle `Win + .` para abrir o painel de emojis
- No Mac: tecle `Cmd + Ctrl + Espaço`
- Sugestões de emojis: 💅 ✨ 🦶 💎 🎨 🌸 💖 ⭐ 🌺 🦋

### Duração
- Sempre em minutos
- Múltiplos de 5 são recomendados (Ex: 30, 45, 60, 90, 120)

### Horários
- Use o formato 24 horas (Ex: 14:00 ao invés de 2:00 PM)
- Os horários aparecem automaticamente ordenados
- Não é possível adicionar horários duplicados

## 🔄 Sincronização Automática

Todas as alterações são:
- ✅ Salvas automaticamente no navegador
- ✅ Refletidas imediatamente na tela do cliente
- ✅ Mantidas mesmo após fechar o navegador
- ✅ Aplicadas aos novos agendamentos

## 📱 Onde as Alterações Aparecem

As configurações modificadas são exibidas em:

1. **Tela do Cliente** (`index.html`):
   - Seção "Nossos Serviços"
   - Formulário de agendamento (select de serviços)
   - Seleção de horários disponíveis

2. **Painel Administrativo** (`admin.html`):
   - Formulário de adicionar agendamento manual
   - Cálculo de receita (usa preços atualizados)

## 🎓 Exemplos de Uso

### Exemplo 1: Adicionar Serviço Sazonal
```
Nome: Decoração de Natal
Ícone: 🎄
Preço: 80.00
Duração: 60
Descrição: Nail art temática de Natal com glitter e adesivos
```

### Exemplo 2: Ajustar Horário de Almoço
Se você almoça das 12h às 14h:
1. Remova o horário 12:00
2. Remova o horário 13:00
3. Os clientes só verão horários disponíveis antes das 12h e após as 14h

### Exemplo 3: Alterar Preço por Aumento
1. Clique em "✏️ Editar" no serviço
2. Atualize o campo "Preço"
3. Salve as alterações
4. Todos os novos agendamentos usarão o preço atualizado

## ❓ Perguntas Frequentes

**P: As alterações afetam agendamentos antigos?**
R: Não. Os agendamentos já feitos mantêm o preço e duração originais.

**P: Posso restaurar os serviços padrão?**
R: Sim. Exclua todos os serviços e recarregue a página. Os serviços padrão serão restaurados automaticamente.

**P: Quantos serviços posso adicionar?**
R: Não há limite. Adicione quantos precisar!

**P: Os horários bloqueados aparecem para o cliente?**
R: Não. Os clientes só veem os horários que você configurou como disponíveis.

**P: Posso adicionar horários fora do horário comercial?**
R: Sim! Você tem total flexibilidade para definir os horários que desejar.

## 🔒 Segurança

- As configurações são armazenadas localmente no navegador
- Apenas quem tem a senha do painel administrativo pode modificar
- Para mudar a senha, edite o arquivo `admin.js` (linha 6)

## 📞 Suporte

Se tiver dúvidas ou problemas:
1. Verifique se está usando um navegador moderno (Chrome, Firefox, Edge)
2. Certifique-se de que o JavaScript está habilitado
3. Tente limpar o cache do navegador se algo não aparecer

---

**Desenvolvido com ❤️ para facilitar o gerenciamento do seu negócio!**


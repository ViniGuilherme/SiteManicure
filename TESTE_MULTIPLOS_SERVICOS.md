# 🧪 Teste Rápido - Agendamento de Múltiplos Serviços

## Como Testar a Nova Funcionalidade

### 1️⃣ Teste na Tela do Cliente

#### Abrir o Sistema
1. **Abra** `index.html` no navegador
2. **Role** até a seção "Agendar Horário"

#### Selecionar Múltiplos Serviços
3. Você verá **checkboxes** ao invés de um select
4. **Marque** dois serviços, por exemplo:
   - ☑ Manicure Básica (45 min - R$ 35.00)
   - ☑ Pedicure (60 min - R$ 40.00)

#### Verificar Resumo
5. ✅ Deve aparecer um **resumo** mostrando:
   - Serviços: Manicure Básica, Pedicure
   - Duração Total: 105 minutos
   - Preço Total: R$ 75.00

#### Selecionar Data e Hora
6. **Selecione** uma data (hoje ou amanhã)
7. **Observe** que os horários disponíveis agora consideram a duração total
8. ✅ Horários que não têm slots suficientes **não aparecem**
9. Exemplo: Se escolher 2 serviços (105 min), o último horário (18:00) não aparecerá

#### Fazer Agendamento
10. **Preencha** os dados:
    - Nome: Teste Cliente
    - Telefone: (11) 98765-4321
    - Email: teste@email.com
11. **Selecione** um horário disponível
12. **Clique** em "Confirmar Agendamento"

#### Verificar Confirmação
13. ✅ Modal deve mostrar:
    - Lista de serviços selecionados
    - Preços individuais
    - Total
    - Duração total

### 2️⃣ Teste no Painel Admin

#### Acessar Admin
14. **Abra** `admin.html`
15. **Faça login** (senha: admin123)

#### Visualizar Agendamento
16. **Veja** o agendamento que você criou
17. ✅ Deve mostrar:
    - Múltiplas badges de serviço
    - Detalhamento de cada serviço
    - Preço total: R$ 75.00
    - Duração total: 105 minutos

#### Verificar Bloqueio de Horários
18. **Clique** em "➕ Adicionar Agendamento"
19. **Selecione** a mesma data do agendamento anterior
20. **Marque** qualquer serviço
21. **Veja** os horários disponíveis
22. ✅ O horário 14:00 **E 15:00** não devem aparecer (se o primeiro agendamento foi às 14:00)

### 3️⃣ Teste de Bloqueio Inteligente

#### Criar Agendamento Longo
23. **No cliente**, tente agendar 3 serviços:
    - ☑ Manicure Básica (45 min)
    - ☑ Pedicure (60 min)
    - ☑ Alongamento de Unhas (120 min)
24. Total: 225 minutos = **4 slots de 1 hora**

#### Verificar Horários
25. **Selecione** uma data
26. ✅ Apenas horários com **4 slots consecutivos livres** devem aparecer
27. Exemplo com horários 09:00 a 18:00:
    - ✅ 09:00 (tem 10:00, 11:00, 12:00 livres)
    - ✅ 10:00 (tem 11:00, 12:00, 14:00 livres) **← Nota: pula o almoço!**
    - ❌ 11:00 (não tem 4 slots consecutivos)
    - ✅ 14:00 (tem 15:00, 16:00, 17:00 livres)
    - ❌ 15:00, 16:00, 17:00, 18:00 (não têm slots suficientes)

### 4️⃣ Teste de Exclusão

#### Excluir Agendamento
28. **No admin**, encontre o agendamento com múltiplos serviços
29. **Clique** em "🗑️ Excluir"
30. **Confirme** a exclusão

#### Verificar Liberação de Horários
31. **Tente adicionar** um novo agendamento na mesma data
32. ✅ Os horários que estavam bloqueados agora devem estar **disponíveis**
33. Tanto o horário principal quanto os horários consecutivos devem estar livres

### 5️⃣ Teste de Conclusão

#### Criar Novo Agendamento
34. Crie um agendamento com 2 serviços (ex: às 10:00)

#### Marcar como Concluído
35. **No admin**, clique em "✓ Concluir"
36. **Confirme**

#### Verificar Estatísticas
37. ✅ A **receita total** deve incluir o valor correto
38. ✅ Deve somar apenas o preço do agendamento principal (não duplicar)

### 6️⃣ Teste de Serviço Único

#### Agendar Apenas Um Serviço
39. **No cliente**, marque apenas 1 serviço
40. ✅ Deve funcionar normalmente (como antes)
41. ✅ Bloqueia apenas 1 horário

### 7️⃣ Teste de Mudança de Seleção

#### Mudar Serviços Dinamicamente
42. **Marque** 2 serviços
43. **Observe** o resumo
44. **Desmarque** 1 serviço
45. ✅ Resumo deve atualizar automaticamente
46. **Selecione** uma data
47. **Marque** mais 1 serviço
48. ✅ Horários disponíveis devem ser recalculados automaticamente

### 8️⃣ Teste de Validação

#### Tentar Agendar Sem Serviço
49. **Desmarque** todos os serviços
50. **Tente** preencher o formulário
51. ✅ Horários devem mostrar "Selecione um serviço primeiro"
52. **Tente** submeter
53. ✅ Deve dar erro: "Por favor, selecione pelo menos um serviço"

### 9️⃣ Teste no Mobile

#### Responsividade
54. **Abra** o site no celular ou reduza o navegador
55. ✅ Checkboxes devem ser tocáveis
56. ✅ Resumo deve aparecer de forma legível
57. ✅ Cards de serviço do admin devem se adaptar

### 🔟 Teste de Compatibilidade

#### Agendamentos Antigos
58. Se você tinha agendamentos do sistema anterior:
59. ✅ Devem aparecer normalmente
60. ✅ Funcionalidades de completar/excluir devem funcionar
61. ✅ Preços devem ser calculados corretamente

## 📋 Checklist de Teste Completo

- [ ] Selecionar múltiplos serviços funciona
- [ ] Resumo atualiza automaticamente
- [ ] Horários consideram duração total
- [ ] Bloqueio de slots consecutivos funciona
- [ ] Agendamento salva múltiplos serviços
- [ ] Modal de confirmação mostra todos os serviços
- [ ] Admin exibe múltiplos serviços corretamente
- [ ] Exclusão remove todos os slots bloqueados
- [ ] Conclusão marca todos os slots como concluídos
- [ ] Receita não duplica valores
- [ ] Serviço único ainda funciona
- [ ] Validações estão funcionando
- [ ] Horários são liberados após exclusão
- [ ] Interface responsiva
- [ ] Compatível com agendamentos antigos

## 🎯 Cenários de Teste Avançados

### Cenário 1: Agenda Cheia
1. Crie vários agendamentos para preencher a agenda
2. Tente agendar múltiplos serviços
3. ✅ Deve mostrar mensagem "Nenhum horário disponível"

### Cenário 2: Último Horário
1. Tente agendar múltiplos serviços no último horário (18:00)
2. ✅ Não deve permitir se precisar de mais de 1 slot

### Cenário 3: Horário de Almoço
1. Configure horários: 09:00 a 12:00, depois 14:00 a 18:00
2. Tente agendar 2 horas de serviço às 11:00
3. ✅ Não deve aparecer (pois precisaria de 12:00 e 13:00, mas 13:00 não existe)

### Cenário 4: Combos Longos
1. Selecione todos os 6 serviços padrão
2. Total: ~6 horas
3. ✅ Poucos ou nenhum horário deve aparecer
4. ✅ Sistema deve calcular corretamente

## 🐛 Bugs para Verificar

Teste se esses cenários **NÃO** causam problemas:

1. **Desmarcar todos os serviços e remarcar** → Deve funcionar
2. **Mudar data após selecionar horário** → Deve limpar horário
3. **Selecionar horário antes de serviço** → Não deve permitir
4. **Excluir agendamento e criar outro no mesmo horário** → Deve funcionar
5. **Múltiplos agendamentos no mesmo dia** → Deve respeitar todos
6. **Recarregar página** → Dados devem persistir

## ✅ Resultado Esperado

Depois de todos os testes:
- ✅ Múltiplos serviços podem ser agendados
- ✅ Sistema bloqueia horários automaticamente
- ✅ Cálculos estão corretos
- ✅ Interface é intuitiva
- ✅ Nenhum bug crítico
- ✅ Compatibilidade mantida

## 🎉 Sucesso!

Se todos os testes passaram, a funcionalidade está **100% operacional**!

Os clientes agora podem:
- 🎨 Agendar múltiplos serviços de uma vez
- 💰 Ver o preço total antes de confirmar
- ⏰ Saber exatamente quanto tempo levará
- 📅 Sistema gerencia tudo automaticamente

**Experiência profissional e completa!** 🚀


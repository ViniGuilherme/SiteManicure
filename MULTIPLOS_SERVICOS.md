# 🎯 Agendamento de Múltiplos Serviços

## ✨ Nova Funcionalidade Implementada

O sistema agora permite que os clientes **agendem múltiplos serviços de uma só vez**, e o sistema automaticamente:
- ✅ Calcula o tempo total necessário
- ✅ Bloqueia os horários consecutivos necessários
- ✅ Calcula o preço total
- ✅ Mostra resumo detalhado

## 🔍 Como Funciona

### Para o Cliente (`index.html`)

#### 1. **Seleção de Serviços**
- Ao invés de um select, agora há **checkboxes** para cada serviço
- O cliente pode marcar **quantos serviços quiser**
- Ao selecionar serviços, aparece um **resumo automático** mostrando:
  - Serviços selecionados
  - Duração total
  - Preço total

#### 2. **Cálculo de Horários Disponíveis**
- O sistema calcula automaticamente **quantos slots de 1 hora são necessários**
- Exemplo: 
  - Manicure (45 min) + Pedicure (60 min) = 105 minutos = **2 slots** necessários
  - Se agendar às 14:00, bloqueará 14:00 e 15:00

#### 3. **Horários Inteligentes**
- Só mostra horários onde há **slots consecutivos livres suficientes**
- Se escolher 2 horas de serviço, não mostrará 18:00 se o último horário disponível for 18:00

### Para a Manicure (`admin.html`)

#### 1. **Visualização de Agendamentos**
- Mostra todos os serviços do agendamento
- Exibe detalhamento individual de cada serviço
- Mostra preço e duração totais
- **Não mostra slots de bloqueio** (apenas o agendamento principal)

#### 2. **Adicionar Agendamento Manual**
- Mesmo sistema de checkboxes
- Resumo automático de tempo e preço
- Horários ajustados conforme duração total

#### 3. **Gerenciamento**
- Ao **concluir** um agendamento, todos os slots relacionados são marcados
- Ao **excluir** um agendamento, todos os slots relacionados são removidos

## 🎨 Interface do Usuário

### Tela do Cliente

```
╔══════════════════════════════════════╗
║ Serviços Desejados *                 ║
╠══════════════════════════════════════╣
║ ☑ 💅 Manicure Básica                 ║
║   (45 min - R$ 35.00)                ║
║                                      ║
║ ☑ 🦶 Pedicure                        ║
║   (60 min - R$ 40.00)                ║
║                                      ║
║ ☐ 💎 Mão e Pé                        ║
║   (90 min - R$ 70.00)                ║
╚══════════════════════════════════════╝

╔══════════════════════════════════════╗
║ Resumo:                              ║
║ Serviços: Manicure Básica, Pedicure ║
║ Duração Total: 105 minutos           ║
║ Preço Total: R$ 75.00                ║
╚══════════════════════════════════════╝
```

## 🔧 Lógica de Bloqueio de Horários

### Exemplo Prático

**Configuração:**
- Horários disponíveis: 09:00, 10:00, 11:00, 12:00, 14:00, 15:00, 16:00, 17:00, 18:00

**Cliente seleciona:**
- Manicure Básica (45 min)
- Pedicure (60 min)
- **Total: 105 minutos**

**Cálculo:**
```javascript
Slots necessários = Math.ceil(105 / 60) = 2 slots
```

**Se escolher 14:00:**
- ✅ **Agendamento Principal** → 14:00 (com todos os dados)
- 🔒 **Slot de Bloqueio** → 15:00 (marca o horário como ocupado)

**Horários que aparecem como disponíveis:**
- ✅ 09:00 (tem 10:00 livre depois)
- ✅ 10:00 (tem 11:00 livre depois)
- ✅ 11:00 (tem 12:00 livre depois)
- ❌ 12:00 (não tem horário livre depois - próximo é 14:00)
- ✅ 14:00 (tem 15:00 livre depois)
- ✅ 15:00 (tem 16:00 livre depois)
- ✅ 16:00 (tem 17:00 livre depois)
- ✅ 17:00 (tem 18:00 livre depois)
- ❌ 18:00 (último horário, não tem depois)

## 💾 Estrutura de Dados

### Agendamento Principal
```javascript
{
  id: 1697123456789,
  clientName: "Maria Silva",
  phone: "(11) 98765-4321",
  email: "maria@email.com",
  services: [
    { name: "Manicure Básica", price: 35, duration: 45 },
    { name: "Pedicure", price: 40, duration: 60 }
  ],
  service: "Manicure Básica + Pedicure", // Para compatibilidade
  date: "2025-10-15",
  time: "14:00",
  price: 75,
  duration: 105,
  slotsNeeded: 2,
  completed: false,
  createdAt: "2025-10-14T10:30:00Z"
}
```

### Slot de Bloqueio (Interno)
```javascript
{
  id: 1697123456790,
  clientName: "Maria Silva",
  phone: "(11) 98765-4321",
  email: "maria@email.com",
  service: "[Continuação] Manicure Básica + Pedicure",
  services: [...],
  date: "2025-10-15",
  time: "15:00",
  price: 0, // Não conta na receita
  duration: 60,
  slotsNeeded: 1,
  completed: false,
  isBlockSlot: true, // Marcador importante
  mainAppointmentId: 1697123456789,
  createdAt: "2025-10-14T10:30:00Z"
}
```

## 🎓 Exemplos de Uso

### Exemplo 1: Serviço Único
- Cliente seleciona: **Manicure Básica** (45 min)
- Slots necessários: 1
- Horários disponíveis: Todos os horários configurados
- Bloqueio: Apenas o horário escolhido

### Exemplo 2: Dois Serviços Curtos
- Cliente seleciona: 
  - **Manicure Básica** (45 min)
  - **Nail Art** (45 min)
- Total: 90 minutos
- Slots necessários: 2
- Se agendar às 10:00:
  - Bloqueia 10:00 e 11:00

### Exemplo 3: Combo Completo
- Cliente seleciona:
  - **Manicure Básica** (45 min)
  - **Pedicure** (60 min)
  - **Nail Art** (45 min)
- Total: 150 minutos
- Slots necessários: 3
- Se agendar às 09:00:
  - Bloqueia 09:00, 10:00 e 11:00

### Exemplo 4: Serviço Longo
- Cliente seleciona: **Alongamento de Unhas** (120 min)
- Slots necessários: 2
- Se agendar às 14:00:
  - Bloqueia 14:00 e 15:00

## ⚙️ Configurações no Admin

### Gerenciar Agendamentos
- **Visualização**: Mostra apenas agendamentos principais (não mostra slots de bloqueio)
- **Completar**: Marca o agendamento principal E todos os slots de bloqueio como concluídos
- **Excluir**: Remove o agendamento principal E todos os slots de bloqueio relacionados

### Receita Total
- Calcula apenas o preço dos agendamentos principais
- Slots de bloqueio têm `price: 0` para não duplicar valores

## 🚀 Vantagens

### Para o Cliente:
- ✅ Agendar tudo de uma vez
- ✅ Ver preço total antes de confirmar
- ✅ Saber exatamente quanto tempo levará
- ✅ Não precisa fazer múltiplos agendamentos

### Para a Manicure:
- ✅ Organização automática de horários
- ✅ Não há risco de agendar serviços sobrepostos
- ✅ Visão clara do que será feito
- ✅ Cálculo automático de receita
- ✅ Melhor aproveitamento do tempo

## 🔒 Segurança e Validações

### No Cliente:
- ✅ Deve selecionar pelo menos 1 serviço
- ✅ Só mostra horários com slots suficientes
- ✅ Verifica disponibilidade antes de confirmar

### No Admin:
- ✅ Mesmas validações do cliente
- ✅ Não permite agendar em horários ocupados
- ✅ Sincronização automática entre slots

## 🐛 Casos Especiais

### Agendamentos Antigos
- Agendamentos feitos antes dessa atualização:
- São exibidos normalmente
- Funcionam com a lógica antiga (serviço único)
- Compatibilidade 100% mantida

### Alteração de Horários Disponíveis
- Se remover um horário que tem agendamentos:
- Agendamentos existentes não são afetados
- Novos agendamentos respeitam os novos horários

### Mudança de Preços
- Agendamentos salvam o preço no momento da criação
- Alterações futuras de preço não afetam agendamentos passados

## 📱 Responsividade

- ✅ Funciona perfeitamente em desktop
- ✅ Adaptado para tablets
- ✅ Otimizado para smartphones
- ✅ Scroll automático em listas longas

## ✨ Melhorias Futuras Sugeridas

Possíveis expansões (opcionais):
- [ ] Descontos para pacotes de serviços
- [ ] Sugestões automáticas de combos populares
- [ ] Histórico de serviços do cliente
- [ ] Notificações de tempo estimado
- [ ] Opção de intervalo entre serviços

## 🎉 Conclusão

O sistema agora oferece uma experiência **profissional e completa** para:
- ✅ Agendar múltiplos serviços
- ✅ Gerenciar tempo de forma inteligente
- ✅ Calcular preços automaticamente
- ✅ Organizar a agenda perfeitamente

**Tudo funcionando de forma automática e intuitiva!** 🚀

---

**Data de Implementação:** 14/10/2025  
**Status:** ✅ Completo e Testado  
**Compatibilidade:** Retrocompatível com agendamentos antigos


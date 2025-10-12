# 💅 Sistema de Agendamento para Manicure - Beleza & Estilo

Um sistema completo de agendamento online com duas interfaces: uma para clientes agendarem e outra para a manicure gerenciar os horários.

## 🌟 Características Principais

### Para Clientes:
- ✅ **Agendamento Simples**: Apenas nome, telefone, email e horário
- ✅ **Visualização de Horários Disponíveis**: Veja em tempo real quais horários estão livres
- ✅ **6 Serviços Disponíveis**: Escolha entre manicure, pedicure, alongamento e mais
- ✅ **Interface Moderna e Responsiva**: Funciona perfeitamente em celular, tablet e computador
- ✅ **Confirmação Instantânea**: Receba confirmação visual do seu agendamento

### Para a Manicure:
- 👩‍💼 **Painel Administrativo Completo**: Gerencie todos os agendamentos em um só lugar
- ➕ **Adicionar Agendamentos**: Crie agendamentos manualmente (telefone, WhatsApp, pessoalmente)
- 📊 **Estatísticas em Tempo Real**: Veja total de agendamentos, receita e mais
- 📅 **Filtros Inteligentes**: Visualize agendamentos por período (todos, hoje, próximos, realizados)
- ✅ **Marcar como Concluído**: Controle quais serviços já foram realizados
- 🗑️ **Gerenciar Agendamentos**: Exclua agendamentos cancelados
- 💰 **Controle Financeiro**: Acompanhe a receita total
- 🔒 **Acesso Protegido**: Área administrativa com senha
- 🎯 **Verificação de Disponibilidade**: Veja horários ocupados em tempo real

## 📋 Serviços e Preços

| Serviço | Preço | Duração |
|---------|-------|---------|
| Manicure Básica | R$ 35,00 | 45 min |
| Manicure com Gel | R$ 65,00 | 60 min |
| Pedicure | R$ 40,00 | 60 min |
| Mão e Pé | R$ 70,00 | 90 min |
| Alongamento de Unhas | R$ 120,00 | 120 min |
| Nail Art | R$ 50,00 | 45 min |

## 🚀 Como Usar

### Instalação

1. **Faça o download** de todos os arquivos do projeto
2. **Abra o arquivo `index.html`** em seu navegador
3. Pronto! O site está funcionando

**Não precisa instalar nada!** O sistema funciona completamente no navegador, sem necessidade de servidor.

### Para Clientes - Como Agendar

1. Acesse o site principal (`index.html`)
2. Navegue até a seção **"Agendar Horário"**
3. Preencha o formulário:
   - **Nome completo**
   - **Telefone** (será formatado automaticamente)
   - **E-mail**
   - **Serviço desejado**
   - **Data**
   - **Horário** (apenas horários disponíveis serão mostrados)
4. Clique em **"Confirmar Agendamento"**
5. Pronto! Você receberá uma confirmação na tela

### Para a Manicure - Painel Administrativo

#### Acessando o Painel:

1. No site principal, clique em **"Área da Manicure"** no menu
2. **OU** abra diretamente o arquivo `admin.html`
3. Digite a senha: **`admin123`** (você pode alterar isso - veja abaixo)
4. Clique em **"Entrar"**

#### Funcionalidades do Painel:

**📊 Estatísticas:**
- Total de agendamentos
- Agendamentos de hoje
- Próximos agendamentos
- Receita total (apenas de serviços concluídos)

**🔍 Filtros:**
- **Todos**: Mostra todos os agendamentos
- **Hoje**: Apenas agendamentos de hoje
- **Próximos**: Agendamentos futuros não realizados
- **Realizados**: Agendamentos já concluídos

**⚙️ Ações Disponíveis:**
- ➕ **Adicionar Agendamento**: Criar novos agendamentos manualmente
- ✅ **Concluir**: Marcar um agendamento como realizado (adiciona à receita)
- 🗑️ **Excluir**: Remover um agendamento (cancelamento)
- 📥 **Exportar**: Pressione `Ctrl+E` para fazer backup dos dados

### Como Adicionar Agendamento Manualmente:

Perfeito para quando clientes ligam, mandam WhatsApp ou chegam pessoalmente!

1. No painel administrativo, clique em **"➕ Adicionar Agendamento"**
2. Preencha os dados do cliente:
   - Nome completo
   - Telefone (formatado automaticamente)
   - E-mail (opcional)
   - Serviço desejado
   - Data
   - Horário disponível
3. O sistema mostra automaticamente quais horários estão ocupados
4. Clique em **"Confirmar Agendamento"**
5. Pronto! O agendamento aparecerá na lista com os demais

**📋 Informações Exibidas:**
- Nome do cliente
- Tipo de serviço
- Data e horário
- Telefone de contato
- E-mail
- Valor do serviço
- Duração

## 🔧 Personalização

### Alterar a Senha do Painel Administrativo

1. Abra o arquivo `admin.js`
2. Na linha 7, altere o valor:
```javascript
this.adminPassword = 'admin123'; // Altere para sua senha
```
3. Salve o arquivo

### Alterar Horários Disponíveis

1. Abra o arquivo `script.js`
2. Na linha 5, modifique o array:
```javascript
this.availableHours = ['09:00', '10:00', '11:00', ...]; // Adicione ou remova horários
```
3. Salve o arquivo

### Alterar Serviços e Preços

1. **No arquivo `script.js`** (linhas 6-13):
```javascript
this.servicesPrices = {
    'Nome do Serviço': { price: 50, duration: 60 },
    // Adicione ou modifique aqui
};
```

2. **No arquivo `index.html`** (seção de serviços e formulário):
- Adicione/edite os cards de serviços
- Adicione/edite as opções no select

3. **No arquivo `admin.js`** (linhas 138-146):
```javascript
const services = {
    'Nome do Serviço': { price: 50, duration: 60 },
    // Mantenha sincronizado com script.js
};
```

### Personalizar Cores

Edite o arquivo `styles.css` nas variáveis CSS (linhas 8-16):
```css
:root {
    --primary-color: #E91E63;      /* Rosa principal */
    --primary-dark: #C2185B;       /* Rosa escuro */
    --primary-light: #F8BBD0;      /* Rosa claro */
    --secondary-color: #9C27B0;    /* Roxo */
    --accent-color: #FF4081;       /* Rosa vibrante */
}
```

## 📦 Estrutura de Arquivos

```
manicure/
│
├── index.html          # Página principal (para clientes)
├── admin.html          # Painel administrativo (para manicure)
├── styles.css          # Estilos compartilhados
├── script.js           # JavaScript da interface do cliente
├── admin.js            # JavaScript do painel administrativo
└── README.md           # Este arquivo
```

## 💾 Armazenamento de Dados

### Como Funciona:
- Os agendamentos são salvos no **localStorage** do navegador
- Os dados persistem mesmo fechando o navegador
- Não precisa de servidor ou banco de dados

### ⚠️ Importante Saber:
- Os dados ficam apenas no navegador/computador usado
- Se limpar os dados do navegador, os agendamentos serão perdidos
- **Recomendação**: Faça backup regular usando `Ctrl+E` no painel admin

### 📥 Backup e Restauração:

**Fazer Backup:**
1. Acesse o painel administrativo
2. Pressione `Ctrl+E`
3. Um arquivo JSON será baixado

**Restaurar Backup:**
1. Abra o Console do navegador (F12)
2. Cole e execute:
```javascript
// Cole o conteúdo do arquivo JSON aqui
const backup = [/* seus dados */];
localStorage.setItem('appointments', JSON.stringify(backup));
location.reload();
```

## 🔒 Segurança

### Para Uso Pessoal/Local:
✅ O sistema atual é perfeito e seguro

### Para Uso Online (Internet):
Se você quiser colocar o site online, considere:

1. **Senha mais forte**: Altere a senha padrão
2. **HTTPS**: Use hospedagem com certificado SSL
3. **Banco de dados**: Migre do localStorage para um banco de dados real
4. **Backend**: Implemente um servidor (Node.js, PHP, etc.)
5. **Autenticação real**: Sistema de login com hash de senha
6. **Notificações**: Integre e-mail/SMS para confirmar agendamentos

## 📱 Compatibilidade

✅ **Navegadores Suportados:**
- Google Chrome (recomendado)
- Mozilla Firefox
- Microsoft Edge
- Safari
- Opera

✅ **Dispositivos:**
- 💻 Desktop/Laptop
- 📱 Smartphones
- 📱 Tablets

## 🎯 Funcionalidades Avançadas Implementadas

- ✅ Formatação automática de telefone
- ✅ Validação de e-mail
- ✅ Verificação de disponibilidade em tempo real
- ✅ Prevenção de duplo agendamento
- ✅ Cálculo automático de receita
- ✅ Sistema de filtros inteligente
- ✅ Animações suaves
- ✅ Design responsivo
- ✅ Proteção por senha
- ✅ Exportação de dados
- ✅ **Agenda virtual - Adicione agendamentos manualmente**
- ✅ **Contador de horários disponíveis por dia**
- ✅ **Identificação de horários ocupados**

## 🆘 Solução de Problemas

### "Meus agendamentos sumiram!"
- Os dados estão no localStorage do navegador
- Certifique-se de usar sempre o mesmo navegador
- Não limpe os dados do navegador
- Faça backups regulares

### "Não consigo acessar o painel administrativo"
- Senha padrão: `admin123`
- Verifique se digitou corretamente
- Se alterou a senha, verifique o arquivo `admin.js`

### "Os horários não aparecem"
- Selecione uma data primeiro
- Verifique se há horários disponíveis naquele dia
- Horários já agendados aparecem como "Ocupado"

### "O site não está funcionando"
- Certifique-se de que todos os arquivos estão na mesma pasta
- Abra o Console do navegador (F12) para ver erros
- Verifique se o JavaScript está habilitado

## 🚀 Próximas Melhorias Sugeridas

- [ ] Notificações por e-mail/SMS
- [ ] Integração com WhatsApp
- [ ] Lembretes automáticos
- [ ] Sistema de avaliações
- [ ] Galeria de trabalhos
- [ ] Integração com Google Calendar
- [ ] Sistema de pagamento online
- [ ] Programa de fidelidade
- [ ] Relatórios financeiros detalhados
- [ ] Múltiplos usuários/manicures

## 📄 Licença

Este projeto é de código aberto e está disponível para uso livre. Sinta-se à vontade para modificar e adaptar às suas necessidades.

## 💬 Dicas de Uso

1. **Configure a senha** antes de usar o sistema
2. **Faça backups regulares** dos agendamentos
3. **Teste o sistema** antes de divulgar aos clientes
4. **Personalize as cores** para combinar com sua marca
5. **Ajuste os horários** de acordo com sua disponibilidade
6. **Atualize os preços** conforme necessário

---

## 📞 Suporte

Para dúvidas sobre o funcionamento do sistema, consulte este README ou o código-fonte que está bem comentado.

---

Desenvolvido com 💖 para profissionais de beleza

**Versão:** 2.1.0  
**Data:** Outubro 2025  
**Novidades:** Agenda virtual - Adicione agendamentos manualmente pelo painel admin!

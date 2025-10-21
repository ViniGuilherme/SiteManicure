# Guia de Deploy - Sistema de Agendamento

## 📁 Arquivos Necessários para Upload

### Arquivos Principais:
- `index.html` - Página principal do sistema
- `admin.html` - Painel administrativo
- `script.js` - Lógica principal
- `admin.js` - Lógica administrativa
- `styles.css` - Estilos
- `firebase-config.js` - Configuração do Firebase

### Arquivos de Documentação (opcionais):
- `README.md`
- `COMO_USAR.txt`
- `GUIA_FIREBASE.md`

## 🚀 Opções de Deploy

### 1. Netlify (Recomendado - Gratuito)

#### Passo a Passo:
1. Acesse [netlify.com](https://netlify.com)
2. Crie uma conta gratuita
3. Clique em "New site from Git" ou "Deploy manually"
4. Faça upload da pasta com todos os arquivos
5. Configure o domínio personalizado:
   - Site settings → Domain management
   - Add custom domain → Digite seu domínio
   - Configure DNS no Registro.br:
     ```
     Tipo: CNAME
     Nome: www
     Valor: [seu-site].netlify.app
     ```

#### Configurações Adicionais:
- **Build command:** (deixar vazio)
- **Publish directory:** (deixar vazio)
- **Redirects:** Criar arquivo `_redirects` na raiz:
  ```
  /admin /admin.html
  /* /index.html 200
  ```

### 2. Vercel (Alternativa Gratuita)

#### Passo a Passo:
1. Acesse [vercel.com](https://vercel.com)
2. Crie uma conta gratuita
3. Importe o projeto
4. Configure domínio personalizado:
   - Settings → Domains
   - Add domain → Digite seu domínio
   - Configure DNS no Registro.br:
     ```
     Tipo: CNAME
     Nome: www
     Valor: [seu-site].vercel.app
     ```

### 3. Hospedagem Tradicional (Paga)

#### Configuração no cPanel:
1. Acesse o cPanel da sua hospedagem
2. Vá em "File Manager"
3. Navegue até a pasta `public_html`
4. Faça upload de todos os arquivos
5. Configure o domínio no painel da hospedagem

## 🔧 Configurações DNS no Registro.br

### Para Netlify:
```
Tipo: CNAME
Nome: www
Valor: [seu-site].netlify.app

Tipo: A
Nome: @
Valor: 75.2.60.5
```

### Para Vercel:
```
Tipo: CNAME
Nome: www
Valor: [seu-site].vercel.app

Tipo: A
Nome: @
Valor: 76.76.19.61
```

### Para Hospedagem Tradicional:
```
Tipo: A
Nome: @
Valor: [IP_DO_SERVIDOR]

Tipo: CNAME
Nome: www
Valor: [seu-dominio].com.br
```

## 📱 Configurações Adicionais

### 1. SSL/HTTPS (Obrigatório)
- Netlify e Vercel: SSL automático
- Hospedagem tradicional: Ativar SSL no cPanel

### 2. Configuração do Firebase
- Atualizar domínios autorizados no Firebase Console
- Adicionar seu domínio na lista de domínios permitidos

### 3. Otimizações
- Comprimir imagens
- Minificar CSS/JS (opcional)
- Configurar cache (opcional)

## 🎯 Checklist Final

- [ ] Domínio comprado no Registro.br
- [ ] DNS configurado corretamente
- [ ] Arquivos enviados para hospedagem
- [ ] SSL ativado
- [ ] Firebase configurado com novo domínio
- [ ] Teste de funcionamento completo
- [ ] Backup dos arquivos

## 🆘 Suporte

Se precisar de ajuda com alguma etapa específica, me avise!

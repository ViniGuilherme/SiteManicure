# Configuração do Firebase para Domínio Personalizado

## 🔥 Passos para Configurar Firebase com Seu Domínio

### 1. Acessar Firebase Console
- Vá para [console.firebase.google.com](https://console.firebase.google.com)
- Selecione seu projeto

### 2. Configurar Autenticação (se usar)
- Authentication → Settings → Authorized domains
- Adicionar seu domínio: `seu-dominio.com.br`
- Adicionar também: `www.seu-dominio.com.br`

### 3. Configurar Firestore (Banco de Dados)
- Firestore Database → Rules
- Verificar se as regras permitem acesso do seu domínio

### 4. Configurar Hosting (Opcional)
- Se quiser usar Firebase Hosting:
- Hosting → Add custom domain
- Digite seu domínio
- Configure DNS conforme instruções do Firebase

## 📋 Configurações de Segurança

### Regras do Firestore (Exemplo):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir leitura/escrita para todos (ajustar conforme necessário)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Configurações de CORS (se necessário):
```javascript
// No Firebase Functions (se usar)
const cors = require('cors')({origin: true});
```

## 🔧 Atualizações no Código

### 1. Verificar firebase-config.js
Certifique-se de que está correto:
```javascript
// Configuração do Firebase
const firebaseConfig = {
  apiKey: "sua-api-key",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "seu-app-id"
};
```

### 2. Atualizar URLs (se necessário)
Se houver URLs hardcoded no código, atualizar para o novo domínio.

## 🚨 Importante

1. **Backup**: Sempre faça backup antes de fazer mudanças
2. **Teste**: Teste todas as funcionalidades após o deploy
3. **SSL**: Certifique-se de que HTTPS está funcionando
4. **DNS**: Pode levar até 24h para propagar completamente

## 📞 Suporte

Se tiver problemas com alguma configuração, me avise!

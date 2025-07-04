![Excalidraw](https://raw.githubusercontent.com/bigjujas/Trabalho-API/refs/heads/main/blueprint.png)

# Venda de Ingressos API

API para venda de ingressos usando Node.js, TypeScript, Express e Prisma.

- **Banco:** Prisma com SQLite
- **Email:** Nodemailer com Ethereal
- **Autenticação:** JWT
- **Senhas:** Criptografadas com bcrypt e validadas por regras de segurança
- **Logs:** Todas as ações importantes são registradas na tabela de logs
- **Registro de último login**

## Como rodar

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Gere o banco de dados e o client Prisma:
   ```bash
   npx prisma migrate dev --name init
   # (ou outro nome para a migração, caso já tenha rodado antes)
   ```
3. Rode o servidor em modo desenvolvimento:
   ```bash
   npm run dev
   ```

## Testando no Insomnia/Postman

Você pode usar os exemplos abaixo como arquivos/payloads JSON para testar cada endpoint no Insomnia ou Postman.
Basta copiar o conteúdo do JSON para o corpo da requisição (body > JSON) e enviar para o endpoint correspondente.

---

## Modelos principais

### Usuario
- id (Int, PK)
- nome (String)
- email (String, único)
- senha (String, criptografada)
- carteiraIngressos (Int)
- lastLogin (DateTime?)
- logs (Log[])

### Festa
- id, nome, valor, ingressos, ingressosDisponiveis

### Venda
- id, clienteId, festaId, quantidade, valor

### Log
- id, usuarioId, acao, detalhes, ip, userAgent, sucesso, createdAt

---

## Funcionalidades e exemplos de uso

### 1. Cadastro de Usuário

**Endpoint:** POST /usuarios

**Exemplo de arquivo JSON:**
```json
{
  "nome": "João Silva",
  "email": "joao@email.com",
  "senha": "MinhaSenha123!"
}
```

### 2. Login e Autenticação JWT

**Endpoint:** POST /auth/login

**Exemplo de arquivo JSON:**
```json
{
  "email": "joao@email.com",
  "senha": "MinhaSenha123!"
}
```

**Resposta esperada:**
```json
{
  "usuario": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@email.com",
    "carteiraIngressos": 0,
    "lastLogin": "2024-06-07T12:00:00.000Z"
  },
  "token": "eyJhbGciOiJI...",
  "mensagem": "Bem-vindo, João Silva. Seu último acesso ao sistema foi em 07/06/2024 09:00:00"
}
```

> **Dica:** Copie o valor do campo `token` e use no header das próximas requisições protegidas:
> 
> `Authorization: Bearer <TOKEN>`

### 3. Alteração de Senha

**Endpoint:** PATCH /usuarios/1/senha

**Exemplo de arquivo JSON:**
```json
{
  "senhaAtual": "MinhaSenha123!",
  "novaSenha": "NovaSenha456@"
}
```

### 4. CRUD de Festas

**Criar festa (POST /festas):**
```json
{
  "nome": "Festa Junina",
  "valor": 50.0,
  "ingressos": 100
}
```

**Atualizar festa (PUT /festas/1):**
```json
{
  "nome": "Festa Junina Atualizada",
  "valor": 60.0,
  "ingressos": 120,
  "ingressosDisponiveis": 100
}
```

### 5. Compra de Ingressos

**Endpoint:** POST /vendas

**Exemplo de arquivo JSON:**
```json
{
  "clienteId": 1,
  "festaId": 1,
  "quantidade": 2
}
```

### 6. Visualização de Logs

**Todos os logs:**
- Endpoint: GET /logs

**Logs de um usuário:**
- Endpoint: GET /logs/usuario/1

**Logs por ação:**
- Endpoint: GET /logs/acao/LOGIN_SUCESSO

> **Importante:** Para todas as rotas protegidas, lembre-se de adicionar o header:
> 
> `Authorization: Bearer <TOKEN>`

---

## Observações
- Sempre use o token JWT retornado no login para acessar rotas protegidas (Authorization: Bearer <TOKEN>)
- Senhas nunca são retornadas nas respostas
- O sistema impede ações não autorizadas e registra todas as tentativas importantes nos logs
- Para testar emails, acesse o link "emailUrl" retornado na resposta de compra

---

## Como alterar a senha do usuário

Para alterar a senha, utilize o endpoint PATCH /usuarios/:id/senha. Você deve informar a senha atual e a nova senha no corpo da requisição. A nova senha será validada pelas regras de segurança e, se estiver correta, será criptografada antes de ser salva.

**Exemplo de requisição (JSON):**
```json
{
  "senhaAtual": "MinhaSenha123!",
  "novaSenha": "NovaSenha456@"
}
```

- Só o próprio usuário pode alterar sua senha (é necessário estar autenticado e usar o token JWT no header Authorization).
- A senha atual é verificada antes da alteração.
- A nova senha precisa seguir as regras de segurança (mínimo 8 caracteres, maiúscula, minúscula, número e símbolo).

---

## Como funciona a exibição do último login

Sempre que um usuário faz login com sucesso, o sistema atualiza o campo `lastLogin` no banco de dados com a data/hora atual. Na resposta do login, o sistema retorna uma mensagem personalizada:

- Se for o primeiro acesso, a mensagem será: 
  > "Bem-vindo, [nome]. Este é o seu primeiro acesso ao sistema."
- Se já houver um acesso anterior, a mensagem será:
  > "Bem-vindo, [nome]. Seu último acesso ao sistema foi em [data/hora]."

O campo `lastLogin` também é retornado no objeto do usuário na resposta do login.

---
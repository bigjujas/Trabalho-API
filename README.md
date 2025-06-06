![Excalidraw](https://raw.githubusercontent.com/bigjujas/Trabalho-API/refs/heads/main/blueprint.png)

# Venda de Ingressos API

API para venda de ingressos usando Node.js, TypeScript, Express e Prisma.

Prisma com SQLite para o armazenamento de dados.

Nodemailer com Ethereal para envio de emails automáticos.

## Como rodar

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Gere o banco de dados e o client Prisma:
   ```bash
   npx prisma migrate dev --name init
   ```
3. Rode o servidor em modo desenvolvimento:
   ```bash
   npm run dev
   ```

## Endpoints

### POST /vendas
Cria uma venda de ingressos, atualizando as tabelas de usuários e festas.

**Body:**
```json
{
  "clienteId": 1,
  "festaId": 1,
  "quantidade": 2
}
```

**Resposta:**
```json
{
  "id": 1,
  "clienteId": 1,
  "festaId": 1,
  "quantidade": 2,
  "valor": 100.0
  "emailUrl": "https://ethereal.email/message/XXXXXXXXXXXX"
}
``` 

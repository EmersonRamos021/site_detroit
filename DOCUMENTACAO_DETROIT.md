# 🚀 Detroit Roleplay - Documentação Oficial

Bem-vindo à documentação do ecossistema **Detroit Roleplay**. O projeto é dividido em três frentes principais:
1. **Site Principal (Loja):** Onde os jogadores acessam, fazem login via Discord e realizam a compra de VIPs/Produtos via PIX.
2. **Painel Admin:** Painel exclusivo para administradores controlarem pedidos, produtos, cupons, financeiro e IDs in-game.
3. **Bot Discord:** Bot automatizado que entrega os cargos, lida com logs e controla vencimentos.

---

## 🛠️ Como Mudar as Credenciais do Mercado Pago

O site utiliza a API do Mercado Pago para gerar **QR Codes (PIX)** automaticamente e processar o pagamento do jogador em tempo real.

### Passos para atualizar as chaves de PIX:
1. Acesse o [Painel de Desenvolvedores do Mercado Pago](https://www.mercadopago.com.br/developers/panel/applications).
2. Selecione a sua aplicação "Detroit Roleplay".
3. Vá no menu **Credenciais de Produção**.
4. Copie o valor do **Access Token** (Ele sempre começa com `APP_USR-`).
5. Acesse a **SquareCloud**, vá no dashboard do **Site Principal** e abra a aba **Variáveis**.
6. Encontre a variável `MERCADOPAGO_ACCESS_TOKEN` e cole a chave nova.
7. Clique em **Salvar** e **Restart** na aplicação.

> ⚠️ **Aviso:** Nunca use credenciais de teste se a sua conta já estiver ativada para produção, pois o Mercado Pago recusa chaves misturadas com o erro `Unauthorized use of live credentials`.

---

## 🔗 Configurando o Webhook do Mercado Pago (Retorno Automático)

Para que o site saiba quando um jogador pagou o PIX e atualize o pedido sozinho:
1. No painel do Mercado Pago (na mesma tela da sua aplicação), vá em **Notificações > Webhooks**.
2. Na URL de produção, coloque o link exato do seu site:
   `https://detroit.squareweb.app/api/webhooks/mercadopago`
3. Nos **Eventos**, marque **APENAS** a opção `Pagamentos` (ou `payment`).
4. Salve. Pronto! Agora todo PIX pago fará o site atualizar o status e mandar DM pro jogador pelo Bot.

---

## ⚙️ Variáveis de Ambiente (SquareCloud)

Tanto o **Site Principal** quanto o **Painel Admin** exigem que você configure as seguintes variáveis no painel da SquareCloud:

| Variável | Descrição | Exemplo / Onde Pegar |
|---|---|---|
| `DATABASE_URL` | Conexão com o Banco de Dados MySQL | Pegue no painel da SquareCloud (Database) |
| `AUTH_SECRET` | Chave de criptografia de login | Texto longo (pode gerar um aleatório) |
| `AUTH_DISCORD_ID` | Client ID do App do Discord | Portal de Desenvolvedores do Discord |
| `AUTH_DISCORD_SECRET` | Client Secret do App do Discord | Portal de Desenvolvedores do Discord |
| `NEXTAUTH_URL` | URL do seu site (obrigatório pro login) | `https://detroit.squareweb.app` |
| `MERCADOPAGO_ACCESS_TOKEN` | Chave de PIX (Apenas no Site Principal) | Painel Mercado Pago |
| `DISCORD_WEBHOOK_URL` | Canal de logs de compras (Apenas Site) | Canal do Discord > Integrações |
| `DISCORD_BOT_TOKEN` | Token do Bot para mandar DM (Apenas Site)| Portal de Desenvolvedores do Discord |

---

## 🖥️ Como rodar e testar no seu PC (Localhost)

Se quiser testar algo antes de mandar para a hospedagem:
1. Abra o terminal na pasta do projeto (`site` ou `admin`).
2. Garanta que você tem o arquivo `.env.local` na pasta contendo as mesmas variáveis mostradas na tabela acima.
3. Rode o comando:
   ```bash
   npm run dev
   ```
4. Acesse `http://localhost:3000` (ou a porta que o terminal mostrar).

---

## 🔄 Como enviar atualizações para a Hospedagem

Se eu (o programador) enviar novos códigos para o seu projeto, siga os passos abaixo para que a hospedagem aplique:

1. Acesse o [Painel da SquareCloud](https://squarecloud.app/).
2. Entre na sua aplicação (Site ou Admin).
3. Na página inicial do app, procure o botão **Commit / Update** (Ele vai puxar as atualizações do seu GitHub).
4. O servidor será reiniciado sozinho. Aguarde a tela preta de "Logs" terminar de carregar.
5. Sucesso! Seu site já está rodando a versão mais atual.

# Coroa 24K — Assistente Emporium24k

Landing page conversacional da Emporium24k, com respostas controladas, identificação de intenção e encaminhamento para a loja oficial ou para o atendimento correto.

## Arquivos

- `index.html`: estrutura da interface.
- `style.css`: visual responsivo.
- `app.js`: intenções, respostas, links e testes internos.
- `iniciar.html`: redirecionamento para o assistente.

## Fontes comerciais

### Loja oficial

`https://www.emporium24k.com.br/`

A loja oficial é usada como fonte atual para:

- produtos à pronta entrega;
- disponibilidade;
- preços atuais;
- categorias e características dos produtos;
- condições mostradas na página do produto e no checkout.

O assistente não copia preços fixos para a base, evitando apresentar valores ou estoque desatualizados.

### Anéis, solitários e alianças

São tratados como produtos por encomenda. Numeração, largura, milimetragem, gramatura, acabamento e personalizações mudam o orçamento. Mesmo quando existe valor de referência no site, o lead é encaminhado aos vendedores para cálculo e consulta de promoções.

## Rotas de atendimento

### Compra, encomendas e personalizados

Distribuição aleatória por sessão entre:

- `5541995888995`
- `5541995776736`

### Venda e avaliação de ouro ou prata

- `5541998518452`

### Consertos de joias e semijoias

- `5541998518452`

## Regras implementadas

- Personalizados somente em ouro 18k ou prata 925, sujeitos à viabilidade técnica.
- Não confecciona peças em moeda ou outros metais.
- Não compra metais diferentes de ouro e prata.
- Produtos à pronta entrega são consultados na loja oficial.
- Anéis, alianças e solitários seguem para atendimento humano.
- Frete para todo o Brasil, conforme a regra comercial e a condição mostrada no checkout.
- Gravações internas gratuitas nas alianças compradas na Emporium24k.
- Joias em ouro 18k ou prata 925 têm garantia permanente do teor.
- Semijoias têm garantia de 1 ano no folheamento, conforme condições do certificado.
- Perguntas não reconhecidas não recebem resposta inventada.

## Testes

Acesse `index.html?test=1` para executar a bateria interna de classificação, botões, telefones e links da loja.

## Limitações atuais

- Base por intenções e palavras-chave no navegador.
- Sem banco central de perguntas desconhecidas.
- Sem painel administrativo.
- Sem sincronização automática de catálogo por API; estoque e valores são consultados diretamente na loja oficial.
- Distribuição dos vendedores é aleatória por sessão, não um round-robin global.

# Coroa 24K — Assistente Emporium24k

Primeira versão da landing page conversacional da Emporium24k.

## Arquivo principal

- `index.html`: página completa, responsiva e sem dependências de backend.

## Rotas de atendimento

### Compra de alianças, joias, semijoias e personalizados

Distribuição alternada 50/50 entre:

- 5541995888995
- 5541995776736

A alternância é armazenada no `localStorage` do navegador.

### Venda e avaliação de ouro ou prata

Direcionamento exclusivo para:

- 5541998518452

### Consertos de joias e semijoias

Direcionamento exclusivo para:

- 5541998518452

## Regras comerciais implementadas

- Peças personalizadas em ouro 18k ou prata 925, sujeitas à viabilidade técnica.
- Não confecciona peças em moeda ou outros metais.
- Não compra metais diferentes de ouro e prata.
- Frete gratuito para todo o Brasil.
- Gravações internas gratuitas nas alianças compradas na Emporium24k.
- Prazo padrão informado de 5 a 7 dias úteis, sujeito ao projeto e à entrega.
- Perguntas sobre preço, orçamento, parcelamento, desconto e intenção de compra são transferidas ao comercial.
- Perguntas sem resposta segura ficam registradas no `localStorage` para evolução futura da base.

## Limitação da V1

A lógica funciona por palavras-chave e intenções programadas no navegador. Ainda não existe banco de dados central, painel administrativo, histórico compartilhado ou IA conectada ao catálogo.

# Sinal via Pix, notificação por WhatsApp e mensalistas

Data: 2026-08-12

## Contexto

O GestQuadra hoje permite reserva avulsa gratuita de horário, sem cobrança de sinal e sem nenhuma notificação automática. O dono de arena relatou que parte dos jogadores não paga sua fração do racha, e pediu um mecanismo de garantia via Pix. Além disso, pediu notificação automática por WhatsApp e um sistema de mensalista, onde o cliente assina um dia e horário fixo por 30 dias, pagando o valor cheio do período de uma vez.

Este documento cobre as três funcionalidades juntas porque compartilham a mesma infraestrutura de pagamento via Pix, mas cada uma pode ser implementada e ativada de forma independente, uma de cada vez.

## Decisões já tomadas

O gateway de pagamento escolhido é o Mercado Pago, via Checkout Transparente, usando a Payments API para gerar cobrança Pix dinâmica com QR Code e confirmação por webhook.

O provedor de WhatsApp escolhido é a API oficial da Meta, Cloud API, exigindo número de telefone dedicado, verificação de empresa no Meta Business Manager, e aprovação prévia de modelo de mensagem.

Cada arena decide individualmente se quer usar o pagamento via Pix e se quer usar a notificação por WhatsApp. Enquanto a arena não tiver a credencial correspondente cadastrada, o recurso fica desativado e o sistema se comporta exatamente como hoje. A Play Soccer é a primeira arena que vai ativar ambos, assim que o dono providenciar as credenciais.

## Arquitetura de dados

### Reserva com status intermediário

A tabela de reservas ganha um novo status, `PENDENTE_PAGAMENTO`, além de `CONFIRMADA` e `CANCELADA` que já existem. Quando o cliente gera um QR Code de Pix, uma reserva é criada nesse status intermediário, ocupando o horário para qualquer outra pessoa da mesma forma que uma reserva confirmada ocupa hoje. A reserva carrega um prazo de expiração de vinte minutos. Se o pagamento for confirmado dentro do prazo, o status muda para `CONFIRMADA`. Se o prazo expirar sem pagamento, o status muda para `CANCELADA` e o horário volta a ficar livre.

Essa abordagem foi escolhida em vez de uma tabela separada de reservas temporárias porque reaproveita toda a lógica de conflito de horário que já existe e está testada, sem duplicar verificações em dois lugares diferentes. Como efeito colateral, a reserva pendente já aparece na lista de reservas do dono no painel administrativo, com uma etiqueta de status diferenciada, sem precisar de nenhuma tela nova.

### Campos novos

Na tabela de arenas (`quadras`), dois campos novos e opcionais: token de acesso do Mercado Pago daquela arena, guardado de forma criptografada, e token de acesso da API do WhatsApp daquela arena, também criptografado. A presença ou ausência de cada token determina se o recurso correspondente está ativo para aquela arena.

Na tabela de quadras (`courts`), um campo novo e opcional, valor de mensalista por hora. Se esse campo não estiver preenchido, a opção de assinatura mensalista não aparece para o cliente naquela quadra, do mesmo jeito que o bloco extra opcional já funciona hoje.

Na tabela de reservas (`bookings`), campos novos: valor do sinal pago, identificador do pagamento no Mercado Pago, prazo de expiração da espera de pagamento, e um vínculo opcional com uma assinatura de mensalista, para reservas geradas automaticamente a partir de uma assinatura.

Uma tabela nova, assinaturas de mensalista, com quadra, nome e telefone do cliente, dia da semana, horário de início e fim, data de início e fim do período de 30 dias, valor total cobrado, e status de pagamento.

## Fluxo do sinal de 20% via Pix na reserva avulsa

O cliente escolhe quadra, data e horário na página pública, preenche nome e telefone, como já funciona hoje. Se a arena tiver o Mercado Pago configurado, ao confirmar aparece uma tela com QR Code do Pix mostrando o valor do sinal, vinte por cento do valor total da sessão. Nesse momento a reserva já nasce como `PENDENTE_PAGAMENTO`, com vinte minutos de prazo, bloqueando o horário para qualquer outra pessoa.

Quando o Mercado Pago confirma o pagamento, ele notifica o sistema pelo webhook configurado, e a reserva passa para `CONFIRMADA`, mostrando a mesma tela de sucesso que já existe hoje, com o link de cancelamento.

Se o cliente não pagar dentro do prazo, a reserva é cancelada automaticamente e o horário volta a ficar disponível.

Se a arena não tiver o Mercado Pago configurado, o fluxo continua exatamente como funciona hoje, sem etapa de pagamento, reserva confirmada na hora.

A tela de espera de pagamento deixa claro que o horário só está garantido depois da confirmação, para o cliente não presumir que já está tudo certo antes de pagar.

## Fluxo de notificação por WhatsApp

Ao cadastrar as credenciais do WhatsApp, a arena vê três opções independentes que pode ligar ou desligar, envio de confirmação quando a reserva é paga ou criada, envio de lembrete algumas horas antes do horário marcado, e envio de aviso quando uma reserva é cancelada.

Confirmação e cancelamento são disparados no exato momento em que o evento acontece no sistema.

O lembrete exige uma rotina em segundo plano, que roda periodicamente verificando quais reservas confirmadas estão se aproximando do horário de lembrete configurado e ainda não tiveram lembrete enviado, disparando a mensagem nesse momento.

Cada mensagem usa um modelo de texto pré aprovado pela Meta, com variáveis preenchidas automaticamente, nome do cliente, nome da quadra, data e horário.

Se o envio falhar, por número inválido ou erro temporário da Meta, o sistema apenas registra a falha, sem impedir a reserva nem travar o fluxo principal. A rotina de lembrete tenta novamente na execução seguinte se não conseguir rodar em determinado horário.

A lista exata de quais eventos ativar para a Play Soccer ainda está pendente de confirmação do dono. A estrutura é construída para suportar os três desde já, com cada um configurável individualmente.

## Fluxo de mensalista

Quando a quadra tem valor de mensalista cadastrado, aparece na página pública uma opção de assinatura mensalista, ao lado da reserva avulsa. O cliente escolhe o dia da semana e o horário fixo desejado.

O sistema calcula quantas vezes aquele dia da semana ocorre nos próximos 30 dias a partir de hoje, verifica se todas as ocorrências estão livres, sem reserva avulsa confirmada nem outro mensalista no mesmo espaço, e mostra o valor total, valor por hora vezes quantidade de ocorrências. Por exemplo, R$165 vezes quatro ocorrências de uma quarta feira.

Se todas as datas estiverem livres, o cliente segue para pagamento do valor cheio via Pix, usando o mesmo mecanismo de QR Code e prazo de vinte minutos do sinal avulso.

Quando o pagamento é confirmado, o sistema cria automaticamente uma reserva individual para cada data calculada, todas vinculadas à mesma assinatura. Cada uma dessas reservas se comporta como uma reserva comum em todas as telas existentes, disponibilidade, cancelamento pelo dono, e listagem no painel, sem exigir nenhuma lógica nova nesses pontos.

Se alguma das datas necessárias já estiver ocupada no momento da tentativa de assinatura, o sistema recusa a assinatura inteira antes de gerar o Pix, informando qual data está em conflito, evitando cobrar por um período que não pode ser garantido por inteiro.

Ao final dos 30 dias, a assinatura expira. Não existe renovação automática. O cliente precisa entrar no sistema e assinar novamente se quiser continuar, e o horário volta a ficar disponível para reserva avulsa ou outro mensalista a partir da data seguinte à última paga.

## Tratamento de erro

Instabilidade do Mercado Pago na confirmação do pagamento não trava o sistema, a reserva permanece pendente até o prazo de vinte minutos esgotar.

Dois clientes tentando o mesmo horário ao mesmo tempo são resolvidos pela mesma trava de conflito que já existe hoje para reserva avulsa, porque a primeira reserva pendente já ocupa o horário.

Credencial do Mercado Pago inválida ou expirada impede a geração do Pix, mostrando mensagem de erro ao cliente sem quebrar o restante do agendamento.

Falha de envio de WhatsApp é apenas registrada, sem impedir reserva ou pagamento.

## Testes planejados

Sinal via Pix: ambiente de sandbox do Mercado Pago simulando pagamento aprovado e pagamento expirado, confirmando liberação correta do horário nos dois casos, e teste de disputa concorrente pelo mesmo horário.

WhatsApp: envio isolado de cada tipo de mensagem, e simulação de falha de envio, confirmando que a reserva não é afetada.

Mensalista: cálculo de ocorrências dentro dos 30 dias, caso de conflito parcial em uma das datas necessárias, e ciclo completo de assinatura, pagamento e criação das reservas individuais. Teste visual no navegador em celular e computador.

## Fora de escopo por enquanto

Renovação automática de mensalista. Reembolso ou cancelamento parcial de assinatura em andamento. Comissão da plataforma sobre transações de outras arenas. Split de pagamento entre GestQuadra e arena.

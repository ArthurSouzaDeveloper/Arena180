# Sinal via Pix, notificação por WhatsApp e mensalistas

Data: 2026-08-12, revisado em 2026-08-13

## Contexto

O GestQuadra hoje permite reserva avulsa gratuita de horário, sem cobrança de sinal e sem nenhuma notificação automática. O dono de arena relatou que parte dos jogadores não paga sua fração do racha, e pediu um mecanismo de garantia via Pix. Além disso, pediu notificação automática por WhatsApp e um sistema de mensalista, onde o cliente assina um dia e horário fixo por 30 dias, pagando o valor cheio do período de uma vez.

Este documento cobre as três funcionalidades juntas porque compartilham a mesma infraestrutura de pagamento via Pix, mas cada uma pode ser implementada e ativada de forma independente, uma de cada vez.

## Decisões já tomadas

O gateway de pagamento escolhido é o Mercado Pago, via Checkout Transparente, usando a Payments API para gerar cobrança Pix dinâmica com QR Code e confirmação por webhook.

O provedor de WhatsApp escolhido é a API oficial da Meta, Cloud API, exigindo número de telefone dedicado, verificação de empresa no Meta Business Manager, e aprovação prévia de modelo de mensagem.

Cada arena decide individualmente se quer usar o pagamento via Pix e se quer usar a notificação por WhatsApp. Enquanto a arena não tiver a credencial correspondente cadastrada, o recurso fica desativado e o sistema se comporta exatamente como hoje. A Play Soccer é a primeira arena que vai ativar ambos, assim que o dono providenciar as credenciais.

O sinal via Pix, incluindo a opção de pagamento integral em vez do sinal, já foi implementado e está em produção. Cada arena escolhe, de forma independente, se aceita sinal de 20%, valor integral, ou os dois, e o cliente escolhe entre as opções habilitadas no momento da reserva. O restante deste documento, a partir daqui, cobre o desenho já ajustado para WhatsApp e mensalistas, que ainda serão implementados.

## Arquitetura de dados

### Reserva com status intermediário

A tabela de reservas ganha um novo status, `PENDENTE_PAGAMENTO`, além de `CONFIRMADA` e `CANCELADA` que já existem. Quando o cliente gera um QR Code de Pix, uma reserva é criada nesse status intermediário, ocupando o horário para qualquer outra pessoa da mesma forma que uma reserva confirmada ocupa hoje. A reserva carrega um prazo de expiração de vinte minutos. Se o pagamento for confirmado dentro do prazo, o status muda para `CONFIRMADA`. Se o prazo expirar sem pagamento, o status muda para `CANCELADA` e o horário volta a ficar livre.

Essa abordagem foi escolhida em vez de uma tabela separada de reservas temporárias porque reaproveita toda a lógica de conflito de horário que já existe e está testada, sem duplicar verificações em dois lugares diferentes. Como efeito colateral, a reserva pendente já aparece na lista de reservas do dono no painel administrativo, com uma etiqueta de status diferenciada, sem precisar de nenhuma tela nova.

### Campos novos

Na tabela de arenas (`quadras`), dois campos novos e opcionais: token de acesso do Mercado Pago daquela arena, guardado de forma criptografada, e token de acesso da API do WhatsApp daquela arena, também criptografado. A presença ou ausência de cada token determina se o recurso correspondente está ativo para aquela arena.

Na tabela de quadras (`courts`), um campo novo e opcional, valor de mensalista por hora. Se esse campo não estiver preenchido, a opção de assinatura mensalista não aparece para o cliente naquela quadra, do mesmo jeito que o bloco extra opcional já funciona hoje.

Na tabela de reservas (`bookings`), campos novos: valor do sinal pago, identificador do pagamento no Mercado Pago, prazo de expiração da espera de pagamento, e um vínculo opcional com uma assinatura de mensalista, para reservas geradas automaticamente a partir de uma assinatura.

Uma tabela nova, assinaturas de mensalista, com quadra, nome e telefone do cliente, dia da semana, horário de início e fim, data de início do primeiro ciclo, status (ativa ou cancelada), e controle de qual ciclo de 28 dias já teve aviso de renovação enviado. Diferente do desenho original, essa tabela não guarda mais uma data de fim, porque a assinatura passou a ser por tempo indeterminado até cancelamento.

Na tabela de arenas, mais um campo novo e opcional, número de WhatsApp de administração, usado para receber o aviso de nova reserva avulsa. É diferente do número usado para enviar as mensagens automáticas aos clientes.

## Fluxo do sinal de 20% via Pix na reserva avulsa

O cliente escolhe quadra, data e horário na página pública, preenche nome e telefone, como já funciona hoje. Se a arena tiver o Mercado Pago configurado, ao confirmar aparece uma tela com QR Code do Pix mostrando o valor do sinal, vinte por cento do valor total da sessão. Nesse momento a reserva já nasce como `PENDENTE_PAGAMENTO`, com vinte minutos de prazo, bloqueando o horário para qualquer outra pessoa.

Quando o Mercado Pago confirma o pagamento, ele notifica o sistema pelo webhook configurado, e a reserva passa para `CONFIRMADA`, mostrando a mesma tela de sucesso que já existe hoje, com o link de cancelamento.

Se o cliente não pagar dentro do prazo, a reserva é cancelada automaticamente e o horário volta a ficar disponível.

Se a arena não tiver o Mercado Pago configurado, o fluxo continua exatamente como funciona hoje, sem etapa de pagamento, reserva confirmada na hora.

A tela de espera de pagamento deixa claro que o horário só está garantido depois da confirmação, para o cliente não presumir que já está tudo certo antes de pagar.

## Fluxo de notificação por WhatsApp

Ao cadastrar as credenciais do WhatsApp, a arena vê quatro opções independentes que pode ligar ou desligar:

Confirmação para o cliente, quando a reserva é paga ou criada.

Lembrete para o cliente, algumas horas antes do horário marcado.

Aviso de renovação para o mensalista, avisando que o ciclo de 30 dias está terminando e é hora de acertar o próximo mês presencialmente.

Aviso de nova reserva avulsa para a própria arena, sempre que um cliente faz uma reserva avulsa nova, enviado para um número de WhatsApp de administração cadastrado pela arena, diferente do número usado para enviar as mensagens automáticas. Para a Play Soccer esse número é +55 19 99214-7153.

Confirmação e o aviso de reserva avulsa são disparados no exato momento em que o evento acontece no sistema.

O lembrete de horário e o aviso de renovação de mensalista exigem uma rotina em segundo plano, que roda periodicamente. Para o lembrete de horário, ela verifica quais reservas confirmadas estão se aproximando do horário configurado e ainda não tiveram lembrete enviado. Para a renovação do mensalista, ela verifica quais assinaturas ativas completaram 28 dias desde o início do ciclo atual e ainda não tiveram o aviso daquele ciclo enviado.

Cada mensagem usa um modelo de texto pré aprovado pela Meta, com variáveis preenchidas automaticamente, como nome do cliente, nome da quadra, data e horário.

Se o envio falhar, por número inválido ou erro temporário da Meta, o sistema apenas registra a falha, sem impedir a reserva nem travar o fluxo principal. A rotina em segundo plano tenta novamente na execução seguinte se não conseguir rodar em determinado horário.

A Play Soccer pretende ativar os quatro avisos assim que a credencial da Meta estiver pronta. A estrutura é construída para suportar os quatro desde já, com cada um configurável individualmente por arena.

## Fluxo de mensalista

Quando a quadra tem valor de mensalista cadastrado, aparece na página pública uma opção de assinatura mensalista, ao lado da reserva avulsa. O cliente escolhe o dia da semana e o horário fixo desejado.

O sistema calcula quantas vezes aquele dia da semana ocorre nos próximos 30 dias a partir de hoje, verifica se todas as ocorrências estão livres, sem reserva avulsa confirmada nem outro mensalista no mesmo espaço, e mostra o valor total do primeiro ciclo, valor por hora vezes quantidade de ocorrências. Por exemplo, R$165 vezes quatro ocorrências de uma quarta feira.

Se todas as datas estiverem livres, o cliente segue para pagamento do sinal de 20% sobre esse valor via Pix, usando o mesmo mecanismo de QR Code e prazo de vinte minutos já usado na reserva avulsa. O restante de cada mês é acertado presencialmente com o dono, mês a mês, por fora do sistema.

Quando o pagamento do sinal é confirmado, o sistema cria automaticamente uma reserva individual para cada data do primeiro ciclo, todas vinculadas à mesma assinatura. Cada uma dessas reservas se comporta como uma reserva comum em todas as telas existentes, disponibilidade, cancelamento pelo dono, e listagem no painel, sem exigir nenhuma lógica nova nesses pontos.

Se alguma das datas necessárias já estiver ocupada no momento da tentativa de assinatura, o sistema recusa a assinatura inteira antes de gerar o Pix, informando qual data está em conflito, evitando cobrar por um período que não pode ser garantido por inteiro.

Diferente do desenho original, a assinatura de mensalista não tem mais uma data de fim fixa. Enquanto estiver com status ativa, o mesmo dia da semana e horário ficam reservados só para aquele cliente indefinidamente, protegendo contra qualquer outro cliente, avulso ou mensalista, tentando ocupar o mesmo espaço em qualquer mês futuro. Uma rotina em segundo plano mantém sempre um horizonte de reservas geradas à frente, por exemplo os próximos 60 dias, criando novas ocorrências conforme o tempo passa, para que o horário nunca apareça como disponível para outra pessoa.

O pagamento de cada mês depois do primeiro é combinado presencialmente entre o cliente e o dono, fora do sistema. O papel do sistema nesse ponto é só avisar por WhatsApp quando o ciclo de 28 dias se aproxima do fim, como descrito na seção de notificação, para lembrar o cliente de acertar o próximo mês.

A assinatura só termina quando o cliente ou o dono cancela explicitamente, seja pelo link de cancelamento do cliente, seja pelo painel administrativo do dono. Ao cancelar, as ocorrências futuras já geradas são canceladas e o horário volta a ficar disponível para reserva avulsa ou outro mensalista a partir da próxima data livre.

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

Cobrança automática recorrente do mensalista pelo sistema. O pagamento de cada mês depois do primeiro é sempre presencial, combinado direto com o dono. Reembolso ou cancelamento parcial de assinatura em andamento. Comissão da plataforma sobre transações de outras arenas. Split de pagamento entre GestQuadra e arena.

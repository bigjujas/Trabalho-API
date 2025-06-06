import nodemailer from 'nodemailer';

export async function sendCompraEmail(to: string, nomeCliente: string, nomeFesta: string, quantidade: number, valor: number) {
  // Cria uma conta de teste no Ethereal
  const testAccount = await nodemailer.createTestAccount();

  // Cria o transporter
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });

  // Conteúdo do e-mail
  const info = await transporter.sendMail({
    from: 'notificacoes@vendaingressos.com',
    to,
    subject: 'Confirmação de Compra de Ingressos',
    text: `Olá, ${nomeCliente}!\n\nSua compra para a festa "${nomeFesta}" foi realizada com sucesso.\nQuantidade de ingressos: ${quantidade}\nValor total: R$ ${valor.toFixed(2)}\n\nObrigado pela compra!`,
    html: `<p>Olá, <b>${nomeCliente}</b>!</p><p>Sua compra para a festa <b>"${nomeFesta}"</b> foi realizada com sucesso.</p><ul><li>Quantidade de ingressos: <b>${quantidade}</b></li><li>Valor total: <b>R$ ${valor.toFixed(2)}</b></li></ul><p>Obrigado pela compra!</p>`
  });

  // Retorna a URL de visualização do e-mail no Ethereal
  return nodemailer.getTestMessageUrl(info);
} 
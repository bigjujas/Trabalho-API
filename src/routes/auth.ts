import { Router, Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { comparePassword } from '../utils/password';
import { generateToken } from '../utils/auth';
import { logLogin } from '../utils/logger';

const router = Router();

// Rota de login
router.post('/login', async (req: Request, res: Response) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    await logLogin(0, false, 'Email ou senha não fornecidos', req);
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  try {
    // Buscar usuário pelo email
    const usuario = await prisma.usuario.findUnique({
      where: { email }
    });

    if (!usuario) {
      await logLogin(0, false, `Tentativa de login com email inexistente: ${email}`, req);
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    // Verificar senha
    const senhaValida = await comparePassword(senha, usuario.senha);
    
    if (!senhaValida) {
      await logLogin(usuario.id, false, 'Senha incorreta', req);
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    // Salvar o valor anterior do lastLogin
    const ultimoAcesso = usuario.lastLogin;

    // Atualizar lastLogin para agora
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { lastLogin: new Date() }
    });

    // Gerar token
    const token = generateToken({
      userId: usuario.id,
      email: usuario.email
    });

    // Registrar login bem-sucedido
    await logLogin(usuario.id, true, 'Login realizado com sucesso', req);

    // Mensagem personalizada
    let mensagem = '';
    if (ultimoAcesso) {
      mensagem = `Bem-vindo, ${usuario.nome}. Seu último acesso ao sistema foi em ${new Date(ultimoAcesso).toLocaleString('pt-BR')}`;
    } else {
      mensagem = `Bem-vindo, ${usuario.nome}. Este é o seu primeiro acesso ao sistema.`;
    }

    // Retornar dados do usuário (sem senha), token e mensagem
    res.json({
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        carteiraIngressos: usuario.carteiraIngressos,
        lastLogin: ultimoAcesso
      },
      token,
      mensagem
    });

  } catch (error: any) {
    await logLogin(0, false, `Erro interno: ${error.message}`, req);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router; 
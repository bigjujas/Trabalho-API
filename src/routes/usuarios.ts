import { Router, Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { hashPassword, validatePassword } from '../utils/password';
import { authMiddleware } from '../utils/auth';
import { logCriacaoUsuario } from '../utils/logger';

const router = Router();

// Listar todos os usuários
router.get('/', async (req: Request, res: Response) => {
  const usuarios = await prisma.usuario.findMany({
    select: {
      id: true,
      nome: true,
      email: true,
      carteiraIngressos: true
    }
  });
  res.json(usuarios);
});

// Buscar usuário por ID
router.get('/:id', async (req: Request, res: Response) => {
  const usuario = await prisma.usuario.findUnique({ 
    where: { id: Number(req.params.id) },
    select: {
      id: true,
      nome: true,
      email: true,
      carteiraIngressos: true
    }
  });
  if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json(usuario);
});

// Criar usuário
router.post('/', async (req: Request, res: Response) => {
  const { nome, email, senha, carteiraIngressos } = req.body;
  
  if (!nome || !email || !senha) {
    await logCriacaoUsuario(0, email || 'N/A', false, 'Campos obrigatórios não fornecidos', req);
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
  }

  // Validar senha
  const passwordValidation = validatePassword(senha);
  if (!passwordValidation.isValid) {
    await logCriacaoUsuario(0, email, false, `Senha não atende aos requisitos: ${passwordValidation.errors.join(', ')}`, req);
    return res.status(400).json({ 
      error: 'Senha não atende aos requisitos de segurança',
      details: passwordValidation.errors
    });
  }

  try {
    const senhaCriptografada = await hashPassword(senha);
    const usuario = await prisma.usuario.create({ 
      data: { 
        nome, 
        email, 
        senha: senhaCriptografada,
        carteiraIngressos: carteiraIngressos || 0
      },
      select: {
        id: true,
        nome: true,
        email: true,
        carteiraIngressos: true
      }
    });
    
    // Registrar criação bem-sucedida
    await logCriacaoUsuario(usuario.id, email, true, 'Usuário criado com sucesso', req);
    
    res.status(201).json(usuario);
  } catch (error: any) {
    await logCriacaoUsuario(0, email, false, `Erro na criação: ${error.message}`, req);
    res.status(400).json({ error: error.message });
  }
});

// Atualizar usuário (requer autenticação)
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  const { nome, email, senha, carteiraIngressos } = req.body;
  
  // Verificar se o usuário está atualizando sua própria conta
  if (req.user && req.user.userId !== Number(req.params.id)) {
    return res.status(403).json({ error: 'Você só pode atualizar sua própria conta' });
  }
  
  // Se uma nova senha for fornecida, validar
  if (senha) {
    const passwordValidation = validatePassword(senha);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Senha não atende aos requisitos de segurança',
        details: passwordValidation.errors
      });
    }
  }
  
  try {
    const data: any = {};
    if (nome) data.nome = nome;
    if (email) data.email = email;
    if (senha) data.senha = await hashPassword(senha);
    if (carteiraIngressos !== undefined) data.carteiraIngressos = carteiraIngressos;

    const usuario = await prisma.usuario.update({
      where: { id: Number(req.params.id) },
      data,
      select: {
        id: true,
        nome: true,
        email: true,
        carteiraIngressos: true
      }
    });
    res.json(usuario);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Alterar senha do usuário (requer autenticação)
router.patch('/:id/senha', authMiddleware, async (req: Request, res: Response) => {
  const { senhaAtual, novaSenha } = req.body;
  const usuarioId = Number(req.params.id);

  // Só pode alterar a própria senha
  if (req.user && req.user.userId !== usuarioId) {
    return res.status(403).json({ error: 'Você só pode alterar sua própria senha' });
  }

  if (!senhaAtual || !novaSenha) {
    return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
  }

  // Validar nova senha
  const passwordValidation = validatePassword(novaSenha);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      error: 'Nova senha não atende aos requisitos de segurança',
      details: passwordValidation.errors
    });
  }

  try {
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se a senha atual está correta
    const senhaCorreta = await require('../utils/password').comparePassword(senhaAtual, usuario.senha);
    if (!senhaCorreta) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    // Criptografar e atualizar a nova senha
    const senhaCriptografada = await hashPassword(novaSenha);
    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { senha: senhaCriptografada }
    });

    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao alterar senha' });
  }
});

// Deletar usuário (requer autenticação)
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  // Verificar se o usuário está deletando sua própria conta
  if (req.user && req.user.userId !== Number(req.params.id)) {
    return res.status(403).json({ error: 'Você só pode deletar sua própria conta' });
  }

  try {
    await prisma.usuario.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router; 
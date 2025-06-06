import { Router, Request, Response } from 'express';
import { prisma } from '../prisma/client';

const router = Router();

// Listar todos os usuários
router.get('/', async (req: Request, res: Response) => {
  const usuarios = await prisma.usuario.findMany();
  res.json(usuarios);
});

// Buscar usuário por ID
router.get('/:id', async (req: Request, res: Response) => {
  const usuario = await prisma.usuario.findUnique({ where: { id: Number(req.params.id) } });
  if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json(usuario);
});

// Criar usuário
router.post('/', async (req: Request, res: Response) => {
  const { nome, email, carteiraIngressos } = req.body;
  try {
    const usuario = await prisma.usuario.create({ data: { nome, email, carteiraIngressos } });
    res.status(201).json(usuario);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Atualizar usuário
router.put('/:id', async (req: Request, res: Response) => {
  const { nome, email, carteiraIngressos } = req.body;
  try {
    const usuario = await prisma.usuario.update({
      where: { id: Number(req.params.id) },
      data: { nome, email, carteiraIngressos }
    });
    res.json(usuario);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Deletar usuário
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.usuario.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router; 
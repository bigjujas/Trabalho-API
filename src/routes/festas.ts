import { Router, Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { authMiddleware } from '../utils/auth';

const router = Router();

// Listar todas as festas
router.get('/', async (req: Request, res: Response) => {
  const festas = await prisma.festa.findMany();
  res.json(festas);
});

// Buscar festa por ID
router.get('/:id', async (req: Request, res: Response) => {
  const festa = await prisma.festa.findUnique({ where: { id: Number(req.params.id) } });
  if (!festa) return res.status(404).json({ error: 'Festa não encontrada' });
  res.json(festa);
});

// Criar festa (requer autenticação)
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  const { nome, valor, ingressos, ingressosDisponiveis } = req.body;
  
  if (!nome || !valor || !ingressos) {
    return res.status(400).json({ error: 'Nome, valor e quantidade de ingressos são obrigatórios' });
  }
  
  try {
    const festa = await prisma.festa.create({ 
      data: { 
        nome, 
        valor, 
        ingressos, 
        ingressosDisponiveis: ingressosDisponiveis || ingressos 
      } 
    });
    res.status(201).json(festa);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Atualizar festa (requer autenticação)
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  const { nome, valor, ingressos, ingressosDisponiveis } = req.body;
  try {
    const festa = await prisma.festa.update({
      where: { id: Number(req.params.id) },
      data: { nome, valor, ingressos, ingressosDisponiveis }
    });
    res.json(festa);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Deletar festa (requer autenticação)
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    await prisma.festa.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router; 
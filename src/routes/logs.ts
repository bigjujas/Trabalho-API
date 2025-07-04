import { Router, Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { authMiddleware } from '../utils/auth';

const router = Router();

// Aplicar middleware de autenticação em todas as rotas de logs
router.use(authMiddleware);

// Listar todos os logs (apenas para demonstração)
router.get('/', async (req: Request, res: Response) => {
  try {
    const logs = await prisma.log.findMany({
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // Limitar a 100 logs mais recentes
    });
    
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar logs' });
  }
});

// Buscar logs de um usuário específico
router.get('/usuario/:usuarioId', async (req: Request, res: Response) => {
  const usuarioId = Number(req.params.usuarioId);
  
  // Verificar se o usuário está buscando seus próprios logs
  if (req.user && req.user.userId !== usuarioId) {
    return res.status(403).json({ error: 'Você só pode visualizar seus próprios logs' });
  }

  try {
    const logs = await prisma.log.findMany({
      where: {
        usuarioId: usuarioId
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar logs do usuário' });
  }
});

// Buscar logs por ação
router.get('/acao/:acao', async (req: Request, res: Response) => {
  const acao = req.params.acao;
  
  try {
    const logs = await prisma.log.findMany({
      where: {
        acao: acao
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });
    
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar logs por ação' });
  }
});

export default router; 
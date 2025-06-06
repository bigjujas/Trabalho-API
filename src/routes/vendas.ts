import { Router, Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { sendCompraEmail } from '../utils/email';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { clienteId, festaId, quantidade } = req.body;

  try {
    const venda = await prisma.$transaction(async (tx) => {
      // Busca usuário e festa
      const usuario = await tx.usuario.findUnique({ where: { id: clienteId } });
      const festa = await tx.festa.findUnique({ where: { id: festaId } });

      if (!usuario || !festa) throw new Error('Usuário ou festa não encontrada');
      if (festa.ingressosDisponiveis < quantidade) throw new Error('Ingressos insuficientes');

      // Atualiza ingressos disponíveis na festa
      await tx.festa.update({
        where: { id: festaId },
        data: { ingressosDisponiveis: { decrement: quantidade } }
      });

      // Atualiza carteira de ingressos do usuário
      await tx.usuario.update({
        where: { id: clienteId },
        data: { carteiraIngressos: { increment: quantidade } }
      });

      // Cria venda
      return tx.venda.create({
        data: {
          clienteId,
          festaId,
          quantidade,
          valor: quantidade * festa.valor
        }
      });
    });


    // Buscar dados completos para o e-mail
    const usuario = await prisma.usuario.findUnique({ where: { id: clienteId } });
    const festa = await prisma.festa.findUnique({ where: { id: festaId } });
    let emailUrl = null;
    if (usuario && festa) {
      emailUrl = await sendCompraEmail(
        usuario.email,
        usuario.nome,
        festa.nome,
        quantidade,
        quantidade * festa.valor
      );
    }

    res.status(201).json({ ...venda, emailUrl });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Listar todas as vendas
router.get('/', async (req: Request, res: Response) => {
  const vendas = await prisma.venda.findMany({
    include: {
      cliente: true,
      festa: true
    }
  });
  res.json(vendas);
});

// Buscar venda por ID
router.get('/:id', async (req: Request, res: Response) => {
  const venda = await prisma.venda.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      cliente: true,
      festa: true
    }
  });
  if (!venda) return res.status(404).json({ error: 'Venda não encontrada' });
  res.json(venda);
});

// Cancelar venda e reverter transação
router.delete('/:id', async (req: Request, res: Response) => {
  const vendaId = Number(req.params.id);

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      // Busca a venda com dados relacionados
      const venda = await tx.venda.findUnique({
        where: { id: vendaId },
        include: { cliente: true, festa: true }
      });

      if (!venda) throw new Error('Venda não encontrada');

      // Reverte ingressos na festa
      await tx.festa.update({
        where: { id: venda.festaId },
        data: {
          ingressosDisponiveis: {
            increment: venda.quantidade
          }
        }
      });

      // Reverte carteira de ingressos do usuário
      await tx.usuario.update({
        where: { id: venda.clienteId },
        data: {
          carteiraIngressos: {
            decrement: venda.quantidade
          }
        }
      });

      // Deleta a venda
      await tx.venda.delete({
        where: { id: vendaId }
      });

      return venda;
    });

    res.json({ message: 'Venda cancelada e reversão concluída.', vendaCancelada: resultado });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});


export default router; 
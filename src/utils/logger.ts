import { prisma } from '../prisma/client';
import { Request } from 'express';

export interface LogData {
  usuarioId?: number;
  acao: string;
  detalhes?: string;
  sucesso?: boolean;
}

export const registrarLog = async (logData: LogData, req?: Request) => {
  try {
    const ip = req?.ip || req?.connection?.remoteAddress || 'unknown';
    const userAgent = req?.headers['user-agent'] || 'unknown';

    await prisma.log.create({
      data: {
        usuarioId: logData.usuarioId,
        acao: logData.acao,
        detalhes: logData.detalhes,
        ip: ip.toString(),
        userAgent,
        sucesso: logData.sucesso ?? true
      }
    });
  } catch (error) {
    console.error('Erro ao registrar log:', error);
  }
};

// Funções específicas para ações comuns
export const logLogin = async (usuarioId: number, sucesso: boolean, detalhes?: string, req?: Request) => {
  await registrarLog({
    usuarioId,
    acao: sucesso ? 'LOGIN_SUCESSO' : 'LOGIN_FALHA',
    detalhes,
    sucesso
  }, req);
};

export const logCompra = async (usuarioId: number, festaId: number, quantidade: number, valor: number, sucesso: boolean, detalhes?: string, req?: Request) => {
  await registrarLog({
    usuarioId,
    acao: sucesso ? 'COMPRA_INGRESSO' : 'TENTATIVA_COMPRA_FALHA',
    detalhes: detalhes || `Festa ID: ${festaId}, Quantidade: ${quantidade}, Valor: R$ ${valor}`,
    sucesso
  }, req);
};

export const logCriacaoUsuario = async (usuarioId: number, email: string, sucesso: boolean, detalhes?: string, req?: Request) => {
  await registrarLog({
    usuarioId,
    acao: sucesso ? 'CRIACAO_USUARIO' : 'TENTATIVA_CRIACAO_USUARIO_FALHA',
    detalhes: detalhes || `Email: ${email}`,
    sucesso
  }, req);
}; 
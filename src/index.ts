import express from 'express';
import vendasRouter from './routes/vendas';
import usuariosRouter from './routes/usuarios';
import festasRouter from './routes/festas';

const app = express();
app.use(express.json());

app.use('/vendas', vendasRouter);
app.use('/usuarios', usuariosRouter);
app.use('/festas', festasRouter);

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
}); 
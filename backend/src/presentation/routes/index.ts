import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import rachaRoutes from './racha.routes';
import dashboardRoutes from './dashboard.routes';

const api = Router();

api.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

api.use('/auth', authRoutes);
api.use('/products', productRoutes);
api.use('/rachas', rachaRoutes);
api.use('/dashboard', dashboardRoutes);

export default api;

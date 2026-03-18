import { Router, type Request, type Response } from 'express';

const router = Router();

// Placeholder for Fleet Routes
router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Fleet (Vehicles & Maintenance) Module is active.' });
});

export default router;

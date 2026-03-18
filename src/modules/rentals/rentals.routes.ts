import { Router, type Request, type Response } from 'express';

const router = Router();

// Placeholder for Rental Routes
router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Rentals (Bookings & Pricing) Module is active.' });
});

export default router;

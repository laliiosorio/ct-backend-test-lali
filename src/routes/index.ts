import searchController from '@/modules/search/search.controller';
import { Router } from 'express';

const router = Router();

// * All search-related endpoints live under /search
router.use('/search', searchController);

export default router;

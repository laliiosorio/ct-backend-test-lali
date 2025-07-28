import searchController from '@/modules/search/search.controller';
import { Router } from 'express';

const router = Router();

/**
 * Root router for the application.
 * Mounts all search-related endpoints under /search.
 * Additional domain routers can be added here in the future.
 */
router.use('/search', searchController);

export default router;

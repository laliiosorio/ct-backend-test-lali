import { handleSearch } from '@/modules/search/search.domain';
import { validateSearchParams, Journey } from '@/modules/search/search.schema';
import { Router, Request, Response } from 'express';
import { z } from 'zod';

const searchController = Router();

searchController.post('/', async (req: Request, res: Response) => {
  // Validate request body against schema
  const reqData = validateSearchParams(req.body);

  // If validation fails, return 400 with error details
  if (!reqData.success) {
    const parseErrors = z.treeifyError(reqData.error);
    console.error(
      'Validation errors:',
      parseErrors.properties.passenger.properties.children.errors,
    );
    const errorMessages = parseErrors.errors.join(' | ');
    return res.status(400).json({
      error: `Invalid search parameters - ${errorMessages}`,
    });
  }

  // If validation succeeds, force journeys type
  try {
    const params = {
      ...reqData.data,
      journeys: reqData.data.journeys as Journey[],
    };

    const result = await handleSearch(params);
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Error en búsqueda:', error.message);
    res.status(500).json({ error: 'Server internal error' });
  }
});

export default searchController;

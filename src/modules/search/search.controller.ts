import { handleSearch } from '@/modules/search/search.domain';
import { validateSearchParams, Journey } from '@/modules/search/search.schema';
import { Router, Request, Response } from 'express';
import { z } from 'zod';

const searchController = Router();

/**
 * POST /search
 * Main entry point for search requests.
 * - Validates the request body using Zod schema.
 * - Returns 400 with error details if validation fails.
 * - Calls the domain handler if validation succeeds.
 * - Handles and logs any unexpected errors.
 */
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

  // If validation succeeds, force journeys type and handle search
  try {
    const params = {
      ...reqData.data,
      journeys: reqData.data.journeys as Journey[],
    };

    // Delegate business logic to domain handler
    const result = await handleSearch(params);
    res.status(200).json(result);
  } catch (error: any) {
    // Log and return server error
    console.error('Search error:', error.message);
    res.status(500).json({ error: 'Server internal error' });
  }
});

export default searchController;

import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync, IsString, IsNumber } from 'class-validator';

/**
 * Validates and transforms environment variables at application startup.
 * Uses class-validator and class-transformer to ensure all required variables
 * are present and have the correct types.
 * Throws an error with details if validation fails, preventing misconfiguration.
 * @param config - The environment variables object (e.g., process.env)
 * @returns The validated and typed environment variables
 */
export function validateEnvConfig(config: Record<string, unknown>) {
  class EnvironmentVariables {
    @IsString() MONGO_URI!: string;
    @IsString() TRAIN_DB!: string;
    @IsString() SEARCH_DB!: string;
    @IsString() SERVIVUELO_URL!: string;
    @IsNumber() PORT!: number;
    @IsString() REDIS_HOST!: string;
    @IsNumber() REDIS_PORT!: number;
  }

  // Transform plain config to typed instance and validate
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    const messages = errors
      .map(err => Object.values(err.constraints || {}).join(', '))
      .map((msg, i) => `${errors[i].property}: ${msg}`);
    throw new Error(`Invalid environment variables:\n• ${messages.join('\n• ')}`);
  }
  return validated;
}

// Validate environment variables at startup
validateEnvConfig(process.env);

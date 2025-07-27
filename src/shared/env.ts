import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync, IsString, IsNumber } from 'class-validator';

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

validateEnvConfig(process.env);

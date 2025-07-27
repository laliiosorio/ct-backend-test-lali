import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync, IsString, IsNumberString } from 'class-validator';

class EnvironmentVariables {
  @IsString() MONGO_URI!: string;
  @IsString() TRAIN_DB!: string;
  @IsString() SEARCH_DB!: string;
  @IsString() SERVIVUELO_URL!: string;
  @IsNumberString() PORT!: string;
}

const validated = plainToInstance(EnvironmentVariables, process.env, {
  enableImplicitConversion: true,
});

const errors = validateSync(validated, { skipMissingProperties: false });

if (errors.length > 0) {
  const msgs = errors.map(err => {
    const cons = err.constraints ? Object.values(err.constraints) : [];
    console.log('----', cons);
    return `${err.property}: ${cons.join(', ')}`;
  });
  throw new Error(`Invalid env variable:\n• ${msgs.join('\n• ')}`);
}

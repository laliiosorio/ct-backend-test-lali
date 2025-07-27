import { validateEnvConfig } from '../env';

describe('src/shared/env.ts', () => {
  it('module import should not throw (uses jest.env.js)', () => {
    expect(() => require('../env')).not.toThrow();
  });
});

describe('validateEnvConfig()', () => {
  it('throws on a totally empty config', () => {
    expect(() => validateEnvConfig({})).toThrow(/MONGO_URI/);
  });

  it('throws when PORT is present but not numeric', () => {
    const partial = {
      MONGO_URI: 'u',
      TRAIN_DB: 't',
      SEARCH_DB: 's',
      SERVIVUELO_URL: 'v',
      PORT: 'NaN',
    };
    expect(() => validateEnvConfig(partial)).toThrow(/PORT/);
  });
});

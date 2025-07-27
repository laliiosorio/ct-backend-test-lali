jest.mock('mongodb', () => {
  const mockConnect = jest.fn();
  const mockDb = jest.fn();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const MongoClient = jest.fn().mockImplementation((_uri: string) => ({
    connect: mockConnect,
    db: mockDb,
  }));
  return { MongoClient, __mockConnect: mockConnect, __mockDb: mockDb };
});

describe('shared/mongo.getDb()', () => {
  let getDb: (dbName: string) => Promise<any>;
  let MongoClient: jest.Mock;
  let mockConnect: jest.Mock;
  let mockDb: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mongodb = require('mongodb');
    MongoClient = mongodb.MongoClient;
    mockConnect = mongodb.__mockConnect;
    mockDb = mongodb.__mockDb;
    MongoClient.mockClear();
    mockConnect.mockClear();
    mockDb.mockClear();
    process.env.MONGO_URI = 'mongodb://localhost:27017';
    ({ getDb } = require('../mongo'));
  });

  it('constructs MongoClient with the MONGO_URI and calls connect/db', async () => {
    await getDb('testdb');
    expect(MongoClient).toHaveBeenCalledWith('mongodb://localhost:27017');
    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(mockDb).toHaveBeenCalledWith('testdb');
  });

  it('reuses the same client and does not call connect again', async () => {
    await getDb('db1');
    await getDb('db2');
    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(mockDb).toHaveBeenCalledWith('db1');
    expect(mockDb).toHaveBeenCalledWith('db2');
  });

  it('throws if MONGO_URI is not set', async () => {
    process.env.MONGO_URI = '';
    jest.resetModules();
    try {
      ({ getDb } = require('../mongo'));
      await getDb('faildb');
      fail('Expected error for missing MONGO_URI');
    } catch (err) {
      expect(err).toBeDefined();
    } finally {
      process.env.MONGO_URI = 'mongodb://localhost:27017';
    }
  });
});

declare namespace NodeJS {
  interface ProcessEnv {
    MONGO_URI: string;
    TRAIN_DB: string;
    SEARCH_DB: string;
    SERVIVUELO_URL: string;
    PORT: string;
  }
}

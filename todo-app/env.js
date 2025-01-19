const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const envConfig = {
  production: false,
  YANDEX_CLIENT_ID: process.env.YANDEX_CLIENT_ID,
  YANDEX_CLIENT_SECRET: process.env.YANDEX_CLIENT_SECRET,
};

const content = `
import { Environment } from './environment.interface';
export const environment: Environment = ${JSON.stringify(envConfig)};
`;

fs.writeFileSync('./src/environments/environment.local.ts', content);

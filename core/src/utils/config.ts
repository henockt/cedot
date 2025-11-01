import dotenv from 'dotenv';

dotenv.config();

interface Config {
  PORT: number
}

const getConfig = (key: string, defaultValue: string): string => {
  return process.env[key] || defaultValue;
};

const config : Config = {
  PORT: parseInt(getConfig('PORT', '3000')),
};

export default config;
import * as dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const models = process.env.MODELS;
if (!models) {
  throw Error('env variable MODELS is not present');
}

const config = {
  models: models.split(','),
  zip: process.env.ZIP,
  email: process.env.EMAIL,
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  PORT: process.env.PORT || 8000,
};

export default config;

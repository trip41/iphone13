import express from 'express';
import config from './config';
import fetch from 'node-fetch';
import cron from 'node-cron';
import SendgridService from './SendgridService';

SendgridService.init();

const app = express();

app.get('/', (req, res) => {
  console.log(req.query.zip);
  fetchAvailability(req.query.zip as any).then((output) => {
    res.json(output);
  });
});

app.get('/healthz', (_, res) => {
  res.json({ status: 'ok' });
});

const colors: any = {
  'MLTR3LL/A': 'Gold',
  'MLTT3LL/A': 'Sierra Blue',
  'MLTQ3LL/A': 'Silver',
  'MLTP3LL/A': 'Graphite',
};

let lastSend = '';

function getUrlForModel(model: string, zip?: string) {
  return `https://www.apple.com/shop/fulfillment-messages?pl=true&cppart=UNLOCKED/US&parts.0=${model}&location=${
    zip || config.zip
  }`;
}

function formatAvailability(storeResults: Array<{ store: string; availability: string }>) {
  return storeResults.map((storeResult) => `${storeResult.store} ${storeResult.availability}`).join('\n');
}

async function fetchAvailability(zip?: string) {
  const output: any[] = [];

  for (const model of config.models) {
    const res = await fetch(getUrlForModel(model, zip));
    const resp = await res.json();

    const storesWithAvailability = resp?.body?.content?.pickupMessage?.stores?.filter(
      (store: any) =>
        store.partsAvailability?.[model]?.storePickupQuote &&
        !store.partsAvailability[model].storePickupQuote?.startsWith('Currently unavailable'),
    );

    const availability: string | any =
      storesWithAvailability.length === 0
        ? `Unavailable`
        : storesWithAvailability.map((store: any) => ({
            store: store.storeName,
            availability: store.partsAvailability?.[model]?.storePickupQuote,
          }));

    output.push({
      model: `${colors[model]} 128gb`,
      availability,
    });
  }

  return output;
}

cron.schedule('* * * * *', () => {
  fetchAvailability().then((results) => {
    const available: any[] = [];
    for (const result of results) {
      if (result.availability === 'Unavailable') {
        console.log(result.model, 'unavailable');
        continue;
      } else {
        console.log(result.model, 'available');
        available.push(result);
      }
    }

    if (available.length > 0) {
      const body = available.map((item) => `${item.model}\n${formatAvailability(item.availability)}`).join('\n\n');
      if (body !== lastSend) {
        SendgridService.sendEmail(body);
        lastSend = body;
      }
    }
  });
});

app.listen(config.PORT, () => {
  console.log(`Server is running at http://localhost:${config.PORT}`);
});

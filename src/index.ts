import express from 'express';
import config from './config';
import fetch from 'node-fetch';
// import cron from 'node-cron';

const PORT = 8000;
const app = express();

app.get('/', (req, res) => {
  console.log(req.query.zip);
  fetchAvailability(req.query.zip as any).then((output) => {
    res.json(output);
  });
});

const colors: any = {
  'MLTR3LL/A': 'Gold',
  'MLTT3LL/A': 'Sierra Blue',
};

function getUrlForModel(model: string, zip?: string) {
  return `https://www.apple.com/shop/fulfillment-messages?pl=true&cppart=UNLOCKED/US&parts.0=${model}&location=${
    zip || config.zip
  }`;
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

// cron.schedule('* * * * *', () => {
//   fetchAvailability().then((output) => {
//     console.log('\n\n', output, '\n\n');
//   });
// });

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

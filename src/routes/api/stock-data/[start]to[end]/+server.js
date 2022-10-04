import { error, json } from '@sveltejs/kit';
import { MongoClient, ServerApiVersion } from 'mongodb';

export async function GET({ params }) {
	// Connect to client
	const uri = `mongodb+srv://user_1:SlDNHYeyzVGNgHxA@portfoliodashboardclust.cvksjhu.mongodb.net/?retryWrites=true&w=majority`;
	const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
	await client.connect();

  let data = []
  const collections = await client.db("stock_data").listCollections().toArray()
  const collection_names = collections.map(({ name }) => name).slice(0, 101);
  for (const symbol of collection_names) {
    const collection = client.db("stock_data").collection(symbol);
    // Get data between two dates sorted from earliest to latest
    const symbol_data = await collection.find({
      _id: {
        $gte: parseInt(params.start),
        $lte: parseInt(params.end)
      }
    }).sort({_id : 1}).toArray();

    let [times, prices, vols] = [[], [], []];
    for (const { _id, data } of symbol_data) {
      times.push(_id);
      prices.push(data.at(0));
      vols.push(data.at(1) / 1000);
    }
    data.push([symbol, {times, prices, vols}])

    console.log('Finished', symbol)
  }
  client.close();

  // Sort data based on profit loss
  const profitloss = (prices) => (prices.at(-1) - prices.at(0)) / prices.at(0);
  data = Object.fromEntries(data.sort((a, b) => profitloss(b[1].prices) - profitloss(a[1].prices)));

  return json(data)
}
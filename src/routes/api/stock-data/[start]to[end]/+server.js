import { error, json } from '@sveltejs/kit';
import { MongoClient, ServerApiVersion } from 'mongodb';

export async function GET({ params }) {
	// Connect to client
	const uri = `mongodb+srv://user_1:SlDNHYeyzVGNgHxA@portfoliodashboardclust.cvksjhu.mongodb.net/?retryWrites=true&w=majority`;
	const client = new MongoClient(uri);
	await client.connect();

  const collection = client.db("stock_data").collection("daily_stock_data");
  // Get data between two dates sorted from earliest to latest
  const db_data = await collection.find({
    time: {
      $gte: parseInt(params.start),
      $lte: parseInt(params.end)
    }
  }).sort({time : 1}).allowDiskUse().toArray();
  client.close();
  
  let chart_data = {}
  for (const {symbol, time, data} of db_data) {
    const prev = symbol in chart_data ? chart_data[symbol] : { times : [], prices : [], vols : []}
    chart_data[symbol] = {times : [...prev.times, time], prices : [...prev.prices, data.at(0)], vols : [...prev.vols, data.at(1) / 1000]}
  }

  // Delete queries which are less than 2 entries
  Object.keys(chart_data).forEach(key => {
    if (chart_data[key].times.length < 2) delete chart_data[key];
  });

  // Sort data based on profit loss
  const profitloss = (prices) => (prices.at(-1) - prices.at(0)) / prices.at(0);
  chart_data = Object.fromEntries(Object.entries(chart_data).sort((a, b) => profitloss(b.at(1).prices) - profitloss(a.at(1).prices)));
  
  return json(chart_data)
}
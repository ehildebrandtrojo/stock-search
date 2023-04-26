import { error, json } from '@sveltejs/kit';
import { MongoClient, ServerApiVersion } from 'mongodb';

export async function POST({ params, request }) {
  const selected_symbols = await request.json();

	// Connect to client
	const uri = `mongodb+srv://user_1:SlDNHYeyzVGNgHxA@portfoliodashboardclust.cvksjhu.mongodb.net/?retryWrites=true&w=majority`;
	const client = new MongoClient(uri);
	await client.connect();

  const collection = client.db("stock_data").collection("daily_stock_data");
  // Get data between two dates sorted from earliest to latest
  let db_data;
  if (parseInt(params.all)) {
    db_data = await collection.find({
      time: {
        $gte: parseInt(params.start),
        $lte: parseInt(params.end)
      }
    }).sort({time : 1}).allowDiskUse().toArray();
  } else {
    db_data = await collection.find({
      symbol: { $in: selected_symbols },
      time: {
        $gte: parseInt(params.start),
        $lte: parseInt(params.end)
      }
    }).sort({time : 1}).allowDiskUse().toArray();
  }
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
  
  return json(chart_data);
}
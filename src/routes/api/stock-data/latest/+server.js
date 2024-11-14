import { json } from '@sveltejs/kit';
import { MongoClient } from 'mongodb';

export async function GET() {
  // Connect to client
  const uri = `mongodb+srv://user_1:test@portfoliodashboardclust.cvksjhu.mongodb.net/?retryWrites=true&w=majority`;
  const client = new MongoClient(uri);
  await client.connect();

  const collection = client.db("stock_data").collection("daily_stock_data");
  // Get latest available data from AAPL to know latest date available
  const db_data = await collection.find({
    symbol: "AAPL",
    time: {
      $gte: Date.now() - 6.048e+8, // Subtract 1 week from today
    }
  }).sort({time : -1}).limit(1).toArray();
  client.close();
  
  return json(db_data[0]['time']);
}

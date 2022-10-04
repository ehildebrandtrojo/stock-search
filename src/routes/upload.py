from random import randint
import pymongo

from datetime import datetime
import numpy as np

def get_database():
    client = pymongo.MongoClient('mongodb+srv://user_1:SlDNHYeyzVGNgHxA@portfoliodashboardclust.cvksjhu.mongodb.net/?retryWrites=true&w=majority')
    return client['stock_data']

if __name__ == '__main__':
    # Load stock_data database and access corresponding collections (tables)
    db = get_database()
    colls = {symbol : db[symbol] for symbol in ['AAPL', 'MSFT']}

    # Insert data
    for symbol, db in colls.items():
        # Load csv file with data
        # Make list of {'_id': utc date, 'data' : [price, vol]} and db.insert_many
        db.insert_one({'_id': round(datetime.now().timestamp() * 1000), 'data' : [randint(0, 10), randint(0, 5)]})

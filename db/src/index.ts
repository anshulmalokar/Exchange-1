import { timeStamp } from "console";
import { DB_TRADE } from "./event";
import { RedisManager } from "./RedisManager";
import { client, performQuery } from "./seed";
async function main() {
  while (true) {
    const response: DB_TRADE = await RedisManager.getInstance().getFromQueue(
      "DB_PROCESS"
    );
    const type = response.type;
    switch (type) {
      case "TRADE_ADDED":
        const {
          id,
          isBuyerMaker,
          market,
          price,
          quantity,
          quoteQuantity,
          timestamp,
        } = response.data;
        const time = new Date(timeStamp as unknown as string);
        try {
            await client.connect();
            await client.query('BEGIN');        
            await client.query(`
                INSERT INTO tata_prices (time, price, volume, currency_code)
                VALUES ($1, $2, $3, $4)
            `, [time, parseFloat(price), parseFloat(quantity), 'INR']);        
            await client.query(`
                INSERT INTO ticker (market, current_price, updated_at)
                VALUES ($1, $2, CURRENT_TIMESTAMP)
                ON CONFLICT (market)
                DO UPDATE SET
                    current_price = EXCLUDED.current_price,
                    updated_at = CURRENT_TIMESTAMP
            `, [market, parseFloat(price)]);        
            await client.query('COMMIT'); // Commit the transaction
            console.log('Transaction completed successfully');
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error during transaction', error);
        }
        break;
      case "ORDER_UPDATE":
        break;
    }
  }
}

main();

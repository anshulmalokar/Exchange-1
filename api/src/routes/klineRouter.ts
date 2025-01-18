import e, { Router } from "express";
import { Client } from 'pg';

const klineRouter = Router();

const client = new Client({
    user: 'your-username',
    host: 'localhost',
    database: 'timeseries_example',
    password: 'your-password',
    port: 5432,
  });

async function getKlines(symbol: string, startTime: number, endTime: number, interval: string) {
    try {
      await client.connect();
  
      const start = new Date(startTime * 1000).toISOString();
      const end = new Date(endTime * 1000).toISOString();
  
      const query = `
        SELECT
          time_bucket($1, start_time) AS bucket,
          symbol,
          first(open, start_time) AS open,
          max(high) AS high,
          min(low) AS low,
          last(close, end_time) AS close,
          sum(volume) AS volume,
          sum(quote_volume) AS quote_volume,
          sum(trades) AS trades
        FROM klines
        WHERE symbol = $2
          AND start_time >= $3
          AND end_time <= $4
        GROUP BY bucket, symbol
        ORDER BY bucket;
      `;
  
      const values = [interval, symbol, start, end];
  
      const res = await client.query(query, values);
  
      const formattedResult = res.rows.map((row: any) => ({
        close: row.close.toString(),
        end: row.bucket,
        high: row.high.toString(),
        low: row.low.toString(),
        open: row.open.toString(),
        quoteVolume: row.quote_volume.toString(),
        start: row.bucket,
        trades: row.trades.toString(),
        volume: row.volume.toString(),
      }));
  
      return formattedResult;
  
    } catch (error) {
      console.error("Error fetching Kline data:", error);
    } finally {
      await client.end();
    }
  }

  klineRouter.get("/", async (req, res) => {
    const klines = await getKlines('ETH_USDC', 1736033400, 1736136000, '1 hour');
    res.status(200).json(klines);
  })

export default klineRouter;
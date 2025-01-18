import { Client } from "pg";

export const client = new Client({
  user: "your-username",
  host: "localhost",
  database: "timeseries_example",
  password: "your-password",
  port: 5432,
});

export async function performQuery(query: string, values: any[]) {
  try {
    await client.connect();
    await client.query(query, values);
  } catch (e) {
    console.log(e);
  }
}

async function createKlineTable() {
  try {
    await client.connect();

    await client.query(`CREATE TABLE ticker (
      market VARCHAR(50) PRIMARY KEY,
      current_price DOUBLE PRECISION NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`);

    await client.query(`
        DROP TABLE IF EXISTS "tata_prices";
        CREATE TABLE "tata_prices"(
            time            TIMESTAMP WITH TIME ZONE NOT NULL,
            price   DOUBLE PRECISION,
            volume      DOUBLE PRECISION,
            currency_code   VARCHAR (10)
        );
        
        SELECT create_hypertable('tata_prices', 'time', 'price', 2);
    `);

    await client.query(`
      INSERT INTO ticker (market, current_price, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (market)
      DO UPDATE SET
          current_price = EXCLUDED.current_price,
          updated_at = CURRENT_TIMESTAMP;
  `, ["tata_prices", 0.00]);

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS klines (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(20) NOT NULL,
        start_time TIMESTAMPTZ NOT NULL,
        end_time TIMESTAMPTZ NOT NULL,
        open FLOAT NOT NULL,
        high FLOAT NOT NULL,
        low FLOAT NOT NULL,
        close FLOAT NOT NULL,
        volume FLOAT NOT NULL,
        quote_volume FLOAT NOT NULL,
        trades INT NOT NULL,
        -- Index for performance on time-based queries
        INDEX idx_symbol_start_time (symbol, start_time)
      );
    `;
    await client.query(createTableQuery);
    console.log("Table 'klines' created successfully.");

    const convertToHypertableQuery = `
      SELECT create_hypertable('klines', 'start_time', if_not_exists => TRUE);
    `;
    await client.query(convertToHypertableQuery);
    console.log(
      "Table 'klines' converted to hypertable for TimescaleDB optimization."
    );
  } catch (error) {
    console.error("Error creating table:", error);
  } finally {
    await client.end();
  }
}

export const seed = () => {
  createKlineTable();
};

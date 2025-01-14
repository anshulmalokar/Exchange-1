import express from "express";
import orderRouter from "./routes/orderRouter";
import tickersRouter from "./routes/tickersRouter";
import depthRouter from "./routes/depthRouter";
import tradesRouter from "./routes/tradesRouter";
import klineRouter from "./routes/klineRouter";

const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());

app.use("/api/v1/order", orderRouter);
app.use("/api/v1/depth", depthRouter);
app.use("/api/v1/trades", tradesRouter);
app.use("/api/v1/klines", klineRouter);
app.use("/api/v1/tickers", tickersRouter);

app.listen(PORT,() => {
    console.log(`Server started at ${PORT}`)
})
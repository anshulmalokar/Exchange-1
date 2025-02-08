import { WebSocketServer } from "ws";
import { UserManager } from "./Managers/UserManger";

const wss = new WebSocketServer({ port: 3001 });

wss.on("connection", (ws) => {
    UserManager.getInstance().addUser(ws);
});

// From engine we will be publishing a message to bookTicker.${marker}
// {"method":"SUBSCRIBE","params":["bookTicker.BTC_USDC"],"id":1}
// Basically this will help in updating the orderBook
// From engine we will be publishing a message to "depth.200ms.${market}"
// {"method":"SUBSCRIBE","params":["depth.200ms.BTC_USDC"],"id":2}
// From engine we will be publishing a e
// {"method":"SUBSCRIBE","params":["trade.BTC_USDC"],"id":3}
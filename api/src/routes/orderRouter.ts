import { Router } from "express";
import { RedisManager } from "../Manager/RedisManager";
import { CANCEL_ORDER, CREATE_ORDER, GET_OPEN_ORDERS, MessageToEngine, MessageToEngineGetOpenOrders, MessageToEngineToCancleOrder } from "../types";

const orderRouter = Router();

orderRouter.get("/", async(req, res) => {
    const {userId, market} = req.body;
    const message: MessageToEngineGetOpenOrders = {
        type: GET_OPEN_ORDERS,
        data: {
            market,
            userId
        }
    };
    const response = await RedisManager.getInstance().sendAndawait(message);
    res.status(200).json(response);
})

orderRouter.post("/",async (req, res) => {
    const {market,price, quantity, side, userId} = req.body;
    const message: MessageToEngine = {
        type: CREATE_ORDER,
        data: {
            market: market,
            price: price,
            quantlty: quantity,
            side: side,
            userId: userId 
        }
    }
    const respone = await RedisManager.getInstance().sendAndawait(message);
    res.status(200).json(respone);
});

orderRouter.delete("/:id",async (req, res) => {
    const {market} = req.body;
    const orderId = req.params.id;
    const message: MessageToEngineToCancleOrder = {
        type: CANCEL_ORDER,
        data: {
            orderId: orderId,
            market: market
        }
    }
    const response = await RedisManager.getInstance().sendAndawait(message);
    res.status(200).json(response);
})



export default orderRouter;
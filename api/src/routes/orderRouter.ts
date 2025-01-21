import { Router } from "express";
import { RedisManager } from "../Manager/RedisManager";
import { CANCEL_ORDER, CREATE_ORDER, GET_OPEN_ORDERS, MessageFromEngine, MessageToEngine, MessageToEngineGetOpenOrders, MessageToEngineToCancleOrder } from "../types";

const orderRouter = Router();

orderRouter.get("/user", async(req, res) => {
    const {userId, market} = req.body;
    const message: MessageToEngineGetOpenOrders = {
        type: GET_OPEN_ORDERS,
        data: {
            market,
            userId
        }
    };
    let response = await RedisManager.getInstance().sendAndawait(message, userId);
    response = JSON.parse(response.toString());
    res.status(200).json({
        response
    });
})

orderRouter.post("/",async (req, res) => {
    const {market,price, quantity, side, userId} = req.body;
    const message: MessageToEngine = {
        type: CREATE_ORDER,
        data: {
            market: market,
            price: Number(price),
            quantity: Number(quantity),
            side: side,
            userId: userId 
        }
    }
    const response: String = await RedisManager.getInstance().sendAndawait(message, userId) || "";
    res.status(200).json({
        data: JSON.parse(response.toString())
    });
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
    const response = RedisManager.getInstance().sendAndawait(message, orderId);
    res.status(200).json(response);
});



export default orderRouter;
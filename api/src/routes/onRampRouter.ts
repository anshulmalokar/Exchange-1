import { json, Router } from "express";
import { RedisManager } from "../Manager/RedisManager";

const onRampRoute = Router();

onRampRoute.post("/", async (req, res) => {
    try{
        const {userId, currency, amount } = req.body;
        const message = {
            type: "ON_RAMP",
            data: {
                amount: amount,
                userId: userId,
                currency: currency
            }
        }
        const response = await RedisManager.getInstance().sendAndawait(message ,userId);
        res.status(200).json({response});
    }catch(e){
        res.status(500).json({
            message: "Internal Server Error"
        })
    }
});

export default onRampRoute;
import { Router, Request, Response} from "express";
import { GET_DEPTH, MessageToEngineGetDepth } from "../types";
import { RedisManager } from "../Manager/RedisManager";

const depthRouter = Router();

depthRouter.get("/", async (req: Request, res: Response) => {
  const { market } = req.body;
  const obj: MessageToEngineGetDepth = {
    type: GET_DEPTH,
    data: {
      market: market,
    },
  };
  const response = await RedisManager.getInstance().sendAndawait(obj, market);
  res.status(200).json(JSON.parse(response.toString()));
});

export default depthRouter;

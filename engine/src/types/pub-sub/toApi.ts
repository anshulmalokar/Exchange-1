import { Fill } from "../Fills";
import { container } from "../depth";
import { Order } from "../order";

export const CREATE_ORDER = "CREATE_ORDER";
export const CANCEL_ORDER = "CANCEL_ORDER";
export const ON_RAMP = "ON_RAMP";
export const ORDER_PALCED = "ORDER_PLACED";
export const DEPTH = "DEPTH";
export const OPEN_ORDERS = "OPEN_ORDERS";
export const GET_DEPTH = "GET_DEPTH";

export type MessageToApi = MessageToApiForDepth | 
                           MessageToApiForOrderCancel | 
                           MessageToApiForOrderPlaced |
                           MessageToApiForOpenOrders;

type MessageToApiForOrderPlaced = {
    type: typeof ORDER_PALCED,
    payload: {
        orderId: string,
        executedQT: number,
        fills: Fill[]
    }
}

type MessageToApiForDepth = {
    type: typeof DEPTH,
    payload: {
        asks: container[],
        bids: container[]
    }
}

type MessageToApiForOrderCancel = {
    type: typeof CANCEL_ORDER,
    payload: {
        orderId: string,
        executedQt: number,
        remainingQt: number
    }
}

type MessageToApiForOpenOrders = {
    type: typeof OPEN_ORDERS,
    payload: {
        orders: Order[]
    }
}
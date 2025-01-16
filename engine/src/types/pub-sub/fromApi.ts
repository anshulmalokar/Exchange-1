export const CREATE_ORDER = "CREATE_ORDER";
export const CANCEL_ORDER = "CANCEL_ORDER";
export const ON_RAMP = "ON_RAMP";
export const GET_DEPTH = "GET_DEPTH";
export const GET_OPEN_ORDERS = "GET_OPEN_ORDERS";

type orderType = 'buy' | 'sell';

export type MessageFromApi = {
    type: typeof CREATE_ORDER,
    data: {
        market: string,
        price: number,
        quantlty: number,
        side: orderType,
        userId: string
    }
} | {
    type: typeof CANCEL_ORDER,
    data: {
        orderId: string,
        market: string
    }
} | {
    type: typeof ON_RAMP,
    data: {
        amount: string,
        userId: string,
        txnId: string
    }
} | {
    type: typeof GET_DEPTH,
    data: {
        market: string
    }
} | {
    type: typeof GET_OPEN_ORDERS,
    data: {
        market: string,
        userId: string
    }
}
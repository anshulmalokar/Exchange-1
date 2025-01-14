import { OrderBook } from "../types/orderBook";

class OrderBookManager{
    private static instance: OrderBookManager;
    private orderBooks: Map<String, OrderBook> = new Map();
    private balanceBooks: Map<String, UserBalance> = new Map();
    private OrderBookManager(){

    }

    public static getInstance(){
        if(!this.getInstance) return new OrderBookManager();
        return this.instance;
    }
}

interface UserBalance{
    [key: string]: {
        balance: number,
        locked: number
    }
}
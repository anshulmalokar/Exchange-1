import { OrderBook } from "../types/orderBook";
import { CANCEL_ORDER, CREATE_ORDER, GET_DEPTH, GET_OPEN_ORDERS, MessageFromApi, ON_RAMP } from "../types/pub-sub/fromApi";
import { UserBalance } from "../types/UserBalance";
import fs from "fs";
import { RedisManager } from "./RedisManager";
import { Order } from "../types/order";
import { Fill } from "../types/Fills";
import { Depth } from "../types/depth";

type incoming = {
    id: string,
    message: {
        type: string,
        data: any
    }
}

export class OrderBookManager{
    private static instance: OrderBookManager;
    private orderBooks: OrderBook[] = [];
    private balanceBooks: Map<String, UserBalance> = new Map();
    private constructor(){
        let snapshot = null;
        try{
            if(process.env.WITH_SNAPSHOT){
                snapshot = fs.readFileSync("./snapshot.json");
            }
        }catch(e){
            console.log("No snapshot founded");
        }

        if(snapshot){
            const snapShotData = JSON.parse(snapshot.toString());
            this.orderBooks = snapShotData.orderBooks.map((o: any) =>new OrderBook(o.bids, o.asks, o.baseAsset, o.lastTradeId, o.currentPrice));
            this.balanceBooks = new Map(snapShotData.balances);
        }else{
            const orderBooksNew = [];
            orderBooksNew.push(new OrderBook([], [], "TATA", 0, 0));
        }

        setInterval(() => {
            this.saveSnapShot();
        }, 3* 1000)
    }

    public saveSnapShot(){
        const saveSnapShotData: {
            orderbooks: any,
            balances: any
        } = {
            orderbooks: this.orderBooks.map(o => o.getSnapshot()),
            balances: Array.from(this.balanceBooks.entries())
        }
        fs.writeFileSync("./snapshot.json", JSON.stringify(saveSnapShotData));
    }

    public static getInstance(){
        if(!this.getInstance) return new OrderBookManager();
        return this.instance;
    }

    public process(message: incoming){
        const clientId = message.id;
        const type = message.message.type;
        const {market} = message.message.data;
        const arr = market.split('_');
        const baseAsset = arr[0];
        const quoteAsset = arr[1];
        switch(type){
            case CREATE_ORDER:
                const data: MessageFromApi = message.message.data;
                // @ts-ignore
                const {userId, price, quantity, side} = message.message.data;
                const check: Boolean = this.checkUserCanTransact(userId, price, quantity, quoteAsset, side, baseAsset);
                if(!check){
                    console.log(`The user with id ${userId} does not have necessary funds
                        to complete the order`);
                }
                const orderBook: OrderBook | undefined = this.orderBooks.find(o => o.baseAsset === baseAsset && o.quoteAsset === quoteAsset);
                if(orderBook === undefined){
                    console.log(`Order book for ${baseAsset} does not exist`);
                }
                const order: Order = {
                    price: price,
                    filled: 0,
                    orderId: 1 + "",
                    userId: userId,
                    quantity: quantity,
                    side: side
                }
                const response: {
                    executedQt: number;
                    fills: Fill[];
                } | undefined = orderBook?.addOrder(order);
                this.updateUserBalance(userId, side, baseAsset, quoteAsset,response?.fills);
                break;
            case CANCEL_ORDER:
                const {orderId} = message.message.data;
                this.orderBooks.forEach(orderBook => {
                    const bids = orderBook.bids;
                    const asks = orderBook.asks;
                    let orderIndex = bids.findIndex(o => o.orderId === orderId)
                    if(orderIndex != -1){
                        const price = bids[orderIndex].price;
                        const quantity = bids[orderIndex].quantity;
                        const userId = bids[orderIndex].userId;
                        const total_amt = price*quantity
                        const userBalance = this.balanceBooks.get(userId);
                        if(userBalance !== undefined){
                            userBalance[quoteAsset].locked += total_amt;
                        }
                        bids.splice(orderIndex, 1);
                    }
                    orderIndex = asks.findIndex(o => o.orderId === orderId);
                    if(orderIndex != -1){
                        const price = bids[orderIndex].price;
                        const quantity = bids[orderIndex].quantity;
                        const userId = bids[orderIndex].userId;
                        const total_amt = price*quantity
                        const userBalance = this.balanceBooks.get(userId);
                        if(userBalance !== undefined){
                            userBalance[baseAsset].locked += total_amt;
                        }
                        asks.splice(orderIndex, 1);
                    }
                });
                break;
            case ON_RAMP:
                break;
            case GET_DEPTH:
                const depthOrderBook: OrderBook | undefined = this.orderBooks.find(o => o.baseAsset === baseAsset && o.quoteAsset === quoteAsset);
                if(depthOrderBook !== undefined){
                    const getDepthResponse = depthOrderBook.getDepths();
                }
                break;
            case GET_OPEN_ORDERS:
                // @ts-ignore
                const {userId} = message.message.data;
                const oBookForOpenOrder: OrderBook | undefined = this.orderBooks.find(o => o.baseAsset === baseAsset && o.quoteAsset === quoteAsset);
                const openOrderResponse = oBookForOpenOrder?.getOpenOrders(userId);
                break;
        }
    }

    private updateUserBalance(userId: any, side: any, baseAsset: any, quoteAsset: any, fills: Fill[] | undefined) {
        const userBalance = this.balanceBooks.get(userId);
        if(userBalance === undefined){
            console.log("updateUserBalance: No valid UserBalance found");
            return;
        }
        let spentAssetQuantity = 0;
        fills?.forEach(fill => spentAssetQuantity+= fill.qty * fill.price);
        if(side === 'buy'){
            userBalance[quoteAsset].balance -= spentAssetQuantity;
            userBalance[quoteAsset].locked -= spentAssetQuantity;
        }
        if(side === 'sell'){
            userBalance[baseAsset].balance -= spentAssetQuantity;
            userBalance[baseAsset].locked -= spentAssetQuantity;
        }
        this.balanceBooks.set(userId, userBalance);
    }

    private checkUserCanTransact(userId: string, price: number, quantity: number, quoteAsset: any, side: 'buy' | 'sell', baseAsset: any): Boolean{
        const userBalance: UserBalance | undefined = this.balanceBooks.get(userId);
        if(userBalance === undefined) return false;
        if(side === 'buy'){
            const total_cost = quantity*price;
            const availableBalance = userBalance[quoteAsset].balance - userBalance[quoteAsset].locked;
            if(total_cost > availableBalance){
                console.log("Insufficient Funds")
                return false;
            }
            userBalance[quoteAsset].locked += total_cost;
        }else{
            const total_cost = quantity*price;
            const availableBalance = userBalance[baseAsset].balance - userBalance[baseAsset].locked;
            if(total_cost > availableBalance){
                console.log("Insufficient Funds")
                return false;
            }
            userBalance[baseAsset].locked += total_cost;
        }
        return false;
    }
}

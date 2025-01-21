import { Order } from "./order";
import { Depth, container } from "./depth";
import { Fill } from "./Fills";

let GLOBAL_TRADE_ID = 1;
export const BASE_CURRENCY = "INR";

export class OrderBook{
    bids: Order[];
    asks: Order[];
    baseAsset: string;
    quoteAsset: string = BASE_CURRENCY || "INR";
    lastTradeId: number;
    currentPrice: number;

    constructor(bids: Order[], asks: Order[], baseAsset: string, lastTradeId: number, currentPrice: number){
        this.bids = bids;
        this.asks = asks;
        this.baseAsset = baseAsset;
        this.lastTradeId = lastTradeId;
        this.currentPrice = currentPrice;
    }

    public ticker(){
        return `${this.baseAsset}_${this.quoteAsset}`
    }

    public getSnapshot():{
        baseAsset: string,
        bids: Order[],
        asks: Order[],
        lastTradeId: number,
        currentPrice: number
    } {
        return {
            baseAsset: this.baseAsset,
            bids: this.bids,
            asks: this.asks,
            lastTradeId: this.lastTradeId,
            currentPrice: this.currentPrice
        }
    }

    public sortOrderBooks(){
        this.bids.sort((a, b) => b.price - a.price);
        this.asks.sort((a, b) => a.price - b.price);
    }

    public addOrder(order: Order): {
        executedQt: number,
        fills: Fill[]
    }{
        let response:{
            executedQt: number,
            fills: Fill[]
        } = {
            executedQt: 0,
            fills: []
        };
        if(order.side === "buy"){
            response = this.matchBids(order);
            if(response.executedQt < order.quantity){
                order.quantity = order.quantity - response.executedQt;
                order.filled = response.executedQt;
                this.bids.push(order);
            }
        }else{
            response = this.matchAsks(order);
            if(response.executedQt < order.quantity){
                order.quantity = order.quantity - response.executedQt;
                order.filled = response.executedQt;
                this.asks.push(order);
            }
        }
        return response;
    }

    public matchBids(order: Order){
        let executedQt = 0;
        let fills: Fill[] = [];
        for(let i=0; i<this.asks.length;i++){
            if(order.quantity > executedQt &&
                this.asks[i].price < order.price &&
                this.asks[i].userId != order.userId 
            ){
                const quantityFilled = Math.min(this.asks[i].quantity, order.quantity + executedQt);
                executedQt += quantityFilled;
                this.asks[i].filled += executedQt;
                const obj: Fill = {
                    price: this.asks[i].price,
                    qty: executedQt,
                    tradeId: GLOBAL_TRADE_ID++,
                    otherUserId: this.asks[i].userId,
                    markerOrderId: this.asks[i].orderId
                }
                fills.push(obj);
            }
        }
        for(let i=0;i<this.asks.length;i++){
            if(this.asks[i].filled === this.asks[i].quantity){
                this.asks.splice(i,1);
                i--;
            }
        }
        return {executedQt,fills};
    }

    public matchAsks(order: Order){
        let executedQt = 0;
        let fills: Fill[] = [];
        for(let i=0;i<this.bids.length;i++){
            if(executedQt < order.quantity && 
                this.bids[i].price >= order.price &&
                this.bids[i].userId != order.userId){
                const quantityUsed = Math.min(this.bids[i].quantity, order.quantity + executedQt);
                executedQt+=quantityUsed;
                this.bids[i].filled += quantityUsed;
                const obj: Fill ={
                    price: this.bids[i].price,
                    qty: executedQt,
                    tradeId: GLOBAL_TRADE_ID++,
                    otherUserId: this.bids[i].userId,
                    markerOrderId: this.bids[i].orderId
                }
                fills.push(obj);
            }
        }
        for(let i=0;i<this.bids.length;i++){
            if(this.bids[i].filled === this.bids[i].quantity){
                this.bids.splice(i,1);
                i--;
            }
        }
        return {executedQt, fills};
    }

    public getDepths(): Depth{
        const arr1:container[] = [];
        const arr2:container[] = [];
        const lastUpdatedAt = 0;
        const timeStamp = new Date();
        this.bids.forEach(order => {
            const price = order.price;
            const quantity = order.quantity;
            arr1.push({price,quantity});
        })
        this.asks.forEach((order) => {
            const price = order.price;
            const quantity = order.quantity;
            arr2.push({price,quantity});
        });
        const ans: Depth = {
            bids: arr1,
            asks: arr2,
            lastUpdatedAt: lastUpdatedAt,
            timeStamp:  timeStamp.toString() ?? ""
        }
        return ans;
    }

    public getOpenOrders(userId: String): Order[]{
        // print the bids array
        const userBids: Order[] = this.bids.filter(order => order.userId === userId);
        const userAsks: Order[] = this.asks.filter(order => order.userId === userId);
        return [...userAsks, ...userBids];
    }

    public cancelBid(cancelBid: Order): number{
        for(let i=0;i<this.bids.length;i++){
            if(cancelBid === this.bids[i]){
                const price = this.bids[i].price;
                this.bids.splice(i,1);
                return price;
            }
        }
        return -1;
    }

    public cancelAsks(cancelAskOrder: Order): number{
        for(let i=0; i< this.asks.length; i++){
            if(cancelAskOrder === this.asks[i]){
                const price = this.asks[i].price;
                this.asks.splice(i, 1);
                return price;
            }
        }
        return -1;
    }
}
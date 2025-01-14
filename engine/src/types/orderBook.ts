let GLOBAL_TRADE_ID = 1;

export interface Order {
    price: number;
    quantity: number;
    orderId: string;
    filled: number;
    side: "buy" | "sell";
    userId: string;
}

const BASE_CURRENCY = "INR";

type container = {
    price: number,
    quantity: number,
}

interface Depth{
    asks: container[],
    bids: container[],
    lastUpdatedAt: number,
    timeStamp: string
}

export interface Fill {
    price: number;
    qty: number;
    tradeId: number;
    otherUserId: string;
    markerOrderId: string;
}

export class OrderBook{
    bids: Order[];
    asks: Order[];
    baseAsset: string;
    quoteAsset: string = BASE_CURRENCY || "INR";
    lastTradeId: number;
    currentPrice: number;

    constructor(bids: Order[], asks: Order[], baseAsset: string, quoteAsset: any, lastTradeId: number, currentPrice: number){
        this.bids = bids;
        this.asks = asks;
        this.baseAsset = baseAsset;
        this.lastTradeId = lastTradeId;
        this.currentPrice = currentPrice;
    }

    public ticker(){
        return `${this.baseAsset}_${this.quoteAsset}`
    }

    public getSnapshot() {
        return {
            baseAsset: this.baseAsset,
            bids: this.bids,
            asks: this.asks,
            lastTradeId: this.lastTradeId,
            currentPrice: this.currentPrice
        }
    }

    sortOrderBooks(){
        this.bids.sort((a, b) => b.price - a.price);
        this.asks.sort((a, b) => a.price - b.price);
    }

    public addOrder(order: Order): {
        executedQt: number,
        fills: Fill[]
    }{
        let fills: Fill[] = [];
        let executedQt = 0;
        if(order.side === "buy"){
            this.matchBids(order);
        }else{

        }
        return {
            executedQt: 0,
            fills: fills
        };
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

    public getDepths(): {}{
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
}
import { OrderBook } from "../types/orderBook";
import { UserBalance } from "../types/UserBalance";
import fs from "fs";
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

    public process(message: JSON){

    }
}
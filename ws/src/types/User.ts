import WebSocket from "ws";
import { SubscriptionManager } from "../Managers/SubscriptionManager";
import { IncomingMessage } from "./in";

export class User{
    private id: string;
    private ws: WebSocket;
    private subscription: string[] = [];
    constructor(id: string, ws: WebSocket){
        this.id = id;
        this.ws = ws;
    }

    public addListnerss(){
        this.ws.on("message", (message: string) => {
            const parsedMessage: IncomingMessage = JSON.parse(message);
            if(parsedMessage.method === "SUBSCRIBE"){
                this.addSubscription(parsedMessage.params[0]);
            }
            if(parsedMessage.method === "UNSUBSCRIBE"){
                this.removeSubscription(parsedMessage.params[0]);
            }
        });
    }

    public getWsConnectionIbject(){
        return this.ws;
    }

    addSubscription(market: string){
        this.subscription.push(market);
        SubscriptionManager.getInstance().subscribe(this.id, market);
    }

    removeSubscription(market: string){
        for(let i=0;i<this.subscription.length;i++){
            if(this.subscription[i] === market){
                this.subscription.splice(i, 1);
                SubscriptionManager.getInstance().unsubscribe(this.id, market);
                return;
            }
        }
    }

    emit(message: any){
        this.ws.emit(message);
    }
}
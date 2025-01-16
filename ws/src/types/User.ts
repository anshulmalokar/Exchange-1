import WebSocket from "ws";

export class User{
    private id: string;
    private ws: WebSocket;
    private subscription: string[] = [];
    constructor(id: string, ws: WebSocket){
        this.id = id;
        this.ws = ws;
    }

    private addListnerss(){
        this.ws.on("message", (message: string) => {
            const parsedMessage = JSON.parse(message);
            if(parsedMessage.method = "SUBSCRIBE"){

            }
            if(parsedMessage.method == "UNSUBSCRIBE"){
                
            }
        });
    }

    addSubscription(market: string){
        this.subscription.push(market);
    }

    removeSubscription(market: string){
        for(let i=0;i<this.subscription.length;i++){
            if(this.subscription[i] === market){
                this.subscription.splice(i, 1);
                return;
            }
        }
    }

    emit(message: any){
        this.ws.emit(message);
    }


}
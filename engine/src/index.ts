import { RedisManager } from "./Manager/RedisManager";
import { OrderBookManager } from "./Manager/OrderBookManager";
async function main(){ 
    const client = RedisManager.getInstance().getClient();
    console.log(`Process Started`)
    while(true){
        const message = await client.rPop("message");
        if(message === null || message === undefined){

        }else{
            console.log(`Incoming message : ${message}`);
            OrderBookManager.getInstance().process(JSON.parse(message));
        }
    }
}

main()
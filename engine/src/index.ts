import { RedisManager } from "./Manager/RedisManager";
import { OrderBookManager } from "./Manager/OrderBooManager";
async function main(){ 
    const client = RedisManager.getInstance().getClient();
    while(true){
        const message = await client.rPop("message");
        if(!message){

        }else{
            OrderBookManager.getInstance().process(JSON.parse(message));
        }
    }
}

main()
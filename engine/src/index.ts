import { RedisManager } from "./Manager/RedisManager";

async function main(){ 
    const client = RedisManager.getInstance().getClient();
    while(true){
        const message = await client.rPop("message");
        if(!message){

        }else{
            
        }
    }
}

main()
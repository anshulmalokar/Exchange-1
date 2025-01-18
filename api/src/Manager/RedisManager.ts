import { createClient, RedisClientType } from 'redis';
export class RedisManager{
    private static instance: RedisManager;
    private redisClient!: RedisClientType;
    private RedisManager(){
        this.redisClient = createClient({ url: 'redis://localhost:6379' });
        this.redisClient.connect();
    }

    public static getInstance(): RedisManager{
        if(this.instance === null){
            return new RedisManager();
        }
        return this.instance;
    }

    public sendAndawait(message: any){
        const id = generateRandomId(5);
        this.redisClient.lPush("message",JSON.stringify({id, message}));
        return new Promise((r) => {
            this.redisClient.subscribe(id+"", (message) => {
                r(message);
            });
        });
    }


}

function generateRandomId(length: number = 8): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
    }
    
    return result;
  }
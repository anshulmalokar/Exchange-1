import { createClient, RedisClientType } from 'redis';

export class RedisManager{
    private static instance: RedisManager;
    private redisClient!: RedisClientType;
    private RedisManager(){
        this.redisClient = createClient({ url: 'redis://localhost:6379' });
    }

    public getClient(): RedisClientType{
        return this.redisClient;
    }    

    public static getInstance(): RedisManager {
        if(!this.instance) return new RedisManager();
        return this.instance;
    }

    public addToQueue(key:any, elements: any){
        this.redisClient.lPush(key, elements);
    }
    
    public getFromQueue(key: string){
        return this.redisClient.get(key);
    }
}
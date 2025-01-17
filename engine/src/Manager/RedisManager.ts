import { createClient, RedisClientType } from 'redis';

export class RedisManager{
    private static instance: RedisManager;
    private redisClient!: RedisClientType;
    private RedisManager(){
        this.redisClient = createClient({ url: 'redis://localhost:6379' });
        this.redisClient.connect();
    }

    public getClient(): RedisClientType{
        return this.redisClient;
    }    

    public static getInstance(): RedisManager {
        if(!this.instance) return new RedisManager();
        return this.instance;
    }

    public sendToApi(clientId: string, message: any){
        this.redisClient.publish(clientId, JSON.stringify(message));
    }

    public addToQueue(key:any, elements: any){
        this.redisClient.lPush(key, elements);
    }
    
    public getFromQueue(key: string){
        return this.redisClient.get(key);
    }
}
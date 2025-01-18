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
    
    public async getFromQueue(key: string){
        const message = await this.redisClient.get(key);
        if(message){
            return JSON.parse(message);
        }
    }
}
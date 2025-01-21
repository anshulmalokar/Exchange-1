import { createClient, RedisClientType } from 'redis';
import { MessageFromEngine } from '../types';
export class RedisManager{
    private static instance: RedisManager;
    private pushClient!: RedisClientType;
    private subscribeClient!: RedisClientType;
    private constructor(){
        this.pushClient = createClient({ url: 'redis://localhost:6379' });
        this.subscribeClient = createClient({ url: 'redis://localhost:6379' });
        this.pushClient.connect();
        this.subscribeClient.connect();
    }

    public static getInstance(): RedisManager {
        if(this.instance === undefined){
            return this.instance = new RedisManager();
        }
        return this.instance;
    }

    public async sendAndawait(message: any, id: string): Promise<String>{
        this.pushClient.lPush("message",JSON.stringify({id, message}));
        return new Promise((r) => {
            this.subscribeClient.subscribe(id, (message) => {
                r(message);
            });
        });
    }
}
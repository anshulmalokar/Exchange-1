export class RedisManager{
    private static instance: RedisManager;
    private RedisManager(){

    }

    public static getInstance(): RedisManager{
        if(this.instance === null){
            return new RedisManager();
        }
        return this.instance;
    }
}
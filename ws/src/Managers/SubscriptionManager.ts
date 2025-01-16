export class SubscriptionManager{
    private static instance: SubscriptionManager;
    private subscriptions: Map<string,string[]> = new Map();
    private constructor(){}
    public static getInstance(): SubscriptionManager{
        if(!SubscriptionManager.instance){
            SubscriptionManager.instance = new SubscriptionManager();
            return SubscriptionManager.instance;
        }
        return SubscriptionManager.instance;
    }   
}
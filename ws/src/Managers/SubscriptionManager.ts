import { createClient, RedisClientType } from "redis";
import { UserManager } from "./UserManger";

export class SubscriptionManager {
  private static instance: SubscriptionManager;
  private subscriber!: RedisClientType;
  private publisher!: RedisClientType;
  private subscriptionsArr: Map<String, string[]> = new Map();
  private reversesubscriptions: Map<String, string[]> = new Map();
  private constructor() {
    this.publisher = createClient({ url: "redis://localhost:6379" });
    this.subscriber = createClient({ url: "redis://localhost:6379" });
    this.publisher.connect();
    this.subscriber.connect();
  }
  public static getInstance() {
    if (this.instance === undefined) {
      return this.instance = new this();
    }
    return this.instance;
  }

  public subscribe(userId: string, subscription: string) {
    const arr: string[] | undefined = this.subscriptionsArr.get(userId);
    if (arr?.includes(subscription)) return;
    arr?.push(subscription);
    this.subscriptionsArr.set(userId, arr ?? []);
    if (this.reversesubscriptions.get(subscription) === undefined) {
      const toAdd: string[] = [userId];
      this.reversesubscriptions.set(subscription, toAdd);
      this.subscriber.subscribe(subscription, (message) => {
        const parsedMessage = JSON.parse(message);
        this.reversesubscriptions.get(subscription)?.forEach(u => UserManager.getInstance()
                                                .getUser(u)?.emit(message));
      });
    } else {
      this.reversesubscriptions.get(subscription)?.concat([userId]);
    }
  }

  public unsubscribe(userId: string, subscription: string){
    const index = this.subscriptionsArr.get(userId)?.findIndex(val => val === subscription); 
    if(index === -1 || index === undefined) return;
    this.subscriptionsArr.get(userId)?.splice(index, 1);
    const index1 = this.reversesubscriptions.get(subscription)?.findIndex(val => val === userId);
    if(index1 === -1 || index1 === undefined) return;
    this.reversesubscriptions.get(userId)?.splice(index1, 1);
    if(this.reversesubscriptions.get(subscription)?.length === 0){
        this.subscriber.unsubscribe(subscription,() => {});
        this.reversesubscriptions.delete(subscription);
    }
  }

  public userLeft(userId: string){
    this.subscriptionsArr.get(userId)?.forEach(sub => this.unsubscribe(userId, sub));
    this.reversesubscriptions.forEach((sub, key) => {
      let index = sub.indexOf(userId); 
      sub.splice(index, 1);
      if(sub.length == 0) this.reversesubscriptions.delete(key);
    })
  }
 
  public getSubscriptions(userId: string){
    return this.subscriptionsArr.get(userId) || [];
  }

}
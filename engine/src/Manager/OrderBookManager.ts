import { OrderBook } from "../types/orderBook";
import {
  CANCEL_ORDER,
  CREATE_ORDER,
  GET_DEPTH,
  GET_OPEN_ORDERS,
  MessageFromApi,
  ON_RAMP,
} from "../types/pub-sub/fromApi";
import { UserBalance } from "../types/UserBalance";
import fs from "fs";
import { RedisManager } from "./RedisManager";
import { Order } from "../types/order";
import { Fill } from "../types/Fills";
import { Depth } from "../types/depth";
import { generateRandomId } from "../utils";

type incoming = {
  id: string;
  message: {
    type: string;
    data: any;
  };
};

export class OrderBookManager {
  private static instance: OrderBookManager;
  private orderBooks: OrderBook[] = [];
  private balanceBooks: Map<String, UserBalance> = new Map();
  private constructor() {
    let snapshot = null;
    try {
      if (process.env.WITH_SNAPSHOT) {
        snapshot = fs.readFileSync("./snapshot.json");
      }
    } catch (e) {
      console.log("No snapshot founded");
    }

    if (snapshot) {
      const snapShotData = JSON.parse(snapshot.toString());
      this.orderBooks = snapShotData.orderBooks.map(
        (o: any) =>
          new OrderBook(
            o.bids,
            o.asks,
            o.baseAsset,
            o.lastTradeId,
            o.currentPrice
          )
      );
      this.balanceBooks = new Map(snapShotData.balances);
    } else {
      this.orderBooks.push(new OrderBook([], [], "TATA", 0, 10));
      this.fillUpBalanceBook();
    }

    setInterval(() => {
      this.saveSnapShot();
    }, 10 * 1000);
  }

  private fillUpBalanceBook() {
    for (let i = 1; i <= 10; i++) {
      this.balanceBooks.set(i + "", {
        INR: {
          balance: 100,
          locked: 0,
        },
        TATA: {
          balance: 100,
          locked: 0,
        }
      });
    }
  }

  private formatBalances() {
    type balanceArr = {
      userid: String;
      obj: {
        asset: string;
        balance: number;
        locked: number;
      };
    };
    const balanceArray: balanceArr[] = [];
    this.balanceBooks.forEach((e: UserBalance, key) => {
      const objecttoBePushed = {
        userid: key,
        obj: {
          asset: "INR",
          balance: e["INR"].balance,
          locked: e["INR"].locked,
        },
      };
      balanceArray.push(objecttoBePushed);
    });
    return balanceArray;
  }

  private saveSnapShot() {
    const saveSnapShotData: {
      orderbooks: {
        baseAsset: string;
        bids: Order[];
        asks: Order[];
        lastTradeId: number;
        currentPrice: number;
      }[];
      balances: any;
    } = {
      orderbooks: this.orderBooks.map((o) => o.getSnapshot()),
      balances: this.formatBalances(),
    };
    // console.log(saveSnapShotData.orderbooks);
    console.log(this.balanceBooks.get(1 + ""));
    // console.log(saveSnapShotData);
    // fs.writeFileSync("./snapshot.json", JSON.stringify(saveSnapShotData));
  }

  public static getInstance() {
    if (this.instance === undefined) {
      return (this.instance = new this());
    }
    return this.instance;
  }

  public process(message: incoming) {
    const clientId = message.id;
    const type = message.message.type;
    const { market } = message.message.data;
    const arr = market.split("_");
    const baseAsset = arr[0];
    const quoteAsset = arr[1];
    switch (type) {
      case CREATE_ORDER:
        try {
          // @ts-ignore
          const { userId, price, quantity, side } = message.message.data;
          const check: Boolean = this.checkUserCanTransact(
            userId,
            Number(price),
            Number(quantity),
            quoteAsset,
            side,
            baseAsset
          );
          if (!check) {
            throw new Error(`The user with id ${userId} does not have necessary funds
                        to complete the order`);
          }
          const orderBook: OrderBook | undefined = this.orderBooks.find(
            (o) => o.baseAsset === baseAsset && o.quoteAsset === quoteAsset
          );
          if (orderBook === undefined) {
            throw new Error(`Order book for ${baseAsset} does not exist`);
          }
          const orderId = generateRandomId(5);
          const order: Order = {
            price: price,
            filled: 0,
            orderId: orderId,
            userId: userId,
            quantity: quantity,
            side: side,
          };
          const response:
            | {
                executedQt: number;
                fills: Fill[];
              }
            | undefined = orderBook?.addOrder(order);
          this.updateUserBalance(
            userId,
            side,
            baseAsset,
            quoteAsset,
            response?.fills
          );
          if (response !== undefined) {
            RedisManager.getInstance().sendToApi(clientId, {
              type: CREATE_ORDER,
              data: { orderId: orderId, response },
            });
          } else {
            throw new Error("process: CREATR_ORDER: Internal Server Error");
          }
        } catch (e) {
          const errorMessage =
            e instanceof Error ? e.message : "Unknown error occurred";
          RedisManager.getInstance().sendToApi(clientId, {
            type: "",
            message: errorMessage,
          });
        }
        break;
      case CANCEL_ORDER:
        try {
          const { orderId } = message.message.data;
          this.orderBooks.forEach((orderBook) => {
            const bids = orderBook.bids;
            const asks = orderBook.asks;
            let orderIndex = bids.findIndex((o) => o.orderId === orderId);
            let flag: Boolean = false;
            if (orderIndex != -1) {
              const price = bids[orderIndex].price;
              const quantity = bids[orderIndex].quantity;
              const userId = bids[orderIndex].userId;
              const total_amt = price * quantity;
              const userBalance = this.balanceBooks.get(userId);
              if (userBalance !== undefined) {
                flag = true;
                userBalance[quoteAsset].locked += total_amt;
              }
              bids.splice(orderIndex, 1);
            }
            orderIndex = asks.findIndex((o) => o.orderId === orderId);
            if (orderIndex != -1) {
              const price = bids[orderIndex].price;
              const quantity = bids[orderIndex].quantity;
              const userId = bids[orderIndex].userId;
              const total_amt = price * quantity;
              const userBalance = this.balanceBooks.get(userId);
              if (userBalance !== undefined) {
                flag = true;
                userBalance[baseAsset].locked += total_amt;
              }
              asks.splice(orderIndex, 1);
            }
            if (flag) {
              RedisManager.getInstance().sendToApi(clientId, {
                type: CANCEL_ORDER,
                message: {
                  orderId,
                  operation: "success",
                },
              });
            } else {
              throw new Error();
            }
          });
        } catch (e) {
          RedisManager.getInstance().sendToApi(clientId, {
            type: CANCEL_ORDER,
            message: "",
          });
        }
        break;
      case ON_RAMP:
        break;
      case GET_DEPTH:
        try {
          const depthOrderBook: OrderBook | undefined = this.orderBooks.find(
            (o) => o.baseAsset === baseAsset && o.quoteAsset === quoteAsset
          );
          if (depthOrderBook !== undefined) {
            const getDepthResponse: Depth = depthOrderBook.getDepths();
            RedisManager.getInstance().sendToApi(clientId, {
              message: getDepthResponse,
            });
          } else {
            throw new Error();
          }
        } catch (e) {
          RedisManager.getInstance().sendToApi(clientId, {
            type: GET_DEPTH,
            message: "",
          });
        }
        break;
      case GET_OPEN_ORDERS:
        // @ts-ignore
        try {
          const { userId } = message.message.data;

          const oBookForOpenOrder: OrderBook | undefined = this.orderBooks.find(
            (o) => o.baseAsset === baseAsset && o.quoteAsset === quoteAsset
          );
          const b = oBookForOpenOrder?.bids;
          console.log(b?.length);
          const openOrderResponse = oBookForOpenOrder?.getOpenOrders(userId);
          RedisManager.getInstance().sendToApi(clientId, {
            message: openOrderResponse,
          });
        } catch (e) {
          RedisManager.getInstance().sendToApi(clientId, {
            type: GET_OPEN_ORDERS,
            message: "",
          });
        }
        break;
    }
  }

  private updateUserBalance(
    userId: any,
    side: any,
    baseAsset: any,
    quoteAsset: any,
    fills: Fill[] | undefined
  ) {
    const userBalance = this.balanceBooks.get(userId);
    if (userBalance === undefined) {
      console.log("updateUserBalance: No valid UserBalance found");
      return;
    }
    let spentAssetQuantity = 0;
    fills?.forEach((fill) => (spentAssetQuantity += fill.qty * fill.price));
    if (side === "buy") {
      userBalance[quoteAsset].balance -= spentAssetQuantity;
      userBalance[quoteAsset].locked -= spentAssetQuantity;
    }
    if (side === "sell") {
      userBalance[baseAsset].balance -= spentAssetQuantity;
      userBalance[baseAsset].locked -= spentAssetQuantity;
    }
    this.balanceBooks.set(userId, userBalance);
  }

  private checkUserCanTransact(
    userId: string,
    price: Number,
    quantity: Number,
    quoteAsset: string,
    side: "buy" | "sell",
    baseAsset: string
  ): Boolean {
    try {
      const userBalance: UserBalance | undefined =
        this.balanceBooks.get(userId);
      if (userBalance === undefined) return false;
      const total_cost = Number(quantity) * Number(price);
      if (side === "buy") {
        if (
          userBalance[quoteAsset] !== null &&
          userBalance[quoteAsset] !== undefined
        ) {
          const availableBalance =
            userBalance[quoteAsset].balance - userBalance[quoteAsset].locked;
          if (total_cost > availableBalance) {
            console.log("checkUserCanTransact: Insufficient Funds");
            return false;
          }
          userBalance[quoteAsset].locked += total_cost;
          return true;
        }
      } else {
        if (
          userBalance[baseAsset] !== null &&
          userBalance[baseAsset] !== undefined
        ) {
          const availableBalance =
            userBalance[baseAsset].balance - userBalance[baseAsset].locked;
          if (total_cost > availableBalance) {
            console.log("checkUserCanTransact: Insufficient Funds");
            return false;
          }
        }
        userBalance[baseAsset].locked += total_cost;
        return true;
      }
      return false;
    } catch (e) {
      console.log(e);
      throw new Error("checkUserCanTransact: error");
    }
  }
}

// Things to do 
// When the order gets matched then I need to re-update the balance of the user whose data is matched.
// In the UserManager
// Also this is not being reflected on the dephts api so
// issue on the orderbook
// Need to solve this two bugs
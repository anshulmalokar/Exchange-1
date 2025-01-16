export interface Depth{
    asks: container[],
    bids: container[],
    lastUpdatedAt: number,
    timeStamp: string
}
export type container = {
    price: number,
    quantity: number,
}
export interface UserBalance{
    [key: string]: {
        balance: number,
        locked: number
    }
}
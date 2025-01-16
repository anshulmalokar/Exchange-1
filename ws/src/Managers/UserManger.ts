import { User } from "../types/User";
import { generateRandomId } from "../utils/Idgenerator";
import WebSocket from "ws";

export class UserManager{
    private static instance: UserManager;
    private usersmap: Map<String, User> = new Map();
    private constructor(){

    }
    static getInstance(){
        if(!UserManager.instance){
            return UserManager.instance = new UserManager();
        }
        return UserManager.instance;
    }

    public addUser(ws: WebSocket){
        const id = generateRandomId(5);
        const user = new User(id, ws);
        this.usersmap.set(id, user);
        return user;
    }

    public getUser(id: String){
        return this.usersmap.get(id);
    }
}
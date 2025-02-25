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
            return this.instance = new this();
        }
        return this.instance;
    }

    public addUser(ws: WebSocket){
        const id = generateRandomId(5);
        const user = new User(id, ws);
        user.addListnerss()
        this.usersmap.set(id, user);
        this.addCloseListner(user, id);
    }

    
    private addCloseListner(user: User, userId: string){
        user.getWsConnectionIbject().on('close', () => {this.usersmap.delete(userId);});
    }

    public getUser(id: String){
        return this.usersmap.get(id);
    }
}
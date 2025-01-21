import { Router } from "express";

const onRampRoute = Router();

onRampRoute.post("/", (req, res) => {
    try{
        
    }catch(e){
        res.status(500).json({
            message: "Internal Server Error"
        })
    }
});

export default onRampRoute;
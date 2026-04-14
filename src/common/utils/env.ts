class Env {
    ACCESS_TOKEN = process.env.ACCESS_TOKEN;
    REFRESH_TOKEN = process.env.REFRESH_TOKEN;
    EXPIRETIME = process.env.EXPIRETIME;
    PORT = process.env.PORT;
    DATABASE_URL = process.env.DATABASE_URL;

    constructor(){
        if(!this.ACCESS_TOKEN){
            throw new Error("ACCESS_TOKEN is not defined");
        }
        if(!this.REFRESH_TOKEN){
            throw new Error("REFRESH_TOKEN is not defined");
        }
        if(!this.EXPIRETIME){
            throw new Error("EXPIRETIME is not defined");
        }
        if(!this.PORT){
            throw new Error("PORT is not defined");
        }
        if(!this.DATABASE_URL){
            throw new Error("DATABASE_URL is not defined");
        }
    }
}

export default new Env();
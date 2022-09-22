import {  Emitter } from "./emitter";
import { WebsocketResponse, Msg, userInfo, InitConfig } from "./types";
import {IMCommand, IMEvents} from "./constants"
import { createWorker, stopWorker, uuid } from "./utils";

export default class WEIMSDK extends Emitter{

    private ws:WebSocket | undefined;
    private wsUrl: string = "";
    private lastTime: number = 0;
    private heartbeatCount: number = 0;
    private heartbeatStartTime: number = 0;
    private logoutFlag: boolean = false;
    private lock: boolean = false;
    private domain:string= "";
    private mid:Number= 0;
    private platform:string= "wx";
    private onceFlag:boolean = true;
    private timer:NodeJS.Timer | undefined = undefined;
    private worker:Worker | null = null;
    private userInfo:userInfo;
    constructor(cfg:InitConfig){
        super();
        this.wsUrl = cfg.wsUrl;
        this.domain = cfg.domain;
        this.mid = cfg.mid;
        this.platform = cfg.platform;
        this.userInfo = cfg.userInfo;
    }
    connect(){
        return new Promise<WebsocketResponse>((resolve,reject) =>{
            const onOpen = () =>{
                this.iLogin(this.userInfo).then((res)=>{
                    this.logoutFlag = false;
                    this.heartbeat();
                    resolve(res);
                })
                .catch((err) =>{
                    reject(err)
                })
            }
            const onClose = () => {
                if(!this.logoutFlag){
                    // Object.values()
                }
                reject({errCode:111,errMsg:'ws connect close ...'})
            }
            
            const onError = (err:Error | Event) => {
                reject({errCode:112,errMsg:'ws connect error...'})
            }
            if(this.platform === 'web'){
                this.ws = new WebSocket(this.wsUrl);
                this.ws.onclose = onClose;
                this.ws.onopen = onOpen;
                this.ws.onerror = onError;
                return;
            }
            //@ts-ignore
            const platformNamespace = this.platform === "uni" ? uni : wx;
            this.ws = platformNamespace.connectSocket({
                url: this.wsUrl,
                complete: () => {},
              });
              //@ts-ignore
              this.ws.onClose(onClose);
              //@ts-ignore
              this.ws.onOpen(onOpen);
              //@ts-ignore
              this.ws.onError(onError);
        
            if(!this.ws){
                reject({errCode:112,errMsg:'The current platform is not supported'})
            }
        });
    }
    private heartbeat(){
        console.log('start heartbeat ...')
        this.clearTimer();
        const callback = () =>{
            if(this.logoutFlag){
                if(this.worker){
                    stopWorker(this.worker);
                }
            }
        }
        if(this.ws?.readyState !== this.ws?.CONNECTING && this.ws?.readyState!==this.ws?.OPEN){
            this.reconnect();
            return;
        }
        const now = new Date().getTime();
        if(now - this.lastTime < 9000){
            return;
        }
        this.getLoginStatus().catch((err)=>this.reconnect());
        if(this.worker){
            stopWorker(this.worker);
        }
        try{
            this.worker = createWorker(callback,10000);
        }catch(error){

        }
    }
    private clearTimer(){
        if(this.timer){
            clearTimeout(this.timer);
        }
    }
    private createMsg(cmd:IMCommand,data:any,fromId:Number,toId:Number){
        return {
            cmd:cmd,
            domain:this.domain,
            mid:this.mid,
            fromId:fromId,
            toId:toId,
            data:data
        }
    }

    logout(uid:Number){
        return new Promise<WebsocketResponse>((resolve,reject) => {
            const _uuid = uuid()
            const msg = this.createMsg(IMCommand.LOGOUT,"",uid,0);
            this.wsSend(msg,resolve,reject);
        })
    }
    getLoginStatus = () => {
        return new Promise<WebsocketResponse>((resolve, reject) => {
        const _uuid =uuid();
        const msg = this.createMsg(
            IMCommand.GETLOGINSTATUS,
            this.userInfo,
            this.userInfo.id,
            0
        );
        this.wsSend(msg, resolve, reject);
        });
    };
    private iLogin(data:userInfo){
        return new Promise<WebsocketResponse>((resolve,reject)=>{
            this.ws?.close();
            this.ws = undefined;
            this.wsSend(
                this.createMsg(IMCommand.LOGIN,data,data.id,0),
                resolve,reject)
        })
    }

    private reconnect(){
        if(!this.onceFlag) this.onceFlag = true;
        if(this.lock) return;
        this.lock = true;
        this.clearTimer();
        this.timer = setTimeout(() => {
            this.connect();
            this.lock = false;
        },500)
    }
    private wsSend = (
        msg:Msg,
        resolve:(value:WebsocketResponse | PromiseLike<WebsocketResponse>)=>void,
        reject:(err?:any)=>void
        )=>{
            if(this.ws?.readyState !== this.ws?.OPEN){
                reject({errCode:112,errMsg:'ws conecting'})
                return;
            }
            if(typeof msg.data === "object"){
                msg.data = JSON.stringify(msg.data)
            }
            const handleMessage = (ev:MessageEvent<string>)=>{
                this.lastTime = new Date().getTime();
                const data = JSON.parse(ev.data)
                if( (IMEvents as Record<string,string>)[data.event.toUpperCase()] ){
                    this.emit(data.event,data);
                    return;
                }

                if(msg.cmd === IMCommand.LOGOUT){
                    //退出指令
                    this.ws!.close();
                    this.ws = undefined;
                    this.onceFlag = true;
                }
                // const callbackJob = this.ws2promise()
            }
            try{
                if(this.platform=='web'){
                    this.ws!.send(JSON.stringify(msg))
                    this.ws!.onmessage = handleMessage;
                }else{
                    this.ws!.send({
                        //@ts-ignore
                        data:JSON.stringify(msg),
                        success:(res:any) =>{
                            if(
                                this.platform==='uni' &&
                                //@ts-ignore
                                this.ws!._callbacks !== undefined &&
                                //@ts-ignore
                                this.ws!._callbacks.message !== undefined
                            ){
                                //@ts-ignore
                                this.ws!._callbacks.message = [];
                            }
                        }
                    });

                    if(this.onceFlag){
                        //@ts-ignore
                        this.ws!.onMessage(handleMessage);
                        this.onceFlag=false;
                    }

                }
            } catch(error){
                reject({errCode:112,errMsg:"no ws connect..."})
                return;
            }
            if (msg.cmd === IMCommand.LOGOUT) {
                this.onceFlag = true;
            }
        }
}
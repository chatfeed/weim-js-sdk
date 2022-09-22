import { Emitter } from "./emitter";
import { WebsocketResponse, InitConfig } from "./types";
export default class WEIMSDK extends Emitter {
    private ws;
    private wsUrl;
    private lastTime;
    private heartbeatCount;
    private heartbeatStartTime;
    private logoutFlag;
    private lock;
    private domain;
    private mid;
    private platform;
    private onceFlag;
    private timer;
    private worker;
    private userInfo;
    constructor(cfg: InitConfig);
    connect(): Promise<WebsocketResponse>;
    private heartbeat;
    private clearTimer;
    private createMsg;
    logout(uid: Number): Promise<WebsocketResponse>;
    getLoginStatus: () => Promise<WebsocketResponse>;
    private iLogin;
    private reconnect;
    private wsSend;
}

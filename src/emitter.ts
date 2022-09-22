import { IMEvents } from './constants';
import {WebsocketResponse} from './types'
interface Events {
    [key:string]:CallbackFunction[]
}
type CallbackFunction = (data:WebsocketResponse)=>void
class Emitter {

    private events:Events;
    constructor(){
        this.events = {};
    }
    emit(event:IMEvents,data:WebsocketResponse){
        if(this.events[event]){
            this.events[event].forEach((fn)=>fn(data));
        }
    }
    on(event:IMEvents,fn:CallbackFunction){
        if(this.events[event]){
            this.events[event].push(fn)
        }else{
            this.events[event] = [fn];
        }
        return this;
    }
    off(event:IMEvents,fn:CallbackFunction){
        if(event && typeof fn === 'function'){
            const listeners = this.events[event];
            const index = listeners.findIndex((_fn)=>_fn===fn);
            listeners.splice(index,1);
        }else{
            this.events[event] = [];
        }
    }
}
export{
    Emitter
}
import { IMEvents } from './constants';
import { WebsocketResponse } from './types';
declare type CallbackFunction = (data: WebsocketResponse) => void;
declare class Emitter {
    private events;
    constructor();
    emit(event: IMEvents, data: WebsocketResponse): void;
    on(event: IMEvents, fn: CallbackFunction): this;
    off(event: IMEvents, fn: CallbackFunction): void;
}
export { Emitter };

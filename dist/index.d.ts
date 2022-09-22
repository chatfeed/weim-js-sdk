import {IMCommand} from '../constants'

export type WebsocketResponse = {
  event: IMCommand;
  errCode: number;
  errMsg: string;
  data: any;
  operationID: string;
};
export type Msg = {
  cmd:IMCommand,
  domain:string,
  mid:Number,
  fromId:Number,
  toId:Number,
  data:any
}
export type userInfo = {
  id:Number,
  nickname:string,
  avatar:string,
  token:string,
  userType:Number
}

export type InitConfig ={
  wsUrl:string,
  domain:string,
  mid:Number,
  platform:string,
  userInfo:userInfo
}
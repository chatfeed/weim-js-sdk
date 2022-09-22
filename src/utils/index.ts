const uuid = ():string => {
    return (Math.random()*36).toString(36).slice(2)+new Date().getTime().toString();
}
export * from './worker'
export {
    uuid
}
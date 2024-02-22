import { DataConnection, MediaConnection } from "peerjs";

export type client = {
    dataConn: DataConnection,
    mediaConn: MediaConnection | undefined
}

export function connMapUpdater(state: Map<string, client>, action: {type: string, dataConn?: DataConnection, mediaConn?: MediaConnection}){
    if (action.dataConn === undefined && action.mediaConn === undefined) return state;

    const newConnMap = new Map(state);
    const connID = action.dataConn?.peer ?? action.mediaConn?.peer ?? ""
    if (action.type === "ADD"){
        if (action.dataConn){
            if (newConnMap.has(connID)){
                // close the previous connection if it exists
                newConnMap.get(connID)!.dataConn?.close();
                newConnMap.get(connID)!.dataConn = action.dataConn;
            } else {
                // create a new entry
                newConnMap.set(connID, {dataConn: action.dataConn, mediaConn: undefined});
            }
        } else {
            if (newConnMap.has(connID)){
                // close the previous connection if it exists
                newConnMap.get(connID)!.mediaConn?.close();
                newConnMap.get(connID)!.mediaConn = action.mediaConn;
                // if (!action.mediaConn?.open) action.mediaConn?.answer()
            } else {
                // reject the call if there is no data stream
                console.log("call rejected due to mising data Conn")
                action.mediaConn?.close()
            }
        }
    } else if (action.type === "REMOVE"){
        if (action.dataConn){
            newConnMap.get(connID)?.dataConn?.close();
            // newConnMap.get(connID)?.mediaConn?.close();
            newConnMap.delete(connID)
        } else {
            newConnMap.get(connID)?.dataConn.send("Media Connection Closed by remove action")
            newConnMap.get(connID)?.mediaConn?.close();
            if (newConnMap.has(connID))
                if (action.mediaConn === newConnMap.get(connID)?.mediaConn)
                    newConnMap.get(connID)!.mediaConn = undefined
        }
    }
    console.log(newConnMap)
    return newConnMap;
}
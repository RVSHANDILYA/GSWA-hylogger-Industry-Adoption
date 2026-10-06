import { useSyncExternalStore } from "react";
import { getDataSource, getInitialDataSource, subscribeDataSource } from "../api/client.js";
export default function useDataSource() {
 return useSyncExternalStore(subscribeDataSource,getDataSource,getInitialDataSource);
}

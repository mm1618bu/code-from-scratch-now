
export interface LiveDataItem {
  id?: string;
  _id?: string;
  machineId: string;
  state: string;
  created_at: string;
  CT1: number;
  CT2: number;
  CT3: number;
  CT_Avg: number;
  total_current: number;
  state_duration: number;
  fault_status: string;
  fw_version: number;
  mac: string;
  hi?: string;
  [key: string]: any;
}

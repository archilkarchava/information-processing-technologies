export default interface RawJsonBranchData {
  P: Array<{
    PID: string | number;
    PName: string;
    PCity: string;
    Color: string;
    Weight: string;
  }>;
  S: Array<{
    SID: string | number;
    SName: string;
    SCity: string;
    Address: string;
    Risk: string | number;
  }>;
  SP: Array<{
    SPID: string | number;
    PID: string | number;
    SID: string | number;
    Quantity: string | number;
    Price: string;
    ShipDate: string;
  }>;
}

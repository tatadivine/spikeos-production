export type AccountType = "employee" | "administrator";
export interface DemoIdentity { key:string; accountType:AccountType; employeeId:string|null; displayName:string; title:string; }
export const ACCOUNT_TYPE_LABELS:Record<AccountType,string>={employee:"Employee",administrator:"Administrator"};

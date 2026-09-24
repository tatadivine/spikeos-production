import * as gen from "../mock/generator";
export const employeeService={list:()=>gen.employees,get:gen.getEmployee,directReports:gen.directReports,byDepartment:gen.departmentEmployees};
export const communicationService={forOwner:gen.communicationsForOwner,get:gen.getCommunication,all:()=>gen.communications};
export const commitmentService={forOwner:gen.commitmentsForOwner,all:()=>gen.commitments};
export const alertService={forOwner:gen.alertsForOwner,all:()=>gen.alerts};
export const customerService={list:()=>gen.customers,get:(id:string)=>gen.customers.find(c=>c.id===id)};
export const coachingService={forEmployee:(id:string)=>gen.insights.filter(i=>i.employeeId===id)};
export const reviewService={all:()=>gen.reviews};
export const evidenceService={all:()=>gen.evidenceEntries};
export const auditService={all:()=>gen.auditLog};
export let ALEX_ID=gen.ALEX_ID;
export let HERO_MANAGER_ID=gen.HERO_MANAGER_ID;


export function setLiveIds(userId:string, managerId:string|null){ ALEX_ID=userId; if(managerId){ HERO_MANAGER_ID=managerId; } }
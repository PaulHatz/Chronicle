import { Request, Response } from "express";
import * as employeeService from "../services/employees.service";


export async function getemployeelist(req: Request, res: Response) {
   
    try {
        const result = await employeeService.getEmployeeList();

        if(!result) {
            return res.status(401).json({
                message: result
            });
        }

        return res.status(200).json({
            employeeList: result
        });
    }
    catch (err) {

        console.error(err);

        return res.status(500).json({
            message: "Internal server error."
        });
    }  
}

export async function getemployee(req: Request, res: Response) {
    try {
        const result = await employeeService.getEmployeeForId(Number(req.params.employeeId));

        if(!result) {
            return res.status(401).json({
                message: result
            });
        }

        return res.status(200).json({
            employee: result
        });


    } catch(err) {
        return res.status(500).json({
            message: "Internal server error."
        });
    }
}

export async function addemployee(req: Request, res: Response) {
    try {
        console.log(req.body);
        const result = await employeeService.createEmployee(req.body);

        if(!result) {
            return res.status(401).json({
                message: result
            });
        }

        return res.status(200).json({
            employee: result
        });


    } catch(err) {
        console.log(err);
        return res.status(500).json({
            message: "Internal server error."
        });
    }
}
export async function updateEmployee(req: Request, res: Response) {
    try {
        const employee = await employeeService.updateEmployee(Number(req.params.employeeId),req.body);
        if (!employee) return res.status(404).json({message:"Employee not found."});
        return res.json({employee});
    } catch (err) {
        if (err instanceof Error && /^(Invalid|Provide|Department not found)/.test(err.message)) return res.status(400).json({message:err.message});
        if ((err as {code?:string})?.code === "P2002") return res.status(409).json({message:"This email is already in use."});
        console.error(err);
        return res.status(500).json({message:"Unable to update employee."});
    }
}

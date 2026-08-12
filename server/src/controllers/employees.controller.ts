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
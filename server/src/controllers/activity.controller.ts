import { Request, Response } from "express";
import * as activityService from "../services/activity.service";


export async function getemployeenotes(req: Request, res: Response) {
    try {
        const result = await activityService.getManagerNotesForEmployeeId(Number(req.params.employeeId));

        if(!result) {
            return res.status(401).json({
                message: result
            });
        }

        return res.status(200).json({
            notes: result
        });


    } catch(err) {
        console.log(err);
        return res.status(500).json({
            message: "Internal server error."
        });
    }
}

export async function getemployeewriteups(req: Request, res: Response) {
    try {
        const result = await activityService.getWriteUpsForEmployeeId(Number(req.params.employeeId));

        if(!result) {
            return res.status(401).json({
                message: result
            });
        }

        return res.status(200).json({
            notes: result
        });


    } catch(err) {
        console.log(err);
        return res.status(500).json({
            message: "Internal server error."
        });
    }
}
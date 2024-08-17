import { Request, Response } from "express";
import prisma from "../database/prisma";

//create Department
export async function createDepartment(req: Request, res: Response) {
    try{
        const { name } = req.body;
        const department = await prisma.department.create({
            data: {
                name
            }
        });
        res.status(201).send(department);
    }
    catch(err){
        console.log(err);
        res.status(500).send(err);
        
    }
}


//create  program
export async function createDepartmentProgram(req: Request, res: Response) {
    try{
        const { name , programCode , description , departmentId } = req.body;
        const departmentProgram = await prisma.program.create({
            data: {
                name , 
                programCode , 
                description ,
                departmentId
            }
        });
        res.status(201).send(departmentProgram);
    }
    catch(err){
        console.log(err);
        res.status(500).send(err);
    }
}


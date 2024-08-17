import prisma from "./database/prisma";

async function main() {
    await prisma.$connect();
    await prisma.department.createMany({
        data: [
            { name: "Computer Science" },
            { name: "Information Technology" },
            { name: "Electrical" },
            { name: "Mechanical" },
            { name: "Civil" }
        ]
    })

    await prisma.program.createMany({
        data: [
            {name : "Object Oriented Programming" , programCode : "CSE-101" , description : "Learn Object Oriented Programming" , departmentId : 1},
        ]
    })


    await prisma.instructor.createMany({
        data: [
            {name : "Instructor 1" , email : "Instructor 1" , departmentId : 1},
        ]
    })


    await prisma.student.createMany({
        data: [
            {name : "Student 1" , email : "Student 1" , departmentId : 1 , enrollmentNumber : "101"},
        ]
    })


    await prisma.labSession.createMany({
        data: [
            {programId : 1 , instructorId : 1 , sessionDate : new Date() , description : "Session 1" , },
        ]
    })


    await prisma.question.createMany({
        data: [
            {description : "exho + 1" , inputsOutputs : "[{\"input\" : \"1\" , \"output\" : \"2\"}]" , labSessionId : 1},
        ]
    })
}

main()
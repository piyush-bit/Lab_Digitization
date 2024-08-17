// middle ware to check if request is valid
export const checkReq = (req: any, res: any, next: any) => {
    const {studentId, questionId } = req.body ;

    if (!studentId || !questionId) {
        return res.status(400).send({ error: 'Invalid request' });
    }

    
    next();
}
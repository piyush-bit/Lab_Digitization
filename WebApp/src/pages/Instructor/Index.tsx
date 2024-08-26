import axios from "axios"
import { useState } from "react"
import { BACKEND_URL } from "../../envVariables"
import CodeInput from "./CodeInput"
import InstructorDetail from "./InstructorDetail"

function Index() {
    
    const [instructorCode, setInstructorCode] = useState<Number>(-1)
    const [instructorDetail , setInstructorDetail] = useState<any>()
    const onSubmitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const code = Number(formData.get("instructorCode"))
        const result = await axios.get(`${BACKEND_URL}/api/ins/details?instructorId=${code}`)
        setInstructorDetail(result.data);
        setInstructorCode(code)
        
    }

  return (
    <div className="w-screen h-screen flex justify-center items-center">
        {
            instructorCode === -1 ? <CodeInput onSubmitHandler={onSubmitHandler} /> : <InstructorDetail detail={instructorDetail} />
        }
    </div>
  )
}



export default Index
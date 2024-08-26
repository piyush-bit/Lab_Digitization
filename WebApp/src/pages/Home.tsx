import { useNavigate } from "react-router-dom"

function Home() : JSX.Element {

    const navigate = useNavigate()

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center">

        <div className="flex gap-4 flex-col items-center justify-center w-[20%] w-min-[200px]">   
            <button className="w-full bg-slate-300 shadow-md rounded-lg px-4 py-2" onClick={() => navigate("/student")}>Student</button>
            <button className="w-full bg-slate-300 shadow-md rounded-lg px-4 py-2" onClick={() => navigate("/instructor")}>Instructor</button>
            <button className="w-full bg-slate-300 shadow-md rounded-lg px-4 py-2" onClick={() => navigate("/admin")}>Admin</button>
        </div>

    </div>
  )
}

export default Home
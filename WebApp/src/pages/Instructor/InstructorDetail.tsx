
function InstructorDetail({detail}:any) {
  return (
    <div>
        <div>Welcome , {detail.name}</div>
        <div>
            {
                detail.labSessions.map((e : any)=>{
                    return <div>Lab Session : {e.id}</div>
                })
            }
        </div>
    </div>
  )
}

export default InstructorDetail
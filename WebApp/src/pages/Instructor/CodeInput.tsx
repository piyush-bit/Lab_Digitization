import React from 'react'

interface CodeInputProps {
    onSubmitHandler: (event: React.FormEvent<HTMLFormElement>) => void
}

function CodeInput({onSubmitHandler} : CodeInputProps) {
  return (
    <form onSubmit={onSubmitHandler} className="flex flex-col">
            <label htmlFor="instructorCode" className="btn btn-primary">Enter Instructor code</label>
            <input type="text" id="instructorCode" name="instructorCode" className="modal-input" placeholder="Instructor code" />
            <button className="btn btn-primary">Submit</button>
    </form>
  )
}

export default CodeInput
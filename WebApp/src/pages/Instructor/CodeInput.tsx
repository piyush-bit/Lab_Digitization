import React from 'react';

interface CodeInputProps {
  onSubmitHandler: (event: React.FormEvent<HTMLFormElement>) => void;
}

function CodeInput({ onSubmitHandler }: CodeInputProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full space-y-8 p-10 bg-white shadow-lg rounded-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Instructor Dashboard
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your instructor code to access the dashboard
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={onSubmitHandler}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="instructorCode" className="sr-only">
                Instructor Code
              </label>
              <input
                id="instructorCode"
                name="instructorCode"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter Instructor Code"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Access Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CodeInput;
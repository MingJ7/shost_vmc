import Image from 'next/image'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-base">
        Welcome to Single Host VMC.
        <br/>
        <br/>
        Click <a className="line-through text-blue-600 hover:text-blue-800 visited:text-purple-600">here</a> to see how to use this.
        <br/>
        Click <a className="underline text-blue-600 hover:text-blue-800 visited:text-purple-600" href='/host'>here</a> to host a session.
        <br/>
        Click <a className="underline text-blue-600 hover:text-blue-800 visited:text-purple-600" href='/pythonServer.py'>here</a> to get the python server to forward the VMC packets

      </div>
    </main>
  )
}

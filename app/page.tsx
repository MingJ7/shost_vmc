import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-base">
        Welcome to Single Host VMC.
        <br/>
        <br/>
        Click <Link className="line-through text-blue-600 hover:text-blue-800 visited:text-purple-600" href="">here</Link> to see how to use this.
        <br/>
        Click <Link className="line-through text-blue-600 hover:text-blue-800 visited:text-purple-600" href='/host'>here</Link> to host a session.
        <br/>
        Click <Link className="underline text-blue-600 hover:text-blue-800 visited:text-purple-600" href='/pythonServer.py'>here</Link> to get the python server to forward the VMC packets

      </div>
    </main>
  )
}

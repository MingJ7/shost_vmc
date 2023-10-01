import asyncio
import socket
import json
from websockets.server import serve

UDP_IP = '127.0.0.1'
# UDP_IP = '192.168.50.90'
# UDP_PORT = 35750

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

async def forward(websocket, fwd_port):
    async for message in websocket:
        if(type(message) == 'str'):
            sock.sendto(message.encode(), (UDP_IP, fwd_port))
        else:
            sock.sendto(message, (UDP_IP, fwd_port))
        await websocket.send(message)

async def initHandler(websocket):
    """
    Handle a connection and dispatch it according to who is connecting.
    """
    # Receive and parse the "init" event from the UI.
    message = await websocket.recv()
    event = json.loads(message)
    assert event["type"] == "init"
    print("got a connection for ", event)

    if "port" in event:
        print("opening", event["type"], event["port"])
        await forward(websocket, event["port"])
    else:
        print("closing")
        websocket.close()

async def main():
    async with serve(initHandler, "localhost", 8765):
        await asyncio.Future()  # run forever

asyncio.run(main())
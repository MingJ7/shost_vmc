import asyncio
import socket
from websockets.server import serve

UDP_IP = '192.168.50.90'
UDP_PORT = 35750

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

async def echo(websocket):
    async for message in websocket:
        if(type(message) == 'str'):
            sock.sendto(message.encode(), (UDP_IP, UDP_PORT))
        else:
            sock.sendto(message, (UDP_IP, UDP_PORT))
        await websocket.send(message)

async def main():
    async with serve(echo, "localhost", 8765):
        await asyncio.Future()  # run forever

asyncio.run(main())
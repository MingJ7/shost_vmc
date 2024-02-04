import asyncio
import socket
import json
from websockets.server import serve

UDP_IP = '127.0.0.1'
# UDP_IP = '192.168.50.90'
# UDP_PORT = 35750

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

async def forwardToHost(websocket, fwd_port):
    async for message in websocket:
        if type(message) is str:
            sock.sendto(message.encode(), (UDP_IP, fwd_port))
        else:
            sock.sendto(message, (UDP_IP, fwd_port))
        # await websocket.send(message)

class MyServerProtocol:
    def __init__(self, ws, loop) -> None:
        self.ws = ws
        self.loop = loop

    def connection_made(self, transport):
        self.transport = transport

    def connection_lost(self, exc):
        if exc is not None:
            print(f"UDP Server Exception: {exc}")

    def datagram_received(self, data, addr):
        # print(f"got data: {data}")
        self.loop.create_task(self.ws.send(data))
    
    def error_received(self, exc):
        print(f"UDP Error: {exc}")

async def readMsg(udp_server):
    message, address = udp_server.recvfrom(10240)
    yield message

async def runUDPServer(websocket, recv_port):
    loop = asyncio.get_running_loop()
    try:
        print(f"UDP server opening with {UDP_IP}:{recv_port}")
        transport, protocol = await loop.create_datagram_endpoint(
        lambda: MyServerProtocol(websocket, loop),
        local_addr=(UDP_IP, recv_port))
        await asyncio.Future() # keep the server open
    # except asyncio.CancelledError:
    #     pass
    finally:
        print("transport is closing")
        transport.close()

async def forwardFromHost(websocket, recv_port):
    udp_server_task = asyncio.create_task(runUDPServer(websocket, recv_port))
    async for message in websocket:
        # handle possible messages?
        pass
    udp_server_task.cancel()

async def initHandler(websocket):
    """
    Handle a connection and dispatch it according to who is connecting.
    """
    # Receive and parse the "init" event from the UI.
    message = await websocket.recv()
    event = json.loads(message)
    if "type" not in event:
        print("invalid handshake")
        websocket.close()
    elif event["type"] == "init":
        print("new connection", event)
        print("forwarding to host", event["type"], event["port"])
        await forwardToHost(websocket, event["port"])
    elif event["type"] == "recv":
        # print("got a connection for ", event)
        print("getting from host", event["type"], event["port"])
        await forwardFromHost(websocket, event["port"])


async def main():
    print("server is starting")
    async with serve(initHandler, "localhost", 8765):
        await asyncio.Future()  # run forever

asyncio.run(main())
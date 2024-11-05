import asyncio

class QueueManager:
    def __init__(self):
        self.queue = asyncio.Queue()
        self.clients = set()
        
    async def put(self, message):
        await self.queue.put(message)
        
    async def get(self):
        return await self.queue.get()
        
    def add_client(self, ws):
        self.clients.add(ws)
        
    def remove_client(self, ws):
        self.clients.remove(ws) 
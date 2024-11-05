from quart import Quart, render_template, websocket, request
from playwright.async_api import async_playwright
import asyncio
import os
from .browser import BrowserManager
from .logger import WebLogger
from .queue_manager import QueueManager

# 获取当前文件所在目录的父目录
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 设置模板和静态文件路径
app = Quart(__name__,
            template_folder=os.path.join(BASE_DIR, 'templates'),
            static_folder=os.path.join(BASE_DIR, 'app', 'static'))

app.browser_manager = None
app.queue_manager = None
app.logger = WebLogger()

active_connections = set()

# 在现有的导入语句下面添加
CODE_DIR = os.path.join(BASE_DIR, 'code')
if not os.path.exists(CODE_DIR):
    os.makedirs(CODE_DIR)

@app.before_serving
async def startup():
    # 初始化 playwright 和浏览器
    app.browser_manager = BrowserManager(app)
    await app.browser_manager.init_browser()
    
    # 初始化消息队列
    app.queue_manager = QueueManager()
    app.logger.set_queue_manager(app.queue_manager)
    
    # 启动队列处理任务
    asyncio.create_task(process_queue())

async def broadcast_message(message):
    # 实现广播消息到所有 WebSocket 连接的逻辑
    for connection in active_connections:
        await connection.send_json(message)

async def process_queue():
    while True:
        message = await app.queue_manager.get()
        await broadcast_message(message)

async def handle_websocket_message(data):
    # 将消息添加到队列中
    await app.queue_manager.put(data)

@app.websocket('/ws')
async def ws():
    websocket_conn = websocket._get_current_object()
    active_connections.add(websocket_conn)
    try:
        # 连接建立时发送当前页面列表
        pages_data = await app.browser_manager.get_pages_data()
        await websocket_conn.send_json({
            'type': 'pages_update',
            'pages': pages_data
        })
        
        while True:
            data = await websocket.receive_json()
            await handle_websocket_message(data)
    except Exception as e:
        app.logger.error(f"WebSocket error: {str(e)}")
    finally:
        active_connections.remove(websocket_conn)

@app.route('/')
async def index():
    return await render_template('index.html')

@app.route('/execute', methods=['POST'])
async def execute_code():
    try:
        data = await request.get_json()
        code = data['code']
        page_index = data['page_index']

        app.logger.info(f"执行代码在页面 {page_index}: {code}")
        
        page = app.browser_manager.get_page(page_index)
        if not page:
            return {'error': 'Invalid page index'}, 400
            
        # 执行代码
        result = await app.browser_manager.execute_code(page, code)
        return {'result': result}
    except Exception as e:
        return {'error': str(e)}, 500

@app.route('/code', methods=['GET'])
async def get_code():
    try:
        file_path = os.path.join(CODE_DIR, 'sample.py')
        if not os.path.exists(file_path):
            return {'code': ''}, 200
            
        with open(file_path, 'r', encoding='utf-8') as f:
            code = f.read()
        return {'code': code}, 200
    except Exception as e:
        app.logger.error(f"Error reading code file: {str(e)}")
        return {'error': str(e)}, 500

@app.route('/code', methods=['PUT'])
async def save_code():
    try:
        data = await request.get_json()
        code = data.get('code', '')
        
        file_path = os.path.join(CODE_DIR, 'sample.py')
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(code)
            
        return {'message': 'Code saved successfully'}, 200
    except Exception as e:
        app.logger.error(f"Error saving code file: {str(e)}")
        return {'error': str(e)}, 500

@app.post("/new_page")
async def new_page():
    try:
        page_index = await app.browser_manager.create_new_page()
        return {"success": True, "page_index": page_index}
    except Exception as e:
        return {"error": str(e)}

if __name__ == '__main__':
    app.run(debug=True) 
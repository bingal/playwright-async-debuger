from playwright.async_api import async_playwright
import asyncio
import os
from dotenv import load_dotenv

class BrowserManager:
    def __init__(self, app):
        self.context = None
        self.pages = []
        self.playwright = None
        self.app = app
        # 加载环境变量
        load_dotenv()
        
    async def init_browser(self):
        self.playwright = await async_playwright().start()
        
        # 从环境变量获取配置
        browser_config = {
            "user_data_dir": os.getenv("USER_DATA_DIR", "./browser_data"),
            "viewport": {
                "width": int(os.getenv("BROWSER_WIDTH", 1280)),
                "height": int(os.getenv("BROWSER_HEIGHT", 800))
            },
            "user_agent": os.getenv("USER_AGENT"),
            "headless": os.getenv("HEADLESS", "false").lower() == "true",
            "devtools": os.getenv("DEVTOOLS", "false").lower() == "true",
        }
        
        # 配置代理
        proxy_server = os.getenv("PROXY_SERVER")
        if proxy_server:
            browser_config["proxy"] = {
                "server": proxy_server,
                "username": os.getenv("PROXY_USERNAME"),
                "password": os.getenv("PROXY_PASSWORD")
            }
            
        # 使用launch_persistent_context替代原来的launch
        self.context = await self.playwright.chromium.launch_persistent_context(
            channel="msedge",
            **browser_config
        )
        
        # 创建初始页面
        page = self.context.pages[0]
        default_url = os.getenv("DEFAULT_URL")
        if default_url:
            await page.goto(default_url)
        self.pages.append(page)
        
        # 监听新页面创建
        self.context.on("page", self.handle_new_page)
        
        # 为每个页面添加事件监听
        for page in self.pages:
            await self.setup_page_listeners(page)
    
    async def setup_page_listeners(self, page):
        # 监听页面关闭
        page.on("close", lambda: asyncio.create_task(self.handle_page_close(page)))
        # 监听页面标题变
        page.on("load", lambda: asyncio.create_task(self.handle_page_update()))
        
    async def handle_page_close(self, page):
        if page in self.pages:
            self.pages.remove(page)
            await self.notify_pages_update()
            
    async def handle_page_update(self):
        await self.notify_pages_update()
        
    async def handle_new_page(self, page):
        self.pages.append(page)
        await self.setup_page_listeners(page)
        await self.notify_pages_update()
    
    async def get_pages_data(self):
        pages_data = []
        for p in self.pages:
            try:
                title = await p.title() or "Untitled"
                url = p.url
                pages_data.append({'title': title, 'url': url})
            except Exception:
                # 页面可能已关闭
                continue
        return pages_data
    
    async def notify_pages_update(self):
        await self.app.queue_manager.put({
            'type': 'pages_update',
            'pages': await self.get_pages_data()
        })
        
    def get_page(self, index):
        if 0 <= index < len(self.pages):
            return self.pages[index]
        return None
        
    async def execute_code(self, page, code):
        try:
            # 创建执行环境
            context = {'page': page}
            
            # 记录开始执行
            self.app.logger.info(f'开始执行代码:\n{"-" * 40}\n{code}\n{"-" * 40}')
            
            # 将代码包装在异步函数中，注意代码的缩进
            wrapped_code = f"""
async def __execute():
{'''    ''' + code.replace(chr(10), chr(10) + '''    ''')}
"""
            # 添加必要的模块到执行环境
            context['asyncio'] = asyncio
            context['context'] = self.context
            context['logger'] = self.app.logger
            
            # 执行包装的代码定义
            exec(wrapped_code, context)
            
            # 执行异步函数并等待结果
            result = await context['__execute']()
            
            # 如果有返回值，记录返回值
            if result is not None:
                success_msg = f"执行成功，返回值: {result}"
                self.app.logger.info(success_msg)
            else:
                success_msg = "代码执行成功，没有返回值"
                self.app.logger.info(success_msg)
                
            return {'success': True, 'message': success_msg}
            
        except Exception as e:
            import traceback
            error_msg = f"执行出错: {str(e)}\n"
            error_trace = traceback.format_exc()
            
            # 记录错误信息
            self.app.logger.error(error_msg)
            self.app.logger.error(error_trace)
            
            return {
                'success': False, 
                'error': error_msg,
                'traceback': error_trace
            } 
    
    async def create_new_page(self):
        # 创建新页面
        page = await self.context.new_page()
        default_url = os.getenv("DEFAULT_URL")
        if default_url:
            await page.goto(default_url)
        return len(self.pages) - 1  # 返回新页面的索引
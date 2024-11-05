import logging
from datetime import datetime
import asyncio
import sys

class WebLogger(logging.Logger):
    def __init__(self):
        super().__init__('web_logger')
        self.queue_manager = None
        
        # 设置日志级别
        self.setLevel(logging.DEBUG)
        
        # 添加控制台处理器
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.DEBUG)
        
        # 设置控制台输出格式
        formatter = logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        console_handler.setFormatter(formatter)
        
        # 添加处理器到logger
        self.addHandler(console_handler)
        
    def set_queue_manager(self, queue_manager):
        self.queue_manager = queue_manager
        
    def _log(self, level, msg, args, exc_info=None, extra=None, stack_info=False, stacklevel=1):
        # 调用父类的 _log 方法（这会触发控制台输出）
        super()._log(level, msg, args, exc_info, extra, stack_info, stacklevel)
        
        # 如果队列管理器存在，发送到Web界面
        if self.queue_manager:
            # 获取日志级别名称
            level_name = logging.getLevelName(level)
            
            # 如果有args，格式化消息
            if args:
                msg = msg % args
            
            # 创建异步任务发送日志到队列
            asyncio.create_task(self.queue_manager.put({
                'type': 'log',
                'level': level_name,
                'message': str(msg),
                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }))
    
    def info(self, msg, *args, **kwargs):
        """
        记录 INFO 级别的日志
        """
        self._log(logging.INFO, msg, args, **kwargs)
        
    def error(self, msg, *args, **kwargs):
        """
        记录 ERROR 级别的日志
        """
        self._log(logging.ERROR, msg, args, **kwargs)
        
    def warning(self, msg, *args, **kwargs):
        """
        记录 WARNING 级别的日志
        """
        self._log(logging.WARNING, msg, args, **kwargs)
        
    def debug(self, msg, *args, **kwargs):
        """
        记录 DEBUG 级别的日志
        """
        self._log(logging.DEBUG, msg, args, **kwargs)
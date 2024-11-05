const requestAnimFrame = (function(){
    return window.requestAnimationFrame       ||
           window.webkitRequestAnimationFrame ||
           window.mozRequestAnimationFrame    ||
           function(callback){
               window.setTimeout(callback, 1000/60);
           };
})();

// 添加页面选择存储的key常量
const SELECTED_PAGE_KEY = 'selectedPageIndex';
const MAX_LOG_LINES = 200;

// 定义日志级别对应的颜色
const LOG_LEVEL_COLORS = {
    'DEBUG': '#999999',    // 灰色
    'INFO': '#28a745',     // 绿色
    'WARNING': '#ffc107',  // 黄色
    'ERROR': '#dc3545',    // 红色
    'CRITICAL': '#dc3545'  // 红色
};

const logOutput = document.getElementById('logOutput');
const pageSelect = document.getElementById('pageSelect');
const executeBtn = document.getElementById('executeBtn');
const logPanel = document.getElementById('log-panel');

let ws = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;
const connectionAlert = document.getElementById('connectionAlert');

function showAlert(message, type) {
    connectionAlert.textContent = message;
    connectionAlert.className = `connection-alert show ${type}`;
    
    // 如果是成功消息，2秒后隐藏
    if (type === 'success') {
        setTimeout(() => {
            connectionAlert.className = 'connection-alert';
        }, 2000);
    }
}

function hideAlert() {
    connectionAlert.className = 'connection-alert';
}

function connectWebSocket() {
    ws = new WebSocket(`ws://${window.location.host}/ws`);
    
    ws.onopen = function() {
        reconnectAttempts = 0;
        if (connectionAlert.classList.contains('error')) {
            showAlert('连接已恢复', 'success');
        }
    };
    
    ws.onclose = function() {
        showAlert('连接已断开，正在尝试重新连接...', 'error');
        
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            setTimeout(connectWebSocket, RECONNECT_DELAY);
        } else {
            showAlert('连接失败，请刷新页面重试', 'error');
        }
    };
    
    ws.onmessage = function(event) {
        const data = JSON.parse(event.data);
        
        if (data.type === 'log') {
            appendLog(data.timestamp, data.level, data.message);
        } else if (data.type === 'pages_update') {
            updatePagesList(data.pages);
            
            // 如果没有选中的页面且有可用页面，自动选择第一个
            if (!pageSelect.value && data.pages.length > 0) {
                pageSelect.value = 0;
                localStorage.setItem(SELECTED_PAGE_KEY, '0');
            }
        }
    };
    
    ws.onerror = function(error) {
        console.error('WebSocket error:', error);
    };
}

// 初始连接
connectWebSocket();

// 将 appendLog 设为全局函数
window.appendLog = function(timestamp, level, message) {
    const lines = logOutput.innerHTML.split('\n');
    if (lines.length > MAX_LOG_LINES) {
        lines.splice(0, lines.length - MAX_LOG_LINES);
    }
    
    // 获取日志级别对应的颜色
    const color = LOG_LEVEL_COLORS[level] || '#000000';
    
    // 创建带颜色的日志行
    const logLine = `<div class="line" style="color: ${color};">[${timestamp}] [${level}] ${message}</div>`;
    
    // 添加新的日志行
    lines.push(logLine);
    
    // 更新日志显示
    logOutput.innerHTML = lines.join('\n');
    
    // 使用我们定义的 requestAnimFrame 替代 requestAnimationFrame
    requestAnimFrame(() => {
        logPanel.scrollTo({
            top: logPanel.scrollHeight,
            behavior: 'smooth'
        });
    });
};

function updatePagesList(pages) {
    // 清空现有选项
    pageSelect.innerHTML = '';
    
    // 获取之前选择的页面索引
    let savedPageIndex = localStorage.getItem(SELECTED_PAGE_KEY);
    
    // 如果没有保存的选择或者保存的索引超出范围，则默认选择第一个页面
    if (!savedPageIndex || savedPageIndex >= pages.length) {
        savedPageIndex = pages.length > 0 ? 0 : '';
    }
    
    // 只有当没有页面时才添加默认选项
    if (pages.length === 0) {
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = "选择页面...";
        pageSelect.appendChild(defaultOption);
    }
    
    // 添加实际的页面选项
    pages.forEach((page, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${page.title} - ${page.url}`;
        pageSelect.appendChild(option);
    });
    
    // 设置选中的页面
    pageSelect.value = savedPageIndex;
}

// 添加页面选择变更监听器
pageSelect.addEventListener('change', (event) => {
    const selectedIndex = event.target.value;
    if (selectedIndex !== '') {
        localStorage.setItem(SELECTED_PAGE_KEY, selectedIndex);
    }
});

executeBtn.addEventListener('click', async () => {
    const selection = editor.getSelection();
    const code = selection.isEmpty()
        ? editor.getValue()
        : editor.getModel().getValueInRange(selection);
    const pageIndex = pageSelect.value;
    
    if (!code || !pageIndex) {
        appendLog(
            formatCurrentTime(),
            'WARNING',
            '请选择页面并输入代码'
        );
        return;
    }
    
    try {
        const response = await fetch('/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                code: code,
                page_index: parseInt(pageIndex)
            })
        });
        
        const result = await response.json();
        if (result.error) {
            appendLog(
                formatCurrentTime(),
                'ERROR',
                `执行错误: ${result.error}`
            );
            if (result.traceback) {
                appendLog(
                    formatCurrentTime(),
                    'ERROR',
                    result.traceback
                );
            }
        } else {
            if (result.message) {
                appendLog(
                    formatCurrentTime(),
                    'INFO',
                    result.message
                );
            } else {
                console.log('没有返回消息内容');
            }
        }
    } catch (error) {
        appendLog(
            formatCurrentTime(),
            'ERROR',
            `请求错误: ${error.message}`
        );
    }
}); 

// 在 WebSocket 处理部分后添加新建页面按钮的事件监听
const newPageBtn = document.getElementById('newPageBtn');

newPageBtn.addEventListener('click', async () => {
    try {
        const response = await fetch('/new_page', {
            method: 'POST'
        });
        
        const result = await response.json();
        if (result.error) {
            appendLog(
                formatCurrentTime(),
                'ERROR',
                `创建新页面失败: ${result.error}`
            );
        } else {
            // 新页面创建成功后，页面列表会通过 WebSocket 自动更新
            // 我们只需要选中新创建的页面
            pageSelect.value = result.page_index;
            localStorage.setItem(SELECTED_PAGE_KEY, result.page_index);
        }
    } catch (error) {
        appendLog(
            formatCurrentTime(),
            'ERROR',
            `创建新页面请求失败: ${error.message}`
        );
    }
});

const formatCurrentTime = () => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // 月份从0开始，需要加1
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 添加在文件末尾
function initSplitter() {
    const splitter = document.querySelector('.splitter');
    const editorContainer = document.querySelector('.editor-container');
    const outputPanel = document.querySelector('.output-panel');
    
    let isResizing = false;
    
    splitter.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.style.cursor = 'col-resize';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        const containerRect = document.querySelector('.main-content').getBoundingClientRect();
        const percentage = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        
        if (percentage > 20 && percentage < 80) {
            editorContainer.style.flex = `${percentage}`;
            outputPanel.style.flex = `${100 - percentage}`;
            
            // 重新计算编辑器大小
            if (editor) {
                editor.layout();
            }
        }
    });
    
    document.addEventListener('mouseup', () => {
        isResizing = false;
        document.body.style.cursor = 'default';
        
        // 拖动结束后再次调整编辑器大小
        if (editor) {
            editor.layout();
        }
    });
    
    // 监听窗口大小变化
    window.addEventListener('resize', () => {
        if (editor) {
            editor.layout();
        }
    });
}

// 在页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initSplitter);



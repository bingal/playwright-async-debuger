require.config({
    'paths': { 'vs': '/static/monaco-editor-0.52.0/min/vs' },
    'vs/nls': {
        availableLanguages: { '*': 'zh-cn' }
    }
});


require(['vs/editor/editor.main'], async function () {
    // 获取初始代码
    try {
        const response = await fetch('/code');
        const data = await response.json();
        const initialCode = data.code || '';

        // 创建编辑器
        editor = monaco.editor.create(document.getElementById("container"), {
            value: initialCode,
            language: "python",
            lineNumbers: "on",
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            theme: "vs-dark",
        });

        // 添加快捷键
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, async function() {
            // 保存代码
            try {
                const code = editor.getValue();
                const response = await fetch('/code', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ code: code })
                });
                
                if (response.ok) {
                    // 使用 main.js 中的 appendLog 函数
                    window.appendLog(
                        new Date().toLocaleString(),
                        'INFO',
                        '代码保存成功'
                    );
                }
            } catch (error) {
                window.appendLog(
                    new Date().toLocaleString(),
                    'ERROR',
                    `保存失败: ${error.message}`
                );
            }
        });

        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, async function() {
            // 获取选中的代码或全部代码
            const selection = editor.getSelection();
            const code = selection.isEmpty() 
                ? editor.getValue() 
                : editor.getModel().getValueInRange(selection);
            
            const pageIndex = document.getElementById('pageSelect').value;
            
            if (!code || !pageIndex) {
                window.appendLog(
                    new Date().toLocaleString(),
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
                    window.appendLog(
                        new Date().toLocaleString(),
                        'ERROR',
                        `执行错误: ${result.error}`
                    );
                    if (result.traceback) {
                        window.appendLog(
                            new Date().toLocaleString(),
                            'ERROR',
                            result.traceback
                        );
                    }
                } else {
                    window.appendLog(
                        new Date().toLocaleString(),
                        'INFO',
                        result.message || '代码执行成功'
                    );
                }
            } catch (error) {
                window.appendLog(
                    new Date().toLocaleString(),
                    'ERROR',
                    `请求错误: ${error.message}`
                );
            }
        });
    } catch (error) {
        console.error('初始化编辑器失败:', error);
    }
});


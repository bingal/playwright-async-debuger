require.config({
  paths: { vs: "/static/monaco-editor-0.52.0/min/vs" },
  "vs/nls": {
    availableLanguages: { "*": "zh-cn" },
  },
});

require(["vs/editor/editor.main"], async function () {
  // 获取初始代码
  try {
    const response = await fetch("/code");
    const data = await response.json();
    const initialCode = data.code || "";

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
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
      async function () {
        // 保存代码
        try {
          const code = editor.getValue();
          const response = await fetch("/code", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ code: code }),
          });

          if (response.ok) {
            // 使用 main.js 中的 appendLog 函数
            window.appendLog(
              new Date().toLocaleString(),
              "INFO",
              "代码保存成功",
            );
          }
        } catch (error) {
          window.appendLog(
            new Date().toLocaleString(),
            "ERROR",
            `保存失败: ${error.message}`,
          );
        }
      },
    );

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      async function () {
        // 获取选中的代码或当前行代码
        const selection = editor.getSelection();
        let code;

        if (!selection.isEmpty()) {
          // 使用选中的代码
          code = editor.getModel().getValueInRange(selection);
        } else {
          // 获取当前光标所在行
          const lineNumber = editor.getPosition().lineNumber;
          const lineContent = editor.getModel().getLineContent(lineNumber);
          code = lineContent;
        }

        const pageIndex = document.getElementById("pageSelect").value;

        if (!code || !pageIndex) {
          window.appendLog(
            new Date().toLocaleString(),
            "WARNING",
            "请选择页面并输入代码",
          );
          return;
        }

        try {
          const response = await fetch("/execute", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code: code,
              page_index: parseInt(pageIndex),
            }),
          });

          const result = await response.json();
          if (result.error) {
            window.appendLog(
              new Date().toLocaleString(),
              "ERROR",
              `执行错误: ${result.error}`,
            );
            if (result.traceback) {
              window.appendLog(
                new Date().toLocaleString(),
                "ERROR",
                result.traceback,
              );
            }
          } else {
            window.appendLog(
              new Date().toLocaleString(),
              "INFO",
              result.message || "代码执行成功",
            );
          }
        } catch (error) {
          window.appendLog(
            new Date().toLocaleString(),
            "ERROR",
            `请求错误: ${error.message}`,
          );
        }
      },
    );

    // 增加自动补全
    const pageCompletionItems = [
      // Methods
      {
        label: "add_init_script",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "add_init_script",
      },
      {
        label: "add_locator_handler",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "add_locator_handler",
      },
      {
        label: "add_script_tag",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "add_script_tag",
      },
      {
        label: "add_style_tag",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "add_style_tag",
      },
      {
        label: "bring_to_front",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "bring_to_front",
      },
      {
        label: "close",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "close",
      },
      {
        label: "content",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "content",
      },
      {
        label: "drag_and_drop",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "drag_and_drop",
      },
      {
        label: "emulate_media",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "emulate_media",
      },
      {
        label: "evaluate",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "evaluate",
      },
      {
        label: "evaluate_handle",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "evaluate_handle",
      },
      {
        label: "expect_console_message",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "expect_console_message",
      },
      {
        label: "expect_download",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "expect_download",
      },
      {
        label: "expect_event",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "expect_event",
      },
      {
        label: "expect_file_chooser",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "expect_file_chooser",
      },
      {
        label: "expect_popup",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "expect_popup",
      },
      {
        label: "expect_request",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "expect_request",
      },
      {
        label: "expect_request_finished",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "expect_request_finished",
      },
      {
        label: "expect_response",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "expect_response",
      },
      {
        label: "expect_websocket",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "expect_websocket",
      },
      {
        label: "expect_worker",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "expect_worker",
      },
      {
        label: "expose_binding",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "expose_binding",
      },
      {
        label: "expose_function",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "expose_function",
      },
      {
        label: "frame",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "frame",
      },
      {
        label: "frame_locator",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "frame_locator",
      },
      {
        label: "get_by_alt_text",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "get_by_alt_text",
      },
      {
        label: "get_by_label",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "get_by_label",
      },
      {
        label: "get_by_placeholder",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "get_by_placeholder",
      },
      {
        label: "get_by_role",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "get_by_role",
      },
      {
        label: "get_by_test_id",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "get_by_test_id",
      },
      {
        label: "get_by_text",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "get_by_text",
      },
      {
        label: "get_by_title",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "get_by_title",
      },
      {
        label: "go_back",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "go_back",
      },
      {
        label: "go_forward",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "go_forward",
      },
      {
        label: "goto",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "goto",
      },
      {
        label: "locator",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "locator",
      },
      {
        label: "opener",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "opener",
      },
      {
        label: "pause",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "pause",
      },
      {
        label: "pdf",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "pdf",
      },
      {
        label: "reload",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "reload",
      },
      {
        label: "remove_locator_handler",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "remove_locator_handler",
      },
      {
        label: "request_gc",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "request_gc",
      },
      {
        label: "route",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "route",
      },
      {
        label: "route_from_har",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "route_from_har",
      },
      {
        label: "route_web_socket",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "route_web_socket",
      },
      {
        label: "screenshot",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "screenshot",
      },
      {
        label: "set_content",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "set_content",
      },
      {
        label: "set_default_navigation_timeout",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "set_default_navigation_timeout",
      },
      {
        label: "set_default_timeout",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "set_default_timeout",
      },
      {
        label: "set_extra_http_headers",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "set_extra_http_headers",
      },
      {
        label: "set_viewport_size",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "set_viewport_size",
      },
      {
        label: "title",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "title",
      },
      {
        label: "unroute",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "unroute",
      },
      {
        label: "unroute_all",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "unroute_all",
      },
      {
        label: "wait_for_event",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "wait_for_event",
      },
      {
        label: "wait_for_function",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "wait_for_function",
      },
      {
        label: "wait_for_load_state",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "wait_for_load_state",
      },
      {
        label: "wait_for_url",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "wait_for_url",
      },
      // Properties
      {
        label: "clock",
        kind: monaco.languages.CompletionItemKind.Property,
        insertText: "clock",
      },
      {
        label: "context",
        kind: monaco.languages.CompletionItemKind.Property,
        insertText: "context",
      },
      {
        label: "frames",
        kind: monaco.languages.CompletionItemKind.Property,
        insertText: "frames",
      },
      {
        label: "is_closed",
        kind: monaco.languages.CompletionItemKind.Property,
        insertText: "is_closed",
      },
      {
        label: "keyboard",
        kind: monaco.languages.CompletionItemKind.Property,
        insertText: "keyboard",
      },
      {
        label: "main_frame",
        kind: monaco.languages.CompletionItemKind.Property,
        insertText: "main_frame",
      },
      {
        label: "mouse",
        kind: monaco.languages.CompletionItemKind.Property,
        insertText: "mouse",
      },
      {
        label: "request",
        kind: monaco.languages.CompletionItemKind.Property,
        insertText: "request",
      },
      {
        label: "touchscreen",
        kind: monaco.languages.CompletionItemKind.Property,
        insertText: "touchscreen",
      },
      {
        label: "url",
        kind: monaco.languages.CompletionItemKind.Property,
        insertText: "url",
      },
      {
        label: "video",
        kind: monaco.languages.CompletionItemKind.Property,
        insertText: "video",
      },
      {
        label: "viewport_size",
        kind: monaco.languages.CompletionItemKind.Property,
        insertText: "viewport_size",
      },
      {
        label: "workers",
        kind: monaco.languages.CompletionItemKind.Property,
        insertText: "workers",
      },
      // Events
      {
        label: "on('close')",
        kind: monaco.languages.CompletionItemKind.Event,
        insertText: "on('close')",
      },
      {
        label: "on('console')",
        kind: monaco.languages.CompletionItemKind.Event,
        insertText: "on('console')",
      },
      {
        label: "on('crash')",
        kind: monaco.languages.CompletionItemKind.Event,
        insertText: "on('crash')",
      },
      {
        label: "on('dialog')",
        kind: monaco.languages.CompletionItemKind.Event,
        insertText: "on('dialog')",
      },
      {
        label: "on('domcontentloaded')",
        kind: monaco.languages.CompletionItemKind.Event,
        insertText: "on('domcontentloaded')",
      },
      {
        label: "on('download')",
        kind: monaco.languages.CompletionItemKind.Event,
        insertText: "on('download')",
      },
      {
        label: "on('filechooser')",
        kind: monaco.languages.CompletionItemKind.Event,
        insertText: "on('filechooser')",
      },
      {
        label: "on('frameattached')",
        kind: monaco.languages.CompletionItemKind.Event,
        insertText: "on('frameattached')",
      },
      {
        label: "on('framedetached')",
        kind: monaco.languages.CompletionItemKind.Event,
        insertText: "on('framedetached')",
      },
      {
        label: "on('framenavigated')",
        kind: monaco.languages.CompletionItemKind.Event,
        insertText: "on('framenavigated')",
      },
      {
        label: "on('load')",
        kind: monaco.languages.CompletionItemKind.Event,
        insertText: "on('load')",
      },
      {
        label: "on('pageerror')",
        kind: monaco.languages.CompletionItemKind.Event,
        insertText: "on('pageerror')",
      },
      {
        label: "on('popup')",
        kind: monaco.languages.CompletionItemKind.Event,
        insertText: "on('popup')",
      },
      {
        label: "on('request')",
        kind: monaco.languages.CompletionItemKind.Event,
        insertText: "on('request')",
      },
      {
        label: "on('requestfailed')",
        kind: monaco.languages.CompletionItemKind.Event,
        insertText: "on('requestfailed')",
      },
      {
        label: "on('requestfinished')",
        kind: monaco.languages.CompletionItemKind.Event,
        insertText: "on('requestfinished')",
      },
      {
        label: "on('response')",
        kind: monaco.languages.CompletionItemKind.Event,
        insertText: "on('response')",
      },
      {
        label: "on('websocket')",
        kind: monaco.languages.CompletionItemKind.Event,
        insertText: "on('websocket')",
      },
      {
        label: "on('worker')",
        kind: monaco.languages.CompletionItemKind.Event,
        insertText: "on('worker')",
      },
    ];

    const contextCompletionItems = [
      // Methods
      {
        label: "add_cookies",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "add_cookies",
      },
      {
        label: "add_init_script",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "add_init_script",
      },
      {
        label: "clear_cookies",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "clear_cookies",
      },
      {
        label: "clear_permissions",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "clear_permissions",
      },
      {
        label: "close",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "close",
      },
      {
        label: "cookies",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "cookies",
      },
      {
        label: "expect_console_message",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "expect_console_message",
      },
      {
        label: "expect_event",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "expect_event",
      },
      {
        label: "expect_page",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "expect_page",
      },
      {
        label: "expose_binding",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "expose_binding",
      },
      {
        label: "expose_function",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "expose_function",
      },
      {
        label: "grant_permissions",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "grant_permissions",
      },
      {
        label: "new_cdp_session",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "new_cdp_session",
      },
      {
        label: "new_page",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "new_page",
      },
      {
        label: "route",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "route",
      },
      {
        label: "route_from_har",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "route_from_har",
      },
      {
        label: "route_web_socket",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "route_web_socket",
      },
      {
        label: "set_default_navigation_timeout",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "set_default_navigation_timeout",
      },
      {
        label: "set_default_timeout",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "set_default_timeout",
      },
      {
        label: "set_extra_http_headers",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "set_extra_http_headers",
      },
      {
        label: "set_geolocation",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "set_geolocation",
      },
      {
        label: "set_offline",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "set_offline",
      },
      {
        label: "storage_state",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "storage_state",
      },
      {
        label: "unroute",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "unroute",
      },
      {
        label: "unroute_all",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "unroute_all",
      },
      {
        label: "wait_for_event",
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: "wait_for_event",
      },
      // Properties
      {
        label: "background_pages",
        kind: monaco.languages.CompletionItemKind.Property,
        insertText: "background_pages",
      },
      {
        label: "browser",
        kind: monaco.languages.CompletionItemKind.Property,
        insertText: "browser",
      },
      {
        label: "clock",
        kind: monaco.languages.CompletionItemKind.Property,
        insertText: "clock",
      },
      {
        label: "pages",
        kind: monaco.languages.CompletionItemKind.Property,
        insertText: "pages",
      },
      {
        label: "request",
        kind: monaco.languages.CompletionItemKind.Property,
        insertText: "request",
      },
      {
        label: "service_workers",
        kind: monaco.languages.CompletionItemKind.Property,
        insertText: "service_workers",
      },
      {
        label: "tracing",
        kind: monaco.languages.CompletionItemKind.Property,
        insertText: "tracing",
      },
      // Events
      {
        label: "on('backgroundpage')",
        kind: monaco.languages.CompletionItemKind.Event,
        insertText: "on('backgroundpage')",
      },
      {
        label: "on('close')",
        kind: monaco.languages.CompletionItemKind.Event,
        insertText: "on('close')",
      },
      {
        label: "on('console')",
        kind: monaco.languages.CompletionItemKind.Event,
        insertText: "on('console')",
      },
      {
        label: "on('dialog')",
        kind: monaco.languages.CompletionItemKind.Event,
        insertText: "on('dialog')",
      },
      {
        label: "on('page')",
        kind: monaco.languages.CompletionItemKind.Event,
        insertText: "on('page')",
      },
      {
        label: "on('request')",
        kind: monaco.languages.CompletionItemKind.Event,
        insertText: "on('request')",
      },
      {
        label: "on('requestfailed')",
        kind: monaco.languages.CompletionItemKind.Event,
        insertText: "on('requestfailed')",
      },
      {
        label: "on('requestfinished')",
        kind: monaco.languages.CompletionItemKind.Event,
        insertText: "on('requestfinished')",
      },
      {
        label: "on('response')",
        kind: monaco.languages.CompletionItemKind.Event,
        insertText: "on('response')",
      },
      {
        label: "on('serviceworker')",
        kind: monaco.languages.CompletionItemKind.Event,
        insertText: "on('serviceworker')",
      },
      {
        label: "on('weberror')",
        kind: monaco.languages.CompletionItemKind.Event,
        insertText: "on('weberror')",
      },
    ];

    monaco.languages.registerCompletionItemProvider("python", {
      provideCompletionItems: function (model, position) {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const textUntilPosition = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column - 1,
        });

        // Check if the word is 'page' or 'context'
        if (range.endColumn === position.column && /^page$/.test(word.word)) {
          return {
            suggestions: pageCompletionItems.map((item) => ({
              kind: item.kind,
              range: range,
              insertText: item.insertText,
              label: item.label,
            })),
          };
        } else if (
          range.endColumn === position.column &&
          /^context$/.test(word.word)
        ) {
          return {
            suggestions: contextCompletionItems.map((item) => ({
              kind: item.kind,
              range: range,
              insertText: item.insertText,
              label: item.label,
            })),
          };
        }

        // If not, return no suggestions
        return { suggestions: [] };
      },
    });
  } catch (error) {
    console.error("初始化编辑器失败:", error);
  }
});

/*!-----------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Version: 0.52.0(f6dc0eb8fce67e57f6036f4769d92c1666cdf546)
 * Released under the MIT license
 * https://github.com/microsoft/monaco-editor/blob/main/LICENSE.txt
 *-----------------------------------------------------------------------------*/


// src/basic-languages/sb/sb.ts
var conf = {
  comments: {
    lineComment: "'"
  },
  brackets: [
    ["(", ")"],
    ["[", "]"],
    ["If", "EndIf"],
    ["While", "EndWhile"],
    ["For", "EndFor"],
    ["Sub", "EndSub"]
  ],
  autoClosingPairs: [
    { open: '"', close: '"', notIn: ["string", "comment"] },
    { open: "(", close: ")", notIn: ["string", "comment"] },
    { open: "[", close: "]", notIn: ["string", "comment"] }
  ]
};
var language = {
  defaultToken: "",
  tokenPostfix: ".sb",
  ignoreCase: true,
  brackets: [
    { token: "delimiter.array", open: "[", close: "]" },
    { token: "delimiter.parenthesis", open: "(", close: ")" },
    // Special bracket statement pairs
    { token: "keyword.tag-if", open: "If", close: "EndIf" },
    { token: "keyword.tag-while", open: "While", close: "EndWhile" },
    { token: "keyword.tag-for", open: "For", close: "EndFor" },
    { token: "keyword.tag-sub", open: "Sub", close: "EndSub" }
  ],
  keywords: [
    "Else",
    "ElseIf",
    "EndFor",
    "EndIf",
    "EndSub",
    "EndWhile",
    "For",
    "Goto",
    "If",
    "Step",
    "Sub",
    "Then",
    "To",
    "While"
  ],
  tagwords: ["If", "Sub", "While", "For"],
  operators: [">", "<", "<>", "<=", ">=", "And", "Or", "+", "-", "*", "/", "="],
  // we include these common regular expressions
  identifier: /[a-zA-Z_][\w]*/,
  symbols: /[=><:+\-*\/%\.,]+/,
  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
  // The main tokenizer for our languages
  tokenizer: {
    root: [
      // whitespace
      { include: "@whitespace" },
      // classes
      [/(@identifier)(?=[.])/, "type"],
      // identifiers, tagwords, and keywords
      [
        /@identifier/,
        {
          cases: {
            "@keywords": { token: "keyword.$0" },
            "@operators": "operator",
            "@default": "variable.name"
          }
        }
      ],
      // methods, properties, and events
      [
        /([.])(@identifier)/,
        {
          cases: {
            $2: ["delimiter", "type.member"],
            "@default": ""
          }
        }
      ],
      // numbers
      [/\d*\.\d+/, "number.float"],
      [/\d+/, "number"],
      // delimiters and operators
      [/[()\[\]]/, "@brackets"],
      [
        /@symbols/,
        {
          cases: {
            "@operators": "operator",
            "@default": "delimiter"
          }
        }
      ],
      // strings
      [/"([^"\\]|\\.)*$/, "string.invalid"],
      // non-teminated string
      [/"/, "string", "@string"]
    ],
    whitespace: [
      [/[ \t\r\n]+/, ""],
      [/(\').*$/, "comment"]
    ],
    string: [
      [/[^\\"]+/, "string"],
      [/@escapes/, "string.escape"],
      [/\\./, "string.escape.invalid"],
      [/"C?/, "string", "@pop"]
    ]
  }
};
export {
  conf,
  language
};

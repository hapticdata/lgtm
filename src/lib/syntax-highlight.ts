import React from 'react';
import { Text } from 'ink';

export type TokenType =
  | 'keyword'
  | 'string'
  | 'comment'
  | 'number'
  | 'function'
  | 'operator'
  | 'type'
  | 'tag'
  | 'attribute'
  | 'plain';

export interface Token {
  type: TokenType;
  value: string;
}

const TOKEN_COLORS: Record<TokenType, string | undefined> = {
  keyword: 'magenta',
  string: 'green',
  comment: 'gray',
  number: 'yellow',
  function: 'blue',
  operator: 'cyan',
  type: 'cyan',
  tag: 'blue',
  attribute: 'yellow',
  plain: undefined,
};

const JS_KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do',
  'switch', 'case', 'break', 'continue', 'default', 'try', 'catch', 'finally',
  'throw', 'new', 'delete', 'typeof', 'instanceof', 'in', 'of', 'class', 'extends',
  'super', 'this', 'static', 'get', 'set', 'async', 'await', 'yield', 'import',
  'export', 'from', 'as', 'default', 'null', 'undefined', 'true', 'false', 'void',
  'interface', 'type', 'enum', 'implements', 'public', 'private', 'protected',
  'readonly', 'abstract', 'declare', 'namespace', 'module',
]);

const PYTHON_KEYWORDS = new Set([
  'def', 'class', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally',
  'with', 'as', 'import', 'from', 'return', 'yield', 'raise', 'pass', 'break',
  'continue', 'and', 'or', 'not', 'in', 'is', 'lambda', 'global', 'nonlocal',
  'True', 'False', 'None', 'async', 'await', 'assert', 'del',
]);

const GO_KEYWORDS = new Set([
  'break', 'case', 'chan', 'const', 'continue', 'default', 'defer', 'else',
  'fallthrough', 'for', 'func', 'go', 'goto', 'if', 'import', 'interface', 'map',
  'package', 'range', 'return', 'select', 'struct', 'switch', 'type', 'var',
  'true', 'false', 'nil', 'iota',
]);

const RUST_KEYWORDS = new Set([
  'as', 'async', 'await', 'break', 'const', 'continue', 'crate', 'dyn', 'else',
  'enum', 'extern', 'false', 'fn', 'for', 'if', 'impl', 'in', 'let', 'loop',
  'match', 'mod', 'move', 'mut', 'pub', 'ref', 'return', 'self', 'Self', 'static',
  'struct', 'super', 'trait', 'true', 'type', 'unsafe', 'use', 'where', 'while',
]);

const SHELL_KEYWORDS = new Set([
  'if', 'then', 'else', 'elif', 'fi', 'case', 'esac', 'for', 'while', 'until',
  'do', 'done', 'in', 'function', 'select', 'time', 'coproc', 'export', 'local',
  'readonly', 'declare', 'typeset', 'unset', 'shift', 'return', 'exit', 'source',
  'true', 'false',
]);

const SQL_KEYWORDS = new Set([
  'select', 'from', 'where', 'and', 'or', 'not', 'in', 'like', 'between', 'is',
  'null', 'order', 'by', 'asc', 'desc', 'limit', 'offset', 'join', 'left', 'right',
  'inner', 'outer', 'on', 'group', 'having', 'union', 'insert', 'into', 'values',
  'update', 'set', 'delete', 'create', 'table', 'index', 'view', 'drop', 'alter',
  'add', 'column', 'primary', 'key', 'foreign', 'references', 'unique', 'default',
  'constraint', 'as', 'distinct', 'all', 'exists', 'case', 'when', 'then', 'end',
]);

const CSS_KEYWORDS = new Set([
  'important', 'inherit', 'initial', 'unset', 'auto', 'none', 'block', 'inline',
  'flex', 'grid', 'absolute', 'relative', 'fixed', 'sticky', 'static',
]);

function getKeywords(language: string): Set<string> {
  switch (language) {
    case 'js':
    case 'javascript':
    case 'ts':
    case 'typescript':
    case 'jsx':
    case 'tsx':
      return JS_KEYWORDS;
    case 'py':
    case 'python':
      return PYTHON_KEYWORDS;
    case 'go':
    case 'golang':
      return GO_KEYWORDS;
    case 'rust':
    case 'rs':
      return RUST_KEYWORDS;
    case 'sh':
    case 'bash':
    case 'shell':
    case 'zsh':
      return SHELL_KEYWORDS;
    case 'sql':
      return SQL_KEYWORDS;
    case 'css':
    case 'scss':
    case 'less':
      return CSS_KEYWORDS;
    default:
      return JS_KEYWORDS;
  }
}

function isHtmlLike(language: string): boolean {
  return ['html', 'htm', 'xml', 'svg', 'jsx', 'tsx'].includes(language);
}

export function tokenizeLine(line: string, language: string): Token[] {
  const tokens: Token[] = [];
  const keywords = getKeywords(language);
  const isHtml = isHtmlLike(language);
  let i = 0;

  while (i < line.length) {
    // Skip whitespace
    if (/\s/.test(line[i]!)) {
      let ws = '';
      while (i < line.length && /\s/.test(line[i]!)) {
        ws += line[i];
        i++;
      }
      tokens.push({ type: 'plain', value: ws });
      continue;
    }

    // Single-line comment //
    if (line[i] === '/' && line[i + 1] === '/') {
      tokens.push({ type: 'comment', value: line.slice(i) });
      break;
    }

    // Hash comment #
    if (line[i] === '#' && (language === 'py' || language === 'python' ||
        language === 'sh' || language === 'bash' || language === 'shell' ||
        language === 'zsh')) {
      tokens.push({ type: 'comment', value: line.slice(i) });
      break;
    }

    // SQL/CSS comment --
    if (line[i] === '-' && line[i + 1] === '-' && language === 'sql') {
      tokens.push({ type: 'comment', value: line.slice(i) });
      break;
    }

    // CSS comment /* (just the start indicator)
    if (line[i] === '/' && line[i + 1] === '*') {
      const end = line.indexOf('*/', i + 2);
      if (end !== -1) {
        tokens.push({ type: 'comment', value: line.slice(i, end + 2) });
        i = end + 2;
        continue;
      } else {
        tokens.push({ type: 'comment', value: line.slice(i) });
        break;
      }
    }

    // HTML tags
    if (isHtml && line[i] === '<') {
      let tag = '<';
      i++;
      const isClosing = line[i] === '/';
      if (isClosing) {
        tag += '/';
        i++;
      }
      // Tag name
      let tagName = '';
      while (i < line.length && /[a-zA-Z0-9-]/.test(line[i]!)) {
        tagName += line[i];
        i++;
      }
      if (tagName) {
        tokens.push({ type: 'tag', value: tag + tagName });
        tag = '';
      } else {
        tokens.push({ type: 'operator', value: tag });
        continue;
      }
      // Attributes
      while (i < line.length && line[i] !== '>') {
        if (/\s/.test(line[i]!)) {
          let ws = '';
          while (i < line.length && /\s/.test(line[i]!)) {
            ws += line[i];
            i++;
          }
          tokens.push({ type: 'plain', value: ws });
          continue;
        }
        // Attribute name
        if (/[a-zA-Z-]/.test(line[i]!)) {
          let attr = '';
          while (i < line.length && /[a-zA-Z0-9-]/.test(line[i]!)) {
            attr += line[i];
            i++;
          }
          tokens.push({ type: 'attribute', value: attr });
          continue;
        }
        // Equals and value
        if (line[i] === '=') {
          tokens.push({ type: 'operator', value: '=' });
          i++;
          // Skip whitespace
          while (i < line.length && /\s/.test(line[i]!)) {
            tokens.push({ type: 'plain', value: line[i]! });
            i++;
          }
          // String value
          if (line[i] === '"' || line[i] === "'") {
            const quote = line[i]!;
            let str = quote;
            i++;
            while (i < line.length && line[i] !== quote) {
              str += line[i];
              i++;
            }
            if (i < line.length) {
              str += line[i];
              i++;
            }
            tokens.push({ type: 'string', value: str });
            continue;
          }
          continue;
        }
        // Skip other characters in tag
        if (line[i] === '/') {
          tokens.push({ type: 'operator', value: '/' });
          i++;
          continue;
        }
        tokens.push({ type: 'plain', value: line[i]! });
        i++;
      }
      if (line[i] === '>') {
        tokens.push({ type: 'tag', value: '>' });
        i++;
      }
      continue;
    }

    // Strings (double quotes)
    if (line[i] === '"') {
      let str = '"';
      i++;
      while (i < line.length && line[i] !== '"') {
        if (line[i] === '\\' && i + 1 < line.length) {
          str += line[i]! + line[i + 1]!;
          i += 2;
        } else {
          str += line[i];
          i++;
        }
      }
      if (i < line.length) {
        str += '"';
        i++;
      }
      tokens.push({ type: 'string', value: str });
      continue;
    }

    // Strings (single quotes)
    if (line[i] === "'") {
      let str = "'";
      i++;
      while (i < line.length && line[i] !== "'") {
        if (line[i] === '\\' && i + 1 < line.length) {
          str += line[i]! + line[i + 1]!;
          i += 2;
        } else {
          str += line[i];
          i++;
        }
      }
      if (i < line.length) {
        str += "'";
        i++;
      }
      tokens.push({ type: 'string', value: str });
      continue;
    }

    // Template strings (backticks)
    if (line[i] === '`') {
      let str = '`';
      i++;
      while (i < line.length && line[i] !== '`') {
        if (line[i] === '\\' && i + 1 < line.length) {
          str += line[i]! + line[i + 1]!;
          i += 2;
        } else {
          str += line[i];
          i++;
        }
      }
      if (i < line.length) {
        str += '`';
        i++;
      }
      tokens.push({ type: 'string', value: str });
      continue;
    }

    // Numbers
    if (/[0-9]/.test(line[i]!)) {
      let num = '';
      while (i < line.length && /[0-9.xXa-fA-FeEoO_]/.test(line[i]!)) {
        num += line[i];
        i++;
      }
      tokens.push({ type: 'number', value: num });
      continue;
    }

    // Identifiers and keywords
    if (/[a-zA-Z_$]/.test(line[i]!)) {
      let ident = '';
      while (i < line.length && /[a-zA-Z0-9_$]/.test(line[i]!)) {
        ident += line[i];
        i++;
      }
      // Check for function call
      let j = i;
      while (j < line.length && /\s/.test(line[j]!)) j++;
      if (line[j] === '(') {
        tokens.push({ type: 'function', value: ident });
        continue;
      }
      // Check if keyword (case-insensitive for SQL)
      const checkIdent = language === 'sql' ? ident.toLowerCase() : ident;
      if (keywords.has(checkIdent)) {
        tokens.push({ type: 'keyword', value: ident });
        continue;
      }
      // Check for type-like names (PascalCase)
      if (/^[A-Z][a-zA-Z0-9]*$/.test(ident)) {
        tokens.push({ type: 'type', value: ident });
        continue;
      }
      tokens.push({ type: 'plain', value: ident });
      continue;
    }

    // Operators
    if (/[+\-*/%=<>!&|^~?:;,.]/.test(line[i]!)) {
      let op = line[i]!;
      i++;
      // Multi-char operators
      if ((op === '=' || op === '!' || op === '<' || op === '>') && line[i] === '=') {
        op += '=';
        i++;
        if (line[i] === '=') {
          op += '=';
          i++;
        }
      } else if ((op === '&' && line[i] === '&') || (op === '|' && line[i] === '|')) {
        op += line[i];
        i++;
      } else if (op === '=' && line[i] === '>') {
        op += '>';
        i++;
      } else if (op === '-' && line[i] === '>') {
        op += '>';
        i++;
      }
      tokens.push({ type: 'operator', value: op });
      continue;
    }

    // Brackets
    if (/[()[\]{}]/.test(line[i]!)) {
      tokens.push({ type: 'plain', value: line[i]! });
      i++;
      continue;
    }

    // Everything else
    tokens.push({ type: 'plain', value: line[i]! });
    i++;
  }

  return tokens;
}

export function renderHighlightedLine(tokens: Token[]): React.ReactElement[] {
  return tokens.map((token, index) =>
    React.createElement(Text, {
      key: index,
      color: TOKEN_COLORS[token.type],
    }, token.value)
  );
}

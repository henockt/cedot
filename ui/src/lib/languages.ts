import type { Extension } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { rust } from '@codemirror/lang-rust';
import { go } from '@codemirror/lang-go';
import { sql } from '@codemirror/lang-sql';

export interface Language {
  id: string
  name: string
  ext: string
  load: () => Extension
}

export const languages: Language[] = [
  { id: 'plaintext', name: 'Plain text', ext: 'txt', load: () => [] },
  { id: 'javascript', name: 'JavaScript', ext: 'js', load: () => javascript() },
  { id: 'typescript', name: 'TypeScript', ext: 'ts', load: () => javascript({ typescript: true }) },
  { id: 'python', name: 'Python', ext: 'py', load: () => python() },
  { id: 'html', name: 'HTML', ext: 'html', load: () => html() },
  { id: 'css', name: 'CSS', ext: 'css', load: () => css() },
  { id: 'json', name: 'JSON', ext: 'json', load: () => json() },
  { id: 'markdown', name: 'Markdown', ext: 'md', load: () => markdown() },
  { id: 'cpp', name: 'C / C++', ext: 'cpp', load: () => cpp() },
  { id: 'java', name: 'Java', ext: 'java', load: () => java() },
  { id: 'rust', name: 'Rust', ext: 'rs', load: () => rust() },
  { id: 'go', name: 'Go', ext: 'go', load: () => go() },
  { id: 'sql', name: 'SQL', ext: 'sql', load: () => sql() },
];

export const getLanguage = (id: string): Language =>
  languages.find((l) => l.id === id) ?? languages[0]!;

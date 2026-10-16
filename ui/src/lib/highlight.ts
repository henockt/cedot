import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

// colors come from CSS variables (app.css) so one style covers light and dark
export const highlight = syntaxHighlighting(
  HighlightStyle.define([
    { tag: [t.keyword, t.operatorKeyword, t.modifier, t.controlKeyword], color: 'var(--hl-keyword)' },
    { tag: [t.string, t.special(t.string), t.regexp, t.character], color: 'var(--hl-string)' },
    { tag: [t.number, t.bool, t.null, t.atom], color: 'var(--hl-number)' },
    { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: 'var(--hl-comment)', fontStyle: 'italic' },
    { tag: [t.function(t.variableName), t.function(t.propertyName), t.definition(t.function(t.variableName))], color: 'var(--hl-function)' },
    { tag: [t.typeName, t.className, t.namespace, t.definition(t.typeName)], color: 'var(--hl-type)' },
    { tag: [t.tagName, t.heading], color: 'var(--hl-keyword)', fontWeight: '600' },
    { tag: [t.attributeName, t.propertyName], color: 'var(--hl-property)' },
    { tag: [t.meta, t.processingInstruction, t.annotation], color: 'var(--hl-comment)' },
    { tag: t.link, textDecoration: 'underline' },
    { tag: t.emphasis, fontStyle: 'italic' },
    { tag: t.strong, fontWeight: '600' },
    { tag: t.invalid, color: 'var(--danger)' },
  ]),
);

import React from 'react';
import DOMPurify from 'dompurify';

export default function SafeHTML({ html, className }) {
  if (!html) return null;
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'ol', 'ul', 'li', 'blockquote', 'pre', 'code', 'a', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class']
  });
  return (
    <div
      className={`prose prose-sm prose-slate max-w-none ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}

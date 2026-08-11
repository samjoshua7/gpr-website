import React from 'react';

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const HighlightText = ({ text, highlight }) => {
  if (!highlight || !text) {
    return <span>{text}</span>;
  }

  // Convert everything to string safely
  const strText = String(text);
  const strHighlight = String(highlight);
  const escaped = escapeRegExp(strHighlight);

  const parts = strText.split(new RegExp(`(${escaped})`, 'gi'));

  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === strHighlight.toLowerCase() ? (
          <mark key={i} style={{ backgroundColor: '#ffeb3b', color: 'inherit', padding: 0, borderRadius: 2 }}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

import React, { useEffect, useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownViewer({
  content,
  loading,
  error,
  selectedPath,
}) {
  const viewerRef = useRef(null);
  const hasMermaid = useMemo(() => content.includes("```mermaid"), [content]);

  useEffect(() => {
    if (!hasMermaid || !viewerRef.current) {
      return undefined;
    }

    let canceled = false;
    import("mermaid")
      .then((mod) => {
        if (canceled) return;
        const mermaid = mod.default || mod;
        mermaid.initialize({ startOnLoad: false });
        return mermaid.run({
          nodes: viewerRef.current.querySelectorAll(".language-mermaid"),
        });
      })
      .catch((err) => {
        console.warn("Mermaid render failed", err);
      });

    return () => {
      canceled = true;
    };
  }, [content, hasMermaid]);
  if (loading) {
    return <div className="viewer__state">Loading content...</div>;
  }

  if (error) {
    return <div className="viewer__state viewer__state--error">{error}</div>;
  }

  if (!selectedPath) {
    return <div className="viewer__state">Select a file to begin.</div>;
  }

  return (
    <div className="viewer" ref={viewerRef}>
      <div className="viewer__path">{selectedPath}</div>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

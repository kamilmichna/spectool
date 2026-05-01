import React from "react";

function TaskMeta({ progress }) {
  if (!progress || progress.total === 0) {
    return null;
  }

  const percent = Math.round((progress.done / progress.total) * 100);

  return (
    <span className="sidebar__progress" title={`${progress.done}/${progress.total} Completed`}>
      <svg className="sidebar__progress-ring" viewBox="0 0 16 16">
        <circle className="sidebar__progress-ring-bg" cx="8" cy="8" r="6" />
        <circle 
          className="sidebar__progress-ring-fill" 
          cx="8" cy="8" r="6" 
          strokeDasharray="37.699"
          strokeDashoffset={37.699 - (percent / 100) * 37.699}
        />
      </svg>
    </span>
  );
}

function SectionBlock({ section, selectedPath, onSelect }) {
  return (
    <div className="sidebar__section">
      <div className="sidebar__section-title">{section.label}</div>
      {section.files &&
        section.files.map((file) => (
          <button
            key={file.path}
            className={
              file.path === selectedPath
                ? "sidebar__item sidebar__item--active"
                : "sidebar__item"
            }
            onClick={() => onSelect(file.path)}
            type="button"
          >
            <span className="sidebar__item-label" title={file.label}>{file.label}</span>
            <TaskMeta progress={file.progress} />
          </button>
        ))}
      {section.children &&
        section.children.map((child) => {
          const isSelected = child.files && child.files.some(f => f.path === selectedPath);
          return (
          <details key={child.id} className="sidebar__child" open={isSelected || undefined}>
            <summary className="sidebar__child-title" style={{ fontWeight: "bold", cursor: "pointer", userSelect: "none" }}>{child.label}</summary>
            {child.files &&
              child.files.map((file) => (
                <button
                  key={file.path}
                  className={
                    file.path === selectedPath
                      ? "sidebar__item sidebar__item--active"
                      : "sidebar__item"
                  }
                  onClick={() => onSelect(file.path)}
                  type="button"
                >
                  <span className="sidebar__item-label" title={file.label}>{file.label}</span>
                  <TaskMeta progress={file.progress} />
                </button>
              ))}
          </details>
        )})}
    </div>
  );
}

export default function Sidebar({ title, rootPath, sections, selectedPath, onSelect }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <div className="sidebar__logo">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
           <h2>{title}</h2>
        </div>
        <div className="sidebar__meta" title={rootPath}>
          {rootPath || "Waiting for project..."}
        </div>
      </div>
      
      <div className="sidebar__scroll-area">
        {(!sections || sections.length === 0) ? (
          <div className="sidebar__empty">No specs found.</div>
        ) : (
          sections.map((section) => (
            <SectionBlock
              key={section.id}
              section={section}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </aside>
  );
}

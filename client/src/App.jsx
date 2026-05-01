import React, { useEffect, useMemo, useRef, useState } from 'react';
import { fetchFile, fetchSpecs, fetchSearch } from './api';
import Sidebar from './components/Sidebar';
import MarkdownViewer from './components/MarkdownViewer';
import { connectWs } from './ws';
import { debounce } from './utils/debounce';
import {
  KBarProvider,
  KBarPortal,
  KBarPositioner,
  KBarAnimator,
  KBarSearch,
  KBarResults,
  useMatches,
  useKBar,
  useRegisterActions,
} from 'kbar';

function SearchUpdater({ searchText, setSelectedPath }) {
  const [results, setResults] = useState([]);
  const queryText = typeof searchText === 'string' ? searchText : String(searchText || '');

  useEffect(() => {
    if (!queryText || queryText.length < 2) {
      setResults([]);
      return;
    }
    let active = true;
    const timer = setTimeout(() => {
      fetchSearch(queryText)
        .then((res) => {
          if (!active) return;
          console.log('Search results:', res.results?.length);
          setResults(res.results || []);
        })
        .catch((err) => console.error('Search error:', err));
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [queryText]);

  const dynamicActions = useMemo(() => {
    return results.map((r, i) => ({
      id: `search-${queryText}-${r.path}-${i}`,
      name: `${r.label} (Content Match)`,
      section: r.section || 'Content Matches',
      subtitle: r.snippet,
      keywords: queryText, // prevent kbar from filtering it out
      perform: () => setSelectedPath(r.path),
    }));
  }, [results, queryText, setSelectedPath]);

  useRegisterActions(dynamicActions, [dynamicActions]);

  return null;
}

function RenderResults() {
  const { results } = useMatches();

  return (
    <KBarResults
      items={results}
      onRender={({ item, active }) =>
        typeof item === 'string' ? (
          <div style={{ padding: '8px 16px', fontSize: '12px', textTransform: 'uppercase', opacity: 0.5 }}>{item}</div>
        ) : (
          <div
            style={{
              padding: '12px 16px',
              background: active ? 'var(--color-bg-hover, rgba(255,255,255,0.1))' : 'transparent',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div>{item.name}</div>
            {item.subtitle && <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '4px' }}>{item.subtitle}</div>}
          </div>
        )
      }
    />
  );
}

function KBarLauncher({ onOpen }) {
  const { query } = useKBar();

  const handleOpen = () => {
    query.toggle();
    onOpen();
  };

  return (
    <button className="kbar-launcher" type="button" onClick={handleOpen}>
      <span>Search</span>
      <span className="kbar-launcher__hint">Cmd+K</span>
    </button>
  );
}

function findFirstFile(sections) {
  for (const section of sections || []) {
    if (section.files && section.files.length > 0) {
      return section.files[0].path;
    }
    for (const child of section.children || []) {
      if (child.files && child.files.length > 0) {
        return child.files[0].path;
      }
    }
  }
  return null;
}

export default function App() {
  const [specs, setSpecs] = useState(null);
  const [selectedPath, setSelectedPath] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refreshRef = useRef(null);
  const searchInputRef = useRef(null);
  const [searchText, setSearchText] = useState('');

  const sections = useMemo(() => specs?.sections || [], [specs]);

  const actions = useMemo(() => {
    const list = [];
    if (!specs?.sections) return list;

    specs.sections.forEach((section) => {
      section.files?.forEach((file) => {
        list.push({
          id: file.path,
          name: file.label,
          section: section.label,
          perform: () => setSelectedPath(file.path),
        });
      });
      section.children?.forEach((child) => {
        child.files?.forEach((file) => {
          list.push({
            id: file.path,
            name: `${child.label} - ${file.label}`,
            section: section.label,
            perform: () => setSelectedPath(file.path),
          });
        });
      });
    });
    return list;
  }, [specs]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchSpecs()
      .then((data) => {
        if (!active) return;
        setSpecs(data);
        const firstPath = findFirstFile(data.sections);
        setSelectedPath(firstPath);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Failed to load specs');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!selectedPath) {
      return undefined;
    }

    setLoading(true);
    fetchFile(selectedPath)
      .then((data) => {
        if (!active) return;
        setContent(data.content || '');
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Failed to load file');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedPath]);

  useEffect(() => {
    if (!selectedPath) {
      return undefined;
    }

    if (!refreshRef.current) {
      refreshRef.current = debounce(() => {
        fetchFile(selectedPath)
          .then((data) => setContent(data.content || ''))
          .catch((err) => setError(err.message || 'Failed to refresh file'));
      }, 150);
    }

    const socket = connectWs({
      onMessage: (message) => {
        if (message.type === 'file_changed' && message.path === selectedPath) {
          refreshRef.current();
        }
      },
    });

    return () => {
      socket.close();
    };
  }, [selectedPath]);

  const title = specs?.framework ? `Framework: ${specs.framework}` : 'spectool';

  const focusSearchInput = () => {
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 0);
  };

  return (
    <KBarProvider actions={actions}>
      <SearchUpdater searchText={searchText} setSelectedPath={setSelectedPath} />
      <KBarPortal>
        <KBarPositioner style={{ zIndex: 100, background: 'rgba(0, 0, 0, 0.5)' }}>
          <KBarAnimator
            style={{
              maxWidth: '600px',
              width: '100%',
              background: 'var(--color-bg-sidebar, #1e1e1e)',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            }}
          >
            <KBarSearch
              ref={searchInputRef}
              onInput={(event) => setSearchText(event.currentTarget.value)}
              style={{
                padding: '16px',
                fontSize: '16px',
                width: '100%',
                boxSizing: 'border-box',
                outline: 'none',
                border: 'none',
                background: 'transparent',
                color: 'var(--color-text, #fff)',
                borderBottom: '1px solid var(--color-border, #333)',
              }}
              defaultPlaceholder="Search specs... (Press cmd+k or ctrl+k)"
            />
            <RenderResults />
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      <div className="app">
        <Sidebar
          title={title}
          rootPath={specs?.rootPath}
          sections={sections}
          selectedPath={selectedPath}
          onSelect={setSelectedPath}
        />
        <main className="app__main">
          <header className="app__header">
            <div className="app__breadcrumbs">{selectedPath ? selectedPath : 'Select a spec to view'}</div>
            <div style={{ marginLeft: 'auto' }}>
              <KBarLauncher onOpen={focusSearchInput} />
            </div>
          </header>
          <div className="app__content">
            <MarkdownViewer content={content} loading={loading} error={error} selectedPath={selectedPath} />
          </div>
        </main>
      </div>
    </KBarProvider>
  );
}

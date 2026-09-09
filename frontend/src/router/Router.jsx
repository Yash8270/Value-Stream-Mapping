import React, { createContext, useContext, useState, useEffect } from 'react';

const RouterContext = createContext({
  location: {
    pathname: typeof window !== 'undefined' ? window.location.pathname : '/',
    search: typeof window !== 'undefined' ? window.location.search : '',
    hash: typeof window !== 'undefined' ? window.location.hash : '',
  },
  navigate: () => {},
});

export function BrowserRouter({ children }) {
  const [location, setLocation] = useState(() => ({
    pathname: typeof window !== 'undefined' ? window.location.pathname : '/',
    search: typeof window !== 'undefined' ? window.location.search : '',
    hash: typeof window !== 'undefined' ? window.location.hash : '',
  }));

  useEffect(() => {
    const handlePopState = () => {
      setLocation({
        pathname: window.location.pathname || '/',
        search: window.location.search || '',
        hash: window.location.hash || '',
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (to, options = {}) => {
    if (typeof to === 'number') {
      window.history.go(to);
      return;
    }

    const path = typeof to === 'string' ? to : (to?.pathname || '/');
    if (options.replace) {
      window.history.replaceState({}, '', path);
    } else {
      window.history.pushState({}, '', path);
    }

    const cleanPath = path.split('?')[0].split('#')[0] || '/';
    setLocation({
      pathname: cleanPath,
      search: path.includes('?') ? '?' + path.split('?')[1].split('#')[0] : '',
      hash: path.includes('#') ? '#' + path.split('#')[1] : '',
    });
  };

  return (
    <RouterContext.Provider value={{ location, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(RouterContext);
  if (!context || !context.location) {
    return {
      pathname: typeof window !== 'undefined' ? window.location.pathname : '/',
      search: typeof window !== 'undefined' ? window.location.search : '',
      hash: typeof window !== 'undefined' ? window.location.hash : '',
    };
  }
  return context.location;
}

export function useNavigate() {
  const context = useContext(RouterContext);
  if (!context || !context.navigate) {
    return (to, options = {}) => {
      if (typeof window !== 'undefined') {
        if (options.replace) window.history.replaceState({}, '', to);
        else window.history.pushState({}, '', to);
        window.dispatchEvent(new Event('popstate'));
      }
    };
  }
  return context.navigate;
}

const ParamsContext = createContext({});

export function useParams() {
  return useContext(ParamsContext) || {};
}

function matchPath(pattern, pathname) {
  if (!pattern || !pathname) return null;
  if (pattern === '*') return { params: {} };
  
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = pathname.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length && !pattern.endsWith('/*')) {
    return null;
  }

  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    if (patternPart.startsWith(':')) {
      const paramName = patternPart.slice(1);
      params[paramName] = decodeURIComponent(pathPart || '');
    } else if (patternPart !== pathPart) {
      return null;
    }
  }

  return { params };
}

export function Routes({ children }) {
  const location = useLocation();
  const currentPath = location?.pathname || '/';
  const childrenArray = React.Children.toArray(children);

  for (const child of childrenArray) {
    if (!React.isValidElement(child)) continue;
    const { path, element } = child.props;
    const match = matchPath(path, currentPath);

    if (match) {
      return (
        <ParamsContext.Provider value={match.params}>
          {element}
        </ParamsContext.Provider>
      );
    }
  }

  return null;
}

export function Route({ path, element }) {
  return element;
}

export function Navigate({ to, replace = true }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace });
  }, [to, replace, navigate]);
  return null;
}

export function Link({ to, children, style, className, onClick, ...props }) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (onClick) onClick(e);
    if (!e.defaultPrevented && e.button === 0 && !e.metaKey && !e.altKey && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      navigate(to);
    }
  };

  return (
    <a href={to} onClick={handleClick} style={style} className={className} {...props}>
      {children}
    </a>
  );
}

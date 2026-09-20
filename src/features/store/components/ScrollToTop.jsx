import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * ScrollToTop ensures that page navigations reset the window scroll to (0, 0),
 * while preserving natural browser scroll behavior on history back/forward (POP) actions.
 */
export const ScrollToTop = () => {
  const { pathname, search } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    // Only reset scroll on PUSH or REPLACE navigation, not on POP (back/forward)
    if (navigationType !== 'POP') {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant',
      });
    }
  }, [pathname, search, navigationType]);

  return null;
};

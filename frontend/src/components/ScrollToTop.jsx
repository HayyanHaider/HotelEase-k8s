import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
 const { pathname } = useLocation();

  useEffect(() => {
   if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
   }
  }, [pathname]);

 return null;
};

export default ScrollToTop;


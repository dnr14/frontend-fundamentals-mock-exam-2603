import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export function useNavigationMessage(): string | null {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.message) {
      navigate(location.pathname, { replace: true });
    }
  }, [navigate, location.pathname, location.state]);

  return location.state?.message ?? null;
}

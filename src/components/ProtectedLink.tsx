import { ReactNode, MouseEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  target?: string;
  rel?: string;
  onRequireAuth?: () => void;
}

export function ProtectedLink({
  href,
  children,
  className,
  onClick,
  target,
  rel,
  onRequireAuth,
}: ProtectedLinkProps) {
  const { isAuthenticated } = useAuth();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!isAuthenticated) {
      e.preventDefault();
      if (onRequireAuth) {
        onRequireAuth();
      }
      return;
    }

    if (onClick) {
      onClick(e);
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={className}
      target={target}
      rel={rel}
    >
      {children}
    </a>
  );
}


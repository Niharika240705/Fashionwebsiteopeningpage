import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
    
    // You can log to an error reporting service here
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
          <div className="max-w-md w-full text-center space-y-6">
            <h1 className="text-4xl font-bold text-black">Oops!</h1>
            <p className="text-black/60">
              Something went wrong. Please try refreshing the page.
            </p>
            {this.state.error && (
              <details className="text-left bg-white p-4 rounded-lg border border-black/10">
                <summary className="cursor-pointer text-sm font-medium mb-2">
                  Error Details
                </summary>
                <pre className="text-xs text-black/60 overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="bg-black text-white px-6 py-3 rounded-full hover:bg-black/90 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


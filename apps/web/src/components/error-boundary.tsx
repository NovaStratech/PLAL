"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

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

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-5 text-center">
          <h1 className="text-3xl font-bold text-ink">Oups !</h1>
          <p className="mt-3 max-w-md text-ink/60">
            Quelque chose s&apos;est mal passé. Rafraîchis la page ou réessaie.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="btn-primary mt-6"
          >
            Recharger
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="mt-6 max-w-lg overflow-auto rounded-xl bg-ink p-4 text-left text-xs text-white/60">
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
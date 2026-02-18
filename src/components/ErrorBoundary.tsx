import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
          <p className="font-serif text-2xl text-foreground mb-2">Algo salió mal</p>
          <p className="text-muted-foreground text-sm mb-6">
            {this.state.error?.message ?? "Error inesperado"}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-primary underline text-sm"
          >
            Intentar de nuevo
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

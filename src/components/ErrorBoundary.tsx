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

  private isChunkLoadError(error: Error): boolean {
    return (
      error.message.includes("Failed to fetch dynamically imported module") ||
      error.message.includes("Importing a module script failed") ||
      error.message.includes("Loading chunk") ||
      error.message.includes("Loading CSS chunk")
    );
  }

  render() {
    if (this.state.hasError) {
      if (this.state.error && this.isChunkLoadError(this.state.error)) {
        return (
          <div className="min-h-screen bg-background flex items-center justify-center px-5">
            <div className="text-center max-w-md space-y-4">
              <span className="text-4xl block" aria-hidden="true">📡</span>
              <h1 className="font-serif text-2xl text-foreground">
                Problema de conexión
              </h1>
              <p className="text-muted-foreground text-sm">
                No pudimos cargar esta página. Revisa tu conexión a internet e intenta de nuevo.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <button
                  onClick={() => {
                    this.setState({ hasError: false, error: null });
                  }}
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/30 hover:bg-primary/90 transition-colors"
                >
                  Reintentar
                </button>
                <a
                  href="/"
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
                >
                  Ir al inicio
                </a>
              </div>
            </div>
          </div>
        );
      }

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

import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Unhandled React error", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
          <div className="w-full max-w-lg rounded-[28px] border border-red-400/20 bg-white/5 p-6 shadow-2xl backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-300">
              Falha na renderizacao
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight">
              O frontend encontrou um erro inesperado.
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              Revise a rota atual, recarregue a aplicacao e confirme se o backend esta acessivel.
            </p>
            {import.meta.env.DEV ? (
              <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950/70 p-4 text-xs text-red-200">
                {this.state.error.message}
              </pre>
            ) : null}
            <button
              type="button"
              onClick={this.handleReload}
              className="mt-5 inline-flex rounded-full bg-brand px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
            >
              Recarregar pagina
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

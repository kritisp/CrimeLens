import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-navy-900 border border-red-500/30 rounded-2xl m-6 space-y-4 text-white font-mono text-xs shadow-glow">
          <h1 className="text-sm font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
            ⚠️ React Runtime Exception
          </h1>
          <p className="text-slate-300 font-bold">{this.state.error?.toString()}</p>
          <pre className="p-4 bg-navy-950/80 rounded-xl border border-white/5 overflow-auto max-h-64 whitespace-pre-wrap text-slate-400">
            {this.state.error?.stack}
          </pre>
          <button 
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg uppercase tracking-wider text-[10px] transition-colors"
          >
            Acknowledge & Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;

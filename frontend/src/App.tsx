import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Analytics } from "./pages/Analytics";
import { AIAssistant } from "./pages/AIAssistant";
import { Cases } from "./pages/Cases";
import { CaseDetailPage } from "./pages/CaseDetailPage";
import { Dashboard } from "./pages/Dashboard";
import { Officers } from "./pages/Officers";
import { RegisterFIR } from "./pages/RegisterFIR";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { CrimeIntelligence } from "./pages/CrimeIntelligence";
import { NetworkExplorer } from "./pages/NetworkExplorer";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Login } from "./pages/Login";
import JudgePresentationConsole from "./components/JudgePresentationConsole";

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/cases/:id" element={<CaseDetailPage />} />
          <Route path="/register-fir" element={<RegisterFIR />} />
          <Route path="/crime-intelligence" element={<CrimeIntelligence />} />
          <Route path="/intelligence" element={<CrimeIntelligence />} />
          <Route path="/network-explorer" element={<NetworkExplorer />} />
          <Route path="/network" element={<NetworkExplorer />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/chat" element={<AIAssistant />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/officers" element={<Officers />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        <JudgePresentationConsole />
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;

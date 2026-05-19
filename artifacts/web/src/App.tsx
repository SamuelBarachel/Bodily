import { Route, Switch } from "wouter";
import { JournalProvider } from "@/context/JournalContext";
import { Toaster } from "sonner";
import { Layout } from "./components/Layout";
import Today from "./pages/Today";
import BodyMap from "./pages/BodyMap";
import Calendar from "./pages/Calendar";
import History from "./pages/History";

export default function App() {
  return (
    <JournalProvider>
      <Layout>
        <Switch>
          <Route path="/" component={Today} />
          <Route path="/today" component={Today} />
          <Route path="/body" component={BodyMap} />
          <Route path="/calendar" component={Calendar} />
          <Route path="/history" component={History} />
        </Switch>
      </Layout>
      <Toaster position="top-center" richColors />
    </JournalProvider>
  );
}

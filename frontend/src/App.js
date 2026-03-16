import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import ThemeToggle from "./components/Theme/ThemeToggle";
import { ThemeProvider } from "./components/Theme/ThemeProvider";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      <ThemeToggle />
    </ThemeProvider>
  );
}

export default App;

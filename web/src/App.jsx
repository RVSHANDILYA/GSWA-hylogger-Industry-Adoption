import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import ExplorerPage from "./pages/ExplorerPage.jsx";
import ResultsPage from "./pages/ResultsPage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

/*
  Routes for the whole site.

  Everything sits under one Layout route, so the nav bar and footer are
  mounted once and stay put while the page underneath changes. Adding a page
  means adding a Route here, a file in src/pages, and an entry in NAV_ITEMS in
  components/layout/NavBar.jsx.
*/
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="explorer" element={<ExplorerPage />} />
          <Route path="results" element={<ResultsPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

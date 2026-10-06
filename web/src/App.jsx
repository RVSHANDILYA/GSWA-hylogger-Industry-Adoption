import { lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout.jsx";
const LandingPage = lazy(() => import("./pages/LandingPage.jsx"));
const ExplorerPage = lazy(() => import("./pages/ExplorerPage.jsx"));
const ResultsPage = lazy(() => import("./pages/ResultsPage.jsx"));
const AboutPage = lazy(() => import("./pages/AboutPage.jsx"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage.jsx"));

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

import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout";
import { Home, CategoryPage, About } from "@/pages";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/:categoryId" element={<CategoryPage />} />
      </Routes>
    </Layout>
  );
}

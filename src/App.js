import React, { useEffect, useState } from "react";
import PDFParser from "./PdfParser";

function App() {
  const [darkMode, setDarkMode] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => setDarkMode(e.matches);

    mediaQuery.addEventListener("change", handleChange);
    document.body.classList.toggle("dark-mode", darkMode);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [darkMode]);

  return (
    <div className="App">
      <PDFParser />
    </div>
  );
}

export default App;

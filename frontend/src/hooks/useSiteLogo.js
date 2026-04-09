import { useEffect, useState } from "react";

const API = "http://localhost:5000/api";
const CACHE_KEY = "siteLogo";

const normalizeLogo = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `http://localhost:5000${value}`;
  return `http://localhost:5000/${value}`;
};

const readCachedLogo = () => {
  try {
    return localStorage.getItem(CACHE_KEY) || "";
  } catch {
    return "";
  }
};

export default function useSiteLogo() {
  const [logo, setLogo] = useState(readCachedLogo);

  useEffect(() => {
    let mounted = true;

    const fetchLogo = async () => {
      try {
        const res = await fetch(`${API}/site/logo`);
        if (!res.ok) return;
        const data = await res.json();
        const next = data?.logo ? String(data.logo) : "";

        if (mounted) {
          setLogo(next);
        }
        localStorage.setItem(CACHE_KEY, next);
      } catch {
        // ignore
      }
    };

    const handleLogoUpdate = () => {
      setLogo(readCachedLogo());
    };

    fetchLogo();
    window.addEventListener("site-logo-updated", handleLogoUpdate);
    window.addEventListener("storage", handleLogoUpdate);

    return () => {
      mounted = false;
      window.removeEventListener("site-logo-updated", handleLogoUpdate);
      window.removeEventListener("storage", handleLogoUpdate);
    };
  }, []);

  return normalizeLogo(logo);
}

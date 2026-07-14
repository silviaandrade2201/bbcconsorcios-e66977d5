import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import logoAsset from "@/assets/logo-bbc.jpeg.asset.json";

export const Route = createFileRoute("/bem-vindo")({
  head: () => ({
    meta: [
      { title: "Bem-vindo — BBC Consórcios" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BemVindoPage,
});

function BemVindoPage() {
  const navigate = useNavigate();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 2500);
    const redirectTimer = setTimeout(() => navigate({ to: "/cliente" }), 3000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(redirectTimer);
    };
  }, [navigate]);

  return (
    <div
      className={`grid min-h-screen place-items-center bg-background transition-opacity duration-500 ease-out ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-6 text-center animate-scale-in">
        <img
          src={logoAsset.url}
          alt="BBC Consórcios"
          className="h-28 w-28 rounded-3xl object-cover shadow-xl ring-1 ring-border"
        />
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">Bem-vindo</h1>
          <p className="mt-1 text-sm text-muted-foreground">BBC Consórcios</p>
        </div>
      </div>
    </div>
  );
}

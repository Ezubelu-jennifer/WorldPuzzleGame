import React from "react";
import { HomeScreen } from "@/components/home/home-screen";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <HomeScreen />
      </main>
      <Footer />
    </div>
  );
}

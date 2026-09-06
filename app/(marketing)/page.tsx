import type React from "react";
import Footer from "./_components/Footer";
import { Heading } from "./_components/Heading";
import Heroes from "./_components/Heroes";

/**
 * Landing page that showcases Joker Notes features and funnels visitors to authentication.
 * Composed of hero sections and a footer specific to marketing content.
 *
 * @returns Marketing homepage layout describing Joker Notes.
 */
const MarketingPage: React.FC = () => {
  return (
    <div className="flex min-h-full flex-col dark:bg-[#1F1F1F]">
      <div className="flex flex-1 flex-col items-center justify-center gap-y-8 px-6 pb-10 text-center md:justify-start">
        <Heading />
        <Heroes />
      </div>
      <Footer />
    </div>
  );
};

export default MarketingPage;

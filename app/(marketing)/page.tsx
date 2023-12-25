import React from "react";
import Heroes from "./_components/Heroes";
import Footer from "./_components/Footer";
import { Heading } from "./_components/Heading";

type pageProps = {};

const MarketingPage: React.FC<pageProps> = () => {
  return (
    <div
      className="
				flex flex-col 
				min-h-full 
			dark:bg-[#1F1F1F]"
    >
      <div
        className="
					flex flex-col flex-1 
					items-center justify-center md:justify-start 
					text-center 
					gap-y-8 
					px-6 pb-10
				"
      >
        <Heading />
        <Heroes />
      </div>
      <Footer />
    </div>
  );
};
export default MarketingPage;

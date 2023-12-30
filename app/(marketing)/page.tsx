import React from "react";
import Heroes from "./_components/Heroes";
import Footer from "./_components/Footer";
import { Heading } from "./_components/Heading";

/**
 * This is the marketing page where users can learn more about the application.
 * From here, the user can also sign up or login to the application.
 * @returns (React.ReactNode) The marketing page
 */
const MarketingPage: React.FC = () => {
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

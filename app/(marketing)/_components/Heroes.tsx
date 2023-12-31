import Image from "next/image";
import React from "react";

/**
 * Displays the hero images on the marketing page.
 * The images are conditionally rendered depending on the theme.
 * One of the images is hidden on mobile devices.
 * @returns (React.FC): Heroes component
 */
const Heroes: React.FC = () => {
  return (
    <div
      className="
				flex flex-col 
				items-center justify-center 
				max-w-5xl
			"
    >
      <div className="flex items-center">
        <div
          className="
						relative 
						w-[300px] h-[300px] 
						sm:w-[350px] sm:h-[350px] 
						md:h-[400px] md:w-[400px]
					"
        >
          {/* Light Mode Theme */}
          <Image
            src="/documents/documents-light.png"
            fill
            className="object-contain dark:hidden"
            alt="Documents"
          />
          {/* Dark Mode Theme */}
          <Image
            src="/documents/documents-dark.png"
            fill
            className="object-contain hidden dark:block"
            alt="Documents"
          />
        </div>
        <div
          className="
						relative 
						h-[400px] w-[400px] 
						hidden md:block"
        >
          {/* Light Mode Theme */}
          <Image
            src="/reading/reading-light.png"
            fill
            className="object-contain dark:hidden"
            alt="Reading"
          />
          {/* Dark Mode Theme */}
          <Image
            src="/reading/reading-dark.png"
            fill
            className="object-contain hidden dark:block"
            alt="Reading"
          />
        </div>
      </div>
    </div>
  );
};

export default Heroes;

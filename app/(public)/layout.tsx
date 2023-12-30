import React from "react";

type PublicLayout = {
  children: React.ReactNode;
};

/**
 * Layout component that applies to all pages within the `(public)` directory.
 * The providers from the root layout component are inherited by this component.
 * The structure of the layout is overwritten.
 * @param children (React.ReactNode): The children to render
 * @returns (React.FC): The public layout
 */
const PublicLayout: React.FC<PublicLayout> = ({ children }) => {
  return <div className="h-full dark:bg-[#1F1F1F]">{children}</div>;
};
export default PublicLayout;

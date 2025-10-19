import React from "react";

/**
 * Props for the public layout wrapper rendered under the marketing routes.
 */
type PublicLayout = {
  children: React.ReactNode;
};

/**
 * Layout for public marketing pages that applies a full-height container and dark background.
 * Inherits shared providers from the root layout while customizing surface styling.
 *
 * @param param0 Props containing the marketing children.
 * @param param0.children Marketing route subtree to render.
 * @returns Wrapper applying the shared public layout styling.
 * @see https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts
 */
const PublicLayout: React.FC<PublicLayout> = ({ children }) => {
  return <div className="h-full dark:bg-[#1F1F1F]">{children}</div>;
};
export default PublicLayout;

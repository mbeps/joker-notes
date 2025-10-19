import Navbar from "./_components/Navbar";

/**
 * Layout dedicated to marketing pages that injects the marketing navbar and spacing.
 * Still inherits providers defined at the root layout level.
 *
 * @param param0 Props containing the marketing children.
 * @param param0.children Marketing content to render beneath the navbar.
 * @returns Marketing layout scaffold including the shared navbar.
 * @see https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts
 */
const MarketingLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-full dark:bg-[#1F1F1F]">
      <Navbar />
      <main className="h-full pt-40">{children}</main>
    </div>
  );
};

export default MarketingLayout;

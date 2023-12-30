import Navbar from "./_components/Navbar";

/**
 * This applies the layout for the marketing pages.
 * This overrides the default layout for the marketing pages.
 * However, the providers from the main layout are still available.
 * A navbar is also added to the layout meaning that it will be available to all marketing pages.
 * @param children (React.ReactNode) The children to render to follow the layout.
 * @returns (React.ReactNode) The layout pages within the `(marketing)` folder.
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

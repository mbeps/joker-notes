import { Spinner } from "@/components/spinner/spinner";

/**
 * Root loading boundary for Joker Notes.
 * Automatically displayed by Next.js Suspense during page transitions and server rendering.
 *
 * @returns Centered large spinner matching the workspace loader.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/loading
 */
export default function RootLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

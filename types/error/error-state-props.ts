/**
 * Configuration options and action callbacks for the reusable ErrorState presentation component.
 */
export interface ErrorStateProps {
  /**
   * The caught runtime error instance, optionally containing an error digest.
   */
  error?: Error & { digest?: string };
  /**
   * Function to reset the error boundary and re-render the segment.
   */
  reset?: () => void;
  /**
   * Primary headline displayed to the user.
   * @default "Something went wrong!"
   */
  title?: string;
  /**
   * Explanatory text beneath the headline describing the failure.
   */
  description?: string;
  /**
   * Action button text for the navigation fallback button.
   * @default "Go back"
   */
  buttonText?: string;
  /**
   * Centralised route target navigated to on fallback button click.
   * @default ROUTES.DOCUMENTS.path
   */
  buttonHref?: string;
  /**
   * Accessible description for the error imagery.
   * @default "Error"
   */
  imageAlt?: string;
  /**
   * Text for the retry button if reset is provided.
   * @default "Try again"
   */
  retryText?: string;
}

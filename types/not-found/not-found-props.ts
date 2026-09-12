/**
 * Props for the NotFound presentation component.
 */
export interface NotFoundProps {
  /**
   * Primary headline displayed to the user.
   * @default "Page not found"
   */
  title?: string;
  /**
   * Explanatory text beneath the headline.
   * @default "The page you are looking for does not exist."
   */
  description?: string;
  /**
   * Action button text.
   * @default "Go back"
   */
  buttonText?: string;
  /**
   * Centralised route target navigated to on button click.
   * @default ROUTES.DOCUMENTS.path
   */
  buttonHref?: string;
  /**
   * Accessible description for the error imagery.
   * @default "Not found"
   */
  imageAlt?: string;
}

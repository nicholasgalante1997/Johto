export default class MissingBrowserRouterLayerProps extends Error {
  constructor() {
    const name = 'MissingBrowserRouterLayerPropsError';
    const message =
      'You are missing required props [router] necessary to render <BrowserRouterLayer/>';
    super(message);
    this.name = name;
  }
}

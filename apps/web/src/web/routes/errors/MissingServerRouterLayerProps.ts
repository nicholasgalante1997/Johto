export default class MissingServerRouterLayerProps extends Error {
  constructor() {
    const name = 'MissingServerRouterLayerPropsError';
    const message =
      'You are missing required props [router, context] necessary to render <ServerRouterLayer />';
    super(message);
    this.name = name;
  }
}

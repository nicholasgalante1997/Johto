import 'dotenv/config.js';
import {
  concurrent_build,
  esm_react_browser_app,
  report_outputs
} from './build/index.js';

try {
  const outputs = await concurrent_build(esm_react_browser_app);
  report_outputs(outputs);
} catch (e) {
  console.error('Build process failed:', e);
}

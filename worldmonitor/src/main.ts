import './style.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Dashboard } from './ui/Dashboard';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('App root not found');

const dashboard = new Dashboard(app);
dashboard.mount();

if (import.meta.hot) {
  import.meta.hot.dispose(() => dashboard.unmount());
}

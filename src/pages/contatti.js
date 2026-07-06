import '../styles/main.css';
import { siteConfig } from '../../config/site.config.js';
import { albums } from '../../config/albums.config.js';
import { validateConfig } from '../utils/validateConfig.js';

validateConfig(siteConfig, albums);

console.log('[portfolio] contatti.js caricato');

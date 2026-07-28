import { mount } from 'svelte';
import App from './app.svelte';
import '../../tailwind.css';
import './styles.css';

mount(App, { target: document.getElementById('root')! });

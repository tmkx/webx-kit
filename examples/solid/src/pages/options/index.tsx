import { render } from 'solid-js/web';
import { App } from './app';
import '../../global.less';
import './style.less';

render(() => <App />, document.getElementById('root')!);

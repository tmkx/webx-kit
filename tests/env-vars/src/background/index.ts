// @ts-expect-error
import config from 'http://localhost:8080/?id=$WEBX_PUBLIC_CONFIG_ID';

console.log(config, process.env.WEBX_PUBLIC_CONFIG_ID);

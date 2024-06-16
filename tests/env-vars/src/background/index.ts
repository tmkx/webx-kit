// @ts-expect-error
import config from 'https://httpbin.org/get?id=$WEBX_PUBLIC_CONFIG_ID';

console.log(config, process.env.WEBX_PUBLIC_CONFIG_ID);

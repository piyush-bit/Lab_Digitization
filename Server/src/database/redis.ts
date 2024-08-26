import {createClient} from 'redis';
export const client = createClient()
export const publisher = client.duplicate();
export const subscriber = client.duplicate();
client.connect()
client.on('error', (err) => console.log('Redis Client Error', err))
client.on('ready', () => console.log('Redis Client Ready'))
import {initClient} from './config.js';

const client={}

function getClient(success) { 
        if (!success) success = ()=> console.log("connected"); 
        const client = initClient(); 
        const connectOptions = { 
          useSSL: true, 
          timeout: 3, 
          mqttVersion: 4, 
          onSuccess: success 
        }; 
        client.connect(connectOptions); 
        return client;  
    }  

export {getClient}
    
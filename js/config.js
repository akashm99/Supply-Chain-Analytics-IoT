// import { $ } from './data.js';
import {region, endpoint, aws_key, aws_secret} from './apikey.js';
// gets MQTT client 
function initClient() {    
        const clientId = Math.random().toString(36).substring(7); 
        const _client = new Paho.MQTT.Client(getEndpoint(), clientId);
     
        // publish method added to simplify messaging 
        _client.publish = function(topic, payload) { 
            let payloadText = JSON.stringify(payload); 
            let message = new Paho.MQTT.Message(payloadText); 
            message.destinationName = topic; 
            message.qos = 0; 
            _client.send(message); 
        } 
        return _client; 
    } 

    
    function getEndpoint() { 
        // WARNING!!! It is not recommended to expose 
        // sensitive credential information in code. 
        // Consider setting the following AWS values 
        // from a secure source. 
        
            // example: us-east-1 
            const REGION = region; 
        
            // example: blahblahblah-ats.iot.your-region.amazonaws.com 
            const IOT_ENDPOINT = endpoint; 
        
            // your AWS access key ID 
            const KEY_ID = aws_key;
        
            // your AWS secret access key 
            const SECRET_KEY = aws_secret;
        
            // date & time 
            const dt = (new Date()).toISOString().replace(/[^0-9]/g, ""); 
            const ymd = dt.slice(0,8); 
            const fdt = `${ymd}T${dt.slice(8,14)}Z` 
            const scope = `${ymd}/${REGION}/iotdevicegateway/aws4_request`; 
            const ks = encodeURIComponent(`${KEY_ID}/${scope}`); 
            let qs = `X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=${ks}&X-Amz-Date=${fdt}&X-Amz-SignedHeaders=host`; 
            const req = `GET\n/mqtt\n${qs}\nhost:${IOT_ENDPOINT}\n\nhost\n${p4.sha256('')}`; 
            qs += '&X-Amz-Signature=' + p4.sign( 
                p4.getSignatureKey( SECRET_KEY, ymd, REGION, 'iotdevicegateway'), 
                `AWS4-HMAC-SHA256\n${fdt}\n${scope}\n${p4.sha256(req)}`
            ); 
            return `wss://${IOT_ENDPOINT}/mqtt?${qs}`; 
        }  


        const _ = atob;
        function p4(){} 
        p4.sign = function(key, msg) { 
            const hash = CryptoJS.HmacSHA256(msg, key); 
            return hash.toString(CryptoJS.enc.Hex); 
        }; 
        p4.sha256 = function(msg) { 
            const hash = CryptoJS.SHA256(msg); 
            return hash.toString(CryptoJS.enc.Hex); 
        }; 
        p4.getSignatureKey = function(key, dateStamp, regionName, serviceName) { 
            const kDate = CryptoJS.HmacSHA256(dateStamp, 'AWS4' + key); 
            const kRegion = CryptoJS.HmacSHA256(regionName, kDate); 
            const kService = CryptoJS.HmacSHA256(serviceName, kRegion); 
            const kSigning = CryptoJS.HmacSHA256('aws4_request', kService); 
            return kSigning; 
        };  

export{initClient}
        
        
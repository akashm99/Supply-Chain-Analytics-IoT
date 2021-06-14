import {getClient} from './iot.js';
import {here_api} from './apikey.js';
// Obtain reference to #mapContainer in DOM
const container = document.getElementById('mapContainer');
// get value for apikey for use with map and/or REST
// const apikey = atob("TVdJblZtRHktR2wtZFFOQ3c5STV5eGY3MlUzTUJCcU5hUHIzWkZPUTBiOA==");
// Store initialized platform object
// const platform = new H.service.Platform({"apikey": apikey});
const platform = new H.service.Platform({"apikey": here_api});
// Store reference to layers object
const layers = platform.createDefaultLayers();
// create initial center point for map and/or REST
const initPoint = new H.geo.Point(47.6132, -122.3301);
// Create map object initialized with container, layers, and geolocation
const map = new H.Map(container, layers.vector.normal.map, {
    center: initPoint,
    zoom: 14,
    pixelRatio: window.devicePixelRatio || 1
});
// Create behavior object initialized with map object
const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
// Create UI object associated with map object and layers object
const ui = H.ui.UI.createDefault(map, layers);
// resize map when window is resized
const provider = map.getBaseLayer().getProvider();
const style = new H.map.Style('https://kuberaspeaking.github.io/Styles/cesStyle.yaml',
'https://js.api.here.com/v3/3.1/styles/omv/');
provider.setStyle(style);
map.getViewModel().setLookAtData({
    tilt: 45
});
window.addEventListener('resize', () => map.getViewPort().resize());

// services
const service = platform.getSearchService();
let client = {}; // MQTT client - see init()

// data
let consumerData = {
    id : "",
    address : "",
    point : {}
};

// add draggable marker
const iconConsumer = new H.map.Icon("/images/consumer.png");
const dragMarker = new H.map.Marker(initPoint, {icon:iconConsumer}, {volatility:true}); 
dragMarker.draggable = true;
map.addObject(dragMarker);

// helper to display formatted lat,lng
function getGeoLabel(point) {
    return "" + Math.abs(point.lat.toFixed(4)) +
    ((point.lat > 0) ? 'N' : 'S') +
    '<br />' + Math.abs(point.lng.toFixed(4)) +
    ((point.lng > 0) ? 'E' : 'W');
}
// dragging events
map.addEventListener('dragstart', function(ev) {
        let target = ev.target,
            pointer = ev.currentPointer;
        if (target instanceof H.map.Marker) {
        let targetPosition = map.geoToScreen(target.getGeometry());
        target['offset'] = new H.math.Point(pointer.viewportX - targetPosition.x, pointer.viewportY - targetPosition.y);
        behavior.disable();
        }
    }, false);
map.addEventListener('drag', function(ev) {
    let target = ev.target,
        pointer = ev.currentPointer;
    if (target instanceof H.map.Marker) {
        target.setGeometry(map.screenToGeo(pointer.viewportX - target['offset'].x, pointer.viewportY - target['offset'].y));
    }
}, false);
map.addEventListener('dragend', function(ev) {
    let target = ev.target;
    if (target instanceof H.map.Marker) {
        processMarker(target);
    }
}, false);

function processMarker(marker) {
    behavior.enable();
    const markerPoint = marker.getGeometry();
    consumerData.point = markerPoint;
    let message = `<div>${getGeoLabel(markerPoint)}</div><hr /><div>`;
    let spot = {};
    service.reverseGeocode({at:`${markerPoint.lat},${markerPoint.lng}`}, 
        (result) => {
            spot = result.items[0];
            //
            spot.address.label && 
            (consumerData.address=spot.address.label) && 
            (message+= consumerData.address);
            
            message+="</div><button onclick='useAddress()'>Use?</button>";

            const bubble =  new H.ui.InfoBubble(markerPoint,{content: message});
            ui.addBubble(bubble);
            map.setCenter(markerPoint,true);
    });
}

useAddress = function() {
    container.style.display = "none";
    map.getViewPort().resize();
    document.getElementById("consumerView").style.display = "initial";
    document.getElementById("address").innerHTML = consumerData.address;
}

// update consumer with textarea
const status = document.getElementById("status");
function addStatus(msg) {
    status.value += `\n${msg}`;
}

// connect buttons with event handler
const btnOrder01 = document.getElementById("retail01");
const btnOrder02 = document.getElementById("retail02");
btnOrder01.addEventListener("click", processOrder);
btnOrder02.addEventListener("click", processOrder);

// event handler for either button
function processOrder(evt) {
    let orderId = Math.random().toString(36).substring(7);
    let retailer = evt.target.id;
    const order = {
        id : orderId,
        retailer : retailer,
        consumer : consumerData
    }
    const publishData = {
        order: order
    };
    client.publish(`sc/orders/${retailer}`, publishData);
    addStatus(`Order ${order.id} placed with ${order.retailer}`);
}


function init() {
    client = getClient(()=>{
        consumerData.id = client.clientId;
        client.subscribe(`sc/orders/${consumerData.id}`);
    });
    client.onMessageArrived = processMessage;
    client.onConnectionLost = function(e) {
        console.log(e);
    } 
}
function processMessage(message) {
    console.log(message);
    let info = JSON.parse(message.payloadString);
    addStatus(info.statusUpdate);
}

window.addEventListener('DOMContentLoaded', () => init());
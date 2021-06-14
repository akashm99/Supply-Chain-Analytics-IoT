import {getClient} from './iot.js';
import {here_api} from './apikey.js';
// Obtain reference to #mapContainer in DOM
const container = document.getElementById('mapContainer');
// get value for apikey for use with map and/or REST
// const apikey = atob("TVdJblZtRHktR2wtZFFOQ3c5STV5eGY3MlUzTUJCcU5hUHIzWkZPUTBiOA==");
// Store initialized platform object
const platform = new H.service.Platform({"apikey": here_api});
// const platform = new H.service.Platform({"apikey": apikey});
// Store reference to layers object
const layers = platform.createDefaultLayers();
// create initial center point for map and/or REST
const initPoint = new H.geo.Point(47.6132, -122.3301);
// Create map object initialized with container, layers, and geolocation
const map = new H.Map(container, layers.vector.normal.map, {
    center: initPoint,
    zoom: 15,
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

let deliveryOp = "";
const tranSelect = document.getElementById("transportId");
tranSelect.addEventListener('change', () => {
    deliveryOp = tranSelect.value;
    const iconTransport = new H.map.Icon(`/images/${deliveryOp}.png`);
    const dragMarker = new H.map.Marker(initPoint,{icon:iconTransport}, {volatility:true}); 
    dragMarker.draggable = true;
    map.addObject(dragMarker);
    container.style.display = "initial";
    map.getViewPort().resize();
    console.log("end change");
});

// helper to display formatted lat,lng
function getGeoLabel(point) {
    return "" + Math.abs(point.lat.toFixed(4)) +
    ((point.lat > 0) ? 'N' : 'S') +
    '<br />' + Math.abs(point.lng.toFixed(4)) +
    ((point.lng > 0) ? 'E' : 'W');
}

// dragging events
map.addEventListener('dragstart', function(ev) {
        var target = ev.target,
            pointer = ev.currentPointer;
        if (target instanceof H.map.Marker) {
        var targetPosition = map.geoToScreen(target.getGeometry());
        target['offset'] = new H.math.Point(pointer.viewportX - targetPosition.x, pointer.viewportY - targetPosition.y);
        behavior.disable();
        }
    }, false);
map.addEventListener('drag', function(ev) {
    var target = ev.target,
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
    let message = `<div>${getGeoLabel(markerPoint)}</div><hr />`;
    // const bubble =  new H.ui.InfoBubble(markerPoint,{content: message});
    // ui.addBubble(bubble);
    client.publish(`sc/delivery/${deliveryOp}`, 
    {operator: deliveryOp, point: markerPoint});
    map.setCenter(markerPoint,true);
}

// AWS IoT
let client = {};
function init() {
    client = getClient();
    client.onMessageArrived = onMessage;
    client.onConnectionLost = function(e) {
        console.log(e);
    }
    
}

function subscribe() {
//    client.subscribe("topic/1");
//    console.log("subscribed");
}

function onMessage(message) {
    // let status = JSON.parse(message.payloadString);
    // console.log(status);
}

window.addEventListener('DOMContentLoaded', () => { init(); });
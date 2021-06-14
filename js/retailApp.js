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
const provider = map.getBaseLayer().getProvider();
const style = new H.map.Style('https://kuberaspeaking.github.io/Styles/cesStyle.yaml',
'https://js.api.here.com/v3/3.1/styles/omv/');
provider.setStyle(style);
map.getViewModel().setLookAtData({
    tilt: 45
});

const group = new H.map.Group();
// resize map when window is resized
window.addEventListener('resize', () => resizeMap());
function resizeMap() {
    map.getViewPort().resize();
    map.getViewModel().setLookAtData({ bounds: group.getBoundingBox()});
}

let dragMarker = {};
// for AWS IoT, initialized in Init()
let client = {};

let retailData = {
    id : "",
    address : "",
    point : {}
};

const retailSelect = document.getElementById("retailId");
retailSelect.addEventListener('change', () => {
    retailData.id = retailSelect.value;
    client.subscribe(`sc/orders/${retailData.id}`);
    const iconRetail = new H.map.Icon(`/images/${retailData.id}.png`);
    dragMarker = new H.map.Marker(initPoint, {icon:iconRetail}, {volatility:true}); 
    dragMarker.draggable = true;
    group.addObject(dragMarker);
    map.addObject(group);
    container.style.display = "initial";
    resizeMap();
    map.setZoom(14,true);
});

const service = platform.getSearchService();

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
    let message = `<div>${getGeoLabel(markerPoint)}</div><hr />`;
    let spot = {};
    service.reverseGeocode({at:`${markerPoint.lat},${markerPoint.lng}`}, 
        (result) => {
            spot = result.items[0];
            console.log(spot);
            spot.address.label && 
                (retailData.address=spot.address.label) && 
                (message+= retailData.address);
            retailData.point = markerPoint;
            const bubble =  new H.ui.InfoBubble(markerPoint,{content: message});
            ui.addBubble(bubble);
            map.setCenter(markerPoint,true);
    });
}


function init() {
    client = getClient();
    client.onMessageArrived = processMessage;
    client.onConnectionLost = function(e) {
        console.log(e);
    } 
    console.log(client); 
}


function processMessage(message) {
    console.log(message);
    let info = JSON.parse(message.payloadString);
    const publishData = {
        retailer: retailData,
        order: info.order
    };
    client.publish("sc/delivery", publishData);
    client.publish(`sc/orders/${info.order.consumer.id}`, {
        statusUpdate: `#${info.order.id} confirmed by ${retailData.id}`
    });
    addConsumerMarker(info.order.consumer.point);
}

function addConsumerMarker(point) {
    const iconConsumer = new H.map.Icon("/images/consumer.png");
    const marker = new H.map.Marker(point, {icon:iconConsumer}); 
    group.addObject(marker);
    resizeMap();
}

window.addEventListener('DOMContentLoaded', () => init());
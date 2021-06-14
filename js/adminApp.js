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
    zoom: 12,
    pixelRatio: window.devicePixelRatio || 1
});
// Create behavior object initialized with map object
const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
// Create UI object associated with map object and layers object
const ui = H.ui.UI.createDefault(map, layers);

// resize map when window is resized
window.addEventListener('resize', () => map.getViewPort().resize());

const iconConsumer = new H.map.Icon("/images/consumer.png");

// for AWS IoT, initialized in Init()
let client = {};


// local data for admin
let adminData = {
    delivery01: {
        id : "#1",
        status : null,
        marker : null,
        point : null,
    },
    delivery02: {
        id: "#2",
        status : null,
        marker : null,
        point : null,
    },
    delivery03: {
        id : "#3",
        status : null,
        marker : null,
        point : null,
    },
    retail01: {
        status : null,
        marker : null,
        point : null
    },
    retail02: {
        status : null,
        marker : null,
        point : null
    }
};

const ops = [adminData.delivery01,adminData.delivery02,adminData.delivery03];

// update status
const status = document.getElementById("status");
function addStatus(msg) {
    status.value += `${msg}\n`;
}

function init() {
    client = getClient(()=>{
        client.subscribe("sc/#");
        console.log("connected");
    });
    client.onMessageArrived = processMessage;
    client.onConnectionLost = function(e) {
        console.log(e);
    } 
}

function processMessage(message) {
    console.log(message);
    let info = JSON.parse(message.payloadString);
    info.operator && (updateOp(info));
    
    info.retailer && (processOrder(info));
}

function processOrder(data) {
    console.log(data);
    let selectedOp = selectOperator(data.retailer.point);
    if (selectedOp) {
        selectedOp.status = "delivery";
        let msg = `#${data.order.id} will be delivered by ${selectedOp.id}`;
        addStatus(msg);
        client.publish(`sc/orders/${data.order.consumer.id}`, {
            statusUpdate: msg
        });
    } else {
        addStatus("No driver available!")
    }
}

function updateOp(data){
    const op = adminData[data.operator];
    if (op.marker) {
        op.point = data.point;
        op.marker.setGeometry(op.point);
    } else {
        op.point = data.point;
        op.marker = getMarker(op.point,new H.map.Icon(`/images/${data.operator}.png`));
        map.addObject(op.marker);
        op.status = "active";
        addStatus(`${op.id} is active.`);
    }
}

function selectOperator(retailPoint) {
    let returnOp = null;
    let distance = 99999999;
    ops.forEach(op=>{
        if (op.status === "active") {
            let startPoint = new H.geo.Point(op.point.lat,op.point.lng);
            let destPoint = new H.geo.Point(retailPoint.lat,retailPoint.lng);
            let tempDistance = startPoint.distance(destPoint);
            if (tempDistance<distance) {
                distance = tempDistance;
                returnOp = op;
            };
        }
    });
    console.log(distance);
    return returnOp;
}

function getMarker(point, icon) {
    const marker = new H.map.Marker(point, {icon:icon}); 
    return marker;
}

window.addEventListener('DOMContentLoaded', () => init());
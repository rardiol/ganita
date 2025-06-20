"use strict";

var windowCounterID = 0;

const canvas = document.getElementById("canvas");
const dragDropWindowTemplate = document.querySelector("#dragDropWindowTemplate");

// configure some drop options for use by all endpoints.
const exampleDropOptions = {
    tolerance: "touh",
    hoverClass: "dropHover",
    activeClass: "dragActive"
};

const sourceEndpoint = {
    endpoint: "Rectangle",
    paintStyle: { width: 25, height: 25, fill: "#00f" },
    source: true,
    target: false,
    reattach: true,
    scope: "down",
    maxConnections: 2,
    connectorStyle: {
        strokeWidth: 5,
        stroke: "#00f",
        dashstyle: "2 2"
    },
    dropOptions: exampleDropOptions
};

const targetEndpoint = {
    endpoint: "Rectangle",
    paintStyle: { width: 25, height: 25, fill: "#00f" },
    source: false,
    target: true,
    reattach: true,
    scope: "down",
    maxConnections: 1,
    dropOptions: exampleDropOptions
};

jsPlumb.ready(function () {

    var instance = window.j = jsPlumb.newInstance({
        dragOptions: { cursor: 'pointer', zIndex: 2000 },
        paintStyle: { stroke: '#666' },
        endpointHoverStyle: { fill: "orange" },
        hoverPaintStyle: { stroke: "orange" },
        endpointStyle: { width: 20, height: 16, stroke: '#666' },
        endpoint: "Rectangle",
        anchors: ["TopCenter", "TopCenter"],
        container: canvas,
        dropOptions: { activeClass: "dragActive", hoverClass: "dropHover" },
        connectionOverlays: [
            {
                type: "Arrow",
                options: { location: 1 }
            }
        ]
    });

    // suspend drawing and initialise.
    instance.batch(function () {

        var dd1 = document.getElementById('dragDropWindow1');

        setNewInput(dd1, windowCounterID);

        dd1.style.left = "50px";
        dd1.style.top = "50px";

        var e1 = instance.addEndpoint(dd1, { anchor: "Bottom" }, sourceEndpoint);

        createNewWindow(dd1, instance);
        instance.bind("connection", function (info, originalEvent) {
            console.log("connection");
            createNewWindow(info.target, instance);
        });

        instance.bind("endpoint:dblclick", function (info, originalEvent) {
            console.log("edbl");
            console.log(info);
            createNewWindow(info.element, instance);
        });

        instance.bind("beforeDrag", function (params) {
            console.log("foo1");
            console.log(params);
            return true;

        });

    });
});

function createNewWindow(current, instance) {
    windowCounterID += 1;
    
    const newWindow = dragDropWindowTemplate.content.firstElementChild.cloneNode(true);
    
    setNewInput(newWindow, windowCounterID);

    newWindow.style.top = (parseInt(current.style.top, 10) + 140) + "px";
    newWindow.style.left = current.style.left;

    var endpointTop = instance.addEndpoint(newWindow, { anchor: "Top" }, targetEndpoint);
    var endpointBottom = instance.addEndpoint(newWindow, { anchor: "Bottom" }, sourceEndpoint);

    canvas.appendChild(newWindow);
}

function setNewInput(el, windowCounterID) {
    const newInput = el.querySelector("input");
    newInput.setAttribute("id", "input" + windowCounterID);
    newInput.setAttribute("name", windowCounterID);
}

window.check = function check() {
    console.log("check!");
    for (const el of document.querySelectorAll("input.formularinp")) {
        console.log(el.value);
        el.value = el.value.toUpperCase();
    }
}
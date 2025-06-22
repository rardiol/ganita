import { asyncRun } from "./workerApi.js";
import { ready as jsPlumbReady, newInstance as jsPlumbNewInstance, JsPlumbInstance, StateMachineConnector } from "../node_modules/@jsplumb/browser-ui/js/jsplumb.browser-ui.es.js";
//import { ready as jsPlumbReady, newInstance as jsPlumbNewInstance, JsPlumbInstance, EndpointOptions, StateMachineConnector } from "@jsplumb/browser-ui"

//import { BezierConnector } from "../node_modules/@jsplumb/connector-bezier/connector-bezier.js";
//import { BezierConnector } from "../node_modules/@jsplumb/connector-bezier//js/jsplumb.connector-bezier.es.js";
//import { FlowchartConnector } from "../node_modules/@jsplumb/connector-flowchart/connector-flowchart.js";

var windowCounterID = 0;

const canvas: HTMLDivElement = document.querySelector("div#canvas")!;
const dragDropWindowTemplate: HTMLTemplateElement = document.querySelector("template#dragDropWindowTemplate")!;
const anitaInputArea: HTMLParagraphElement = document.querySelector("p#anita_input")!;
const anitaOutputArea: HTMLParagraphElement = document.querySelector("p#anita_out")!;
const checkButton: HTMLButtonElement = document.querySelector("button#checkbtn")!;
const dd1 = document.getElementById('dragDropWindow1')!;


declare global {
    interface Window {
        check: Function;
        j: JsPlumbInstance;
    }
}

function myBeforeDrop(params) {

    if (params.sourceId == params.targetId) {
        console.log("block selfconnection");
        return false;
    }

    if (window.j.select({ source: params.sourceId, target: params.targetId }).length >= 1) {
        console.log("block doubleconnect");
        return false;
    }

    return true;
}

const sourceEndpoint: EndpointOptions = {
    endpoint: "Rectangle",
    paintStyle: { fill: "#00f", width: 50, height:20 },
    source: true,
    target: false,
    scope: "down",
    connectionsDirected: true,
    maxConnections: 2,
    connectorStyle: {
        strokeWidth: 5,
        stroke: "#00f",
        dashstyle: "2 2"
    },
};

const targetEndpoint: EndpointOptions = {
    endpoint: "Rectangle",
    paintStyle: { fill: "#00f", width: 50, height: 20 },
    source: false,
    target: true,
    scope: "down",
    maxConnections: 1,
    beforeDrop: myBeforeDrop,

};

const justificationSourceEndpoint: EndpointOptions = {
    endpoint: "Dot",
    paintStyle: { fill: "#0F0", width: 50, height: 20 },
    source: true,
    target: false,
    scope: "back",
    connectionsDirected: true,
    maxConnections: 2,
    connectorStyle: {
        strokeWidth: 5,
        stroke: "#0F0",
        dashstyle: "2 2"
    },
    connector: {
        type: StateMachineConnector.type,
        options: {curviness: 40}
    }

};

const justificationTargetEndpoint: EndpointOptions = {
    endpoint: "Dot",
    paintStyle: { fill: "#080", radius:40 },
    source: false,
    target: true,
    scope: "back",
    maxConnections: -1,
    beforeDrop: myBeforeDrop,
};


jsPlumbReady(function () {

    var instance = window.j = jsPlumbNewInstance({
        dragOptions: { cursor: 'pointer', zIndex: 2000 },
        paintStyle: { stroke: '#666' },
        endpointHoverStyle: { fill: "orange" },
        hoverPaintStyle: { stroke: "orange" },
        endpointStyle: { width: 20, height: 16, stroke: '#666' },
        endpoint: "Rectangle",
        anchors: ["Top", "Top"],
        container: canvas,
        connectionOverlays: [
            {
                type: "Arrow",
                options: { location: 1 }
            }
        ]
    });

    // suspend drawing and initialise.
    instance.batch(function () {

        setNewInput(dd1, windowCounterID);

        dd1.style.left = "50px";
        dd1.style.top = "50px";

        var e1 = instance.addEndpoint(dd1, { anchor: "Bottom" }, sourceEndpoint);

        var e1 = instance.addEndpoint(dd1, { anchor: "BottomRight" }, justificationTargetEndpoint);


        createNewWindow(dd1, instance);
        instance.bind("connection", function (info, originalEvent) {
            console.log("connection");
            //createNewWindow(info.target, instance);
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

    const newWindow = dragDropWindowTemplate.content.firstElementChild!.cloneNode(true) as HTMLDivElement;

    setNewInput(newWindow, windowCounterID);

    newWindow.style.top = (parseInt(current.style.top, 10) + 140) + "px";
    newWindow.style.left = current.style.left;

    var endpointTop = instance.addEndpoint(newWindow, { anchor: "Top" }, targetEndpoint);
    var endpointBottom = instance.addEndpoint(newWindow, { anchor: "Bottom" }, sourceEndpoint);
    var endpointJustTarget = instance.addEndpoint(newWindow, { anchor: "BottomRight" }, justificationTargetEndpoint);
    var endpointSourceTarget = instance.addEndpoint(newWindow, { anchor: "TopRight" }, justificationSourceEndpoint);


    canvas.appendChild(newWindow);
}

function setNewInput(el, windowCounterID) {
    const newInput = el.querySelector("input");
    newInput.setAttribute("id", "input" + windowCounterID);
    newInput.setAttribute("name", windowCounterID);
}

window.check = async function check() {
    console.log("check");
    let accInp = "";
    for (const el of document.querySelectorAll("input.formularinp") as NodeListOf<HTMLInputElement>) {
        console.log("check for");
        accInp += el.value;
    }

    anitaInputArea.innerText = accInp;

    let output: string;
    try {
        console.log("check await");
        output = await asyncRun(accInp);
        console.log(output);
    } catch (err) {
        console.log(err);
        return;
    }
    anitaOutputArea.innerText = output;
}

console.log("readying");
checkButton.disabled = true;
asyncRun("start").then(function (result) {
    console.log("ready");
    checkButton.disabled = false;
    checkButton.innerText = "Check";
})
console.log("readying2");

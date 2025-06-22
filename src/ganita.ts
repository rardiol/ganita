import { asyncRun } from "./workerApi.js";
import { ready as jsPlumbReady, newInstance as jsPlumbNewInstance, JsPlumbInstance, StateMachineConnector } from "../node_modules/@jsplumb/browser-ui/js/jsplumb.browser-ui.es.js";
//import { ready as jsPlumbReady, newInstance as jsPlumbNewInstance, JsPlumbInstance, EndpointOptions, StateMachineConnector } from "@jsplumb/browser-ui"
import Split from '../node_modules/split.js/dist/split.es.js'

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


console.log(Split(['#canvas_div', '#anita_input_div', '#anita_out_div'], [60, 20, 20]));


function myBeforeDrop(params) {
console.log("myBeforeDrop", params);
    if (params.sourceId == params.targetId) {
        console.log("block selfconnection");
        return false;
    }

    if (window.j.select({ source: params.sourceId, target: params.targetId, scope: params.scope }).length >= 1) {
        console.log("block doubleconnect");
        return false;
    }

    return true;
}

const sourceEndpoint: EndpointOptions = {
    endpoint: "Rectangle",
    paintStyle: { fill: "#00f", width: 50, height:40 },
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
    paintStyle: { fill: "#00f", width: 50, height: 40 },
    source: false,
    target: true,
    scope: "down",
    maxConnections: 1,
    beforeDrop: myBeforeDrop,

};

const justificationSourceEndpoint: EndpointOptions = {
    endpoint: {type:"Dot", options:{ radius: 20 }},
    paintStyle: { fill: "#0F0"},
    source: true,
    target: false,
    scope: "back",
    connectionsDirected: true,
    maxConnections: 1,
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
    endpoint: {type:"Dot", options:{ radius: 20 }},
    paintStyle: { fill: "#080"},
    source: false,
    target: true,
    scope: "back",
    maxConnections: -1,
    beforeDrop: myBeforeDrop,
};


const closureSourceEndpoint: EndpointOptions = {
    endpoint: {type:"Dot", options:{ radius: 20 }},
    paintStyle: { fill: "#F00"},
    source: true,
    target: false,
    scope: "closure",
    connectionsDirected: true,
    maxConnections: 1,
    connectorStyle: {
        strokeWidth: 5,
        stroke: "#F00",
        dashstyle: "2 2"
    },
    connector: {
        type: StateMachineConnector.type,
        options: {curviness: 40}
    }

};

const closureTargetEndpoint: EndpointOptions = {
    endpoint: {type:"Dot", options:{ radius: 20 }},
    paintStyle: { fill: "#800"},
    source: false,
    target: true,
    scope: "closure",
    maxConnections: -1,
    beforeDrop: myBeforeDrop,
};



jsPlumbReady(function () {

    var instance = window.j = jsPlumbNewInstance({
        dragOptions: { cursor: 'pointer', zIndex: 2000 },
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
        var e2 = instance.addEndpoint(dd1, { anchor: "BottomLeft" }, justificationTargetEndpoint);
        var e3 = instance.addEndpoint(dd1, { anchor: "BottomRight" }, closureTargetEndpoint);


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
    var endpointJustificationTarget = instance.addEndpoint(newWindow, { anchor: "BottomLeft" }, justificationTargetEndpoint);
    var endpointJustificationSource = instance.addEndpoint(newWindow, { anchor: "TopLeft" }, justificationSourceEndpoint);
    var endpointClosureTarget = instance.addEndpoint(newWindow, { anchor: "BottomRight" }, closureTargetEndpoint);
    var endpointClosureSource = instance.addEndpoint(newWindow, { anchor: "TopRight" }, closureSourceEndpoint);

    canvas.appendChild(newWindow);
}

function setNewInput(el, windowCounterID) {
    const newInput = el.querySelector("input");
    newInput.setAttribute("id", "input" + windowCounterID);
    newInput.setAttribute("name", windowCounterID);
}

window.check = async function check() {
    console.log("check");
    let anitaInput = tree2anita();

    anitaInputArea.innerText = anitaInput;

    let anitaOutput: string;
    try {
        console.log("check await");
        anitaOutput = await asyncRun(anitaInput);
        console.log(anitaOutput);
    } catch (err) {
        console.log(err);
        return;
    }
    anitaOutputArea.innerText = anitaOutput;
}

console.log("readying");
checkButton.disabled = true;
asyncRun("start").then(function (result) {
    console.log("ready");
    checkButton.disabled = false;
    checkButton.innerText = "Check";
})
console.log("readying2");



function tree2anita(): string {
    return tree2anitaStep(dd1, 1, new Map(), false).output;
}

function tree2anitaStep(
    el: HTMLElement,
    lineNumber: number,
    idMap: Map<string, number>,
    forking: boolean)
    : { output: string, conclusion: boolean, lineNumber: number } {

    let output = "";
    let conclusion = false;
    const children = window.j.select({ source: el.getAttribute("data-jtk-managed"), scope: ["down"] });
    const justifications = window.j.select({ source: el.getAttribute("data-jtk-managed"), scope: ["back"] });
    const closures = window.j.select({ source: el.getAttribute("data-jtk-managed"), scope: ["closure"] });

    idMap.set(el.getAttribute("data-jtk-managed"), lineNumber);

    console.log("tree2anitaStep", el, lineNumber, idMap, forking, children, justifications, closures);

    /*
        children    justifications  closure     general/forking
        0           0               0           fail(incomplete) N
        1           0               0           pre/conclusion N
        2           0               0           conclusion N
        0           1               0           saturation Y
        1           1               0           rule apply Y
        2           1               0           rule apply and forking Y
        0           0               1           tautological contradiction N
    X   1           0               1           fail
    X   2           0               1           fail
        0           1               1           rule apply and closure Y
    X   1           1               1           fail
    X   2           1               1           fail
    */

    if(justifications.length == 0 && forking) {
        throw "Cannot fork without justification";
    }
    if(children.length > 0 && closures.length > 0) {
        throw "Cannot have children on a closed tree"
    }

    if (justifications.length == 0) { // pre or conclusion
        console.log("tree2anitaStep 1");
        output += lineNumber++;
        output += ". ";
        if (forking) {
            output += "{ ";
        }
        output += (el.querySelector("input.formularinp") as HTMLInputElement).value;
        output += " ";

        if (children.length == 1) {
            console.log("tree2anitaStep 2");
            let childResult = tree2anitaStep(children.entries[0].target, lineNumber, idMap, false);
            lineNumber = childResult.lineNumber;
            if (childResult.conclusion) {
                output += "conclusion";
            } else {
                output += "pre";
            }
            output += "\n";
            output += childResult.output;
        } else if (children.length == 2) {
            console.log("tree2anitaStep 3");
            let child0Result = tree2anitaStep(children.entries[0].target, lineNumber, idMap, true);
            let child1Result = tree2anitaStep(children.entries[1].target, child0Result.lineNumber, idMap, true);
            lineNumber = child1Result.lineNumber;

            output += " conclusion";

            output += "\n";
            output += child0Result.output;
            output += "} \n"
            output += child1Result.output;
            output += "} \n"
        } else {
            output += " conclusion";
            output += "\n";
            console.log("tree2anitaStep 4");
        }
    } else if (justifications.length == 1) { // rule apply
        conclusion = true;
        console.log("tree2anitaStep 5");
        output += lineNumber++;
        output += ". ";
        if (forking) {
            output += "{ ";
        }
        output += (el.querySelector("input.formularinp") as HTMLInputElement).value;
        output += " ";

        if (children.length == 1) {
            console.log("tree2anitaStep 6");
            let childResult = tree2anitaStep(children.entries[0].target, lineNumber, idMap, false);
            lineNumber = childResult.lineNumber;

            output += idMap.get(justifications.entries[0].target.getAttribute("data-jtk-managed"));

            output += "\n";
            output += childResult.output;
        } else if (children.length == 2) {
            console.log("tree2anitaStep 7");
            let child0Result = tree2anitaStep(children.entries[0].target, lineNumber, idMap, true);
            let child1Result = tree2anitaStep(children.entries[1].target, child0Result.lineNumber, idMap, true);
            lineNumber = child1Result.lineNumber;

            output += idMap.get(justifications.entries[0].target.getAttribute("data-jtk-managed"));

            output += "\n";
            output += child0Result.output;
            output += "} \n"
            output += child1Result.output;
            output += "} \n"
        } else if (children.length == 0) { // unsaturated
            console.log("tree2anitaStep 8");
            output += idMap.get(justifications.entries[0].target.getAttribute("data-jtk-managed"));

            output += "\n";
        } else {
            console.log("tree2anitaStep unreachable 9");
        }
    } else {
        console.log("tree2anitaStep 13"); 
    }
    
    if (closures.length == 1) { // @ contradiction
        console.log("tree2anitaStep 10");

        output += lineNumber++;
        output += ". ";
        output += "@ ";
        output += lineNumber-2;
        output += ","
        output += idMap.get(closures.entries[0].target.getAttribute("data-jtk-managed"));
        output += "\n";

        return { output, conclusion, lineNumber };

    } else {
        console.log("tree2anitaStep 11");

        return { output, conclusion: conclusion, lineNumber };

    };
}

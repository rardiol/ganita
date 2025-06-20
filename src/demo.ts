import {ready as jsPlumbReady, newInstance as jsPlumbNewInstance, JsPlumbInstance } from "../node_modules/@jsplumb/browser-ui/js/jsplumb.browser-ui.es.js";
import { loadPyodide } from "../node_modules/pyodide/pyodide.mjs";


var windowCounterID = 0;

const canvas: HTMLDivElement = document.querySelector("div#canvas")!;
const dragDropWindowTemplate: HTMLTemplateElement = document.querySelector("template#dragDropWindowTemplate")!;

declare global {
    interface Window {
        check: Function;
        j: JsPlumbInstance;
    }
}

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

        var dd1 = document.getElementById('dragDropWindow1')!;

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

    const newWindow = dragDropWindowTemplate.content.firstElementChild!.cloneNode(true) as HTMLDivElement;

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

async function mainPyodide() {
    console.log("mainPyodide");
    let pyodide = await loadPyodide();
    console.log("loaded pyodide");
    await pyodide.loadPackage(
        ['https://files.pythonhosted.org/packages/3b/00/2344469e2084fb287c2e0b57b72910309874c3245463acd6cf5e3db69324/appdirs-1.4.4-py2.py3-none-any.whl',
            'https://files.pythonhosted.org/packages/c0/7c/f66be9e75485ae6901ae77d8bdbc3c0e99ca748ab927b3e18205759bde09/rply-0.7.8-py2.py3-none-any.whl',
            '../lib/anita-0.1.13-py3-none-any.whl']);
    console.log("loaded packages");

    pyodide.runPython(`

from pyodide.ffi import to_js

import anita

from anita.anita_en_fo import check_proof

def test(inp):
    return to_js(inp + " FOO")

  `);
    console.log("ran pyodide");

    return pyodide;
}

let pyodideReadyPromise = mainPyodide();

async function evaluatePython(inp) {
    console.log("evaluatePython");

    let pyodide = await pyodideReadyPromise;
    console.log("evaluatePython await pyodideReadyPromise");
    try {
        let output = pyodide.globals.get("test")(inp);
        console.log(output);
        return output;
    } catch (err) {
        console.log(err);
    }
}

window.check = async function check() {
    console.log("check!");
    for (const el of document.querySelectorAll("input.formularinp") as NodeListOf<HTMLInputElement>) {
        console.log(el.value);
        const val = await evaluatePython(el.value);
        console.log(val);
        el.value = val;
    }
}
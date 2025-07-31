import { ready as jsPlumbReady, newInstance as jsPlumbNewInstance, JsPlumbInstance, EndpointOptions, StateMachineConnector, BeforeDropParams, Connection, Endpoint, ContainmentType } from "@jsplumb/browser-ui"
import { BezierConnector } from "@jsplumb/connector-bezier";
import { FlowchartConnector } from "@jsplumb/connector-flowchart";
import Split from "split.js"
import "@jsplumb/browser-ui/css/jsplumbtoolkit.css"
import "./ganita.css";
import { webworker } from "webpack";
import { pyodidePackages } from "./globals";

declare global {
    interface Window {
        reset: Function;
        check: Function;
        closeWindow: Function;
        copy_latex: Function;
        copy_colored_latex: Function
        j: JsPlumbInstance;
    }
}

let windowCounterID = 0;

const canvas: HTMLDivElement = document.querySelector("div#canvas")!;
const dragDropWindowTemplate: HTMLTemplateElement = document.querySelector("template#dragDropWindowTemplate")!;
const anitaInputArea: HTMLParagraphElement = document.querySelector("p#anita_input")!;
const anitaOutputArea: HTMLParagraphElement = document.querySelector("p#anita_out")!;
const anitaOutputLatexArea: HTMLParagraphElement = document.querySelector("p#anita_out_latex")!;
const anitaOutputColoredLatexArea: HTMLParagraphElement = document.querySelector("p#anita_out_colored_latex")!;
const anitaOutputLatexOverleafArea: HTMLTextAreaElement = document.querySelector("#overleaf_form_textarea")!;
const anitaOutputColoredLatexOverleafArea: HTMLTextAreaElement = document.querySelector("#overleaf_colored_form_textarea")!;
const checkButton: HTMLButtonElement = document.querySelector("button#checkbtn")!;
const checkButton2: HTMLButtonElement = document.querySelector("button#checkbtn2")!;
const rootWindow = document.getElementById('dragDropWindow1')!;
const topBar: HTMLDivElement = document.querySelector("div#topbar")!;
let pyodideWorker: Worker;


const sourceEndpoint: EndpointOptions = {
    endpoint: "Rectangle",
    // @ts-expect-error
    paintStyle: { width: 70, height: 60 },
    source: true,
    target: false,
    scope: "down",
    connectionsDirected: true,
    maxConnections: 2,
    connectorClass: "down",
    connectorStyle: {
        strokeWidth: 5,
        stroke: "#111",
    },
    beforeDrop: myBeforeDrop,
    cssClass: "down source",
};

const targetEndpoint: EndpointOptions = {
    endpoint: "Rectangle",
    // @ts-expect-error
    paintStyle: { width: 70, height: 60 },
    source: false,
    target: true,
    scope: "down",
    maxConnections: 1,
    beforeDrop: myBeforeDrop,
    cssClass: "down target",
};

const justificationSourceEndpoint: EndpointOptions = {
    endpoint: { type: "Dot", options: { radius: 30 } },
    paintStyle: { fill: "#0F0" },
    source: true,
    target: false,
    scope: "back",
    connectorClass: "back",
    connectionsDirected: true,
    maxConnections: 1,
    connectorStyle: {
        strokeWidth: 5,
        stroke: "#0F0",
        dashstyle: "2 2"
    },
    connector: {
        type: StateMachineConnector.type,
        options: {
            margin: 15,
            curviness: 60,
            proximityLimit: 120,
        }
    },
    // @ts-expect-error
    beforeDrop: myBeforeDrop,
    cssClass: "back source",
};

const justificationTargetEndpoint: EndpointOptions = {
    endpoint: { type: "Dot", options: { radius: 30 } },
    paintStyle: { fill: "#5F5" },
    source: false,
    target: true,
    scope: "back",
    maxConnections: -1,
    // @ts-expect-error
    beforeDrop: myBeforeDrop,
    cssClass: "back target",
};

const closureSourceEndpoint: EndpointOptions = {
    endpoint: { type: "Dot", options: { radius: 30 } },
    paintStyle: { fill: "#00F" },
    source: true,
    target: false,
    scope: "closure",
    connectorClass: "closure",
    connectionsDirected: true,
    maxConnections: 1,
    connectorStyle: {
        strokeWidth: 5,
        stroke: "#00F",
        dashstyle: "2 2"
    },
    connector: {
        type: StateMachineConnector.type,
        options: {
            margin: 15,
            curviness: 60,
            proximityLimit: 120,
        }
    },
    cssClass: "closure source",
    // @ts-expect-error
    beforeDrop: myBeforeDrop,
};

const closureTargetEndpoint: EndpointOptions = {
    endpoint: { type: "Dot", options: { radius: 30 } },
    paintStyle: { fill: "#55F" },
    source: false,
    target: true,
    scope: "closure",
    maxConnections: -1,
    // @ts-expect-error
    beforeDrop: myBeforeDrop,
    cssClass: "closure target",
};

// https://stackoverflow.com/a/35974082 cc-by-sa
function isCollide(a: Element, b: Element): boolean {
    var aRect = a.getBoundingClientRect();
    var bRect = b.getBoundingClientRect();

    return !(
        ((aRect.top + aRect.height) < (bRect.top)) ||
        (aRect.top > (bRect.top + bRect.height)) ||
        ((aRect.left + aRect.width) < bRect.left) ||
        (aRect.left > (bRect.left + bRect.width))
    );
}

function createNewWindow(current: HTMLElement, instance: JsPlumbInstance, lateralOffset?: boolean): HTMLDivElement {
    windowCounterID += 1;

    const otherWindows = Array.from(document.querySelectorAll(".window"));
    const newWindow = dragDropWindowTemplate.content.firstElementChild!.cloneNode(true) as HTMLDivElement;

    setNewInput(newWindow, windowCounterID);
    addNewCloseButton(newWindow, windowCounterID);

    newWindow.style.top = (parseInt(current.style.top, 10) + current.offsetHeight + 90) + "px";
    newWindow.style.left = Math.min(parseInt(current.style.left, 10) + (lateralOffset ? current.offsetWidth + 60 : 0), canvas.offsetWidth - current.offsetWidth + 20) + "px";

    canvas.appendChild(newWindow);

    console.log("createNewWindow", newWindow);
    while (!otherWindows.every((el) => !isCollide(newWindow, el))) {
        newWindow.style.top = (parseInt(newWindow.style.top, 10) + 50) + "px";
        console.log("move", newWindow);
    }

    const _endpointTop = instance.addEndpoint(newWindow, { anchor: "Top" }, targetEndpoint);
    const _endpointBottom = instance.addEndpoint(newWindow, { anchor: "Bottom" }, sourceEndpoint);
    const _endpointJustificationTarget = instance.addEndpoint(newWindow, { anchor: "BottomLeft" }, justificationTargetEndpoint);
    const _endpointJustificationSource = instance.addEndpoint(newWindow, { anchor: "TopLeft" }, justificationSourceEndpoint);
    const _endpointClosureTarget = instance.addEndpoint(newWindow, { anchor: "BottomRight" }, closureTargetEndpoint);
    const _endpointClosureSource = instance.addEndpoint(newWindow, { anchor: "TopRight" }, closureSourceEndpoint);

    return newWindow;
}

function addNewCloseButton(el: HTMLElement, windowCounterID: number) {
    const newInput = el.querySelector("button")!;
    newInput.setAttribute("id", "button_close" + windowCounterID);
    newInput.setAttribute("name", windowCounterID.toString());
}

function setNewInput(el: HTMLElement, windowCounterID: number) {
    const newInput = el.querySelector("input")!;
    newInput.setAttribute("id", "input" + windowCounterID);
    newInput.setAttribute("name", windowCounterID.toString());
}

function closeWindow2(target: HTMLElement) {
    console.log("closeWindow2", target);
    window.j.removeAllEndpoints(target);
    window.j.unmanage(target);
    target.remove();
}

const closeWindow = window.closeWindow = async function closeWindow(event: PointerEvent) {
    console.log("closeWindow", event);
    const target = (event.target as HTMLElement).parentElement?.parentElement!;
    closeWindow2(target);
}

async function setClipboard(text: string) {
    const type = "text/plain";
    const clipboardItemData = {
        [type]: text,
    };
    const clipboardItem = new ClipboardItem(clipboardItemData);
    await navigator.clipboard.write([clipboardItem]);
}

const copy_latex = window.copy_latex = async function copy_latex(event: PointerEvent) {
    console.log("copy_latex", event);
    await setClipboard(anitaOutputLatexArea.innerText);
}

const copy_colored_latex = window.copy_colored_latex = async function copy_colored_latex(event: PointerEvent) {
    console.log("copy_colored_latex", event);
    await setClipboard(anitaOutputColoredLatexArea.innerText);
}

function setLatexContent(text: string, el: HTMLTextAreaElement, color: boolean) {
    const xcolor = color ? "\\usepackage{xcolor}" : "";
    el.textContent = `
\\documentclass[12pt]{article}
\\usepackage[english]{babel}
\\usepackage{amsmath}
\\usepackage{tikz}
\\usepackage{qtree}
${xcolor}
\\begin{document}
${text}
\\end{document}
`
}

window.check = async function check(params: PointerEvent) {
    console.log("check");
    topBar.scrollIntoView();
    let anitaInput;
    try {
        anitaInput = tree2anita();
    } catch (error: any) {
        console.log("Error", error);
        anitaInputArea.innerText = error.toString();
        return;
    }

    anitaInputArea.innerText = anitaInput;

    let anitaMainOutput: string;
    let latex: string = "Erro";
    let colored_latex: string = "Erro";
    resetLatexButtons();

    try {
        console.log("check await");
        const anitaOutput = await asyncRun(anitaInput);
        if (typeof anitaOutput === "string") {
            anitaMainOutput = anitaOutput;
            console.log(anitaMainOutput);
        } else {
            anitaMainOutput = anitaOutput[0];
            const anitaGetProof = anitaOutput[1];
            latex = anitaGetProof.latex;
            colored_latex = anitaGetProof.colored_latex;
            setLatexContent(latex, anitaOutputLatexOverleafArea, false);
            setLatexContent(colored_latex, anitaOutputColoredLatexOverleafArea, true);
            console.log(anitaGetProof);
            console.log(anitaMainOutput);
            document.querySelectorAll(".latex_button").forEach((el) => el.removeAttribute("disabled"));
        }
    } catch (err: any) {
        console.log(err);
        anitaMainOutput = err.toString();
    }
    anitaOutputArea.innerText = anitaMainOutput;
    anitaOutputLatexArea.innerText = latex;
    anitaOutputColoredLatexArea.innerText = colored_latex;
}

window.reset = async function reset(params: PointerEvent) {
    if (!window.confirm("Tem certeza que deseja resetar a árvore?")) {
        return;
    }

    for (let el of document.querySelectorAll(".window.child")) {
        closeWindow2(el as HTMLElement);
    }

    resetRootWindow();
    window.j.repaintEverything();

    window.scroll(0, 0);
};

function tree2anita(): string {
    for (const el of document.querySelectorAll(".line_number")) {
        el.textContent = "";
    }
    return tree2anitaStep(rootWindow, 1, new Map(), false).output;
}

function tree2anitaStep(
    el: HTMLElement,
    lineNumber: number,
    idMap: Map<string, number>,
    forking: boolean)
    : { output: string, conclusion: boolean, lineNumber: number } {

    let output = "";
    let conclusion = false;
    const thisLineNumber = lineNumber;
    const children = window.j.select({ source: el.getAttribute("data-jtk-managed"), scope: ["down"] });
    const justifications = window.j.select({ source: el.getAttribute("data-jtk-managed"), scope: ["back"] });
    const closures = window.j.select({ source: el.getAttribute("data-jtk-managed"), scope: ["closure"] });
    const line_type = el.querySelector(".line_type") as HTMLSpanElement;

    const data_jtk_managed = (el.getAttribute("data-jtk-managed") || (() => { throw new Error("Failed to find data-jtk-managed") })());
    idMap.set(data_jtk_managed, lineNumber);
    (el.querySelector(".line_number") as HTMLSpanElement).textContent = lineNumber + ".";

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

    if (justifications.length == 0 && forking) {
        throw new Error(`É necessário uma justificativa para a bifurcação no nó ${lineNumber}`);
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
            const childResult = tree2anitaStep(children.get(0).target, lineNumber, idMap, false);
            lineNumber = childResult.lineNumber;
            if (childResult.conclusion) {
                output += "conclusao";
                line_type.textContent = "conclusão";
            } else {
                output += "pre";
                line_type.textContent = "premissa";
            }
            output += "\n";
            output += childResult.output;
        } else if (children.length == 2) {
            console.log("tree2anitaStep 3");

            let child0Result;
            let child1Result;

            if (parseInt(children.get(0).target.style.left, 10) < parseInt(children.get(1).target.style.left, 10)) {
                child0Result = tree2anitaStep(children.get(0).target, lineNumber, idMap, true);
                child1Result = tree2anitaStep(children.get(1).target, child0Result.lineNumber, idMap, true);
            } else {
                child0Result = tree2anitaStep(children.get(1).target, lineNumber, idMap, true);
                child1Result = tree2anitaStep(children.get(0).target, child0Result.lineNumber, idMap, true);
            }

            lineNumber = child1Result.lineNumber;

            output += " conclusao";
            line_type.textContent = "conclusão";

            output += "\n";
            output += child0Result.output;
            output += "} \n"
            output += child1Result.output;
            output += "} \n"
        } else {
            line_type.textContent = "conclusão"
            output += " conclusao";
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

        line_type.textContent = "regra";

        if (children.length == 1) {
            console.log("tree2anitaStep 6");
            const childResult = tree2anitaStep(children.get(0).target, lineNumber, idMap, false);
            lineNumber = childResult.lineNumber;

            output += idMap.get(justifications.get(0).target.getAttribute("data-jtk-managed"));

            output += "\n";
            output += childResult.output;
        } else if (children.length == 2) {
            console.log("tree2anitaStep 7");
            let child0Result;
            let child1Result;

            if (parseInt(children.get(0).target.style.left, 10) < parseInt(children.get(1).target.style.left, 10)) {
                child0Result = tree2anitaStep(children.get(0).target, lineNumber, idMap, true);
                child1Result = tree2anitaStep(children.get(1).target, child0Result.lineNumber, idMap, true);
            } else {
                child0Result = tree2anitaStep(children.get(1).target, lineNumber, idMap, true);
                child1Result = tree2anitaStep(children.get(0).target, child0Result.lineNumber, idMap, true);
            }

            lineNumber = child1Result.lineNumber;

            output += idMap.get(justifications.get(0).target.getAttribute("data-jtk-managed"));

            output += "\n";
            output += child0Result.output;
            output += "} \n"
            output += child1Result.output;
            output += "} \n"
        } else if (children.length == 0) { // unsaturated
            console.log("tree2anitaStep 8");
            output += idMap.get(justifications.get(0).target.getAttribute("data-jtk-managed"));

            output += "\n";
        } else {
            console.log("tree2anitaStep unreachable 9");
        }
    } else {
        console.log("tree2anitaStep 13");
    }

    if (closures.length == 1) { // @ contradiction
        console.log("tree2anitaStep 10");

        (el.querySelector(".line_number") as HTMLSpanElement).textContent += ", " + lineNumber.toString() + ".";
        line_type.textContent += ", fecho";

        output += lineNumber++;
        output += ". ";
        output += "@ ";
        output += thisLineNumber;
        output += ","
        output += idMap.get(closures.get(0).target.getAttribute("data-jtk-managed"));
        output += "\n";

        return { output, conclusion, lineNumber };

    } else {
        console.log("tree2anitaStep 11");

        return { output, conclusion: conclusion, lineNumber };

    };
}

function getPromiseAndResolve(): { promise: Promise<unknown>; resolve: any; } {
    let resolve;
    const promise = new Promise((res) => {
        resolve = res;
    });
    return { promise, resolve };
}

// Each message needs a unique id to identify the response. In a real example,
// we might use a real uuid package
let lastId = 1;
function getId() {
    return lastId++;
}

// Add an id to msg, send it to worker, then wait for a response with the same id.
// When we get such a response, use it to resolve the promise.
function requestResponse(worker: Worker, msg: string): Promise<[string, any]> {
    console.log("requestResponse", worker, msg);

    const { promise, resolve } = getPromiseAndResolve();
    const idWorker = getId();
    worker.addEventListener("message", function listener(event) {
        console.log("requestResponse addEventListener");
        console.log(event);
        console.log(event.data);

        if (event.data?.id !== idWorker) {
            console.log("requestResponse addEventListener return?");

            return;
        }
        console.log("requestResponse addEventListener returno");

        // This listener is done so remove it.
        worker.removeEventListener("message", listener);
        // Filter the id out of the result
        const { id, result } = event.data;
        console.log("requestResponse resolve");

        resolve(result);
        console.log("requestResponse resolve2");

    });
    console.log("requestResponse postMessage");

    worker.postMessage({ id: idWorker, msg });
    console.log("requestResponse return");

    return promise as Promise<[string, any]>;
}

function asyncRun(inp: string): Promise<[string, any]> {
    console.log("asyncRun");
    return requestResponse(pyodideWorker, inp);
}

function myBeforeDrop(params: BeforeDropParams) {
    console.log("myBeforeDrop", params);
    if (params.sourceId == params.targetId) {
        console.log("block selfconnection");
        return false;
    }
    return true;
}

let temporaryWindow: HTMLDivElement | null = null;

function cleanTemporaryWindow() {
    console.log("cleanTemporaryWindow", temporaryWindow);
    if (
        !temporaryWindow
    ) {
        return;
    }
    if (
        window.j.select({ source: temporaryWindow.getAttribute("data-jtk-managed") }).length != 0 ||
        window.j.select({ target: temporaryWindow.getAttribute("data-jtk-managed") }).length != 0 ||
        (temporaryWindow.querySelector("input.formularinp") as HTMLInputElement).value != ""
    ) {
        temporaryWindow = null;
        return;
    }

    closeWindow2(temporaryWindow);
}

function resetLatexButtons() {
    document.querySelectorAll(".latex_button").forEach((el) => (el as HTMLButtonElement).disabled = true);
}

function resetRootWindow() {
    (rootWindow.querySelector("input.formularinp") as HTMLInputElement).value = "";
    (rootWindow.querySelector(".line_number") as HTMLElement).innerText = "";
    (rootWindow.querySelector(".line_type") as HTMLElement).innerText = "";
    rootWindow.style.left = "50px";
    rootWindow.style.top = "50px";
}

function jsPlumbReadyFunction() {

    const instance = window.j = jsPlumbNewInstance({
        // @ts-expect-error
        dragOptions: { zIndex: 2000, containment: ContainmentType.parent, containmentPadding: 50 },
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

        setNewInput(rootWindow, windowCounterID);

        resetRootWindow();

        const e1 = instance.addEndpoint(rootWindow, { anchor: "Bottom" }, sourceEndpoint);
        const e2 = instance.addEndpoint(rootWindow, { anchor: "BottomLeft" }, justificationTargetEndpoint);
        const e3 = instance.addEndpoint(rootWindow, { anchor: "BottomRight" }, closureTargetEndpoint);

        instance.bind("connection", function (params, originalEvent) {
            console.log("connection", params, originalEvent);
            cleanTemporaryWindow();
        });

        instance.bind("endpoint:dblclick", function (params, originalEvent) {
            console.log("edbl", params);
            createNewWindow(params.element, instance);
        });

        instance.bind("beforeDrag", function (params, originalEvent) {
            console.log("beforeDrag", params, originalEvent);
            const endpoint: Endpoint = params.endpoint;
            if (endpoint.scope == "down" && endpoint.isSource && endpoint.connections.length < 2) {
                temporaryWindow = createNewWindow(params.source, instance, endpoint.connections.length == 1);
                instance.repaintEverything();
                console.log("new temporaryWindow", temporaryWindow);
            }
            return true;
        });

        instance.bind("beforeStartDetach", function (params, originalEvent) {
            console.log("beforeStartDetach", params, originalEvent);
            const endpoint: Endpoint = params.endpoint;
            if (endpoint.scope == "down" && endpoint.isSource && endpoint.connections.length < 2) {
                temporaryWindow = createNewWindow(params.source, instance, endpoint.connections.length == 1);
                instance.repaintEverything();
                console.log("new temporaryWindow", temporaryWindow);
            }
            return true;
        });

        instance.bind("drag:start", function (params, originalEvent) {
            console.log("drag:start", params, originalEvent);
            return true;
        });

        instance.bind("connection:drag", function (params: Connection, originalEvent) {
            console.log("connection:drag", params, originalEvent);
            return true;
        });

        instance.bind("connection:abort", function (params, originalEvent) {
            console.log("connection:abort", params, originalEvent);
            cleanTemporaryWindow();
            return true;
        });

        instance.bind("connection:move", function (params, originalEvent) {
            console.log("connection:move", params, originalEvent);
            cleanTemporaryWindow();
            return true;
        });

        instance.bind("connection:detach", function (params, originalEvent) {
            console.log("connection:detach", params, originalEvent);
            cleanTemporaryWindow();
            return true;
        });
    });
}

(function main() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js', { scope: "./" }).then(
            registration => {
                console.log('SW registered: ', registration);
            }).catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    } else {
        console.error("Service workers are not supported.");
    }

    pyodideWorker = new Worker(new URL('./webWorker', import.meta.url), { type: "module" });
    console.log("pyodideWorker", pyodideWorker, import.meta.url, `${window.location.origin}/pyodide`);
    console.log("sending indexURL", pyodideWorker.postMessage({ indexURL: `${window.location}` })); // TODO: remove

    for (const pkg of pyodidePackages) {
        window.fetch(pkg, { "priority": "low" });
    }

    console.log(Split(['#canvas', '#anita_inout'], { sizes: [70, 30], minSize: 20 }));
    document.querySelector(".gutter-horizontal")?.appendChild(document.createElement("div"));

    console.log("readying");
    checkButton.disabled = true;
    checkButton2.disabled = true;
    resetLatexButtons();
    asyncRun("start").then(function (result) {
        console.log("ready");
        checkButton.disabled = false;
        checkButton.innerText = "Checar";
        checkButton2.disabled = false;
        checkButton2.innerText = "Checar";
    })
    console.log("readying2");

    jsPlumbReady(jsPlumbReadyFunction);
})();


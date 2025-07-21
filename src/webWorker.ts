import { loadPyodide } from "pyodide";
import mainPy from './mainPy.py';
import { pyodidePackages } from './globals';

async function mainPyodide(windowLocationIndex: string) {
    console.log("mainPyodide", location, windowLocationIndex);

    const indexURL: string = new URL("./pyodide", location.href).toString();
    console.log("indexURL", indexURL);
    const packages = pyodidePackages.map((url) => url.toString());

    let pyodide = await loadPyodide({ indexURL, packages });
    console.log("loaded pyodide");

    const pyresult = pyodide.runPython(mainPy);
    console.log("ran pyodide");
    console.log(pyresult);
    console.log(typeof pyresult);

    return pyodide;
}

let pyodideReadyPromise: Promise<any> | null = null;

self.onmessage = async (event) => {
    console.log("onmessage", event, event.data);
    if (pyodideReadyPromise === null) {
        console.log("onmessage mainPyodide");
        pyodideReadyPromise = mainPyodide(event.data.indexURL);
        console.log("onmessage mainPyodide return");
        return;
    }

    // make sure loading is done
    console.log("onmessage awaiting");
    const pyodide = await pyodideReadyPromise;
    console.log("onmessage awaited");

    const { id, msg } = event.data;
    const locals = pyodide.toPy({ inp: msg });

    try {
        // Execute the python code in this context
        console.log("runPythonAsync1");
        const result = pyodide.runPython("my_check_proof(inp)", { locals });
        console.log("runPythonAsync2", result, typeof result);
        self.postMessage({ result, id });
        console.log("postMessage");
    } catch (error) {
        console.log("error");
        console.log(error);
        console.log(typeof error);
        console.log("error", error, typeof error);
        self.postMessage({ error: error, id });
        console.log("error3");
    }
};
import { loadPyodide } from "pyodide";

async function mainPyodide(indexURL) {
    console.log("mainPyodide");


    let pyodide = await loadPyodide({ indexURL });
    console.log("loaded pyodide");
    await pyodide.loadPackage(
        ['https://files.pythonhosted.org/packages/3b/00/2344469e2084fb287c2e0b57b72910309874c3245463acd6cf5e3db69324/appdirs-1.4.4-py2.py3-none-any.whl',
            'https://files.pythonhosted.org/packages/c0/7c/f66be9e75485ae6901ae77d8bdbc3c0e99ca748ab927b3e18205759bde09/rply-0.7.8-py2.py3-none-any.whl',
            './anita-0.1.13-py3-none-any.whl']);
    console.log("loaded packages");

    const pyresult = pyodide.runPython(`
from pyodide.ffi import to_js

from anita.anita_en_fo import check_proof

def my_check_proof(inp):
    if inp == "start":
        return to_js("start")
    return to_js(check_proof(inp))

"ok"
`);
    console.log("ran pyodide");
    console.log(pyresult);
    console.log(typeof pyresult);

    return pyodide;
}

let pyodideReadyPromise = null;

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
        const result = await pyodide.runPythonAsync("my_check_proof(inp)", { locals });
        console.log("runPythonAsync2", result, typeof result);
        self.postMessage({ result, id });
        console.log("postMessage");
    } catch (error) {
        console.log("error", error, typeof error);
        self.postMessage({ error: error.message, id });
        console.log("error3");
    }
};
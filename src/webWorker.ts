import { loadPyodide } from "../node_modules/pyodide/pyodide.mjs";

async function mainPyodide() {
    console.log("mainPyodide");
    let pyodide = await loadPyodide();
    console.log("loaded pyodide");
    await pyodide.loadPackage(
        ['https://files.pythonhosted.org/packages/3b/00/2344469e2084fb287c2e0b57b72910309874c3245463acd6cf5e3db69324/appdirs-1.4.4-py2.py3-none-any.whl',
            'https://files.pythonhosted.org/packages/c0/7c/f66be9e75485ae6901ae77d8bdbc3c0e99ca748ab927b3e18205759bde09/rply-0.7.8-py2.py3-none-any.whl',
            '../lib/anita-0.1.13-py3-none-any.whl']);
    console.log("loaded packages");

    const pyresult = pyodide.runPython(`

from pyodide.ffi import to_js

import anita

from anita.anita_en_fo import check_proof

def test2():
    pass

def test3():
    print("fooa")

def test(inp):
    print("test", inp)
    if inp == "start":
        return to_js("start")
    return to_js(inp + " FOO")

4
  `);
    console.log("ran pyodide");
    console.log(pyresult);
    console.log(typeof pyresult);


    return pyodide;
}

let pyodideReadyPromise = mainPyodide();

self.onmessage = async (event: MessageEvent<{ id: number, msg: string }>) => {
    console.log(event);
    console.log(event.data);
    // make sure loading is done
    const pyodide = await pyodideReadyPromise;

    const { id, msg } = event.data;

    const locals = pyodide.toPy({ inp: msg });
    console.log(locals);
    try {
        // Execute the python code in this context
        console.log("runPythonAsync1 test2 1");
        console.log(await pyodide.runPythonAsync("test2()", { locals }));
        console.log("runPythonAsync1 test2 2");
        console.log("runPythonAsync1 test3 1");
        console.log(await pyodide.runPythonAsync("test3()", { locals }));
        console.log("runPythonAsync1 test3 2");
        console.log("runPythonAsync1");
        const result = await pyodide.runPythonAsync("test(inp)", { locals });
        console.log(result);
        console.log(typeof result);
        console.log("runPythonAsync2");
        self.postMessage({ result, id });
        console.log("postMessage");
    } catch (error) {
        console.log("error");
        console.log(typeof error);
        console.log(error);
        console.log("error2");
        self.postMessage({ error: error.message, id });
        console.log("error3");

    }
};
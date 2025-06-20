
function getPromiseAndResolve(): { promise: Promise<unknown>; resolve: any; } {
    let resolve;
    let promise = new Promise((res) => {
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
  function requestResponse(worker: Worker, msg: string): Promise<string> {
    console.log("requestResponse");

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

    return promise as Promise<string>;
  }
  
  const pyodideWorker = new Worker("./webWorker.js", { type: "module" });
  
  export function asyncRun(inp: string): Promise<string> {
    console.log("asyncRun");
    return requestResponse(pyodideWorker, inp);
  }
  
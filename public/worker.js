importScripts("/wiregasm.js");

let sharky = null;
let session = null;

loadWiregasm({
  locateFile: (path, prefix) => {
    console.log("locateFile", path, prefix);
    if (path.endsWith(".data")) return "/wiregasm.bmp";
    if (path.endsWith(".wasm")) return "/wiregasm.wasm";
    return prefix + path;
  },
  setStatus: (text) => {
    if (!text) return;
    postMessage({ type: "progress", message: text });
  },
  instantiateWasm: (info, receiveInstance) => {
    postMessage({ type: "progress", message: "Starting engine download..." });
    fetch("/wiregasm.wasm")
      .then(response => {
        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        let loaded = 0;
        let lastReport = 0;
        
        const reader = response.body.getReader();
        return new Response(
          new ReadableStream({
            async start(controller) {
              while (true) {
                const { done, value } = await reader.read();
                if (done) {
                  postMessage({ type: "progress", message: "WASM downloaded, initializing..." });
                  controller.close();
                  break;
                }
                loaded += value.length;
                if (total) {
                  const now = Date.now();
                  if (now - lastReport > 100) {
                    postMessage({ type: "progress", message: `Downloading Parser Engine (68MB WASM)... ${Math.round((loaded/total)*100)}%` });
                    lastReport = now;
                  }
                }
                controller.enqueue(value);
              }
            }
          }), {
            headers: response.headers
          }
        );
      })
      .then(response => WebAssembly.instantiateStreaming(response, info))
      .then(result => receiveInstance(result.instance, result.module))
      .catch(err => {
        console.error("WASM instantiation failed:", err);
        postMessage({ type: "progress", message: "Failed to download engine." });
      });
    return {};
  }
})
  .then((result) => {
    result.init();
    sharky = result;
    console.log("Wiregasm initialized.");
    const columns = vecToArray(sharky.getColumns());
    postMessage({ type: "init", columns, success: true });
  })
  .catch((error) => {
    console.log({ type: "init", error, success: false });
  });

const vecToArray = (vec) =>
  Array.from({ length: vec.size() }, (_, i) => vec.get(i));

const devectorize = (obj) => {
  if (obj === null) return null;

  if (obj?.constructor?.name?.startsWith("Vector"))
    obj = devectorize(vecToArray(obj));

  if (obj?.entries?.()?.[Symbol.iterator] === "function")
    for (const [i, item] of obj.entries()) obj[i] = devectorize(item);
  else if (typeof obj === "object")
    for (const [i, item] of Object.entries(obj)) obj[i] = devectorize(item);

  return obj;
};

self.addEventListener("message", async ({ data }) => {
  if (data.type === "frame") {
    const frame = devectorize(session.getFrame(data.number));
    return postMessage({ id: data.id, frame });
  }

  if (data.type === "frames") {
    const framesVec = session.getFrames(data.filter ?? "", data.skip ?? 0, data.limit ?? 0);
    const frames = devectorize(framesVec.frames);
    return postMessage({ id: data.id, frames });
  }

  if (data.type === "find") {
    return postMessage({ id: data.id, result: session.findFrame(data.params) });
  }

  if (data.type === "check-filter") {
    return postMessage({ id: data.id, result: sharky.checkFilter(data.filter) });
  }

  if (data.type === "open") {
    try {
      const filePath = `/uploads/${data.file.name}`;
      
      try {
        sharky.FS.mkdir('/uploads');
      } catch (e) {
        // Directory exists, ignore
      }

      console.log("Starting to stream file to WASM FS...", data.file.size);
      postMessage({ type: "progress", message: "Copying to local analyzer memory..." });
      
      const buffer = new Uint8Array(data.file.size);
      const reader = data.file.stream().getReader();
      let position = 0;
      let lastReport = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer.set(value, position);
        position += value.length;
        
        const now = Date.now();
        if (now - lastReport > 200) {
            postMessage({ type: "progress", message: `Copying file... ${Math.round((position / data.file.size) * 100)}%` });
            lastReport = now;
        }
      }
      
      sharky.FS.writeFile(filePath, buffer);
      console.log("File completely streamed to memory and written to WASM FS.");

      postMessage({ type: "progress", message: "Analyzing PCAP structure..." });
      session = new sharky.DissectSession(filePath);

      const result = session.load();
      postMessage({ type: "progress", message: null }); // Clear progress

      return postMessage({ id: data.id, result });
    } catch (e) {
      console.error("Open file error:", e);
      postMessage({ type: "progress", message: null });
      return postMessage({ id: data.id, result: { code: 1, message: e.message } });
    }
  }

  if (data.type === "close") {
    session?.delete();
    session = null;
    return postMessage({ id: data.id, success: true });
  }
});

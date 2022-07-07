import wretch from "wretch"
import { WretchOptions } from "wretch"
import { dedupe } from "../src/index"
import http from "http"
import { mock } from "./mock"

export default describe("DedupeMiddleware", () => {
  const PORT = 5001
  const BASE_URL = `http://localhost:${PORT}`
  let server: http.Server | null = null;
  let logs: any[] = []

  const log = (url: string, options: WretchOptions) => {
    logs.push([url, options.method])
  }

  beforeAll(() => {
    server = http.createServer((req, res) => {
      req.pipe(res)
    });
    server.listen(PORT)
  })

  afterAll(() => {
    server?.close()
  })

  beforeEach(() => {
    logs = []
  })

  it("should prevent sending multiple requests", async () => {
    const w = wretch(BASE_URL).polyfills({ fetch: mock(log) }).middlewares([dedupe()])
    const results = await Promise.all([
      w.get("/one").res(),
      w.get("/one").res(),
      w.get("/one").res(),
      w.get("/two").res(),
      w.get("/two").res(),
      w.get("/three").res(),
      w.post("body", "/one").res(),
      w.post("body", "/one").res(),
    ])

    expect(logs).toEqual([
      ["http://localhost:5001/one", "GET"],
      ["http://localhost:5001/two", "GET"],
      ["http://localhost:5001/three", "GET"],
      ["http://localhost:5001/one", "POST"],
      ["http://localhost:5001/one", "POST"]
    ]);

    results.forEach((result, i) => {
      expect(result).toMatchObject({
        url: "http://localhost:5001/" + ((i < 3 || i > 5) ? "one" : i < 5 ? "two" : "three"),
        status: 200,
        statusText: 'OK',
      })
    });
  })

  it("should skip some requests", async () => {
    const w = wretch(BASE_URL).polyfills({ fetch: mock(log) }).middlewares([dedupe({
      skip: (url, options) => { return options.skip || url.endsWith("/toto") }
    })])
    await Promise.all([
      w.get("/one").res(),
      w.get("/one").res(),
      w.get("/one").res(),
      w.options({ skip: true }).get("/one").res(),
      w.get("/toto").res(),
      w.get("/toto").res()
    ])

    expect(logs).toEqual([
      ["http://localhost:5001/one", "GET"],
      ["http://localhost:5001/one", "GET"],
      ["http://localhost:5001/toto", "GET"],
      ["http://localhost:5001/toto", "GET"],
    ])
  })

  it("should key requests", async () => {
    const w = wretch(BASE_URL).polyfills({ fetch: mock(log) }).middlewares([dedupe({
      key: () => { return "/same-key" }
    })])

    const results = await Promise.all([
      w.get("/one").res(),
      w.get("/two").res(),
      w.get("/three").res()
    ])

    expect(logs).toEqual([
      ["http://localhost:5001/one", "GET"]
    ])

    results.forEach((result, i) => {
      expect(result).toMatchObject({
        url: "http://localhost:5001/one",
        status: 200,
        statusText: 'OK',
      })
    });
  })

  it("should allow custom resolvers", async () => {
    const w = wretch(BASE_URL).polyfills({ fetch: mock(log) }).middlewares([dedupe({
      resolver: res => res
    })])

    const results = await Promise.all([
      w.get("/one").res(),
      w.get("/one").res(),
      w.get("/one").res()
    ])

    expect(results[0]).toStrictEqual(results[1])
    expect(results[0]).toStrictEqual(results[2])
  })
})
import wretch from "wretch"
import { delay } from "../src/index"

export default describe("DelayMiddleware", () => {
  it("should delay requests", async () => {
    let before = 0
    let after = 0
    await wretch("").polyfills({ fetch: () => Promise.resolve({ ok: true }) }).middlewares([
      next => (url, options) => {
        before = new Date().getTime()
        return next(url, options).then(response => {
          after = new Date().getTime()
          return response
        })
      },
      delay(1000)
    ]).get().res()
    expect(after - before).toBeGreaterThan(1000)
  })
})
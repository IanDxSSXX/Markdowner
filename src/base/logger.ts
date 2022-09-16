namespace C {
    export class MarkdownerLogger {
        debugLevel = -1
        warn(position: string, message: string|any) {
            if (typeof message === "string") {
                console.warn(`Markdowner-debug-${position}: ${message}`)
            } else {
                console.warn(`Markdowner-debug-${position}: `, message)
            }
        }

        setDebugLevel(value: number) {
            this.debugLevel = value
        }
        debug(position: string, message: string | any, debugLevel=0) {
            if (this.debugLevel>=debugLevel) {
                if (typeof message === "string") {
                    console.debug(`Markdowner-debug-${position}: ${message}`)
                } else {
                    console.debug(`Markdowner-debug-${position}: `, message)
                }
            }
        }

        throw(position: string, throwMessage: string) {
            throw `Markdowner-${position}: ${throwMessage}`
        }
    }
}


export const MarkdownerLogger = new C.MarkdownerLogger()
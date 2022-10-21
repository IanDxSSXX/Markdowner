import {Markdowner, ReactMarkdowner, RTMarkdowner} from "./base";
import MarkdownIt from "markdown-it";
import {Lexer, marked} from "marked";
import {renderToString} from "react-dom/server";
import {ReactElement} from "react";

Markdowner.init()
async function fileReader(blob: any) {
    return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = async (e: any) => {
            let contentBase = e.target.result
            resolve(contentBase);
        };
        reader.readAsText(blob)
    });
}

export async function readMDFile(fileName: string) {
    let contentBase = ""
    await fetch(`http://localhost:3000/mdBenchmarkFiles/${fileName}.md`)
        .then(res => res.blob())
        .then(async (blob) =>  {
            contentBase = await fileReader(blob)
        });

    return contentBase
}

function calTime(func: () => any) {
    let t1, t2
    t1 = window.performance.now()
    func()
    t2 = window.performance.now()
    return t2-t1
}

async function mdIterParse(fileName="test1", repeatNum=1) {
    let content = (await readMDFile(fileName)).repeat(repeatNum)
    let markdownerTime = calTime(() => {
        let a = Markdowner.parse(content)
    })

    let markdownItTime = calTime(() => {
        let b = (new MarkdownIt()).parse(content, {});
    })

    let markedTime = calTime(() => {
        let c = new Lexer().lex(content)
    })

    return [markdownerTime, markdownItTime, markedTime]
}

async function mdIterRender(fileName="test1", repeatNum=1) {
    let content = (await readMDFile(fileName)).repeat(repeatNum)
    let markdownerTime = calTime(() => {
        let a = renderToString(ReactMarkdowner({content}) as ReactElement)
    })

    let markdownItTime = calTime(() => {
        let b = (new MarkdownIt()).render(content, {});
    })

    let markedTime = calTime(() => {
        let c = marked.parse(content)
    })

    return [markdownerTime, markdownItTime, markedTime]
}


async function benchmarkSingleFile(fileName:string, iterations=1000, repeatNum=1, testType:"render"|"parse"="parse") {
    let markdownerTimes=[], markdownItTimes=[], markedTimes=[]
    let iterFunc = testType === "parse" ? mdIterParse : mdIterRender
    for (let _ of Array(iterations).fill(0)) {
        let [markdownerTime, markdownItTime, markedTime] = await iterFunc(fileName, repeatNum)
        markdownerTimes.push(markdownerTime)
        markdownItTimes.push(markdownItTime)
        markedTimes.push(markedTime)
    }
    let sum = (arr: Array<any>) => arr.reduce((a, b) => a + b, 0)

    let markDownerTime = (sum(markdownerTimes)/iterations).toFixed(3)
    let markdownItTime = (sum(markdownItTimes)/iterations).toFixed(3)
    let markedTime = (sum(markedTimes)/iterations).toFixed(3)
    console.log(`----------${fileName}----------`)
    console.log(`Markdowner:  ${markDownerTime}`)
    console.log(`Markdown-It: ${markdownItTime}`)
    console.log(`Marked:      ${markedTime}`)

    return `| ${fileName} | ${markDownerTime} | ${markdownItTime} | ${markedTime} |\n`

}

export async function benchmark() {
    console.log("start testing")
    let iterations = 1, repeatTimes = 100, testType:"render"|"parse"="parse"
    let tableResult = 
`| file           | markdowner | markdown-it | marked  |
| -------------- | ---------- | ----------- | ------- |
`
    tableResult += await  benchmarkSingleFile("fullFeatures", iterations, repeatTimes, testType)
    // tableResult += await  benchmarkSingleFile("heading", iterations, repeatTimes, testType)
    // tableResult += await  benchmarkSingleFile("list", iterations, repeatTimes, testType)
    // tableResult += await  benchmarkSingleFile("blockQuote", iterations, repeatTimes, testType)
    // tableResult += await  benchmarkSingleFile("codeBlock", iterations, repeatTimes, testType)
    // tableResult += await  benchmarkSingleFile("table", iterations, repeatTimes, testType)
    // tableResult += await  benchmarkSingleFile("footnote", iterations, repeatTimes, testType)
    // tableResult += await  benchmarkSingleFile("checkList", iterations, repeatTimes, testType)
    // tableResult += await  benchmarkSingleFile("inline", iterations, repeatTimes)
    console.log(tableResult)
}
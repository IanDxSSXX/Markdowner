import {Markdowner} from "./index";
import MarkdownIt from "markdown-it";
import {Lexer} from "marked";
import {range} from "@iandx/reactui";
import {totalTime} from "../block/parser";


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
    await fetch(`mdBenchmarkFiles/${fileName}.md`)
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

async function mdTextIter(fileName="test1", repeatNum=1) {
    let content = (await readMDFile(fileName)).repeat(repeatNum)

    let markdownerTime = calTime(() => {
        Markdowner.new().parse(content)
    })

    let markdownItTime = calTime(() => {
        (new MarkdownIt()).parse(content, {});
    })

    let markedTime = calTime(() => {
        new Lexer().lex(content)
    })

    return [markdownerTime, markdownItTime, markedTime]
}

async function benchmarkSingleFile(fileName:string, iterations=1000, repeatNum=1) {
    let markdownerTimes=[], markdownItTimes=[], markedTimes=[]
    for (let _ of range(iterations).asArray()) {
        let [markdownerTime, markdownItTime, markedTime] = await mdTextIter(fileName, repeatNum)
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
    let iterations = 50, repeatTimes = 10
    let tableResult = 
`| file           | markdowner | markdown-it | marked  |
| -------------- | ---------- | ----------- | ------- |
`
    tableResult += await  benchmarkSingleFile("fullFeatures", iterations, repeatTimes)
    tableResult += await  benchmarkSingleFile("heading", iterations, repeatTimes)
    tableResult += await  benchmarkSingleFile("list", iterations, repeatTimes)
    tableResult += await  benchmarkSingleFile("blockQuote", iterations, repeatTimes)
    tableResult += await  benchmarkSingleFile("codeBlock", iterations, repeatTimes)
    tableResult += await  benchmarkSingleFile("table", iterations, repeatTimes)
    tableResult += await  benchmarkSingleFile("footnote", iterations, repeatTimes)
    tableResult += await  benchmarkSingleFile("checkList", iterations, repeatTimes)
    tableResult += await  benchmarkSingleFile("inline", iterations, repeatTimes)
    console.log(tableResult)
}
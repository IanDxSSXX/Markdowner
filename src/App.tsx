import React, {useEffect, useRef} from 'react';
import {MarkdownInlineParser} from "./inline/parser";
import {Lexer, marked} from "marked";
import {Div, RUITag} from "@iandx/reactui/tag";
import {HStack, VStack, Text} from "@iandx/reactui/component";
import {range, useRUIState} from "@iandx/reactui";
import {Markdowner, C} from "./base";
import {MarkdownerDocument} from "./render";
import MarkdownIt from "markdown-it"
import {MarkdownAST} from "./base/syntaxTree";
import {benchmark, readMDFile} from "./base/benchmark";
import { renderToString } from 'react-dom/server'
import katex from "katex"
// @ts-ignore
import * as latex from 'latex.js'

function test() {
    let content =
`hhh
# heading
plain text 1
* list1
  * list11
continue list11
  * list12
  
  plain text3
* list2
continue list2
# heading2
plain text 4
continue plain text\\
plain text 5  
plain text 6
`
    console.log(content)
    // console.log("fuck",/(?:(?<=\n|^) *\* .+?(?:\n|$))/g.test("  * list11\\n"))

    let out = Markdowner.parse(content)
    console.log(out)
    //
    // let arr = range(5000000).asArray()
    // let a,b
    // let t1,t2
    // t1 = performance.now()
    // for (let i of arr) {
    //     a =i
    //     b=i
    // }
    // t2 = performance.now()
    // console.log(t2-t1)

}
Markdowner.init({softBreak: true, willParseContent:false})




function App() {
    // benchmark()
    // test()
    readMDFile("fullFeatures").then(content => {
        // let trees = Markdowner.new({willParseContent:false}).parse(content)
        // console.log(trees)
    })

    let markdownASTs = useRUIState([])
    return (
      HStack(
          RUITag("textarea")
              .onChange((e)=>{
                  let content = (e.target as any).value
                  let t1,t2
                  t1 = performance.now()
                  let trees = Markdowner.ASTHelper.incrementalParse(content)
                  t2 = performance.now()
                    console.log(t2-t1)
                  t1 = performance.now()
                  let a2 = Markdowner.new().ASTHelper.incrementalParse(content)
                  t2 = performance.now()
                  console.log(t2-t1)
                  console.log(a2)

                  markdownASTs.value = trees
                  // console.log(Markdowner.new().parse(content))
              })
              .height("100%")
              .width("46%")
              .padding("20px")
              .outline("none")
              .border("1px solid gray"),

          MarkdownerDocument({markdownASTs: markdownASTs.value})
              .height("100%")
              .width("46%")
              .padding("20px")
              .border("1px solid gray")
              .overflow("scroll")

      )
          .width("96%")
          .height("800px")
          .margin("%2")
          .asReactElement()
    )
}

export default App;

import React, {useEffect, useRef} from 'react';
import {MarkdownInlineParser} from "./inline/parser";
import {Lexer, marked} from "marked";
import {Div, RUITag} from "@iandx/reactui/tag";
import {HStack, VStack, Text} from "@iandx/reactui/component";
import {range, useRUIState} from "@iandx/reactui";
import {Markdowner, C} from "./base";
import {MarkdownerDocument} from "./render";
import MarkdownIt from "markdown-it"
import {MarkdownSyntaxTree} from "./base/syntaxTree";
import {benchmark, readMDFile} from "./base/benchmark";
import { renderToString } from 'react-dom/server'
import katex from "katex"
// @ts-ignore
import * as latex from 'latex.js'

function test() {


}
Markdowner.init({softBreak: false})




function App() {

    let syntaxTrees = useRUIState([])
    // benchmark()
    // readMDFile("fullFeatures").then(content => {
    //     let trees = Markdowner.parse(content)
    //     console.log(trees)
    //     let newTrees = new C.SyntaxTreeHelper(trees).flatten()
    //     console.log(newTrees)
    // })

    return (
      HStack(
          RUITag("textarea")
              .onChange((e)=>{
                  let plainContent = (e.target as any).value
                  let trees = Markdowner.ASTHelper.incrementalParse(plainContent)
                  syntaxTrees.value = trees
                  console.log(trees)
                  const toFindDuplicates = (arry:any) => arry.filter((item:any, index:any) => arry.indexOf(item) !== index)
                  console.log(trees.filter(t => toFindDuplicates(trees.map(t=>t.id!)).includes(t.id)))
                  // readMDFile("fullFeatures").then(content => {
                  //     // for (let i of range(10).asArray()) {
                  //     //     console.log(Markdowner.render(content))
                  //     // }
                  // })
                  // console.log(JSON.stringify(trees))

                  // console.log(trees)
              })
              .height("600px")
              .width("300px")
              .padding("20px")
              .outline("none")
              .border("1px solid gray"),

          MarkdownerDocument({syntaxTrees: syntaxTrees.value})
              .width("300px")
              .height("600px")
              .padding("20px")
              .border("1px solid gray")
              .overflow("scroll")

      )
          .width("600px")
          .height("600px")
          .margin("40px")
          .asReactElement()
    )
}

export default App;

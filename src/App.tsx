import {HStack, VStack, Text} from "@iandx/reactui/component";
import {range, useRUIState, RUITag, RUI, RUIElement} from "@iandx/reactui";
import {Markdowner, MarkdownerView} from "./base";
import {Div, Span} from "@iandx/reactui/tag";
import {benchmark} from "./base/benchmark";
import {InlineElements, InlineRUIElements} from "./render/view";



Markdowner.init({softBreak: false})
Markdowner.dropRule.block(["Heading"])
Markdowner.addRule.block({
    name: "Heading",
    rule: {
        tags: {
            leading: /#{1,5} /,
            exact: [/(?:\n|^).+?\n===+ */, /(?:\n|^).+? ?\n---+ */]
        },
        getProps: (raw) => {
            let headingLevel: number
            let hashHeadingMatch = raw.match(/^#+ /)
            if (hashHeadingMatch) {
                headingLevel = hashHeadingMatch![0].trim().length
            } else {
                let heading1Match = raw.match(/\n===+/)
                headingLevel = !!heading1Match ? 1 : 2
            }
            return {headingLevel}
        },
        trimText: raw => raw.replaceAll(/\n((===+)|(---+))/g, "").replaceAll(/^#{1,5} /g, ""),
        parseContent: text => text,
        recheckMatch: raw => {
            return true
        },
        blockType: "leaf"
    },
    view: (content: any, {headingLevel, blockProp}) =>
        Span(content+(!!blockProp ? blockProp.a:"")).fontSize(`${(5 - (headingLevel ?? 1)) * 6 + 15}px`)
})


function App() {
    // benchmark()
    let content = useRUIState("")
    return (
      HStack(
          RUITag("textarea")()
              .onChange((e)=>{
                  content.value = (e.target as any).value
              })
              .height("100%")
              .width("48%")
              .padding("20px")
              .outline("none")
              .border("1px solid gray"),

          Div(
              // RUITag(MarkdownerView)()
                  <MarkdownerView content={content.value} incrementalParse={true}/>
                  // .setProps({content: content.value, incrementalParse: true})
          )
              .height("100%")
              .width("48%")
              .padding("20px")
              .border("1px solid gray")
              .overflow("scroll")
      )
          .position("fixed")
          .width("90%")
          .height("90vh")
          .padding("2vh 2%")
          .asReactElement()
    )
}

export default App;

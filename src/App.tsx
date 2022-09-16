import {HStack, VStack, Text} from "@iandx/reactui/component";
import {range, useRUIState, RUITag, RUI, RUIElement} from "@iandx/reactui";
import {
    InlineElements,
    InlineRUIElements,
    Markdowner,
    MarkdownerBlockRuleInterface,
    ReactMarkdowner,
    RUIMarkdowner
} from "./base";
import {Div} from "@iandx/reactui/tag";

Markdowner.init({softBreak: true})
Markdowner.dropRule.block(["Heading"])
Markdowner.addRule.inline({
    name: "What",
    rule: { tags:{round: "hh" }, allowNesting: false},
    view: (content: string) =>
        <span style={{color:"red"}}>{content}</span>,
})
Markdowner.debug(2)



function EditableMarkdowner() {
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
              RUIMarkdowner({content: content.value})
                // <ReactMarkdowner incrementalParse={true}>{content.value}</ReactMarkdowner>
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

    )
}

function App() {
    return EditableMarkdowner().asReactElement()
}


export default App;

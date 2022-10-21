import {HStack, VStack, Text} from "@renest/component";
import {RTConfig, State, TagView, useState, View, ViewWrapper} from "@renest/renest";
import {
    Markdowner,
    RTMarkdowner
} from "./base";
import {Div} from "./renderer/Convert";
RTConfig.debug = false


Markdowner.init({softBreak: true})
Markdowner.dropRule.block(["Heading"])
Markdowner.addRule.inline({
    name: "What",
    rule: { tags:{round: "hh"}, allowNesting: true},
    view: (content: any) => {
        return <span style={{color:"red"}}>{content}</span>
    }
})
Markdowner.debug(-1)


class EditableMarkdowner extends View {
    @State mdContent = ""
    Body = () =>
        HStack(
            TagView("textarea")()
                .onChange((e: any)=>{
                    this.mdContent = (e.target as any).value
                })
                .height("100%")
                .width("48%")
                .padding("20px")
                .outline("none")
                .border("1px solid gray"),

            Div(
                RTMarkdowner(this.mdContent)
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

}

function App() {
    return ViewWrapper(EditableMarkdowner)().asReactElement()
}


export default App;

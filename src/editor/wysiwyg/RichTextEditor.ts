import {ReactUIElement} from "@iandx/reactui/core";
import EditableDiv from "../utils/EditableDiv";
import {ForEach, useRUIState} from "@iandx/reactui";
import {RUIMarkdowner} from "../../base";

export class RichTextEditor extends ReactUIElement {
    Body = () => {
        let content = useRUIState("")

        let textBlock =
            EditableDiv(
                RUIMarkdowner({content: content.value}),
            ).registerBy(this)

        textBlock
            .onInput((e)=>{
                let currContent = e.currentTarget.textContent
                console.log(currContent)
            })



        return textBlock
    }
}

export default function() {
    return new RichTextEditor()
}
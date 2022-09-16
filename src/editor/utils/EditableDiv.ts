import {Div} from "@iandx/reactui/tag";
import {useRef} from "react";
import {ReactUIElement, RUIProp} from "@iandx/reactui/core";

class EditableDiv extends ReactUIElement {
    Body = ({content}:any):any => {
        const editor = Div(...content).registerBy(this)
        const compositionStart = this.C.compositionStart ?? useRef(false);
        const handleChange = (inputData: string, event:any, isComposition: boolean) => !!this.C.onChange && this.C.onChange(inputData, event, isComposition)

        editor
            .outline("none")
            .whiteSpace("pre")
            .setProp("contentEditable", true)
            .setProp("suppressContentEditableWarning", true)
            .onDragStart(event => {event.preventDefault()}) // disable text drag
            .onDrop(event => {event.preventDefault()}) // disable text drag
            .onCompositionStart(()=>{
                compositionStart.current = true
            })
            .onCompositionEnd((event)=>{
                compositionStart.current = false
                handleChange(event.data, event, true)
            })
            .onInput((event)=>{
                if (!compositionStart.current) {
                    handleChange((event.nativeEvent as InputEvent).data ?? "", event, false);
                }
            })


        return editor
    }

    @RUIProp
    onChange(value: any): any { return this }

    @RUIProp
    compositionStart(value: any): any { return this }
}


export default function(...content:any) {
    return new EditableDiv({content})
}

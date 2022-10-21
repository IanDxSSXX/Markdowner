import {Prop, RTConfig, View, ViewWrapper} from "@renest/renest";
import {MarkdownerLogger} from "./logger";
import {Div} from "../renderer/Convert";
import {MarkdownerDocument, MarkdownerMapBlock, MarkdownerMapInline} from "../renderer/DocumentView";
import {Markdowner, MarkdownerViewProps} from "./markdowner";


class MarkdownerView extends View {
    @Prop content: any
    markdownASTs: any

    didMount = () => {
        console.log("what")
    }

    Preset = () => {
        this.markdownASTs = Markdowner.incrementalParse(this.content)
        MarkdownerLogger.debug("generatedAST", this.markdownASTs, 0)
        MarkdownerMapInline.value = Markdowner.inlineRuleMap
        MarkdownerMapBlock.value = Markdowner.blockRuleMap
    }

    Body = () =>
        Div(
            MarkdownerDocument(this.markdownASTs)
        ).className("Markdowner-Document-root")
}


export const RTMarkdowner = (content: any) => ViewWrapper(MarkdownerView)({content})

export function ReactMarkdowner(props: MarkdownerViewProps) {
    return RTMarkdowner(props).asReactElement()
}

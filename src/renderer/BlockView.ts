import {FuncView, Prop, View, ViewWrapper} from "@renest/renest";
import {MarkdownAST} from "../base/ast";
import {useMemo} from "react";
import {Div, Span} from "./Convert";
import {MarkdownerLogger} from "../base/logger";
import {toRTElement} from "./utils";
import {MarkdownerMapBlock} from "./DocumentView";
import {defaultBlockMap} from "./defaultRuleMaps/block";

class BlockView extends View {
    @Prop markdownAST: MarkdownAST | any

    block() {
        let map = MarkdownerMapBlock.value ?? defaultBlockMap
        let blockFunc = map[this.markdownAST.type]
        let element
        if (!!blockFunc) {
            element = blockFunc(this.markdownAST.content, this.markdownAST.props)
        } else {
            MarkdownerLogger.warn("Render-block", `didn't have a block map named ${this.markdownAST.type}, treat it as plain text`)
            element = Span(this.markdownAST.raw)
        }

        return toRTElement(element)
    }

    Body = () =>
        Div(
            this.block()
        )
            .width("100%")
            .wordWrap("break-word")
            .whiteSpace("pre-wrap")
            .margin("0px")
            .className(`Markdowner-Block-${this.markdownAST.type}`)
}


export default ViewWrapper(BlockView)


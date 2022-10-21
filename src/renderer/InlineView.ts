import {MarkdownAST} from "../base/ast";
import {Prop, View, ViewWrapper} from "@renest/renest";
import {MarkdownerLogger} from "../base/logger";
import {Span} from "./Convert";
import {MarkdownerMapInline} from "./DocumentView";
import {toRTElement} from "./utils";
import {defaultInlineMap} from "./defaultRuleMaps/inline";

class InlineView extends View {
    @Prop markdownAST: MarkdownAST | any

    inline() {
        let map = MarkdownerMapInline.value ?? defaultInlineMap
        let inlineFunc = map[this.markdownAST.type]
        let element
        if (!!inlineFunc) {
            element = inlineFunc(this.markdownAST.content, this.markdownAST.props)
        } else {
            MarkdownerLogger.warn("Render-inline", `didn't have a block map named ${this.markdownAST.type}, treat it as plain text`)
            element = Span(this.markdownAST.raw)
        }
        return toRTElement(element)
    }

    Body = () =>
        this.inline()
            .className(`Markdowner-inline-${this.markdownAST.type}`)

}

const Inline = ViewWrapper(InlineView)

export function InlineRTElements(inlineASTs: MarkdownAST[]) {
    return inlineASTs
        .map((inlineAST, idx) =>
            Inline({markdownAST:inlineAST})
                .key(inlineAST.id??idx)
        )
}

export function InlineElements(inlineASTs: MarkdownAST[]) {
    return InlineRTElements(inlineASTs)
        .map(el=>el.asReactElement())
}

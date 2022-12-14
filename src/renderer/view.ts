import {ConditionView, ForEach, RUI, RUIElement, RUIFragment, RUITag, useRUIState} from "@iandx/reactui";
import {MarkdownAST} from "../base/ast";
import {List} from "@iandx/reactui/component";
import {defaultBlockMap, defaultInlineMap, MarkdownerViewFunc} from "./ruleMap";
import {Div, Span} from "@iandx/reactui/tag";
import {ReactElement, useMemo} from "react";
import {ReactUIBase} from "@iandx/reactui/core";
import {MarkdownerLogger} from "../base/logger";

namespace C {
    export class MarkdownerViewBase {
        blockMap: { [key: string]: MarkdownerViewFunc } = defaultBlockMap
        inlineMap: { [key: string]: MarkdownerViewFunc } = defaultInlineMap

        init(blockMap: { [key: string]: MarkdownerViewFunc }, inlineMap: { [key: string]: MarkdownerViewFunc }) {
            this.blockMap = blockMap
            this.inlineMap = inlineMap
        }

        documentView = RUI(({markdownASTs, isDocument}: { markdownASTs: MarkdownAST[], isDocument: boolean }) => {
            let newMarkdownASTs = markdownASTs
                .filter((markdownAST: MarkdownAST) => markdownAST.props?.visible ?? true)
                .map((markdownAST: MarkdownAST) => ({
                    ast: markdownAST,
                    order: markdownAST.props?.elementOrder ?? 1
                }))
                .sort((a: any, b: any) => a.order - b.order)
                .map(t => t.ast)

            return (
                List(newMarkdownASTs, (markdownAST: MarkdownAST, idx) =>
                    this.blockView({markdownAST})
                        .key(!!markdownAST.id ? markdownAST.id : idx)
                )
                    .width("100%")
                    .spacing((isDocument ?? false) ? "10px" : "0px")
                    .alignment("leading")
            )
        })

        private blockView = RUI(({markdownAST}: { markdownAST: MarkdownAST }) =>
            useMemo(() =>
                    Div(
                        this.block(markdownAST)
                    )
                        .width("100%")
                        .wordWrap("break-word")
                        .whiteSpace("pre-wrap")
                        .margin("0px")
                        .className(`Markdowner-Block-${markdownAST.type}`)
                , [markdownAST.id ?? false, markdownAST.raw])
        )

        private block(markdownAST: MarkdownAST): ReactUIBase {
            let blockFunc = this.blockMap[markdownAST.type]
            let element
            if (!!blockFunc) {
                element = blockFunc(markdownAST.content, markdownAST.props)
            } else {
                MarkdownerLogger.warn("Render-block", `didn't have a block map named ${markdownAST.type}, treat it as plain text`)
                element = Span(markdownAST.raw)
            }

            return this.toRUIElement(element)
        }

        private inlineView = RUI(({markdownAST}: { markdownAST: MarkdownAST }) => {
            return  useMemo(() =>
                    this.inline(markdownAST)
                        .className(`Markdowner-inline-${markdownAST.type}`)
                , [markdownAST.id ?? false, markdownAST.raw])
        })

        private inline(inlineAST: MarkdownAST): ReactUIBase {
            let inlineFunc = this.inlineMap[inlineAST.type]
            let element
            if (!!inlineFunc) {
                element = inlineFunc(inlineAST.content, inlineAST.props)
            } else {
                MarkdownerLogger.warn("Render-inline", `didn't have a block map named ${inlineAST.type}, treat it as plain text`)
                element = Span(inlineAST.raw)
            }
            return this.toRUIElement(element)
        }

        inlineRUIElements(inlineASTs: MarkdownAST[]) {
            return inlineASTs.map((inlineAST, idx) => this.inlineView({markdownAST:inlineAST}).key(inlineAST.id??idx))
        }

        inlineElements(inlineASTs: MarkdownAST[]) {
            return this.inlineRUIElements(inlineASTs).map(el=>el.asReactElement())
        }

        toRUIElement(element: ReactUIBase | ReactElement): ReactUIBase {
            if ((element as any).IAmReactUI??false) {
                return element as ReactUIBase
            } else {
                return RUIElement(element as ReactElement)
            }
        }

        
    }
}

export const MarkdownerViewBase = new C.MarkdownerViewBase()
export const InlineRUIElements = (inlineASTs: MarkdownAST[]) => MarkdownerViewBase.inlineRUIElements(inlineASTs)
export const InlineElements = (inlineASTs: MarkdownAST[]) => MarkdownerViewBase.inlineElements(inlineASTs)

export const BlockRUIElements = (blockASTs: MarkdownAST[]) => MarkdownerViewBase.documentView({markdownASTs: blockASTs})
export const BlockElements = (blockASTs: MarkdownAST[]) => MarkdownerViewBase.documentView({markdownASTs: blockASTs}).asReactElement()

export const MarkdownerDocument = (blockASTs: MarkdownAST[]) => MarkdownerViewBase.documentView({markdownASTs: blockASTs, isDocument:true})

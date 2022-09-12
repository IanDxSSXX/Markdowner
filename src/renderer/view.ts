import {ConditionView, ForEach, RUI, RUIElement, RUIFragment, RUITag, useRUIState} from "@iandx/reactui";
import {MarkdownAST} from "../base/syntaxTree";
import {List} from "@iandx/reactui/component";
import {defaultBlockMap, defaultInlineMap, MarkdownerViewFunc} from "./ruleMap";
import {Div, Span} from "@iandx/reactui/tag";
import {ReactElement, useEffect, useMemo, useRef} from "react";
import {ReactUIBase} from "@iandx/reactui/core";
import {isInstanceOf, uid} from "../base/utils";
import React from "react"
import {MarkdownerHelper} from "../base/helper";

namespace C {
    export class MarkdownerViewBase {
        blockMap: { [key: string]: MarkdownerViewFunc } = defaultBlockMap
        inlineMap: { [key: string]: MarkdownerViewFunc } = defaultInlineMap

        init(blockMap: { [key: string]: MarkdownerViewFunc }, inlineMap: { [key: string]: MarkdownerViewFunc }) {
            this.blockMap = blockMap
            this.inlineMap = inlineMap
        }

        MarkdownDocument = RUI(({markdownASTs, isDocument}: { markdownASTs: MarkdownAST[], isDocument: boolean }) => {
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
                    this.Block({markdownAST})
                        .key(!!markdownAST.id ? markdownAST.id : idx)
                )
                    .width("100%")
                    .spacing((isDocument ?? false) ? "10px" : "0px")
                    .alignment("leading")
            )
        })

        private Block = RUI(({markdownAST}: { markdownAST: MarkdownAST }) =>
            useMemo(() =>
                    Div(
                        this.block(markdownAST)
                    )
                        .width("100%")
                        .wordWrap("break-word")
                        .whiteSpace("pre-wrap")
                        .margin("0px")
                        .className(`Markdowner-Block-${markdownAST.type}`)
                , [markdownAST.id ?? markdownAST.content])
        )

        private block(markdownAST: MarkdownAST): ReactUIBase {
            let blockFunc = this.blockMap[markdownAST.type]
            let element
            if (!!blockFunc) {
                element = blockFunc(markdownAST.content, markdownAST.props)
            } else {
                MarkdownerHelper.warn("Render-block", `didn't have a block map named ${markdownAST.type}, treat it as plain text`)
                element = Span(markdownAST.raw)
            }

            return MarkdownerViewBase.toRUIElement(element)
        }

        private static toRUIElement(content: ReactUIBase | ReactElement): ReactUIBase {
            if (isInstanceOf(content, ReactUIBase)) {
                return content as ReactUIBase
            } else {
                return RUIElement(content as ReactElement)
            }
        }

        private static toReactElement(content: ReactUIBase | ReactElement): ReactElement {
            if (isInstanceOf(content, ReactUIBase)) {
                return (content as ReactUIBase).asReactElement()
            } else {
                return content as ReactElement
            }
        }

        inlineElements(inlineASTs: MarkdownAST[]) {
            return inlineASTs.map(inlineAST => MarkdownerViewBase.toReactElement(this.inlineElement(inlineAST)))
        }

        inlineRUIElements(inlineASTs: MarkdownAST[]) {
            return inlineASTs.map(inlineAST => MarkdownerViewBase.toRUIElement(this.inlineElement(inlineAST)))
        }

        private inlineElement(inlineAST: MarkdownAST): ReactUIBase|ReactElement {
            let inlineFunc = this.inlineMap[inlineAST.type]
            let element
            if (!!inlineFunc) {
                element = inlineFunc(inlineAST.content, inlineAST.props)
            } else {
                MarkdownerHelper.warn("Render-inline", `didn't have a block map named ${inlineAST.type}, treat it as plain text`)
                element = Span(inlineAST.raw)
            }
            return element
        }


    }
}

export const MarkdownerViewBase = new C.MarkdownerViewBase()
export const InlineElements = (inlineASTs: MarkdownAST[]) => MarkdownerViewBase.inlineElements(inlineASTs)
export const InlineRUIElements = (inlineASTs: MarkdownAST[]) => MarkdownerViewBase.inlineRUIElements(inlineASTs)
export const MarkdownDocument = (props: { markdownASTs: MarkdownAST[], isDocument?: boolean }) =>
    MarkdownerViewBase.MarkdownDocument(props)
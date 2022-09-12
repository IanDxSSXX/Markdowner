import {MarkdownAST} from "../base/syntaxTree";
import {defaultBlockMap, defaultInlineMap, MarkdownerViewFunc} from "./ruleMap";
import {ReactElement, useEffect, useMemo, useRef} from "react";
import {MarkdownerHelper} from "../base/helper";
import React from "react";

namespace C {
    export class MarkdownerViewBase {
        blockMap: { [key: string]: MarkdownerViewFunc } = defaultBlockMap
        inlineMap: { [key: string]: MarkdownerViewFunc } = defaultInlineMap

        init(blockMap: { [key: string]: MarkdownerViewFunc }, inlineMap: { [key: string]: MarkdownerViewFunc }) {
            this.blockMap = blockMap
            this.inlineMap = inlineMap
        }


         block(markdownAST: MarkdownAST): ReactElement {
            let blockFunc = this.blockMap[markdownAST.type]
            let element
            if (!!blockFunc) {
                element = blockFunc(markdownAST.content, markdownAST.props)
            } else {
                MarkdownerHelper.warn("Render-block", `didn't have a block map named ${markdownAST.type}, treat it as plain text`)
                element = <span>{markdownAST.raw}</span>
            }

            return element
        }


        inlineElements(inlineASTs: MarkdownAST[]) {
            return React.Children.toArray(inlineASTs.map((inlineAST) => this.inlineElement(inlineAST)))
        }


        private inlineElement(inlineAST: MarkdownAST): ReactElement {
            let inlineFunc = this.inlineMap[inlineAST.type]
            let element
            if (!!inlineFunc) {
                element = inlineFunc(inlineAST.content, inlineAST.props)
            } else {
                MarkdownerHelper.warn("Render-inline", `didn't have a block map named ${inlineAST.type}, treat it as plain text`)
                element = <span>{inlineAST.raw}</span>
            }
            return element
        }


    }
}

export const MarkdownerViewBase = new C.MarkdownerViewBase()
export const InlineElements = (inlineASTs: MarkdownAST[]) => MarkdownerViewBase.inlineElements(inlineASTs)


export function MarkdownDocument({markdownASTs, isDocument}: { markdownASTs: MarkdownAST[], isDocument?: boolean }) {
    let newMarkdownASTs = markdownASTs
        .filter((markdownAST: MarkdownAST) => markdownAST.props?.visible ?? true)
        .map((markdownAST: MarkdownAST) => ({
            ast: markdownAST,
            order: markdownAST.props?.elementOrder ?? 1
        }))
        .sort((a: any, b: any) => a.order - b.order)
        .map(t => t.ast)

    return (
        <div style={{
            width: "100%",
            marginBottom: (isDocument ?? false) ? "10px" : "0px"
        }}>
            {newMarkdownASTs.map((markdownAST: MarkdownAST, idx) =>
                <Block markdownAST={markdownAST} key={!!markdownAST.id ? markdownAST.id : idx}/>
            )}
        </div>
    )
}

function Block({markdownAST}: { markdownAST: MarkdownAST }) {
    return (
        useMemo(() =>
            <div
                id={`Markdowner-Block-${markdownAST.type}`}
                style={{
                    width: "100%",
                    wordWrap: "break-word",
                    whiteSpace: "pre-wrap",
                    margin: "0px"
                }}>
                {MarkdownerViewBase.block(markdownAST)}
            </div>
        , [markdownAST.id ?? markdownAST.content])
    )
}

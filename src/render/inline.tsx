import {flattened, isInstanceOf} from "../base/utils";
import {Div, P, RUITag, Span} from "@iandx/reactui/tag";
import {ReactUIBase, ReactUIElement} from "@iandx/reactui/core";
import {RUI, RUIElement} from "@iandx/reactui";
import {MarkdownSyntaxTree} from "../base/syntaxTree";
import {ReactElement} from "react";
import {inlineMaps} from "./defaultMaps";
import {renderToString} from "react-dom/server";

export interface InlineContent {
    htmlContents: string[]
    reactContents: ReactElement[]
    ruiContents: ReactUIBase[]
}
export type ContentType = ReactUIBase | ReactElement | string

export function contentToRUIElement(inlineContent: ContentType): ReactUIBase {
    if (isInstanceOf(inlineContent, ReactUIBase)) {
        return inlineContent as ReactUIBase
    } else if(typeof inlineContent === "string"){
        return Span().setProp("dangerouslySetInnerHTML", {__html: inlineContent})
    } else {
        return RUIElement(inlineContent as ReactElement)
    }
}

function contentToReactElement(inlineContent: ContentType): ReactElement {
    if (isInstanceOf(inlineContent, ReactUIBase)) {
        return (inlineContent as ReactUIBase).asReactElement()
    } else if(typeof inlineContent === "string"){
        return Span().setProp("dangerouslySetInnerHTML", {__html: inlineContent}).asReactElement()
    } else {
        return inlineContent as ReactElement
    }
}

function contentToHtml(inlineContent: ContentType): string {
    if (isInstanceOf(inlineContent, ReactUIBase)) {
        return renderToString((inlineContent as ReactUIBase).asReactElement())
    } else if(typeof inlineContent === "string"){
        return inlineContent
    } else {
        return renderToString(inlineContent as ReactElement)
    }
}

function inlineSyntaxTreeToViews(inlineSyntaxTree: MarkdownSyntaxTree): ReactUIBase{
    let children = inlineSyntaxTree.children
    let mappedElementFunc = (inlineMaps as any)[inlineSyntaxTree.type!]
    let htmlContents: string[]
    let reactContents: ReactElement[]
    let ruiContents: ReactUIBase[]

    if (!children || (children!.length === 1 && children![0].type === "Text")) {
        let content = inlineSyntaxTree.content!
        htmlContents = [contentToHtml(content)]
        reactContents = [contentToReactElement(content)]
        ruiContents = [contentToRUIElement(content)]
    } else {
        let contents = children!.map(childTree => inlineSyntaxTreeToViews(childTree))
        htmlContents = contents.map((c: ReactUIBase)=>contentToHtml(c))
        reactContents = contents.map((c: ReactUIBase)=>contentToReactElement(c))
        ruiContents = contents.map((c: ReactUIBase)=>contentToRUIElement(c))
    }

    return mappedElementFunc({htmlContents, reactContents, ruiContents}, inlineSyntaxTree.props)
}

export function inlineElements(content: MarkdownSyntaxTree | MarkdownSyntaxTree[] | ContentType): ReactUIBase[] {
    let elements: ReactUIBase[]
    if (content instanceof Array<MarkdownSyntaxTree>) {
        elements = content.map((tree: MarkdownSyntaxTree) => {
            let content: ContentType = inlineSyntaxTreeToViews(tree)
            return contentToRUIElement(content)
        })
    } else if (Object.hasOwn(content as Object, "type") )  {
        elements = [contentToRUIElement(inlineSyntaxTreeToViews(content as MarkdownSyntaxTree))]
    } else {
        elements = [
            contentToRUIElement(content as ContentType)
        ]
    }
    return elements
}










import {ContainerItem, MarkdownAST} from "../../base/ast";
import {ReactElement} from "react";
import {A, Em, Span, Strong} from "../Convert";
import {ConditionView, TagView} from "@renest/renest";
import {MarkdownerLogger} from "../../base/logger";
import {Markdowner} from "../../base";
import {MarkdownerRuleMap} from "../utils";
import {InlineRTElements} from "../InlineView";

export const defaultInlineMap: MarkdownerRuleMap = {
    Text: (content) =>
        content,
    Italic: (content) =>
        Em(InlineRTElements(content)),
    Bold: (content) =>
        Strong( InlineRTElements(content)),
    Strike: (content) =>
        Span(InlineRTElements(content)).textDecoration("line-through"),
    Code: (content) =>
        Span(InlineRTElements(content))
            .backgroundColor("#eeeeee")
            .borderRadius("3px")
            .color(`#e37d7d`)
            .letterSpacing("0.5px")
            .fontSize("95%")
            .padding("0.2em 0.4em"),
    Link: (content, {linkUrl, cleanDisplay}) =>
        ConditionView(cleanDisplay??false, {
            true: () => A(InlineRTElements(content))
                .textDecoration("none")
                .color("gray"),
            false: () => A(InlineRTElements(content))
        }).setProp("href", linkUrl),
    Underline: (content) =>
        Span(InlineRTElements(content)).textDecoration("underline"),
    Superscript: (content) =>
        TagView("sup")(InlineRTElements(content)),
    Subscript: (content) =>
        TagView("sub")(InlineRTElements(content)),
    Escape: (content) =>
        Span(InlineRTElements(content)),
    Highlight: (content) =>
        Span(InlineRTElements(content)).backgroundColor("Highlight"),
    HtmlTag: (content) =>
        Span().setProp("dangerouslySetInnerHTML", {__html: content}),
    Math: (content) => {
        let __html: string
        try {
            const katex = require("katex");
            // @ts-ignore
            import("katex/dist/katex.css")
            __html = katex.renderToString(content, {
                throwOnError: false,
                output: "html",
                displayMode: false
            })
        } catch (e) {
            __html = content
            MarkdownerLogger.warn("Latex math", "Error when parsing LaTex math formula, default parser is using " +
                "this project(https://github.com/KaTeX/KaTeX), " +
                "install it as dependency to use this feature or override [MathBlock] View")
        }
        return (
            Span()
                .setProp("dangerouslySetInnerHTML", {__html})
        )
    }
    ,
    FootnoteSup: (content: string, {footnoteSupId}) =>
        A(
            TagView("sup")(`[${content}]`).id(`Markdowner-FootnoteSup-${content}-${footnoteSupId}`)
        )
            .setProp("href", `#Markdowner-Footnote-${content}-0`)
            .color("gray")
            .textDecoration("none")
    ,
    LinkTag: (content, {tagName}: any) =>  {
        let linkBlocks = Markdowner.ast.findBlocks("LinkTagBlock", t=>t.props.tagName === tagName)
        return ConditionView(linkBlocks.length === 0, {
            true: () => Span("[",InlineRTElements(content),"]"),
            false: () => A(Span(tagName))
                .setProp("href", linkBlocks[0].props.tagUrl)
        })
    }
}


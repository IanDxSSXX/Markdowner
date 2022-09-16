import {
    A,
    Div,
    Em,
    Img,
    Input,
    Span,
    Strong,
    Table,
    Tbody,
    Th,
    Tr,
    Td,
    Blockquote
} from "@iandx/reactui/tag";

import {ContainerItem, MarkdownAST} from "../base/ast";
import {ForEach, RUITag, RUIFragment, range, uid, ConditionView} from "@iandx/reactui";
import {Markdowner} from "../base";
import {MdOutlineReply, MdCircle} from "react-icons/md"
import {ReactUIBase} from "@iandx/reactui/core";
import {latexStyle} from "../.supports/latexStyles/styles";
import {Indexing} from "../base/utils";
import {BlockRUIElements, InlineRUIElements} from "./view";
import {ReactElement} from "react";
import {MarkdownerLogger} from "../base/logger";


export type MarkdownerViewFunc = (content: string|MarkdownAST[]|ContainerItem[]|any, props: any)=>ReactUIBase|ReactElement
export interface MarkdownerRuleMap {[key:string]: MarkdownerViewFunc}
export const defaultInlineMap: MarkdownerRuleMap = {
    Text: (content) =>
        content,
    Italic: (content) =>
        Em(InlineRUIElements(content)),
    Bold: (content) =>
        Strong( InlineRUIElements(content)),
    Strike: (content) =>
        Span(InlineRUIElements(content)).textDecoration("line-through"),
    Code: (content) =>
        Span(InlineRUIElements(content))
            .backgroundColor("#eeeeee")
            .borderRadius("3px")
            .color(`#e37d7d`)
            .letterSpacing("0.5px")
            .fontSize("95%")
            .padding("0.2em 0.4em"),
    Link: (content, {linkUrl, cleanDisplay}) =>
        ConditionView(cleanDisplay??false, {
            true: () => A(InlineRUIElements(content))
                .textDecoration("none")
                .color("gray"),
            false: () => A(InlineRUIElements(content))
        }).setProp("href", linkUrl),
    Underline: (content) =>
        Span(InlineRUIElements(content)).textDecoration("underline"),
    Superscript: (content) =>
        RUITag("sup")(InlineRUIElements(content)),
    Subscript: (content) =>
        RUITag("sub")(InlineRUIElements(content)),
    Escape: (content) =>
        Span(InlineRUIElements(content)),
    Highlight: (content) =>
        Span(InlineRUIElements(content)).backgroundColor("Highlight"),
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
            RUITag("sup")(`[${content}]`).id(`Markdowner-FootnoteSup-${content}-${footnoteSupId}`)
        )
            .setProp("href", `#Markdowner-Footnote-${content}-0`)
            .color("gray")
            .textDecoration("none")
    ,
    LinkTag: (content, {tagName}: any) =>  {
        let linkBlocks = Markdowner.ast.findBlocks("LinkTagBlock", t=>t.props.tagName === tagName)
        return ConditionView(linkBlocks.length === 0, {
            true: () => Span("[",InlineRUIElements(content),"]"),
            false: () => A(Span(tagName))
                .setProp("href", linkBlocks[0].props.tagUrl)
        })
    }
}

export const defaultBlockMap: MarkdownerRuleMap = {
    Paragraph: (content) =>
        RUIFragment(InlineRUIElements(content))
    ,
    Heading: (content, {headingLevel}) =>
        Span(InlineRUIElements(content)).fontSize(`${(5 - (headingLevel ?? 1)) * 6 + 15}px`)
    ,
    CodeBlock: ({language, content}) => {
        let blockTag: any
        let props:any = {}
        try {
            const {Prism} = require("react-syntax-highlighter");
            const {oneLight} = require("react-syntax-highlighter/dist/esm/styles/prism")
            blockTag = Prism
            props.language = language
            props.style = oneLight
        } catch (e) {
            blockTag = "code"
            MarkdownerLogger.warn("Code block", "Error when parsing Code block, default parser is using " +
                "this project(https://github.com/react-syntax-highlighter/react-syntax-highlighter), " +
                "install it as dependency to use this feature or override [MathBlock] View or just using <code/> like now")
        }
        return RUITag(blockTag)(content)
            .setProps(props)
    },


    UnorderedList: (content: ContainerItem[], {level}) => {
        let bulletList = ["●", "○", "■", "□", "◆", "◇", "▸", "▹"]
        return Div(
            ...ForEach(content, (item: ContainerItem) =>
                Div(
                    Span(
                        Span(`${bulletList[level%bulletList.length]}  `).paddingLeft("3px"),
                        InlineRUIElements(item.item)
                    ),
                    BlockRUIElements(item.content)
                        .paddingLeft("20px")
                )
            ),
        )
    }
   ,
    OrderedList: (content: ContainerItem[], {start, level}) => {
        let indexing = [(num:number)=>num, Indexing.letter, Indexing.romanNumeral]
        let wrapper = [["",""],["",")"],["(",")"],["[","]"]]
        let index = indexing[level%3]
        let wrap = wrapper[Math.floor(level/3)]
        return  Div(
            ...ForEach(content, (item: ContainerItem, idx) =>
                Div(
                    Span(
                        `${wrap[0]}${index(start+idx)}${wrap[1]}.  `,
                        InlineRUIElements(item.item)
                    ),
                    BlockRUIElements(item.content)
                        .paddingLeft("20px")
                )
            ),
        )
    }
   ,
    Table: (headerAndRows: MarkdownAST[][][], {headerAligns, rowAligns}) =>
        Table(
            // ---- header
            Tbody(
                Tr(
                    ...ForEach(headerAndRows[0], (h: MarkdownAST[], idx: number) =>
                        Th(InlineRUIElements(h))
                            .border("thin solid gray")
                            .borderCollapse("collapse")
                            .padding("5px")
                            .textAlign(headerAligns[idx])
                    )
            )).width("100%"),
            // ---- rows
            Tbody(
                ...ForEach(headerAndRows.slice(1), (row: MarkdownAST[][]) =>
                    Tr(
                        ...ForEach(row, (r, idx) =>
                            Td(InlineRUIElements(r))
                                .border("thin solid gray")
                                .borderCollapse("collapse")
                                .padding("5px")
                                .textAlign(rowAligns[idx])
                        )
                    )
                )
            ).width("100%")
        ).width("100%")
            .borderCollapse("collapse"),

    Blockquote: (content) =>
        Blockquote(
            BlockRUIElements(content)
        )
            .padding("4px 0px 4px 18px")
            .borderLeft("2px solid gray")
            .margin("4px 0px"),

    Divider: (_, {dividerType}) =>
        Div()
            .margin("15px 0px")
            .borderTop(`1px ${dividerType} #bbb`)
            .borderBottom(`1px ${dividerType} #bbb`)
            .borderRadius("1px")
            .boxSizing("border-box")
            .width("100%")
            .height("2px")
    ,
    CheckList: (content: ContainerItem[], {isChecked}) =>
        Div(
            ...ForEach(content, (item: ContainerItem) =>
                Div(
                    Span(
                        Input()
                            .setProps({
                                type: "checkbox",
                                defaultChecked: isChecked
                            }).margin(0),
                        "  ",
                        InlineRUIElements(item.item)
                    ).width("100%"),
                    BlockRUIElements(item.content)
                        .paddingLeft("20px")
                )
            )
        )
    ,
    Image: (_, {altContent, imageUrl, title, zoomSize, alignment, linkUrl}) => {
        let props = {
            src: imageUrl,
            alt: altContent,
            title: title
        }
        let margins: {[key:string]: string} = {
            "left": "0px auto 0px 0px",
            "center": "0px auto",
            "right": "0px 0px 0px auto",
        }

        return (
        ConditionView(!!linkUrl , {
            true: () => A(
                Img()
                    .setProps(props)
                    .width("100%")
            )
                .setProp("href", linkUrl)
                .width(zoomSize)
                .height("max-content"),
            false: () => Img()
                .setProps(props)
                .width(zoomSize)
        })
            .display("block")
            .margin(margins[alignment])
        )
    },
    MathBlock: (content) => {
        let __html: string
        try {
            const katex = require("katex");
            // @ts-ignore
            import("katex/dist/katex.css")
            __html = katex.renderToString(content, {
                throwOnError: false,
                output: "html",
                displayMode: true
            })
        } catch (e) {
            __html = content
            MarkdownerLogger.warn("Latex math", "Error when parsing LaTex math formula, default parser is using " +
                "this project(https://github.com/KaTeX/KaTeX), " +
                "install it as dependency to use this feature or override [MathBlock] View")
        }
        return Div()
            .setProp("dangerouslySetInnerHTML", {__html})
    }
    ,
    Latex: (content) => {
        let latexHtml: string
        try {
            const latex = require("latex.js")
            try {
                let document = latex.parse(content, {generator:  new latex.HtmlGenerator({hyphenate: false})}).htmlDocument()
                let bodyHtml = document.body.innerHTML
                // ---- I'm a genius!
                const {latexStyle} = require("../.supports/latexStyles/styles")
                latexHtml = latexStyle + bodyHtml
            } catch (e) {
                latexHtml = `<div style='color:red'>${content}</div>`
            }
        } catch (e) {
            MarkdownerLogger.warn("Latex", "Error when parsing LaTex Document, default parser is using " +
                "this project(https://github.com/michael-brade/LaTeX.js), " +
                "install it as dependency to use this feature or override [Latex] View")
            latexHtml = content
        }



        return (
            Div()
            .ref(async function (host: HTMLElement) {
                if (host === null) return
                if (!host.shadowRoot) {
                    host.attachShadow({mode: "open"});
                }
                host.innerHTML = "";
                host.shadowRoot!.innerHTML = latexHtml
            } as any)
        )
    }
    ,
    Footnote: (content,  {noteName, footnoteIdx}) => {
        let footnoteSubTrees = Markdowner.ast
            .findInlineItems("FootnoteSup", footnoteSup=>footnoteSup.props?.noteName===noteName)
        return (
            Span(
                Span(`[${noteName}] `).whiteSpace("pre-wrap"),
                InlineRUIElements(content),
                ...ForEach(footnoteSubTrees, (footnoteSup: MarkdownAST) =>
                    A(RUITag(MdOutlineReply)())
                        .setProp("href", `#Markdowner-FootnoteSup-${noteName}-${footnoteSup.props.footnoteSupId}`)
                        .color("gray")
                        .textDecoration("none")
                )
            )
                .fontSize("small")
                .id(`Markdowner-Footnote-${noteName}-${footnoteIdx}`)
        )
    },
}


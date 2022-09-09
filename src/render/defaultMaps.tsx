import {InlineContent, ContentType, inlineElements} from "./inline";
import {A, Div, Img, Input, Li, Ol, RUITag, Span, Table, Ul} from "@iandx/reactui/tag";
import {Prism as SyntaxHighlighter} from "react-syntax-highlighter";
import {oneLight} from "react-syntax-highlighter/dist/esm/styles/prism";
import {MarkdownAST} from "../base/syntaxTree";
import {HStack, Spacer, VStack} from "@iandx/reactui/component";
import {ForEach, If, range, uid, useRUIState} from "@iandx/reactui";
import {MarkdownDocument} from "./block";
import katex from "katex";
import {ReactElement, useEffect, useRef} from "react";
import "katex/dist/katex.css"
// @ts-ignore latexStyles.js has no @types package
import * as latex from 'latex.js'
import {Markdowner} from "../base";
import {MdOutlineReply} from "react-icons/md"
import {IsFirstRender, isInstanceOf, getLatexJSHtmlGenerator} from "../base/utils";


export const blockMaps: {[key:string]: (content: any, props: any, children: any) =>  ContentType} = {
    Heading: (content, {headingLevel}) =>
        Span(...inlineElements(content)).fontSize(`${(5 - (headingLevel ?? 1)) * 6 + 15}px`),
    Paragraph: (content) => content,
    CodeBlock: ({language, content}) =>
        RUITag(SyntaxHighlighter, content)
            .setProps({
                language,
                style: oneLight
            }),
    UnorderedListContainer: (_, __, children: MarkdownAST[]) =>
        Ul(
            MarkdownDocument({markdownASTs: children})
        )
            .width("100%")
            .paddingLeft("10px")
            .marginTop("0px")
            .marginBottom("0px"),

    UnorderedList: (content, _, children: MarkdownAST[] | undefined) => {
        if (!!children) {
            return Div(
                Li(...inlineElements(content)),
                MarkdownDocument({markdownASTs: children})
            )
        } else {
            return Li(...inlineElements(content))
        }
    },

    OrderedListContainer: (_, {start}, children: MarkdownAST[]) =>
        Ol(
            MarkdownDocument({markdownASTs: children})
        ).setProp("start", start)
            .paddingLeft("10px")
            .marginTop("0px")
            .marginBottom("0px"),

    OrderedList: (content, _, children: MarkdownAST[] | undefined) => {
        return If(!!children).Then(
            Div(
                Li(...inlineElements(content)),
                MarkdownDocument({markdownASTs: children})
            )
        ).Else(
            Li(...inlineElements(content))
        )
    }
        ,

    Table: ({header, rows, headerAligns, rowAligns}) =>
        Table(
            // ---- header
            RUITag("tbody", RUITag("tr",
                ...header.map((h: string, idx: number) =>
                    RUITag("th", h)
                        .border("thin solid gray")
                        .borderCollapse("collapse")
                        .padding("5px")
                        .textAlign(headerAligns[idx])
                )
            )).width("100%"),
            // ---- rows
            RUITag("tbody",
                ...rows.map((row: string[]) =>
                    RUITag("tr",
                        ...row.map((r, idx) =>
                            RUITag("td", r)
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

    Blockquote: (content, _) =>
        RUITag("blockquote",
            MarkdownDocument({markdownASTs: content})
        )
            .borderLeft("2px solid gray")
            .marginLeft("0px")
            .paddingLeft("8px"),

    Divider: (_, {dividerType}) =>
        Div()
            .margin("15px 0px")
            .borderTop(`1px ${dividerType} #bbb`)
            .borderBottom(`1px ${dividerType} #bbb`)
            .borderRadius("1px")
            .boxSizing("border-box")
            .width("100%")
            .height("2px"),

    CheckListContainer: (_, __, children: MarkdownAST[]) =>
        Div(
            MarkdownDocument({markdownASTs: children})
        )
            .paddingLeft("10px"),
    CheckList: (content, {isChecked}, children) => {
        let CheckLi = () =>
            Div(
                Input()
                    .setProps({
                        type: "checkbox",
                        defaultChecked: isChecked
                    }),
                ...inlineElements(content)
            ).width("100%")
        return If(!!children).Then(
            Div(
                CheckLi(),
                MarkdownDocument({markdownASTs: children})
            )
        ).Else(
            CheckLi()
        )
    },

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
        return If(!!linkUrl).Then(
                A(
                    Img()
                        .setProps(props)
                        .width("100%")
                )
                    .setProp("href", linkUrl)
                    .width(zoomSize)
                    .height("max-content")
            ).Else(
                Img()
                    .setProps(props)
                    .width(zoomSize)
            )
            .display("block")
            .margin(margins[alignment])

    },
    MathBlock: (content) =>
        Div()
            .setProp("dangerouslySetInnerHTML", {__html:
                katex.renderToString(content, {
                    throwOnError: false,
                    output: "html",
                    displayMode: true
                })
            }),
    Latex: (content) =>
            Div()
                .ref(function (host: HTMLElement) {
                    if (host === null) return
                    let latexHtml: string
                    try {
                        let document = latex.parse(content.replaceAll(/^\n|\n$/g, ""), {generator:getLatexJSHtmlGenerator()}).htmlDocument()
                        latexHtml = document.documentElement.innerHTML
                    } catch (e) {
                        latexHtml = "<div style='color:red'>error when parsing LaTex Document</div>"
                    }
                    host.attachShadow({mode: "open"});
                    host.innerHTML = "";
                    host.shadowRoot!.innerHTML = latexHtml
                } as any),
    Footnote: (content,  {noteName, footnoteIdx}) => {
        let footnoteSups = useRUIState([])
        useEffect(() => {
            let elements = Array.from(document.getElementsByClassName(`Markdowner-FootnoteSup-${noteName}`))
            footnoteSups.value = elements.map(el=>el.id)
        }, [content])

        return (
            Span(
                Span(`[${noteName}]\t`),
                ...inlineElements(content),
                ...footnoteSups.value.map((id: string) =>
                    A(RUITag(MdOutlineReply))
                        .setProp("href", `#${id}`)
                        .color("gray")
                        .textDecoration("none")
                )
            )
                .fontSize("small")
                .id(`Markdowner-Footnote-${noteName}-${footnoteIdx}`)
        )
    }
        


}




export const inlineMaps: {[key:string]: (inlineContent: InlineContent, props: any)=>ContentType} = {
    Text: ({ruiContents}: InlineContent) =>
        Span(...ruiContents),
    Italic: ({ruiContents}: InlineContent) =>
        RUITag("em", ...ruiContents),
    Bold: ({ruiContents}: InlineContent) =>
        RUITag("strong", ...ruiContents),
    Strike: ({ruiContents}: InlineContent) =>
        Span(...ruiContents).textDecoration("line-through"),
    Code: ({ruiContents}: InlineContent) =>
        Span(...ruiContents)
            .backgroundColor("#eeeeee")
            .borderRadius("3px")
            .color(`#e37d7d`)
            .letterSpacing("0.5px")
            .fontSize("95%")
            .padding("0.2em 0.4em"),
    Link: ({ruiContents}: InlineContent, {linkUrl, cleanDisplay}) =>
        If(cleanDisplay??false).Then(
            A(...ruiContents)
                .textDecoration("none")
                .color("gray")
        ).Else(
            A(...ruiContents)
        ).setProp("href", linkUrl),
    Underline: ({ruiContents}: InlineContent) =>
        Span(...ruiContents).textDecoration("underline"),
    Superscript: ({ruiContents}: InlineContent) =>
        RUITag("sup", ...ruiContents),
    Subscript: ({ruiContents}: InlineContent) =>
        RUITag("sub", ...ruiContents),
    Escape: ({ruiContents}: InlineContent) =>
        Span(...ruiContents),
    Highlight: ({ruiContents}: InlineContent) =>
        Span(...ruiContents).backgroundColor("Highlight"),
    HtmlTag: ({ruiContents}, {tag}) =>
        RUITag(tag, ...ruiContents),
    Math: ({htmlContents}: InlineContent) =>
        Span()
            .setProp("dangerouslySetInnerHTML", {__html:
                    katex.renderToString(htmlContents[0], {
                        throwOnError: false,
                        output: "html"
                    })
            }),
    FootnoteSup: (_: InlineContent, {noteName}) => {
        return  A(
            RUITag("sup", `[${noteName}]`).className(`Markdowner-FootnoteSup-${noteName}`).id(`Markdowner-FootnoteSup-${noteName}-${uid()}`)
        )
            .setProp("href", `#Markdowner-Footnote-${noteName}-0`)
            .color("gray")
            .textDecoration("none")
    }



}


import {InlineContent, ContentType, inlineElements} from "./inline";
import {A, Div, Img, Input, Li, Ol, RUITag, Span, Table, Ul} from "@iandx/reactui/tag";
import {Prism as SyntaxHighlighter} from "react-syntax-highlighter";
import {oneLight} from "react-syntax-highlighter/dist/esm/styles/prism";
import {MarkdownSyntaxTree} from "../base/syntaxTree";
import {HStack, Spacer, VStack} from "@iandx/reactui/component";
import {ForEach, If, range, useRUIState} from "@iandx/reactui";
import {Block} from "./block";
import katex from "katex";
import {ReactElement, useEffect, useRef} from "react";
import {ReactUIBase, ReactUIElement} from "@iandx/reactui/core";
import "katex/dist/katex.css"
// @ts-ignore latexStyles.js has no @types package
import * as latex from 'latex.js'
import {Markdowner} from "../base";
import {MdOutlineReply} from "react-icons/md"
import {latexJsHtmlGenerator, IsFirstRender, isInstanceOf} from "../base/utils";


export const blockMaps: {[key:string]: (content: any, props: any, children: any) => MarkdownSyntaxTree[] | ContentType} = {
    Heading: (content, {headingLevel}) =>
        Span(...inlineElements(content)).fontSize(`${(5 - (headingLevel ?? 1)) * 6 + 15}px`),
    Paragraph: (content) => content,
    CodeBlock: ({language, content}) =>
        RUITag(SyntaxHighlighter, content)
            .setProps({
                language,
                style: oneLight
            }),
    UnorderedListContainer: (_, __, children: MarkdownSyntaxTree[]) =>
        Ul(
            ...children.map((markdownSyntaxTree: MarkdownSyntaxTree) => {
                    let type = markdownSyntaxTree.type
                    let content = markdownSyntaxTree.content
                    let props = markdownSyntaxTree.props
                    let children = markdownSyntaxTree.children
                    return (blockMaps as any)[type](content, props, children)
                }
            )
        )
            .paddingLeft("10px")
            .marginTop("0px")
            .marginBottom("0px"),

    UnorderedList: (content, _, children: MarkdownSyntaxTree[] | undefined) => {
        if (!!children) {
            return Div(
                Li(...inlineElements(content)),
                Block({syntaxTrees: children})
            )
        } else {
            return Li(...inlineElements(content))
        }
    },

    OrderedListContainer: (_, {start}, children: MarkdownSyntaxTree[]) =>
        Ol(
            ...children.map((markdownSyntaxTree: MarkdownSyntaxTree) => {
                    let type = markdownSyntaxTree.type
                    let content = markdownSyntaxTree.content
                    let props = markdownSyntaxTree.props
                    let children = markdownSyntaxTree.children
                    return (blockMaps as any)[type](content, props, children)
                }
            )
        ).setProp("start", start)
            .paddingLeft("10px")
            .marginTop("0px")
            .marginBottom("0px"),

    OrderedList: (content, _, children: MarkdownSyntaxTree[] | undefined) =>
        If(!!children).Then(
            Div(
                Li(...inlineElements(content)),
                Block({syntaxTrees: children})
            )
        ).Else(
            Li(...inlineElements(content))
        ),

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
            )),
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
            )
        )
            .borderCollapse("collapse"),

    Blockquote: (content) =>
        RUITag("blockquote",
            Block({syntaxTrees: content})
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

    CheckList: (content, {checkedArr, indentArr}) =>
        VStack(
            ...content.map((item: MarkdownSyntaxTree, idx: number) =>
                HStack(
                    Span("\t".repeat(indentArr[idx]))
                        .whiteSpace("pre-wrap"),
                    Input()
                        .setProps({
                            type: "checkbox",
                            defaultChecked: checkedArr[idx]
                        }),
                    ...inlineElements(item)
                )
            )
        ).alignment("leading"),
    Image: (_, {altContent, imageUrl, title, zoomSize, alignment, linkUrl}) => {
        let props = {
            src: imageUrl,
            alt: altContent,
            title: title
        }
        return HStack(
            If(alignment==="tailing" || alignment==="center").Then(Spacer()),
            If(!!linkUrl).Then(
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
            ),
            If(alignment==="leading" || alignment==="center").Then(Spacer()),
        )
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
    Latex: (content) => {
        let generator = new latex.HtmlGenerator({
            hyphenate: false,
            // styles: ["latexStyles/css/article.css", "latexStyles/css/base.css", "latexStyles/css/book.css", "latexStyles/css/katex.css"]
            styles: ["https://latex.js.org/css/article.css",
                "https://latex.js.org/css/base.css",
                "https://latex.js.org/css/book.css",
                "https://latex.js.org/css/katex.css"]
        })
        return (
            Div()
                .ref(async function (host: HTMLElement) {
                    if (host === null) return
                    let latexHtml: string
                    try {
                        let document = latex.parse(content.replaceAll(/^\n|\n$/g, ""), {generator}).htmlDocument()
                        latexHtml = document.documentElement.innerHTML
                    } catch (e) {
                        latexHtml = "<div style='color:red'>error when parsing LaTex Document</div>"
                    }
                    // await new Promise(r => setTimeout(r, 2000));
                    // if (host.shadowRoot === null) {
                        host.attachShadow({mode: "open"});
                    // }
                    host.innerHTML = "";
                    host.shadowRoot!.innerHTML = latexHtml
                    // host.shadowRoot!.innerHTML = "<div style='color: red'>fjaojdfoiahfohasoi</div>"
                } as any)
        )
    },
    Footnote: (content,  {noteName, uid}) => {
        let flatTrees =  Markdowner.ASTHelper?.flatten() ?? []
        let footnoteTrees = flatTrees.filter(t=>t.type==="Footnote" && (t.props?.noteName??-1)===noteName).map(t=>t.props?.uid ?? "-1")
        let footnoteIdx = footnoteTrees.indexOf(uid)
        let footnoteSubTrees = flatTrees.filter(t=>t.type==="FootnoteSup" && (t.props?.noteName??-1)===noteName)
        
        return (
            Span(
                Span(`[${noteName}]\t`),
                ...inlineElements(content),
                ...range(footnoteSubTrees.length).asArray().map((i) =>
                    A(RUITag(MdOutlineReply))
                        .setProp("href", `#markdowner-footnoteSup-${noteName}-${i}`)
                        .color("gray")
                        .textDecoration("none")
                )
            )
                .fontSize("small")
                .id(`markdowner-footnote-${noteName}-${footnoteIdx}`)
        )
    }
        


}




export const inlineMaps: {[key:string]: (inlineContent: InlineContent, props: any)=>ContentType} = {
    Text: ({htmlContents}: InlineContent) =>
        Span(htmlContents),
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
    FootnoteSup: (_: InlineContent, {noteName, uid}) => {
        let flatTrees =  Markdowner.ASTHelper?.flatten() ?? []
        let footnoteSupTrees = flatTrees.filter(t=>t.type==="FootnoteSup" && (t.props?.noteName??-1)===noteName).map(t=>t.props?.uid ?? "-1")
        let supIndex = footnoteSupTrees.indexOf(uid)
        return (
            A(
                RUITag("sup", `[${noteName}]`).id(`markdowner-footnoteSup-${noteName}-${supIndex}`)
            )
                .setProp("href", `#markdowner-footnote-${noteName}-0`)
                .color("gray")
                .textDecoration("none")
        )
    }


}


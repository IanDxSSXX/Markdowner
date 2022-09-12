
import {ContainerItem, MarkdownAST} from "../base/syntaxTree";
import {Markdowner} from "../base";
import {MdOutlineReply, MdCircle} from "react-icons/md"
import {Fragment, ReactElement} from "react";
import {latexStyle} from "../.supports/latexStyles/styles";
import {Indexing, uid} from "../base/utils";
import {MarkdownDocument, InlineElements} from "./view";
import {MarkdownerHelper} from "../base/helper";


export type MarkdownerViewFunc = (content: string|MarkdownAST[]|ContainerItem[]|any, props: any)=>ReactElement
export interface MarkdownerRuleMap {[key:string]: MarkdownerViewFunc}

export const defaultInlineMap: MarkdownerRuleMap = {
    Text: (content) =>
        <span>{content}</span>,
    Italic: (content) =>
        <em>{InlineElements(content)}</em>,
    Bold: (content) =>
        <span>{InlineElements(content)}</span>,
    Strike: (content) =>
        <span style={{
            textDecoration:"line-through"
        }}>
            {InlineElements(content)}
        </span>,
    Code: (content) =>
        <span style={{
            backgroundColor:"#eeeeee",
            borderRadius: "3px",
            color: "#e37d7d",
            letterSpacing: "0.5px",
            fontSize: "95%",
            padding: "0.2em 0.4em"
        }}>
            {InlineElements(content)}
        </span>,
    Link: (content, {linkUrl, cleanDisplay}) =>
        cleanDisplay??false ?
            <a style={{
                textDecoration:"none",
                color:"gray"
            }} href={linkUrl}>
                {InlineElements(content)}
            </a> :
            <a href={linkUrl}>
                {InlineElements(content)}
            </a>,
    Underline: (content) =>
        <span style={{textDecoration: "underline"}}>{InlineElements(content)}</span>,
    Superscript: (content) =>
        <sup>{InlineElements(content)}</sup>,
    Subscript: (content) =>
        <sub>{InlineElements(content)}</sub>,
    Escape: (content) =>
        <span>{InlineElements(content)}</span>,
    Highlight: (content) =>
        <span style={{backgroundColor: "Highlight"}}>{InlineElements(content)}</span>,
    HtmlTag: (content, {tag}) => {
        const Tag = tag
        return <Tag>{InlineElements(content)}</Tag>
    } ,
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
            MarkdownerHelper.warn("Latex math", "Error when parsing LaTex math formula, default parser is using " +
                "this project(https://github.com/KaTeX/KaTeX), " +
                "install it as dependency to use this feature or override [MathBlock] View")
        }
        return (
            <span dangerouslySetInnerHTML={{__html}}/>
        )
    },
    FootnoteSup: (content: string, {footnoteSupId}) =>
        <a href={`#Markdowner-Footnote-${content}-0`} style={{color: "gray", textDecoration: "none"}}>
            <sup id={`Markdowner-FootnoteSup-${content}-${footnoteSupId}`}>[{content}]</sup>
        </a>
            ,
    LinkTag: (content, {tagName}: any) => {
        let linkBlocks = Markdowner.ast.findBlocks("LinkTagBlock", t=>t.props.tagName === tagName)
        return linkBlocks.length === 0 ?
            <span>{InlineElements(content)}</span> :
            <a href={linkBlocks[0].props.tagUrl}><span>{tagName}</span></a>
    }
}

export const defaultBlockMap: MarkdownerRuleMap = {
    Paragraph: (content) =>
        <Fragment>{InlineElements(content)}</Fragment>
    ,
    Heading: (content, {headingLevel}) =>
        <span style={{fontSize: `${(5 - (headingLevel ?? 1)) * 6 + 15}px`}}>
            {InlineElements(content)}
        </span>
    ,
    CodeBlock: ({language, content}) => {
        let BlockTag: any
        let props:any = {}
        try {
            const {Prism} = require("react-syntax-highlighter");
            const {oneLight} = require("react-syntax-highlighter/dist/esm/styles/prism")
            BlockTag = Prism
            props.language = language
            props.style = oneLight
        } catch (e) {
            BlockTag = "code"
            MarkdownerHelper.warn("Code block", "Error when parsing Code block, default parser is using " +
                "this project(https://github.com/react-syntax-highlighter/react-syntax-highlighter), " +
                "install it as dependency to use this feature or override [MathBlock] View or just using <code/> like now")
        }
        return <BlockTag props={props}>{content}</BlockTag>
    },


    UnorderedList: (content: ContainerItem[], {level}) => {
        let bulletList = ["●", "○", "■", "□", "◆", "◇", "▸", "▹"]
        return(
            <div>
                {content.map((item: ContainerItem, idx) =>
                    <div key={idx}>
                        <span>
                            <span style={{paddingLeft:"3px"}}>{`${bulletList[level%bulletList.length]}  `}</span>
                            {InlineElements(item.item)}
                        </span>
                        <div style={{paddingLeft:"20px"}}>
                            <MarkdownDocument markdownASTs={item.content}/>
                        </div>
                    </div>
                )}
            </div>
        )
    }
   ,
    OrderedList: (content: ContainerItem[], {start, level}) => {
        let indexing = [(num:number)=>num, Indexing.letter, Indexing.romanNumeral]
        let wrapper = [["",""],["",")"],["(",")"],["[","]"]]
        let index = indexing[level%3]
        let wrap = wrapper[Math.floor(level/3)]
        return(
            <div>
                {content.map((item: ContainerItem, idx) =>
                    <div key={idx}>
                        <span>
                            {`${wrap[0]}${index(start+idx)}${wrap[1]}.  `}
                            {InlineElements(item.item)}
                        </span>
                        <div style={{paddingLeft:"20px"}}>
                            <MarkdownDocument markdownASTs={item.content}/>
                        </div>
                    </div>
                )}
            </div>
        )
    }
   ,
    Table: ({header, rows, headerAligns, rowAligns}) =>
        <table style={{width:"100%", borderCollapse: "collapse"}}>
            <tbody style={{width:"100%"}}>
                <tr>
                    {header.map((h: string, idx: number) =>
                        <th key={idx}
                            style={{
                            border: "thin solid gray",
                            borderCollapse: "collapse",
                            padding: "5px",
                            textAlign: headerAligns[idx]
                        }}>{h}</th>
                    )}
                </tr>
            </tbody>
            <tbody style={{width:"100%"}}>
            {rows.map((row: string[], i:number) =>
                <tr key={i}>
                    {row.map((r: string, idx) =>
                        <td key={idx}
                            style={{
                                border: "thin solid gray",
                                borderCollapse: "collapse",
                                padding: "5px",
                                textAlign: rowAligns[idx]
                        }}>{r}</td>
                    )}
                </tr>
            )}
            </tbody>
        </table>,

    Blockquote: (content) =>
        <blockquote style={{
            padding: "4px 0px 4px 18px",
            borderLeft: "2px solid gray",
            margin: "4px 0px"
        }}>
            <MarkdownDocument markdownASTs={content}/>
        </blockquote>
    ,
    Divider: (_, {dividerType}) =>
        <div style={{
            margin: "15px 0px",
            borderTop: `1px ${dividerType} #bbb`,
            borderBottom: `1px ${dividerType} #bbb`,
            borderRadius: "1px",
            boxSizing: "border-box",
            width: "100%",
            height: "2px",
        }} />

    ,
    CheckList: (content: ContainerItem[], {isChecked}) =>
        <div>
            {content.map((item: ContainerItem, idx) =>
                <div key={idx}>
                        <span>
                            <input type="checkbox" defaultChecked={isChecked} style={{margin: "0px", marginRight: "8px"}}/>
                            {InlineElements(item.item)}
                        </span>
                    <div style={{paddingLeft:"20px"}}>
                        <MarkdownDocument markdownASTs={item.content}/>
                    </div>
                </div>
            )}
        </div>
    ,
    Image: (_, {altContent, imageUrl, title, zoomSize, alignment, linkUrl}) => {
        let margins: {[key:string]: string} = {
            "left": "0px auto 0px 0px",
            "center": "0px auto",
            "right": "0px 0px 0px auto",
        }

        return (
            !!linkUrl ? 
            <a href={linkUrl} style={{width: zoomSize, height: "max-content",display:"block",margin:margins[alignment]}}>
                <img src={imageUrl} alt={altContent} title={title} style={{width: "100%"}}/>
            </a>:
            <img src={imageUrl} alt={altContent} title={title} style={{width: zoomSize,display:"block",margin:margins[alignment]}}/>
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
            MarkdownerHelper.warn("Latex math", "Error when parsing LaTex math formula, default parser is using " +
                "this project(https://github.com/KaTeX/KaTeX), " +
                "install it as dependency to use this feature or override [MathBlock] View")
        }
        return (
            <div dangerouslySetInnerHTML={{__html}}/>
        )
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
            MarkdownerHelper.warn("Latex", "Error when parsing LaTex Document, default parser is using " +
                "this project(https://github.com/michael-brade/LaTeX.js), " +
                "install it as dependency to use this feature or override [Latex] View")
            latexHtml = content
        }
        
        return (
            <div ref={
                function (host: HTMLElement) {
                    if (host === null) return
                    if (!host.shadowRoot) {
                        host.attachShadow({mode: "open"});
                    }
                    host.innerHTML = "";
                    host.shadowRoot!.innerHTML = latexHtml
                } as any
            }/>
        )
    }
    ,
    Footnote: (content,  {noteName, footnoteIdx}) => {
        let footnoteSubTrees = Markdowner.ast
            .findInlineItems("FootnoteSup", footnoteSup=>footnoteSup.props?.noteName===noteName);
       
        return (
            <span style={{fontSize:"small"}} id={`Markdowner-Footnote-${noteName}-${footnoteIdx}`}>
                <span>{`[${noteName}]\t`}</span>
                {InlineElements(content)}
                {footnoteSubTrees.map((footnoteSub: MarkdownAST, idx) =>
                    <a
                        key={idx}
                        href={ `#Markdowner-FootnoteSup-${noteName}-${footnoteSub.props.footnoteSupId}`}
                        style={{color: "gray", textDecoration: "none"}}>
                        <MdOutlineReply/>
                    </a>
                )}
            </span>
        )
    },
}


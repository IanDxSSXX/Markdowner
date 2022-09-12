import {InlineMarkdownTagExtend, InlineMarkdownTag} from "./inline/regex";
import {BlockMarkdownTagExtend, BlockMarkdownTag} from "./block/regex";
import {flattened} from "../base/utils";
import {uid} from "../base/utils";

export interface InlineMarkdownRules {
    [key: string]: InlineMarkdownTag | InlineMarkdownTagExtend
}
export interface BlockMarkdownRules {
    [key: string]: BlockMarkdownTag | BlockMarkdownTagExtend
}

export type DefaultInlineRules = "Italic" | "Bold" | "Strike" | "Underline" | "Code" | "Link" | "Escape" | "Superscript" |
    "Subscript" | "Highlight" | "HtmlTag" | "Math" | "FootnoteSup" | "LinkTag"
export type DefaultBlockRules = "Heading" | "OrderedList" | "UnorderedList" | "Blockquote" | "CodeBlock" | "Table" | "Divider" |
    "CheckList" | "Image" | "MathBlock" | "Latex" | "Footnote" | "LinkTagBlock" | "Comment"


export const blockDefaultRules: BlockMarkdownRules = {
    Heading: {
        tags: {
            leading: /#{1,5} /,
            exact: [/(?:\n|^).+? ?\n===+ */, /(?:\n|^).+? ?\n---+ */]
        },
        getProps: (text) => {
            let headingLevel: number
            let hashHeadingMatch = text.match(/^#+ /)
            if (hashHeadingMatch) {
                headingLevel = hashHeadingMatch![0].trim().length
            } else {
                let heading1Match = text.match(/\n===+/)
                headingLevel = !!heading1Match ? 1 : 2
            }
            return {headingLevel}
        },
        trimText: text => text.replaceAll(/\n((===+)|(---+))/g, "").replaceAll(/^#{1,5} /g, "")
    },
    OrderedList: {
        tags: {leading: /(?: {2})*[0-9]\. /},
        getProps: (text) => ({start: +text.match(/\d+/g)![0]}),
        blockType: "container"
    },
    UnorderedList: {
        tags: {leading: [/(?: {2})*[*+-] /]},
        blockType: "container"
    },
    Blockquote: {
        tags: {exact: /(?:\n|^)(?:(?:> *)+ .+?(?:\n|$))*(?:> *)+ .+?(?=\n|$)/},
        parseContent: (text, handler) => {
            let newText = text.replaceAll(/\n> */g, "\n").replaceAll(/^> */g, "")
            let parser = handler.parser.new()
            return parser.parse(newText)
        }
    },
    CodeBlock: {
        tags: {round: "```"},
        parseContent: text => {
            text = text.replace(/^```|```$/g, "")
            let language = (text.match(/^.+?\n/g) ?? ["text"])[0].replace("```", "").trim()
            let content = text.replace(/^.+?\n/g, "")
            return {language, content}
        },
    },
    Table: {
        tags: {
            exact: /\|(?: .+? \|)+\n\|(?: [-*:]{1,2}-+[-*:]{1,2}? \|)+(?:\n\|(?: .+? \|)+)*/
        },
        parseContent: (text) => {
            let header: string[]

            let allRows = text.split("\n").filter(r=>r!=="")
            header = allRows[0].split("|").map(h=>h.trim()).filter(h=>h!=="")
            let headerAligns: ("left"|"center"|"right")[] = Array(header.length).fill("center")
            let rowAligns: ("left"|"center"|"right")[] = Array(header.length).fill("left")
            let rows: string[][] = []

            if (allRows.length !== 1) {
                let alignTags = allRows[1].split("|").map(i=>i.trim()).filter(i=>i!=="")
                for (let [idx, tag] of alignTags.entries()) {
                    // ---- header alignment
                    if (/^:?\*[^*]+$/.test(tag)) {
                        headerAligns[idx] = "left"
                    } else if(/^[^*]+\*:?$/.test(tag)) {
                        headerAligns[idx] = "right"
                    } else if(/^:?\*[:-]+\*:?$/.test(tag)) {
                        headerAligns[idx] = "center"
                    }
                    // ---- row alignment
                    if (/^\*?:[^:]+$/.test(tag)) {
                        rowAligns[idx] = "left"
                    } else if(/^[^:]+:\*?$/.test(tag)) {
                        rowAligns[idx] = "right"
                    } else if(/^\*?:[*-]+:\*?$/.test(tag)) {
                        rowAligns[idx] = "center"
                    }
                }
                rows = allRows.slice(2).map(r=>r.split("|").map(i=>i.trim()).filter(i=>i!==""))
            }
            return {header, rows, headerAligns, rowAligns}

        },
        recheckMatch: raw => {
            let rowNum: number | undefined
            for (let line of raw.split(/\n/g).filter(l=>l.trim()!=="")) {
                let newRowNum = line.split("|").length
                if (rowNum !== undefined && newRowNum !== rowNum) return false
                rowNum = newRowNum
            }
            return true
        }
    },
    Divider: {
        tags: {exact: /---{1,4}(?:\[(?:dashed|dotted|solid)])?/},
        order: 2, // ---- behind heading1
        getProps: text => ({dividerType: (text.match(/dashed|dotted|solid/) ?? ["solid"])[0]})
    },
    CheckList: {
        tags: {leading: /(?: {2})*- \[[ x]] /},
        blockType: "container",
        order:0,
        getProps: text => ({isChecked: text.match(/(?: {2})*- \[[ x]] /)![0].includes("x")})
    },
    Image: {
        tags: {exact: /!\[.+?]\(.+?(?: .+?)*? *\)|\[!\[.+?]\(.+?(?: .+?)*? *\)]\(.+?\)/},
        parseContent: _ => undefined,
        getProps: text => {
            text = text.trim()
            let linkUrl: string | undefined
            if (/^\[!\[.+?]\(.+?(?: .+?)*? *\)]\(.+?\)$/.test(text)) {
                // ---- with link
                linkUrl = text.match(/\(.+?\)$/)![0].replaceAll(/[()]/g, "")
                text = text.replaceAll(/^\[|\([^\]]+?\)$/g, "")
            }
            let altContent = text.match(/!\[.+?]/)![0].replaceAll(/[![\]]/g, "")
            let content: string = text.match(/\(.+?(?: .+?)*\)/)![0].replaceAll(/[()]/g, "")
            let splitContent: string[] = [
                ...flattened(content.split(/".+?"/).map(c=>c.split(" ").map(i=>i.trim()))),
                ...(content.match(/".+?"/g) ?? [])
            ].filter(i=>i!=="")
            let imageUrl = splitContent[0]
            let otherProps = splitContent.slice(1)
            let title = otherProps.filter(i=>/^".+?"$/.test(i))[0].replaceAll('"', "") ?? ""
            let zoomSize = otherProps.filter(i=>/^[0-9]{1,3}%$/.test(i))[0] ?? "50%"
            let alignment = otherProps.filter(i=>/^left|right|center$/.test(i))[0] ?? "left"
            return {altContent, imageUrl, title, zoomSize, alignment, linkUrl}
        }
    },
    MathBlock: {
        tags: {round: "$$"},
        parseContent: (text) =>  text
    },
    Latex: {
        tags: {round: "$$$"},
        parseContent: (text) => text.replaceAll(/^\n|\n$/g, ""),
        order: -1
    },
    Footnote: {
        tags: {leading: /\[\^.+?]:/},
        getProps: (text, state) => {
            let noteName = text.match(/^\[\^.+?]:/)![0].replaceAll(/[[\]:^]/g, "").trim()

            if (state.footnoteArr === undefined) state.footnoteArr = {}
            let footnoteArr = state.footnoteArr
            if (footnoteArr[noteName] === undefined) {
                footnoteArr[noteName] = 0
            } else {
                footnoteArr[noteName] += 1
            }
            return {
                elementOrder: 100,
                noteName,
                footnoteIdx: footnoteArr[noteName],
                rerender: true
            }
        },
    },
    LinkTagBlock: {
        tags: {leading: /\[.+?]:/},
        order: 2,
        getProps: raw => ({
            tagName: raw.match(/\[.+?]/)![0].replaceAll(/[[\]]/g, "").trim(),
            tagUrl: raw.replace(/\[.+?]:/, "").trim(),
            visible: false
        })
    },
    Comment: {
        tags: {leading: /\/\//},
        getProps: ()=>({visible: false})
    }


}

export const inlineDefaultRules: InlineMarkdownRules = {
    // ---- the order doesn't matter, default order is 1
    Italic: {
        tags: {
            round: "[em]",
            exact: [
                /\*(?!\s)(?:(?:[^*]*?(?:\*\*[^*]+?\*\*[^*]*?)+?)+?|[^*]+)\*/,
            ]
        },
        trimText: (text: string) => text.replace(/^\*|\*$/g, ""),
    },
    Bold: {
        tags: {
            round: "[bold]",
            exact: [
                /\*\*(?!\s)(?:[^*]+?|(?:[^*]*(?:\*[^*]+\*[^*]*)+?)+?)\*\*/,
            ]
        },
        trimText: (text: string) => text.replace(/^\*\*|\*\*$/g, ""),
        order: 0
    },
    Strike: {
        tags: {round: ["~~", "[strike]"]},
        order: 0 // prior to subscript
    },
    Underline: {wrap: ["<u>", "</u>"], round: ["_", "[underline]"]},
    Code: {
        tags: {round: ["`", "[code]"]},
        recheckMatch: raw => (raw.match(/`/g) ?? []).length % 2 === 0
    },
    Link: {
        tags: {wrap: ["[", /]\(.+?\)/]},
        getProps: (text: string) => ({linkUrl: text.match(/\(.+?\)$/)![0].replaceAll(/[()]/g, "")}),
    },
    Escape: {
        tags: {exact: /\\[*~<>_=`$\\]/},
        trimText: text => text.replace("\\", ""),
        order: -1000 // ---- must be the first
    },
    Superscript: {round: "^"},
    Subscript: {round: "~"},
    Highlight: {round: "=="},
    HtmlTag: {
        tags: {wrap: [/<[a-zA-Z]+>/, /<\/[a-zA-Z]+>/]},
        recheckMatch: raw => {
            let leftTag = raw.match(/<[a-zA-Z]+>/)![0]
            let rightTag = raw.match(/<\/[a-zA-Z]+>/)![0]
            return leftTag.replaceAll(/[<>]/g, "").trim() === rightTag.replaceAll(/[<>/]/g, "").trim()
        },
        getProps: text => ({tag: text.match(/<[a-zA-Z]+>/)![0].replaceAll(/[<>]/g, "").trim()})
    },
    Math: {
        tags: {round: "$"},
        allowNesting: false,
    },
    FootnoteSup: {
        tags: {wrap: ["[^", "]"]},
        getProps: (text) => {
            let noteName = text.replaceAll(/[[\]^]/g, "")
            return {noteName, footnoteSupId: uid()}
        },
        order: -2,
        allowNesting: false
    },
    LinkTag: {
        tags: {wrap: ["[", "]"]},
        order: -1,
        getProps: raw => ({tagName: raw.replaceAll(/[[\]]/g, "").trim()})
    },

}
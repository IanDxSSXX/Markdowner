import {BlockMarkdownTagExtend, BlockMarkdownTag, hardLineBreakRegex, BlockTagHandler} from "./regex";
import {tab} from "@testing-library/user-event/dist/tab";
import {flattened} from "../../base/utils";
import {uid} from "@iandx/reactui";

export interface BlockMarkdownRules {
    [key: string]: BlockMarkdownTag | BlockMarkdownTagExtend
}

export const blockDefaultRules: BlockMarkdownRules = {
    Heading: {
        tags: {
            leading: /#{1,5} /,
            exact: [/(?<=^|\n).+? ?\n==={1,4} ?/, /(?<=^|\n).+? ?\n---{1,4} ?/]
        },
        getProps: (text: string) => {
            let headingLevel: number
            let hashHeadingMatch = text.match(/^#+ /)
            if (hashHeadingMatch) {
                headingLevel = hashHeadingMatch![0].trim().length
            } else {
                let heading1Match = text.match(/\n==={1,4}/)
                headingLevel = heading1Match ? 1 : 2
            }
            return {headingLevel}
        },
        trimText: text => text.replaceAll(/\n((==={1,4})|(---{1,4}))/g, "").replaceAll(/^#{1,5} /g, "")
    },
    OrderedList: {
        tags: {leading: /[0-9]\. /},
        getContainerProps: text => ({start: +text.match(/\d+/g)![0]}),
        blockType: "container"
    },
    UnorderedList: {
        tags: {leading: ["* ", "+ ", "- "]},
        blockType: "container"
    },
    Blockquote: {
        tags: {leading: "> "},
        parseContent: (text, handler) => {
            let newText = text.replaceAll(/(?<=^|\n) ?> /g, " ")
            newText = newText.replaceAll(/(?<= >.+?\n|^) (?!>)/g, "\n")
            let parser = handler.parser.new()
            return parser.parse(newText)
        },
        blockType: "container",
        dropContainer: true
    },
    CodeBlock: {
        tags: {round: "```"},
        parseContent: (text: string) => {
            let language = (text.match(/^.+?\n/g) ?? ["text"])[0].replace("```", "").trim()
            let content = text.replace(/^.+?\n/g, "")
            return {language, content}
        },
    },
    Table: {
        tags: {
            exact: /\|(?: .+? \|)+\n\|(?: [-*:]{1,2}-+[-*:]{1,2}? \|)+(?:\n\|(?: .+? \|)+)*/
        },
        parseContent: (text: string) => {
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
        order: 2, // ---- behind heading2
        getProps: text => ({dividerType: (text.match(/dashed|dotted|solid/) ?? ["solid"])[0]})
    },
    CheckList: {
        tags: {exact: /(?: *- \[[x ]] .+?\n)* *- \[[x ]] .+?/},
        order: 0, // ---- prior to unordered list,
        parseContent: (text, handler) => text
            .replaceAll(/ *- \[[x ]] /g, "").trim().split("\n")
            .map(c=>handler.defaultParseContent(c)),
        getProps: (text, handler) => {
            let parser = handler.parser
            let checkedArr = [], indentArr = []
            if (parser.listStrictIndent) {
                for (let line of text.trim().split("\n")) {
                    let checkMatch = line.match(/ *- \[[x ]]/)![0]
                    checkedArr.push(checkMatch.includes("x"))
                    indentArr.push(Math.floor(checkMatch.search(/[^ ]/)/parser.tabSpaceNum))
                }
            } else {
                let spaceCounts: number[] = []
                let splitContent = text.trim().split("\n")
                for (let line of splitContent) {
                    let checkMatch = line.match(/ *- \[[x ]]/)![0]
                    checkedArr.push(checkMatch.includes("x"))
                    let spaceCount = checkMatch.search(/[^ ]/)
                    spaceCounts.push(spaceCount)
                }
                let spaceCountSet = [...new Set(spaceCounts)].sort()
                let maxSpaceCount: number = 0
                for (let [idx, spaceCount] of spaceCountSet.entries()) {
                    if ((spaceCount - spaceCounts[idx - 1] ?? maxSpaceCount) < parser.tabSpaceNum) {
                        maxSpaceCount = spaceCount
                    }
                }
                indentArr = spaceCounts.map(s=>Math.floor(Math.max(s-maxSpaceCount,0)/parser.tabSpaceNum))
            }
            return {checkedArr, indentArr}
        }
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
                text = text.replaceAll(/^\[|(?<=]\(.+\))]\(.+?\)$/g, "")
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
        parseContent: text => text
    },
    Latex: {
        tags: {round: "$$$"},
        parseContent: text => text,
        order: 0
    },
    Footnote: {
        tags: {leading: /\[\^.+?]:/},
        getProps: text => ({
            elementOrder: 100,
            noteName: text.match(/^\[\^.+?]:/)![0].replaceAll(/[[\]:^]/g, "").trim(),
            uid: uid()
        }),

    }

}
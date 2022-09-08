import {InlineMarkdownTagExtend, InlineMarkdownTag} from "./regex";
import {uid} from "@iandx/reactui";

export interface InlineMarkdownRules {
    [key: string]: InlineMarkdownTag | InlineMarkdownTagExtend
}

export const inlineDefaultRules: InlineMarkdownRules = {
    // ---- the order doesn't matter, default order is 1
    Italic: {
        tags: {
            round: "[em]",
            exact: [
                /\*(?!\s)(?:(?:[^\*]*?(?:\*\*[^\*]+?\*\*[^\*]*?)+?)+?|[^\*]+)(?<!\s)\*/,
            ]
        },
        trimText: (text: string) => text.replace(/^\*|\*$/g, ""),
    },
    Bold: {
        tags: {
            round: "[bold]",
            exact: [
                /\*\*(?!\s)(?:[^\*]+?|(?:[^\*]*(?:\*[^\*]+\*[^\*]*)+?)+?)(?<!\s)\*\*/,
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
        tags: {exact: /\\[*~<>_=`$]/},
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
            return {noteName: text.replaceAll(/[[\]^]/g, ""), uid: uid()}
        },
        order: 0
    }
}
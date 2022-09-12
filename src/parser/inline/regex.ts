import {correctRegExpKeywords} from "../../base/utils";
import {C, MarkdownInlineParser} from "./parser";

// ---- declaring
export type InlineInlineMarkdownTagType = string | RegExp

export interface InlineMarkdownTag {
    round?: InlineInlineMarkdownTagType[] | InlineInlineMarkdownTagType
    wrap?: [InlineInlineMarkdownTagType, InlineInlineMarkdownTagType][] | [InlineInlineMarkdownTagType, InlineInlineMarkdownTagType]
    exact?: InlineInlineMarkdownTagType[] | InlineInlineMarkdownTagType
}

export interface InlineMarkdownTagExtend {
    tags: InlineMarkdownTag
    getProps?: ((raw: string, state: {[key:string]:any}, handler: InlineTagHandler) => any | ((raw: string, state: {[key:string]: any}, handler: InlineTagHandler) => any)[])
    trimText?: (raw: string) => string
    recheckMatch?: ((raw: string) => boolean | ((raw: string) => boolean)[])
    order?: number
    allowNesting?: boolean
}

// ---- regexTag
export class InlineTagHandler {
    ruleName: string
    tags: InlineMarkdownTag
    regexString: string = ""
    useRecheckMatch: boolean = false
    currentTag: InlineMarkdownTag|undefined
    order: number = 1
    allowNesting = true
    parser: C.MarkdownInlineParser

    getProps: (raw: string) => any = () => {}
    trimText: (raw: string) => string = this.defaultTrimText
    recheckMatch: (raw: string) => boolean = () => true

    constructor(ruleName:string, tags: InlineMarkdownTag | InlineMarkdownTagExtend, parser: C.MarkdownInlineParser) {
        this.ruleName = ruleName
        this.parser = parser
        if (Object.keys(tags).includes("tags")) {
            let tagExtend = tags as InlineMarkdownTagExtend
            this.tags = this.getTags(tagExtend.tags)
            this.parseExtend(tagExtend)
        } else {
            this.tags = this.getTags(tags as InlineMarkdownTag)
        }

        this.initRegex();
    }

    // ---- initialization
    protected parseExtend(tagExtend: InlineMarkdownTagExtend) {
        if (tagExtend.order !== undefined) this.order = tagExtend.order
        if (!!tagExtend.getProps) this.getProps = (raw: string) => {
            let getPropsArr: any = tagExtend.getProps
            if (!(tagExtend.getProps! instanceof Array)) getPropsArr = [getPropsArr]
            let props = {}
            for (let getPropsFunc of getPropsArr) {
                props = {...props, ...getPropsFunc(raw, this.parser.state, this)}
            }
            return props
        };
        if (!!tagExtend.trimText) this.trimText = (text: string) => {
            let trimText = tagExtend.trimText!(text)
            // ---- set current tag
            let trimTagArr = text.split(trimText)
            if (trimTagArr.length === 2) {
                let leftTag = trimTagArr[0].trim(), rightTag = trimTagArr[1].trim()
                this.currentTag = (leftTag === rightTag ? {"round": leftTag} : {"wrap": [leftTag, rightTag]}) as InlineMarkdownTag
            }
            return trimText
        };
        if (!!tagExtend.recheckMatch) {
            this.useRecheckMatch = true
            this.recheckMatch = (raw: string) => {
                let recheckMatchArr: any = tagExtend.recheckMatch
                if (!(tagExtend.recheckMatch! instanceof Array)) recheckMatchArr = [recheckMatchArr]
                for (let recheckMatch of recheckMatchArr) {
                    if (!recheckMatch(raw)) {
                        return false
                    }
                }
                return true
            }
        }
        if (tagExtend.allowNesting !== undefined) this.allowNesting = tagExtend.allowNesting

    }


    protected getTags(tags: InlineMarkdownTag): InlineMarkdownTag {
        let newTags: InlineMarkdownTag = {...tags}
        if (!!newTags.round && !(Array.isArray(newTags.round!))) newTags.round = [newTags.round! as any];
        if (!!newTags.wrap && !Array.isArray(newTags.wrap[0])) newTags.wrap = [newTags.wrap! as any];
        if (!!newTags.exact && !(Array.isArray(newTags.exact!))) newTags.exact = [newTags.exact as any];

        return newTags as InlineMarkdownTag
    }

    protected initRegex() {
        // ---- no space at start or end
        let regexArray: string[] = []
        // ---* parse [T]text[T]
        for (let tag of (this.tags.round! ?? []) as Array<InlineInlineMarkdownTagType>) {
            let regexTag = correctRegExpKeywords(tag)
            regexArray.push(`(?:${regexTag}\\S+?(?:[\\s+\\S+])*?${regexTag})`)
        }
        // ---* parse [T:start]text[T:end]
        for (let [leftTag, rightTag] of (this.tags.wrap ?? []) as Array<[InlineInlineMarkdownTagType, InlineInlineMarkdownTagType]>) {
            let regexLeftTag = correctRegExpKeywords(leftTag)
            let regexRightTag = correctRegExpKeywords(rightTag)
            regexArray.push(`(?:${regexLeftTag}\\S+?[\\s+\\S+]*?${regexRightTag})`)
        }
        // ---* parse [T]
        for (let tag of (this.tags.exact ?? []) as Array<InlineInlineMarkdownTagType>) {
            let regexTag = correctRegExpKeywords(tag)
            regexArray.push(`(?:${regexTag})`)
        }
        this.regexString = regexArray.join("|")
    }

    // ---- syntax tree default func
    protected defaultTrimText(text: string) {
        let trimText = text
        // ---- trim round tag like *abc*
        for (let tag of (this.tags.round ?? []) as Array<InlineInlineMarkdownTagType>) {
            let regexTag = correctRegExpKeywords(tag)
            let trimArr = trimText.split(new RegExp(`(^${regexTag}|${regexTag}$)`, "g"))
            if (trimArr.length === 5) {
                this.currentTag = {"round": trimArr[1]} as InlineMarkdownTag
                trimText = trimArr[2]
            }
        }
        // ---- trim wrap tag like <span></span>
        for (let [leftTag, rightTag] of (this.tags.wrap ?? []) as Array<[InlineInlineMarkdownTagType, InlineInlineMarkdownTagType]>) {
            let regexLeftTag = correctRegExpKeywords(leftTag)
            let regexRightTag = correctRegExpKeywords(rightTag)
            let trimArr = trimText.split(new RegExp(`(^${regexLeftTag}|${regexRightTag}$)`, "g"))
            if (trimArr.length === 5) {
                this.currentTag = {"wrap": [trimArr[1], trimArr[3]]} as InlineMarkdownTag
                trimText = trimArr[2]
            }
        }

        return trimText
    }


    trimedTextAddTag(trimText: string): string {
        if (!this.currentTag) return trimText
        if (!!this.currentTag.round) {
            return this.currentTag.round + trimText + this.currentTag.round
        }
        if (!!this.currentTag.wrap) {
            return this.currentTag.wrap[0] + trimText + this.currentTag.wrap[1]
        }
        return trimText
    }
}
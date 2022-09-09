import {ForEach, RUI, uid, useRUIState} from "@iandx/reactui";
import {MarkdownAST} from "../base/syntaxTree";
import {List, VStack} from "@iandx/reactui/component";
import {blockMaps} from "./defaultMaps";
import {contentToRUIElement, ContentType, inlineElements} from "./inline";
import {Div, Span} from "@iandx/reactui/tag";
import {Markdowner} from "../base";
import {useEffect} from "react";



function getBlockFromMap(markdownAST: MarkdownAST, inlineAST: MarkdownAST): ContentType {
    let blockFunc = blockMaps[markdownAST.type]
    let element
    if (!!blockFunc) {
        element = blockFunc!(inlineAST, markdownAST.props, markdownAST.children)
    } else {
        if (markdownAST.type !== "Text") {
            console.warn(`Markdowner-render-block-didn't have a block map named ${markdownAST.type}`)
        }
        element = Span(markdownAST.raw)
    }

    return element
}
export const Block = RUI(({markdownAST}: { markdownAST:MarkdownAST }) => {
    let defaultContent: MarkdownAST[] = [{type: "Text", content: "",  raw: "hh", level: "inline"}]
    let contentState = useRUIState(defaultContent)

    useEffect(() => {
        // ---- when markdownAST.id changes, it means it is a new rendered ast
        // ---- don't parse content in Markdowner.parse, so set willParseContent = false and parse all content here
        contentState.value =  Markdowner.ASTHelper.parseSingleASTContent(markdownAST)
    }, [markdownAST.id])

    useEffect(() => {
        if (markdownAST.props?.rerender ?? false) {
            // ---- if use rerender, render it every time when it enters
            contentState.value =  Markdowner.ASTHelper.parseSingleASTContent(markdownAST)
        }
    }, [markdownAST])


    return Div(...inlineElements(getBlockFromMap(markdownAST, contentState.value)))
        .width("100%")
        .wordWrap("break-word")
        .whiteSpace("pre-wrap")
        .margin("0px")
        .className(`Markdowner-Block-${markdownAST.type}`)
})

export const MarkdownDocument = RUI(({markdownASTs, isDocument}:any) => {
    return List((markdownASTs).map((markdownAST: MarkdownAST, idx:number) => ({
                element: Block({markdownAST}).key(idx),
                order: markdownAST.props?.elementOrder ?? 1
            })
        ).sort((a: any, b: any) => a.order - b.order),
        (c) => c.element
    )
        .width("100%")
        .spacing((isDocument ?? false) ? "10px" : "0px")
        .alignment("leading")
}

)




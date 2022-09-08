import {ForEach, RUI, uid, useRUIState} from "@iandx/reactui";
import {MarkdownSyntaxTree} from "../base/syntaxTree";
import {VStack} from "@iandx/reactui/component";
import {blockMaps} from "./defaultMaps";
import {contentToRUIElement, inlineElements} from "./inline";
import {Div} from "@iandx/reactui/tag";
import {useEffect, useRef} from "react";
import {IsFirstRender, objectEquals} from "../base/utils";


export const BlockWrap = RUI(({content, blockName}:any) => {
    let preContent = useRUIState(content)
    useEffect(() => {
        if (content.id !== preContent.value.id) {
            preContent.value = content
        }
    })
    return Div(...inlineElements(preContent.value))
        .width("100%")
        .wordWrap("break-word")
        .whiteSpace("pre-wrap")
        .margin("0px")
        .className(`Markdowner-Block-${blockName}`)
})

export const Block = RUI(({syntaxTrees, isDocument}:any) =>
    VStack(
        ForEach((syntaxTrees).map((markdownSyntaxTree: MarkdownSyntaxTree) => {
            let type = markdownSyntaxTree.type
            let content = markdownSyntaxTree.content
            let props = markdownSyntaxTree.props
            let children = markdownSyntaxTree.children
            let blockElement = blockMaps[type](content, props, children)

            return {
                element: contentToRUIElement(
                    BlockWrap({content: blockElement, blockName: type})
                ).key(markdownSyntaxTree.id!),
                order: props?.elementOrder ?? 1
            }
        }).sort((a: any, b: any) => a.order - b.order), (c) =>
            c.element
        )
    )
        .spacing((isDocument ?? false) ? "10px" : "0px")
        .alignment("leading")
)




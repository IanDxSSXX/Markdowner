import {objectValid} from "./utils";
import {uid} from "@iandx/reactui";
import {f} from "@iandx/reactui/ReactUITheme-48edfbd4";

export interface MarkdownAST {
    id?: string
    type: string
    level: "block" | "inline"
    raw?: string
    content?: any
    children?: MarkdownAST[]
    props?: any
}


export function generateBlockSyntaxTree(type: string, level: "block"|"inline", raw?: string, content?: any, props?: any,
                                 children?: MarkdownAST[], geneId?: boolean): MarkdownAST {
    let syntaxTree: MarkdownAST
    if (geneId ?? false) {
        syntaxTree = {id: uid(), type, level}
    } else {
        syntaxTree = {type, level}
    }
    if (raw !== undefined) syntaxTree.raw = raw
    if (content !== undefined) syntaxTree.content = content
    if (objectValid(props)) syntaxTree.props = props
    if (!!children) syntaxTree.children = children
    return syntaxTree
}


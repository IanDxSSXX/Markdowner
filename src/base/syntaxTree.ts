import {objectValid} from "./utils";
import {uid} from "../base/utils";

export interface ContainerItem {
    item: MarkdownAST[] | any
    content: MarkdownAST[]
}

export interface MarkdownAST {
    id?: string
    type: string
    level: "block" | "inline"
    raw: string
    content: MarkdownAST[] | ContainerItem[] | string | any
    props?: any
}


export function generateMarkdownerAST(geneId: boolean, type: string, level: "block"|"inline", raw: string,
                                      content: string|MarkdownAST[]|ContainerItem[]|any, props?: any): MarkdownAST {
    let syntaxTree: MarkdownAST = {type, level, raw, content}
    if (objectValid(props)) syntaxTree.props = props
    if (geneId) syntaxTree.id = uid()

    return syntaxTree
}


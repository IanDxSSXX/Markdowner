import {ContainerItem, MarkdownAST} from "./ast";
import {C} from "./index";

export class MarkdownerHelper {
    static warn(position: string, warning: string) {
        console.warn(`Markdowner-${position}: ${warning}`)
    }

    static throw(position: string, throwMessage: string) {
        throw `Markdowner-${position}: ${throwMessage}`
    }
}

export class IncrementalParse {
    private static incrementalParseContainer(preASTNoIdContent: ContainerItem[], currASTNoIdContent: ContainerItem[],
                                             preASTContent: ContainerItem[], currASTContent: ContainerItem[]) {
        let newContent: ContainerItem[] = []
        for (let idx in Array(currASTContent.length).fill(0)) {
            if (!preASTContent[idx]) {
                newContent.push(currASTContent[idx])
                continue
            }
            let item = this.incrementalParse(
                preASTNoIdContent[idx].item,
                currASTNoIdContent[idx].item,
                preASTContent[idx].item,
                currASTContent[idx].item,
            ) as MarkdownAST[]
            let content = this.incrementalParse(
                preASTNoIdContent[idx].content,
                currASTNoIdContent[idx].content,
                preASTContent[idx].content,
                currASTContent[idx].content,
            ) as MarkdownAST[]
            newContent.push({item, content})
        }

        return newContent
    }

    private static incrementalParseContent(preASTNoIdContent: MarkdownAST[] | any, currASTNoIdContent: MarkdownAST[] | any,
                                           preASTContent: MarkdownAST[] | any, currASTContent: MarkdownAST[] | any) {
        let newContent: any = currASTContent
            if (currASTContent.length>0) {
                if (currASTContent[0] instanceof Array) {
                    newContent = []
                    for (let i in Array(currASTContent.length).fill(0)) {
                        newContent.push(this.incrementalParseContent(
                            preASTNoIdContent[i], currASTNoIdContent[i], preASTContent[i], currASTContent[i]
                        ))
                    }
                } else if (currASTContent[0].level === "inline") {
                    // inline
                    newContent = this.incrementalParse(
                        preASTNoIdContent, currASTNoIdContent, preASTContent, currASTContent)
                } else if (!!currASTContent[0].item && !!currASTContent[0].content) {
                    // container
                    newContent = this.incrementalParseContainer(
                        preASTNoIdContent, currASTNoIdContent, preASTContent, currASTContent)
                }
            }
        return newContent
    }

    private static incrementalParse(preASTsNoId: MarkdownAST[], currASTsNoId: MarkdownAST[], preASTs: MarkdownAST[], currASTs: MarkdownAST[]) {
        let startToDiffer = false
        let preASTsNoIdString = preASTsNoId.map(tree=>JSON.stringify(tree))

        for (let [idx, currASTNoId] of currASTsNoId.entries()) {
            if (!startToDiffer) {
                let preASTNoId = preASTsNoId[idx]
                if (!preASTNoId) continue // ---- no pre ast
                if (JSON.stringify(preASTNoId) === JSON.stringify(currASTNoId)) {
                    currASTs[idx] = preASTs[idx]
                    preASTsNoIdString[idx] = "used"
                } else {
                    startToDiffer = true
                    if (currASTNoId.type === preASTNoId.type) {
                        currASTs[idx].id = preASTs[idx].id
                        if (currASTNoId.content instanceof Array) {
                            currASTs[idx].content = this.incrementalParseContent(
                                preASTNoId.content, currASTNoId.content, preASTs[idx].content, currASTs[idx].content)
                        }
                        preASTsNoIdString[idx] = "used"
                        continue
                    }
                }
            }
            if (startToDiffer){
                let indexInPreASTs = preASTsNoIdString.indexOf(JSON.stringify(currASTNoId))
                if (indexInPreASTs !== -1) {
                    // ---- pre tree contain the new tree, assign the pre id to it's
                    preASTsNoIdString[indexInPreASTs] = "used"
                    currASTs[idx] = preASTs[indexInPreASTs]
                }
            }
        }
        return currASTs
    }
    static parse(preASTs: MarkdownAST[], currASTs: MarkdownAST[]): MarkdownAST[] {
        if (currASTs.length === 1 && currASTs[0].type === "error") return currASTs
        let preASTsNoId = this.dropId(preASTs)
        let currASTsNoId = this.dropId(currASTs)

        currASTs = this.incrementalParse(preASTsNoId, currASTsNoId, preASTs, currASTs)
        
        return currASTs
    }

    private static dropId(trees: MarkdownAST[]) {
        let treesString = JSON.stringify(trees)
        treesString = treesString.replaceAll(
            /,"id":".+?"}/g,
            '}')
        return JSON.parse(treesString) as MarkdownAST[]
    }

}
export class ASTHelper {
    trees: MarkdownAST[] = []
    markdowner: C.Markdowner

    constructor(markdowner: C.Markdowner) {
        this.markdowner = markdowner
    }

    flatten() {
        return ASTHelper.flattenASTs(this.trees)
    }

    static flattenASTs(asts: MarkdownAST[]): MarkdownAST[] {
        let flatASTs: MarkdownAST[] = []
        for (let ast of asts) {
            flatASTs.push(ast)
            if (ast.content instanceof Array<MarkdownAST>) {
                flatASTs.push(...ASTHelper.flattenASTs(ast.content))
            }
        }
        return flatASTs
    }

    findInlineItems(typeName: string, condition: (inlineAST: MarkdownAST) => boolean=()=>true) {
        return this.flatten().filter(t=>t.type===typeName && condition(t))
    }

    findBlocks(typeName: string, condition: (blockAST: MarkdownAST) => boolean=()=>true) {
        return this.trees.filter(t=>t.type===typeName && condition(t))
    }
}





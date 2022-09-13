import {MarkdownAST} from "./syntaxTree";
import {C} from "./index";

export class MarkdownerHelper {
    static warn(position: string, warning: string) {
        console.warn(`Markdowner-${position}: ${warning}`)
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

    incrementalParse(content: string): MarkdownAST[] {
        this.markdowner.init({...this.markdowner.markdownerProps, geneId:true})
        let preTrees = this.trees
        let currTrees = this.markdowner.parse(content)

        if (currTrees.length === 1 && currTrees[0].type === "error") return currTrees

        let preTreesNoId = ASTHelper.dropId(preTrees)
        let currTreesNoId = ASTHelper.dropId(currTrees)
        let preTreesNoIdString = preTreesNoId.map(tree=>JSON.stringify(tree))
        let currTreesNoIdString = currTreesNoId.map(tree=>JSON.stringify(tree))

        for (let [idx, currTreeNoIdString] of currTreesNoIdString.entries()) {
            let indexInPreTrees = preTreesNoIdString.indexOf(currTreeNoIdString)
            if (indexInPreTrees !== -1) {
                // ---- pre tree contain the new tree, assign the pre id to it's
                preTreesNoIdString[indexInPreTrees] = "used"
                currTrees[idx].id = preTrees[indexInPreTrees].id
            }
        }

        return currTrees
    }

    asyncParse(content: string): Promise<MarkdownAST[]> {
        return new Promise<MarkdownAST[]>((resolve) => {
            resolve(this.markdowner.parse(content))
        })
    }

    asyncIncrementalParse(content: string): Promise<MarkdownAST[]> {
        return new Promise<MarkdownAST[]>((resolve) => {
            resolve(this.markdowner.parse(content))
        })
    }

    static dropId(trees: MarkdownAST[]) {
        let treesString = JSON.stringify(trees)
        treesString = treesString.replaceAll(
            /,"id":".+?"}/g,
            '}')
        return JSON.parse(treesString) as MarkdownAST[]
    }

}





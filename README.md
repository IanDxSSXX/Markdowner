# Markdowner
A powerful markdown parser and renderer for react
* 👐 build for high extensibility
* ⚡️ yet still very fast
* 💫 best practice for react
* ✨ incremental parsing to avoid unnecessary dom re-render
* 🎨 easy to customize

## Install
`npm install @iandx/markdowner`

## Quick start
```tsx
import { ReactMarkdowner } from '@iandx/markdowner';
function App () {
    const content = '# Welcome to **use** *Markdowner*';
    return(
        <ReactMarkdowner content={content}/>
    )
}
```

## Usage
### ReactMarkdowner
* Basic React component. Give it a `content` or `children` prop as its rendering content

  Use whichever you like
```tsx
let content = "* this is a list"
const Markdowner1 = () => 
    <ReactMarkdowner content={content} />
const Markdowner2 = () =>
    <ReactMarkdowner>{content}<ReactMarkdowner/>
```
### Markdowner
#### Global init markdowner

```tsx
import {Markdowner} from "@iandx/markdowner"
Markdowner.init({
    tabSpaceNum: 2,
    softBreak: true,
    geneId: false
})
```
| properties | type   | default | description                                                                  |
|--------|---|------------------------------------------------------------------------------|------------------------------------------------------------------------------|
| tabSpaceNum    | number | 2 | a tab "\t" equals to how many spaces                                         |
| softBreak    | number | true | if set "true", "\n" will be recognized as a soft break instead of a new line |
| geneId    | number | false | give each AST a unique id, useful for increnmental parsing                   |

#### Default rules and drop rules

* Inline

  | type        | description                                        |
  | ----------- | -------------------------------------------------- |
  | Bold        | \*\*bold\*\*                                       |
  | Italic      | \*italic\*                                         |
  | Strike      | \~\~strike through\~\~                             |
  | Underline   | \<u\>underline\<u\>, \_!also underline!\_          |
  | Code        | \`code\`                                           |
  | Link        | \[link title\]\(link_url\)                         |
  | Escape      | character like \\\*, \\\_, \\\~                    |
  | Superscript | \^superscript\^                                    |
  | Subscript   | \~subscript\~                                      |
  | Highlight   | \=\=hightlight\=\=                                 |
  | HtmlTag     | \<anyTag\>content</anyTag\>                        |
  | Math        | \$latex math formula like \frac{1}{2}\$            |
  | FootnoteSup | \[\^footnotesup\] will link to the end of the page |
  | LinkTag     | [link tag] will be a link if supply a link block   |

  if you don't want some provided inline features, you can easily drop it by using

  ```tsx
  import {Markdowner} from "@iandx/markdowner"
  Markdowner.dropRule.inline(["Math", "LinkTag"])
  ```

* block

  | type          | blockType | description                                                                      |
  | ------------- |----------------------------------------------------------------------------------| ------------------------------------------------------------ |
  | Heading       | leaf      | # this is heading1<br />this is also heading1<br />\=\=\=\==                     |
  | Blockquote    | leaf      | > blockquote<br />>> level2                                                      |
  | CodeBlock     | leaf      | \`\`` javascript<br />  function test() {<br />console.log("hi")<br />}<br />``` |
  | Divider       | leaf      | ----[dashed]                                                                     |
  | Image         | leaf      | \!\[alt_content\](url hover_title 50% center)                                    |
  | MathBlock     | leaf      | \$\$<br />Math block \sqrt{a}<br />\$\$                                          |
  | Latex         | leaf      | \$\$\$<br />Latex block \sqrt{a}<br />\$\$\$                                     |
  | Footnote      | leaf      | \[^footnotesup\]: content                                                        |
  | LinkTagBlock  | leaf      | \[^linkTag\]: replaced url                                                       |
  | Comment       | leaf      | // any comment                                                                   |
  | UnorderedList | container | * unordered list<br />+ also unordered list<br />- still unordered list          |
  | OrderedList   | container | 1. OrderedList<br />1. will display 2 in this line                               |
  | CheckList     | container | - [x] GFM to-do list                                                             |

  if you don't want some provided inline features, you can easily drop it by using

  ```ts
  import {Markdowner} from "@iandx/markdowner"
  Markdowner.dropRule.block(["Comment", "Image", "Divider"])
  ```


#### Add new rules

inline
First we will introduce the structure of the syntax rule.
Following are the properties.

`tags` An object to define syntax token. You may use the following properties to config.

* `leading`  A String which will be recognized as syntax token used before text, e.g. '##' 
* `round`  A String which will be recognized as syntax token used around text, e.g. '**'
* `wrap` A array which will be recognized as syntax token used in the left and right of the text. e.g. ['<tag>','</tag>']
* `exact` A String or a regular expression

`trimText` A callback function which recieves a raw text and usually returns the text after triming the tags. Note: using leading, round, wrap, the parser will help you trim the tags token by default

`parseContent` A callback function which recieve the trimmed text

`getProps` A callback function which recieve the raw text, get the additional props, then return.

`recheckMatch` A callback function which recieve the raw text to recheck if the raw text match the syntax token. 

`order`

Now, you may use `addRule` to custom your own syntax.

`addRule({name,rule,view})`
* `name` A string used to identify the rule.
* `rule` A object introducing before to describe the custom syntax.
* `view` A function which returns a React component matching your custom token.

Following is an example.
```javascript
// add a block syntax
Markdowner.addRule.block({
    name: "CustomHeading",
    rule: {
        tags: {
            leading: /#{1,5} /, 
            exact: [/(?:\n|^).+?\n===+ */, /(?:\n|^).+? ?\n---+ */]
        },
    getProps: (raw) => {
        let headingLevel: number
        let hashHeadingMatch = raw.match(/^#+ /)
        if (hashHeadingMatch) {
        headingLevel = hashHeadingMatch![0].trim().length
        } else {
        let heading1Match = raw.match(/\n===+/)
        headingLevel = !!heading1Match ? 1 : 2
        }
        return {headingLevel}
    },
    trimText: raw => raw.replaceAll(/\n((===+)|(---+))/g, "").replaceAll(/^#{1,5} /g, ""),
    parseContent: text => text,
    recheckMatch: raw => {
        return true
    },
    blockType: "leaf"
    },
    view: (content: any, {headingLevel, blockProp}) =>
    Span(content+(!!blockProp ? blockProp.a:"")).fontSize(`${(5 - (headingLevel ?? 1)) * 6 + 15}px`)
    })

// add a inline syntax
Markdowner.addRule.inline({
    name: "Italic",
    rule: {
        tags: {
            round: "[em]",
            exact: [
                /\*(?!\s)(?:(?:[^*]*?(?:\*\*[^*]+?\*\*[^*]*?)+?)+?|[^*]+)\*/,
            ]
        },
        trimText: (text: string) => text.replace(/^\*|\*$/g, ""),
    },
    // view:  (content) => ()
})
```

you may use `dropRule`to remove one of the syntax rule.
```javascript
// remove a block syntax rule
Markdowner.dropRule.block(["Heading"])

// remove a inline syntax rule
Markdowner.dropRule.inline(["Italic"])
```

  

## Advanced

### MarkdownerView
API


### Markdowner

API

| function | description                        | parameter | 
|------------------------------------|-----------|----------|
| init     | to certain props init a Markdowner | object   |
| parse    | return a markdonwerTree array      | string   |
Usage
```javascript
import { Markdowner } from '@iandx/markdowner'

Markdowner.init({softBreak: false})
const markdownerASTs = Markdowner.parse('## Markdowner **fast** ')
```
### MarkdonwerTree
Markdowner.parse will parse the text iteratively where there is a markdown syntax.
We design a tree to contain the parsed result called MarkdonwerTrees.

Note: The type of leaf node  must be "Text" or "Heading"

The node of MarkdonwerTree has the following properties.

| properties | description                                             | type   | value           |
|------------|---------------------------------------------------------|--------|-----------------|
| content    | its children which are also the markdownTrees or string |        |                 |
| id         | block id                                                |        |                 |
| level      | block level or inline level                             | string | "block"/"inline" |
| props      | additional properties                                   | object |                 |
| raw        | the text inclues markdown syntax                        | string |                 |
| type       | the markdown type. e.g."OrderedList", "Heading"         | string |                 |

### Custom Syntax

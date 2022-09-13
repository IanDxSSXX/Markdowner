# Markdowner
The best markdown parser and renderer for react
* 👐 build for high extensibility
* ⚡️ yet still very fast
* 💫 best practice for react (also works in a browser/server/cli)
* incremental parsing to avoid unnecessary dom render
## Demo

## install


## Usage
### React
```javascript
import React, {useState} from 'react';
import { MarkdownerView } from '@iandx/markdowner';

function App () {
    const content = '# Markdowner **high extensibility**';
    return(
        <MarkdownerView content={content} />
    )
}
 
```
### HTML
```html

```


## Advanced
### MarkdownerView
API

| props | describtion                | type | default |
|---|----------------------------|---|-----|
| content | the content will be parsed | string |     |
| incrementalParse | is using incremental parse | boolean | false |

### Markdowner

API

| function | description                        | parameter | 
 |------------------------------------|-----------|------------|
| init     | to certain props init a Markdowner | object    |
| parse    | return a markdonwerTree array      | string    |
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
First we will introduce the structure of the syntax rule. 
Following are the properties.

`tags` A object to define syntax token
* `leading` 
* `round`
* `wrap`
* `exact`

`parseContent`

`getProps`

`recheckMatch`

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

import {HStack, VStack, Text} from "@iandx/reactui/component";
import {range, useRUIState, RUITag, RUI, RUIElement} from "@iandx/reactui";
import {
    InlineElements,
    InlineRUIElements,
    Markdowner,
    MarkdownerBlockRuleInterface,
    ReactMarkdowner,
    RUIMarkdowner
} from "./base";
import {EditableMarkdowner} from "./editor/wysiwyg/main";

Markdowner.init({softBreak: true})

function App() {
    return EditableMarkdowner().asReactElement()
}


export default App;

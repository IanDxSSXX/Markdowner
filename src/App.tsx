import {Markdowner, MarkdownerView,MarkdownDocument} from "./base"
import {benchmark} from "./benchmark";
import {useState} from "react";



Markdowner.init({softBreak: true})

function App() {
    // benchmark()
    let [content, setContent] = useState("")
    console.log(<MarkdownerView content={content}/>)

    return (
        <div style={{display:"flex",flexDirection:"row"}}>
            <textarea onChange={(e) => {
                setContent((e.target as any).value)
            }}/>
            <div style={{height:"90vh"}}>
                <MarkdownerView >
                    {content}
                </MarkdownerView>
            </div>

        </div>

    )
}

export default App;

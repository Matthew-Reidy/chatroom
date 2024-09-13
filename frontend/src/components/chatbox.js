import {useState, useRef, useEffect, useContext} from 'react'
import {userContext} from '../App'
export const ChatBox = () => {
    const context = useContext(userContext)

    const [messages, setMessages] = useState([])

    const [msg, setMsg] = useState("")
   
    const ws = useRef(null);

    useEffect(() => {
        ws.current = new WebSocket(`wss://9b5valccuh.execute-api.us-west-1.amazonaws.com/test/?username=${context.userName}`)
        
        ws.current.onmessage = (event)=>{

            console.log(event)

            if (event.data !== ''){
                const newMessage =  JSON.parse(JSON.parse(event.data));
                console.log(newMessage)
                setMessages((prevMessages) => [...prevMessages, newMessage]);
                console.log(messages)
            }   
            
        }

        ws.current.onclose = (event)=>{
            console.log("closed!")
        }
        ws.current.onopen = (event) =>{
            console.log("opened!")
        }
        return () => {
            ws.current.close();
        }
    }, [])
    

  function close(){
    if (ws.current && ws.current.readyState === WebSocket.OPEN){
        console.log("closing")
        ws.current.close(1000, "user initated")
        context.setJoinInit(false)
        context.setUserName(null)

    }
  }

  async function sendMessage(event){

    event.preventDefault();

    const messageBody = {
        action: "message",
        userName: context.userName,
        message: msg
    }

    ws.current.send(JSON.stringify(messageBody))
    setMsg("")

  }

  return (
    <div className="flex items-center justify-center min-h-screen">
        <div className="p-4 border border-gray-300 rounded shadow-md">
            <div className="mb-4">
                <ul className="h-48 overflow-y-auto border border-gray-300 rounded p-2">
                    {messages?.map((message) => {
                                    return <li>
                                                {message.userName} - {message.message}
                                            </li>
                    }

                    )}
                </ul>
            </div>

            <div className="text-center">
                <form onSubmit={sendMessage} className="flex flex-col items-center">
                    <div className="flex space-x-2">
                        <textarea
                            className="resize-none border border-gray-300 rounded px-4 py-2"
                            rows="4"
                            cols="50"
                            required
                            value={msg}
                            onChange={(e)=>setMsg(e.target.value)}
                        ></textarea>
                        <button
                            className="bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600"
                            type="submit"
                        >
                            Send Message
                        </button>
                    </div>
                </form>

                <button
                className="bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 mt-4"
                type="button"
                onClick={close}
                >
                    Disconnect
                </button>
            </div>
        </div>
    </div>

  )
}
